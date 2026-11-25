import { supabase } from '../lib/supabaseClient'
import { isDeletedStaffStatus } from '../utils/fleet'

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function monthLabel(year, month) {
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleString('default', { month: 'short', year: 'numeric' })
}

export function monthInputValue(year, month) {
  return `${year}-${pad2(month)}`
}

export function parseMonthInput(value) {
  const [y, m] = String(value || '').split('-').map(Number)
  if (!y || !m) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }
  return { year: y, month: m }
}

function monthDateRange(year, month) {
  const start = `${year}-${pad2(month)}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${pad2(month)}-${pad2(lastDay)}`
  return { start, end }
}

function formatStaffStatus(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (!s) return '—'
  if (s === 'approve' || s === 'approved' || s === 'active') return 'Active'
  if (s === 'pending') return 'Pending'
  if (s === 'suspend' || s === 'suspended') return 'Suspended'
  if (s === 'reject' || s === 'rejected') return 'Rejected'
  if (s === 'deleted') return 'Deleted'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function defaultAvatar(id) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(id || 'staff')}`
}

function emptyStaffStats() {
  return {
    jobsAssigned: 0,
    totalSessions: 0,
    morningSessions: 0,
    eveningSessions: 0,
    completedSessions: 0,
  }
}

/**
 * Monthly operations report for a company admin.
 * @param {string} companyId
 * @param {{ year: number, month: number, role?: 'all'|'driver'|'pa' }} opts
 */
export async function getAdminMonthlyReport(companyId, { year, month, role = 'all' } = {}) {
  if (!companyId) throw new Error('company_id is required')
  const y = Number(year)
  const m = Number(month)
  if (!y || !m) throw new Error('year and month are required')

  const { start, end } = monthDateRange(y, m)
  const periodLabel = monthLabel(y, m)

  const [driversRes, pasRes, jobsRes, sessionsRes] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, first_name, last_name, status, profile_picture_url')
      .eq('company_id', companyId),
    supabase
      .from('passenger_assistant')
      .select('id, first_name, surname, status, profile_picture_url')
      .eq('company_id', companyId),
    supabase
      .from('jobs')
      .select('id, status, semester_start, semester_end, assigned_driver_id, assigned_pa_id')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .neq('status', 'canceled'),
    supabase
      .from('job_sessions')
      .select(
        `
        id,
        session_date,
        direction,
        status,
        driver_id,
        pa_id,
        job_id,
        jobs!inner ( id, company_id, assigned_pa_id, status )
      `,
      )
      .eq('jobs.company_id', companyId)
      .gte('session_date', start)
      .lte('session_date', end),
  ])

  if (driversRes.error) throw driversRes.error
  if (pasRes.error) throw pasRes.error
  if (jobsRes.error) throw jobsRes.error
  if (sessionsRes.error) throw sessionsRes.error

  const drivers = (driversRes.data || []).filter((d) => !isDeletedStaffStatus(d.status))
  const pas = (pasRes.data || []).filter((p) => !isDeletedStaffStatus(p.status))
  const jobs = jobsRes.data || []
  const sessions = (sessionsRes.data || []).filter((s) => {
    const jobStatus = String(s.jobs?.status || '').toLowerCase()
    return jobStatus !== 'cancelled' && jobStatus !== 'canceled'
  })

  const jobsInPeriod = jobs.filter((j) => {
    const js = String(j.status || '').toLowerCase()
    if (js === 'draft') return false
    const startDate = j.semester_start ? String(j.semester_start).slice(0, 10) : null
    const endDate = j.semester_end ? String(j.semester_end).slice(0, 10) : null
    if (startDate && endDate) return startDate <= end && endDate >= start
    return false
  })

  const sessionJobIds = new Set(sessions.map((s) => s.job_id).filter(Boolean))
  const totalJobs = Math.max(jobsInPeriod.length, sessionJobIds.size)

  let morningSessions = 0
  let eveningSessions = 0
  for (const s of sessions) {
    const dir = String(s.direction || '').toLowerCase()
    if (dir === 'inbound') eveningSessions += 1
    else morningSessions += 1
  }

  const byDriver = new Map()
  const byPa = new Map()

  for (const d of drivers) {
    byDriver.set(d.id, {
      id: d.id,
      name: [d.first_name, d.last_name].filter(Boolean).join(' ').trim() || 'Driver',
      role: 'Driver',
      avatar: d.profile_picture_url || defaultAvatar(d.id),
      status: formatStaffStatus(d.status),
      statusRaw: d.status,
      jobIds: new Set(),
      ...emptyStaffStats(),
    })
  }
  for (const p of pas) {
    byPa.set(p.id, {
      id: p.id,
      name: [p.first_name, p.surname].filter(Boolean).join(' ').trim() || 'PA',
      role: 'PA',
      avatar: p.profile_picture_url || defaultAvatar(p.id),
      status: formatStaffStatus(p.status),
      statusRaw: p.status,
      jobIds: new Set(),
      ...emptyStaffStats(),
    })
  }

  for (const j of jobsInPeriod) {
    if (j.assigned_driver_id && byDriver.has(j.assigned_driver_id)) {
      byDriver.get(j.assigned_driver_id).jobIds.add(j.id)
    }
    if (j.assigned_pa_id && byPa.has(j.assigned_pa_id)) {
      byPa.get(j.assigned_pa_id).jobIds.add(j.id)
    }
  }

  for (const s of sessions) {
    const dir = String(s.direction || '').toLowerCase()
    const isEvening = dir === 'inbound'
    const isCompleted = String(s.status || '').toLowerCase() === 'completed'

    if (s.driver_id && byDriver.has(s.driver_id)) {
      const row = byDriver.get(s.driver_id)
      if (s.job_id) row.jobIds.add(s.job_id)
      row.totalSessions += 1
      if (isEvening) row.eveningSessions += 1
      else row.morningSessions += 1
      if (isCompleted) row.completedSessions += 1
    }

    // Prefer stamped session.pa_id; fall back for legacy rows.
    const paId = s.pa_id || s.jobs?.assigned_pa_id
    if (paId && byPa.has(paId)) {
      const row = byPa.get(paId)
      if (s.job_id) row.jobIds.add(s.job_id)
      row.totalSessions += 1
      if (isEvening) row.eveningSessions += 1
      else row.morningSessions += 1
      if (isCompleted) row.completedSessions += 1
    }
  }

  const finalize = (row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
    status: row.status,
    jobsAssigned: row.jobIds.size,
    totalSessions: row.totalSessions,
    morningSessions: row.morningSessions,
    eveningSessions: row.eveningSessions,
    completedSessions: row.completedSessions,
  })

  let staff = []
  if (role !== 'pa') staff = staff.concat([...byDriver.values()].map(finalize))
  if (role !== 'driver') staff = staff.concat([...byPa.values()].map(finalize))

  staff.sort((a, b) => {
    if (b.completedSessions !== a.completedSessions) return b.completedSessions - a.completedSessions
    if (b.totalSessions !== a.totalSessions) return b.totalSessions - a.totalSessions
    return a.name.localeCompare(b.name)
  })

  const topStaffBySessions = [...staff]
    .filter((s) => s.completedSessions > 0 || s.totalSessions > 0)
    .sort((a, b) => b.completedSessions - a.completedSessions || b.totalSessions - a.totalSessions)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      value: s.completedSessions || s.totalSessions,
    }))

  // Week buckets within the selected month for morning vs evening.
  const weeks = []
  const cursor = new Date(y, m - 1, 1)
  const monthEndDate = new Date(y, m, 0)
  let weekIdx = 1
  while (cursor <= monthEndDate) {
    const weekStart = new Date(cursor)
    const weekEnd = new Date(cursor)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (weekEnd > monthEndDate) weekEnd.setTime(monthEndDate.getTime())
    weeks.push({
      label: `Week ${weekIdx}`,
      start: weekStart.toISOString().slice(0, 10),
      end: weekEnd.toISOString().slice(0, 10),
      morning: 0,
      evening: 0,
    })
    cursor.setDate(cursor.getDate() + 7)
    weekIdx += 1
  }

  for (const s of sessions) {
    const day = String(s.session_date).slice(0, 10)
    const bucket = weeks.find((w) => day >= w.start && day <= w.end)
    if (!bucket) continue
    if (String(s.direction || '').toLowerCase() === 'inbound') bucket.evening += 1
    else bucket.morning += 1
  }

  return {
    periodLabel,
    year: y,
    month: m,
    stats: {
      totalJobs,
      totalDrivers: drivers.length,
      totalPas: pas.length,
      totalSessions: sessions.length,
      morningSessions,
      eveningSessions,
    },
    staff,
    topStaffBySessions,
    morningVsEveningByWeek: weeks.map(({ label, morning, evening }) => ({ label, morning, evening })),
  }
}
