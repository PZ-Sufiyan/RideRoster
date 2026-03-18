import { supabase } from '../lib/supabaseClient'

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

