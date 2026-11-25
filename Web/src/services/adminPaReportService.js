import { supabase } from '../lib/supabaseClient'
import { formatFleetLabel, isPrivateFleet } from '../utils/fleet'
import { monthLabel } from './adminReportService'

function pad2(n) {
  return String(n).padStart(2, '0')
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
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(id || 'pa')}`
}

function formatDirection(direction) {
  return String(direction || '').toLowerCase() === 'inbound' ? 'Evening' : 'Morning'
}

function formatSessionStatus(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (!s) return '—'
  if (s === 'completed') return 'Completed'
  if (s === 'skipped') return 'Skipped'
  if (s === 'incomplete') return 'Incomplete'
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled'
  if (s === 'active') return 'Active'
  if (s === 'pending') return 'Pending'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function overlapsLeave(leave, start, end) {
  const ls = String(leave.start_date || '').slice(0, 10)
  const le = String(leave.end_date || leave.start_date || '').slice(0, 10)
  if (!ls) return false
  return ls <= end && le >= start
}

const SESSION_SELECT = `
  id,
  job_id,
  session_date,
  direction,
  status,
  started_at,
  completed_at,
  pa_id,
  jobs!inner (
    id,
    company_id,
    job_name,
    client_school_name,
    passenger_assistant_pay,
    status,
    assigned_pa_id
  )
`

/**
 * PA monthly performance report.
 * Prefers job_sessions.pa_id history; falls back to jobs.assigned_pa_id for legacy rows.
 * @param {string} companyId
 * @param {string} paId
 * @param {{ year: number, month: number }} opts
 */
export async function getAdminPaReport(companyId, paId, { year, month } = {}) {
  if (!companyId) throw new Error('company_id is required')
  if (!paId) throw new Error('pa_id is required')
  const y = Number(year)
  const m = Number(month)
  if (!y || !m) throw new Error('year and month are required')

  const { start, end } = monthDateRange(y, m)
  const periodLabel = monthLabel(y, m)

  const [paRes, jobsRes, sessionsByPaRes, sessionsLegacyRes, leaveRes] = await Promise.all([
    supabase
      .from('passenger_assistant')
      .select('id, company_id, first_name, surname, status, fleet, phone, profile_picture_url')
      .eq('id', paId)
      .eq('company_id', companyId)
      .maybeSingle(),
    supabase
      .from('jobs')
      .select(
        'id, job_name, client_school_name, internal_job_id, status, semester_start, semester_end, passenger_assistant_pay, assigned_pa_id',
      )
      .eq('company_id', companyId)
      .eq('assigned_pa_id', paId)
      .neq('status', 'cancelled')
      .neq('status', 'canceled'),
    // Historical: stamped at session time
    supabase
      .from('job_sessions')
      .select(SESSION_SELECT)
      .eq('pa_id', paId)
      .eq('jobs.company_id', companyId)
      .gte('session_date', start)
      .lte('session_date', end)
      .order('session_date', { ascending: false }),
    // Legacy fallback: no pa_id yet, still on currently assigned job
    supabase
      .from('job_sessions')
      .select(SESSION_SELECT)
      .is('pa_id', null)
      .eq('jobs.assigned_pa_id', paId)
      .eq('jobs.company_id', companyId)
      .gte('session_date', start)
      .lte('session_date', end)
      .order('session_date', { ascending: false }),
    supabase
      .from('leave_requests')
      .select('id, start_date, end_date, status, leave_type')
      .eq('user_id', paId)
      .eq('status', 'approved'),
  ])

  if (paRes.error) throw paRes.error
  if (!paRes.data) {
    const err = new Error('Passenger assistant not found.')
    err.code = 'NOT_FOUND'
    throw err
  }
  if (jobsRes.error) throw jobsRes.error
  if (sessionsByPaRes.error) throw sessionsByPaRes.error
  if (sessionsLegacyRes.error) throw sessionsLegacyRes.error

  const pa = paRes.data
  const privatePa = isPrivateFleet(pa.fleet)
  const assignedJobs = jobsRes.data || []

  const sessionMap = new Map()
  for (const s of [...(sessionsByPaRes.data || []), ...(sessionsLegacyRes.data || [])]) {
    if (s?.id) sessionMap.set(s.id, s)
  }
  const sessions = [...sessionMap.values()]
    .filter((s) => {
      const js = String(s.jobs?.status || '').toLowerCase()
      return js !== 'cancelled' && js !== 'canceled'
    })
    .sort((a, b) => String(b.session_date).localeCompare(String(a.session_date)))
  const leaves = leaveRes.error ? [] : leaveRes.data || []

  const jobIdsFromSessions = new Set(sessions.map((s) => s.job_id).filter(Boolean))
  const jobsInReport = new Map()
  for (const j of assignedJobs) jobsInReport.set(j.id, j)
  for (const s of sessions) {
    if (s.job_id && s.jobs) {
      jobsInReport.set(s.job_id, {
        id: s.job_id,
        job_name: s.jobs.job_name,
        client_school_name: s.jobs.client_school_name,
        passenger_assistant_pay: s.jobs.passenger_assistant_pay,
        status: s.jobs.status,
      })
    }
  }

  let morningCompleted = 0
  let eveningCompleted = 0
  let completedSessions = 0
  let skippedSessions = 0
  let incompleteSessions = 0
  let cancelledSessions = 0
  let otherSessions = 0

  const byDay = new Map()
  const byJob = new Map()

  for (const s of sessions) {
    const status = String(s.status || '').toLowerCase()
    const isEvening = String(s.direction || '').toLowerCase() === 'inbound'
    const day = String(s.session_date).slice(0, 10)

    if (!byDay.has(day)) byDay.set(day, { date: day, completed: 0, total: 0 })
    const dayRow = byDay.get(day)
    dayRow.total += 1

    if (!byJob.has(s.job_id)) {
      const job = jobsInReport.get(s.job_id) || {}
      const rate = job.passenger_assistant_pay != null ? Number(job.passenger_assistant_pay) : null
      byJob.set(s.job_id, {
        jobId: s.job_id,
        jobName: job.job_name || 'Job',
        school: job.client_school_name || '—',
        totalSessions: 0,
        completedSessions: 0,
        morningCompleted: 0,
        eveningCompleted: 0,
        payPerSession: rate,
        estimatedPay: 0,
      })
    }
    const jobRow = byJob.get(s.job_id)
    jobRow.totalSessions += 1

    if (status === 'completed') {
      completedSessions += 1
      dayRow.completed += 1
      jobRow.completedSessions += 1
      if (isEvening) {
        eveningCompleted += 1
        jobRow.eveningCompleted += 1
      } else {
        morningCompleted += 1
        jobRow.morningCompleted += 1
      }
      if (privatePa && jobRow.payPerSession != null) {
        jobRow.estimatedPay += jobRow.payPerSession
      }
    } else if (status === 'skipped') skippedSessions += 1
    else if (status === 'incomplete') incompleteSessions += 1
    else if (status === 'cancelled' || status === 'canceled') cancelledSessions += 1
    else otherSessions += 1
  }

  const totalSessions = sessions.length
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 1000) / 10 : 0
  const jobsAssigned = Math.max(assignedJobs.length, jobIdsFromSessions.size)

  let estimatedPay = 0
  if (privatePa) {
    for (const row of byJob.values()) estimatedPay += row.estimatedPay || 0
  }

  const leaveInPeriod = leaves.filter((l) => overlapsLeave(l, start, end))
  const activeDays = [...byDay.values()].filter((d) => d.completed > 0).length

  const dailyTrend = []
  const daysInMonth = new Date(y, m, 0).getDate()
  for (let d = 1; d <= daysInMonth; d += 1) {
    const key = `${y}-${pad2(m)}-${pad2(d)}`
    const row = byDay.get(key)
    dailyTrend.push({
      date: key,
      label: String(d),
      completed: row?.completed || 0,
      total: row?.total || 0,
    })
  }

  const jobsBreakdown = [...byJob.values()].sort(
    (a, b) => b.completedSessions - a.completedSessions || b.totalSessions - a.totalSessions,
  )

  const sessionHistory = sessions.map((s) => ({
    id: s.id,
    date: String(s.session_date).slice(0, 10),
    jobId: s.job_id,
    jobName: s.jobs?.job_name || 'Job',
    school: s.jobs?.client_school_name || '—',
    direction: formatDirection(s.direction),
    status: formatSessionStatus(s.status),
    statusRaw: s.status,
    startedAt: s.started_at,
    completedAt: s.completed_at,
  }))

  return {
    periodLabel,
    year: y,
    month: m,
    pa: {
      id: pa.id,
      name: [pa.first_name, pa.surname].filter(Boolean).join(' ').trim() || 'Passenger Assistant',
      avatar: pa.profile_picture_url || defaultAvatar(pa.id),
      status: formatStaffStatus(pa.status),
      fleet: pa.fleet,
      fleetLabel: formatFleetLabel(pa.fleet),
      isPrivate: privatePa,
      phone: pa.phone || null,
    },
    stats: {
      jobsAssigned,
      totalSessions,
      completedSessions,
      completionRate,
      morningCompleted,
      eveningCompleted,
      skippedSessions,
      incompleteSessions,
      cancelledSessions,
      otherSessions,
      activeDays,
      leaveDays: leaveInPeriod.length,
      estimatedPay: privatePa ? Math.round(estimatedPay * 100) / 100 : null,
    },
    dailyTrend,
    morningVsEvening: {
      morning: morningCompleted,
      evening: eveningCompleted,
    },
    jobsBreakdown,
    sessionHistory,
  }
}
