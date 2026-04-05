import { supabase } from '../lib/supabaseClient'

/** Matches `formatJobDisplayId` in jobService (kept local to avoid pulling the full job module). */
function formatJobDisplayId(uuid) {
  const s = String(uuid || '').replace(/-/g, '')
  const short = s.slice(0, 8).toUpperCase()
  return `#J-${short}`
}

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

/** Colours for job-type donut (reused in admin dashboard). */
export const ADMIN_FLEET_DONUT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
]

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

function pctChangeMoM(currentPeriodCount, previousPeriodCount) {
  const c = Number(currentPeriodCount) || 0
  const p = Number(previousPeriodCount) || 0
  if (p === 0) return c > 0 ? 100 : 0
  return Math.round(((c - p) / p) * 1000) / 10
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * Company admin dashboard: KPIs, job-type breakdown, jobs-by-month, recent activity feed.
 * All queries are scoped to `companyId`.
 */
export async function getAdminCompanyDashboard(companyId) {
  if (!companyId) throw new Error('company_id is required')

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))

  const thisMonthStartIso = thisMonthStart.toISOString()
  const lastMonthStartIso = lastMonthStart.toISOString()
  const lastMonthEndIso = lastMonthEnd.toISOString()

  const [
    vehiclesRes,
    vehiclesThisMonthRes,
    vehiclesLastMonthRes,
    driversTotalRes,
    driversThisMonthRes,
    driversLastMonthRes,
    activeJobsRes,
    jobsThisMonthRes,
    jobsLastMonthRes,
    jobTypesRes,
    jobsSixMonthsRes,
    recentJobsRes,
    recentPassengersRes,
    recentDriversRes,
    recentRoutesRes,
  ] = await Promise.all([
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', thisMonthStartIso),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', lastMonthStartIso)
      .lte('created_at', lastMonthEndIso),
    supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', thisMonthStartIso),
    supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', lastMonthStartIso)
      .lte('created_at', lastMonthEndIso),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('status', 'eq', 'draft')
      .not('status', 'eq', 'completed'),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('status', 'eq', 'draft')
      .not('status', 'eq', 'completed')
      .gte('created_at', thisMonthStartIso),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('status', 'eq', 'draft')
      .not('status', 'eq', 'completed')
      .gte('created_at', lastMonthStartIso)
      .lte('created_at', lastMonthEndIso),
    supabase.from('jobs').select('job_type').eq('company_id', companyId).not('status', 'eq', 'draft'),
    supabase
      .from('jobs')
      .select('created_at, status')
      .eq('company_id', companyId)
      .gte('created_at', startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1)).toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('jobs')
      .select('id, job_name, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('passenger')
      .select('id, first_name, surname, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('drivers')
      .select('id, first_name, last_name, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('job_passenger_routes')
      .select(
        `
        id,
        created_at,
        job_id,
        passenger:passenger_id (first_name, surname),
        jobs!inner (company_id)
      `,
      )
      .eq('jobs.company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  if (driversTotalRes.error) throw driversTotalRes.error
  if (driversThisMonthRes.error) throw driversThisMonthRes.error
  if (driversLastMonthRes.error) throw driversLastMonthRes.error
  if (activeJobsRes.error) throw activeJobsRes.error
  if (jobsThisMonthRes.error) throw jobsThisMonthRes.error
  if (jobsLastMonthRes.error) throw jobsLastMonthRes.error
  if (jobTypesRes.error) throw jobTypesRes.error
  if (jobsSixMonthsRes.error) throw jobsSixMonthsRes.error
  if (recentJobsRes.error) throw recentJobsRes.error
  if (recentPassengersRes.error) throw recentPassengersRes.error
  if (recentDriversRes.error) throw recentDriversRes.error

  const vehicleCount = !vehiclesRes.error ? vehiclesRes.count ?? 0 : 0
  const driverTotal = driversTotalRes.count ?? 0
  const fleetHeadline = vehicleCount > 0 ? vehicleCount : driverTotal
  const vThis = !vehiclesThisMonthRes.error ? vehiclesThisMonthRes.count ?? 0 : 0
  const vLast = !vehiclesLastMonthRes.error ? vehiclesLastMonthRes.count ?? 0 : 0
  const fleetTrendPct =
    vehicleCount > 0
      ? pctChangeMoM(vThis, vLast)
      : pctChangeMoM(driversThisMonthRes.count ?? 0, driversLastMonthRes.count ?? 0)

  const activeJobsCount = activeJobsRes.count ?? 0
  const jobsTrendPct = pctChangeMoM(jobsThisMonthRes.count ?? 0, jobsLastMonthRes.count ?? 0)

  const typeCounts = {}
  for (const row of jobTypesRes.data || []) {
    const key = (row.job_type || 'Unknown').trim() || 'Unknown'
    typeCounts[key] = (typeCounts[key] || 0) + 1
  }
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const typeTotal = typeEntries.reduce((s, [, n]) => s + n, 0)
  const fleetDistribution = typeEntries.map(([label, count], i) => ({
    label,
    value: typeTotal ? Math.round((count / typeTotal) * 1000) / 10 : 0,
    count,
    color: ADMIN_FLEET_DONUT_COLORS[i % ADMIN_FLEET_DONUT_COLORS.length],
  }))

  const months = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString('default', { month: 'short' }),
      count: 0,
    })
  }
  for (const row of jobsSixMonthsRes.data || []) {
    if (!row.created_at) continue
    const c = new Date(row.created_at)
    const key = `${c.getFullYear()}-${c.getMonth()}`
    const bucket = months.find((m) => m.key === key)
    if (bucket && row.status && String(row.status).toLowerCase() !== 'draft') {
      bucket.count += 1
    }
  }
  const jobsByMonth = months.map(({ label, count }) => ({ label, count }))
  const maxMonthCount = Math.max(1, ...jobsByMonth.map((m) => m.count))

  const activities = []

  for (const j of recentJobsRes.data || []) {
    activities.push({
      id: `job-${j.id}`,
      at: j.created_at,
      variant: 'success',
      text: `New job "${j.job_name || 'Untitled'}" created`,
    })
  }
  for (const p of recentPassengersRes.data || []) {
    const name = [p.first_name, p.surname].filter(Boolean).join(' ').trim() || 'Passenger'
    activities.push({
      id: `passenger-${p.id}`,
      at: p.created_at,
      variant: 'info',
      text: `Passenger ${name} registered`,
    })
  }
  for (const d of recentDriversRes.data || []) {
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ').trim() || 'Driver'
    activities.push({
      id: `driver-${d.id}`,
      at: d.created_at,
      variant: 'add',
      text: `Driver ${name} added to the team`,
    })
  }
  const routeRows = recentRoutesRes.error ? [] : recentRoutesRes.data || []
  for (const r of routeRows) {
    const p = r.passenger
    const name = p ? [p.first_name, p.surname].filter(Boolean).join(' ').trim() : 'Passenger'
    const jid = formatJobDisplayId(r.job_id)
    activities.push({
      id: `route-${r.id}`,
      at: r.created_at,
      variant: 'warning',
      text: `Passenger ${name || 'Passenger'} added to job ${jid}`,
    })
  }

  activities.sort((a, b) => new Date(b.at) - new Date(a.at))
  const recentActivities = activities.slice(0, 5).map((a) => ({
    ...a,
    timeLabel: formatRelativeTime(a.at),
  }))

  return {
    fleetHeadline,
    fleetTrendPct,
    activeJobsCount,
    jobsTrendPct,
    fleetDistribution,
    jobsByMonth,
    maxMonthCount,
    recentActivities,
  }
}

