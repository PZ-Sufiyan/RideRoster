import { supabase } from '../lib/supabaseClient'
import { FLEET, normalizeFleet } from '../utils/fleet'

const countTable = async (table) => {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

const startOfLocalDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
const startOfNextLocalDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0)

export const getSuperAdminDashboardStats = async () => {
  const [
    totalCompanies,
    pendingApprovals,
    totalDrivers,
    totalPassengers,
    totalSubAdmins,
    totalCompanyAdmins,
  ] = await Promise.all([
    countTable('companies'),
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count, error }) => {
        if (error) throw error
        return count ?? 0
      }),
    countTable('drivers'),
    countTable('passenger_info'),
    countTable('sub_admins'),
    countTable('company_admins'),
  ])

  const usersTotal = totalDrivers + totalPassengers + totalSubAdmins + totalCompanyAdmins

  const dayStart = startOfLocalDay()
  const nextDayStart = startOfNextLocalDay()

  const { count: bookingsTodayCount, error: bookingsTodayError } = await supabase
    .from('passenger_bookings')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', nextDayStart.toISOString())

  if (bookingsTodayError) throw bookingsTodayError

  return {
    totalCompanies,
    pendingApprovals,
    activeJobsToday: bookingsTodayCount ?? 0,
    usersTotal,
  }
}

export const getPendingCompanyApprovals = async ({ limit = 5 } = {}) => {
  const { data, error } = await supabase
    .from('companies')
    .select('id, company_name, company_address, company_operating_address, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Monthly company growth for the last N months.
 * Returns an array like:
 * [{ label: 'Jan', total: 10 }, ...]
 */
export const getCompanyGrowthByMonth = async ({ months = 12 } = {}) => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0, 0)

  const { data, error } = await supabase
    .from('companies')
    .select('id, created_at')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  const buckets = []
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    buckets.push({
      key,
      label: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      count: 0,
    })
  }

  data?.forEach((row) => {
    const created = row.created_at ? new Date(row.created_at) : null
    if (!created || Number.isNaN(created.getTime())) return
    const key = `${created.getFullYear()}-${created.getMonth()}`
    const bucket = buckets.find((b) => b.key === key)
    if (bucket) bucket.count += 1
  })

  // Convert to cumulative totals so the line shows growth over time.
  let running = 0
  const result = buckets.map((b) => {
    running += b.count
    return {
      label: b.label,
      total: running,
    }
  })

  return result
}

/**
 * Company counts by company_type.
 * Expects company_type values: 'Small company', 'Medium company', 'Large company'.
 */
export const getCompanyTypeBreakdown = async () => {
  const types = ['Small company', 'Medium company', 'Large company']
  const results = await Promise.all(
    types.map(async (t) => {
      const { count, error } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('company_type', t)

      if (error) throw error
      return { type: t, count: count ?? 0 }
    }),
  )

  const breakdown = {
    small: results.find((r) => r.type === 'Small company')?.count ?? 0,
    medium: results.find((r) => r.type === 'Medium company')?.count ?? 0,
    large: results.find((r) => r.type === 'Large company')?.count ?? 0,
  }

  return breakdown
}

/** Colours for company vs private fleet donut. */
export const ADMIN_FLEET_DONUT_COLORS = {
  [FLEET.COMPANY]: '#004D6D',
  [FLEET.PRIVATE]: '#0d9488',
}

export function formatRelativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const t = d.getTime()
  if (Number.isNaN(t)) return ''
  const diffSec = Math.floor((Date.now() - t) / 1000)
  if (diffSec < 45) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function toYmd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function jobEventActivityVariant(eventType) {
  const t = String(eventType || '')
  if (t === 'job_driver_assigned' || t === 'job_pa_assigned' || t === 'job_completed') return 'success'
  if (t === 'job_driver_removed' || t === 'job_pa_removed') return 'warning'
  return 'info'
}

/** True when a job's semester (or created month fallback) overlaps a calendar month. */
function jobActiveInMonth(job, year, monthIndex) {
  const monthStart = toYmd(new Date(year, monthIndex, 1))
  const monthEnd = toYmd(new Date(year, monthIndex + 1, 0))
  const status = String(job?.status || '').toLowerCase()
  if (status === 'draft' || status === 'cancelled' || status === 'canceled') return false

  const start = job?.semester_start ? String(job.semester_start).slice(0, 10) : null
  const end = job?.semester_end ? String(job.semester_end).slice(0, 10) : null
  if (start && end) return start <= monthEnd && end >= monthStart

  if (!job?.created_at) return false
  const created = new Date(job.created_at)
  if (Number.isNaN(created.getTime())) return false
  return created.getFullYear() === year && created.getMonth() === monthIndex
}

/**
 * Company admin dashboard: vehicle/job KPIs, company vs private fleet,
 * jobs-by-month trend, and recent job-event activity.
 * All queries are scoped to `companyId`.
 */
export async function getAdminCompanyDashboard(companyId) {
  if (!companyId) throw new Error('company_id is required')

  const now = new Date()

  const [vehiclesRes, activeJobsRes, jobsForChartRes, jobEventsRes] = await Promise.all([
    supabase.from('vehicles').select('id, fleet').eq('company_id', companyId),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active'),
    // Chart counts jobs that overlapped each month (exclude cancelled).
    supabase
      .from('jobs')
      .select('created_at, status, semester_start, semester_end')
      .eq('company_id', companyId)
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'canceled'),
    supabase
      .from('job_event_notifications')
      .select('id, event_type, title, body, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  if (vehiclesRes.error) throw vehiclesRes.error
  if (activeJobsRes.error) throw activeJobsRes.error
  if (jobsForChartRes.error) throw jobsForChartRes.error
  if (jobEventsRes.error) throw jobEventsRes.error

  const vehicles = vehiclesRes.data || []
  const fleetHeadline = vehicles.length
  let companyCount = 0
  let privateCount = 0
  for (const row of vehicles) {
    if (normalizeFleet(row.fleet) === FLEET.PRIVATE) privateCount += 1
    else companyCount += 1
  }
  const fleetTotal = companyCount + privateCount
  const fleetDistribution = [
    {
      label: 'Company',
      key: FLEET.COMPANY,
      count: companyCount,
      value: fleetTotal ? Math.round((companyCount / fleetTotal) * 1000) / 10 : 0,
      color: ADMIN_FLEET_DONUT_COLORS[FLEET.COMPANY],
    },
    {
      label: 'Private',
      key: FLEET.PRIVATE,
      count: privateCount,
      value: fleetTotal ? Math.round((privateCount / fleetTotal) * 1000) / 10 : 0,
      color: ADMIN_FLEET_DONUT_COLORS[FLEET.PRIVATE],
    },
  ].filter((row) => row.count > 0)

  const activeJobsCount = activeJobsRes.count ?? 0

  const chartJobs = jobsForChartRes.data || []
  const months = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const monthIndex = d.getMonth()
    let count = 0
    for (const job of chartJobs) {
      if (jobActiveInMonth(job, year, monthIndex)) count += 1
    }
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      count,
    })
  }
  const jobsByMonth = months
  const maxMonthCount = Math.max(1, ...jobsByMonth.map((m) => m.count))

  const recentActivities = (jobEventsRes.data || []).slice(0, 6).map((row) => ({
    id: `job-event-${row.id}`,
    at: row.created_at,
    variant: jobEventActivityVariant(row.event_type),
    text: String(row.body || row.title || 'Job update').trim(),
    timeLabel: formatRelativeTime(row.created_at),
  }))

  return {
    fleetHeadline,
    activeJobsCount,
    fleetDistribution,
    jobsByMonth,
    maxMonthCount,
    recentActivities,
  }
}

