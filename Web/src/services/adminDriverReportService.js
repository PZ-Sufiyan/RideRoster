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
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(id || 'driver')}`
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

function vehicleLabel(v) {
  if (!v) return null
  const plate = v.taxi_license_plate_number || v.registration_number
  const mm = [v.make, v.model].filter(Boolean).join(' ')
  if (plate && mm) return `${mm} · ${plate}`
  return plate || mm || null
}

function overlapsLeave(leave, start, end) {
  const ls = String(leave.start_date || '').slice(0, 10)
  const le = String(leave.end_date || leave.start_date || '').slice(0, 10)
  if (!ls) return false
  return ls <= end && le >= start
}

/**
 * Driver-specific monthly performance report.
 * @param {string} companyId
 * @param {string} driverId
 * @param {{ year: number, month: number }} opts
 */
export async function getAdminDriverReport(companyId, driverId, { year, month } = {}) {
  if (!companyId) throw new Error('company_id is required')
  if (!driverId) throw new Error('driver_id is required')
  const y = Number(year)
  const m = Number(month)
  if (!y || !m) throw new Error('year and month are required')

  const { start, end } = monthDateRange(y, m)
  const periodLabel = monthLabel(y, m)

  const [driverRes, vehicleRes, jobsRes, sessionsRes, leaveRes, payHistRes] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, company_id, first_name, last_name, status, fleet, phone, license_no, profile_picture_url, vehicle_assigned')
      .eq('id', driverId)
      .eq('company_id', companyId)
      .maybeSingle(),
    supabase
      .from('vehicles')
      .select('id, make, model, taxi_license_plate_number, registration_number, driver_id')
      .eq('company_id', companyId)
      .eq('driver_id', driverId)
      .maybeSingle(),
    supabase
      .from('jobs')
      .select('id, job_name, client_school_name, internal_job_id, status, semester_start, semester_end, driver_pay, assigned_driver_id')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .neq('status', 'canceled'),
    supabase
      .from('job_sessions')
      .select(
        `
        id,
        job_id,
        session_date,
        direction,
        status,
        started_at,
        completed_at,
        driver_id,
        jobs!inner ( id, company_id, job_name, client_school_name, driver_pay, status )
      `,
      )
      .eq('driver_id', driverId)
      .eq('jobs.company_id', companyId)
      .gte('session_date', start)
      .lte('session_date', end)
      .order('session_date', { ascending: false }),
    supabase
      .from('leave_requests')
      .select('id, start_date, end_date, status, leave_type')
      .eq('user_id', driverId)
      .eq('status', 'approved'),
    supabase
      .from('job_driver_pay_history')
      .select('id, job_id, approved_pay, approved_at, ended_at')
      .eq('company_id', companyId)
      .eq('driver_id', driverId)
      .order('approved_at', { ascending: false }),
  ])

  if (driverRes.error) throw driverRes.error
  if (!driverRes.data) {
    const err = new Error('Driver not found.')
    err.code = 'NOT_FOUND'
    throw err
  }
  // vehicle / leave / pay history may be empty — only throw hard errors
  if (vehicleRes.error && vehicleRes.error.code !== 'PGRST116') {
    // maybeSingle 0 rows is fine; ignore soft failures for optional joins
  }
  if (jobsRes.error) throw jobsRes.error
  if (sessionsRes.error) throw sessionsRes.error

  const driver = driverRes.data
  const privateDriver = isPrivateFleet(driver.fleet)
  const vehicle = vehicleRes.error ? null : vehicleRes.data
  const jobs = jobsRes.data || []
  const sessions = (sessionsRes.data || []).filter((s) => {
    const js = String(s.jobs?.status || '').toLowerCase()
    return js !== 'cancelled' && js !== 'canceled'
  })
  const leaves = leaveRes.error ? [] : leaveRes.data || []
  const payHistory = payHistRes.error ? [] : payHistRes.data || []

  const assignedJobs = jobs.filter((j) => j.assigned_driver_id === driverId)
  const jobIdsFromSessions = new Set(sessions.map((s) => s.job_id).filter(Boolean))
  const jobsInReport = new Map()
  for (const j of assignedJobs) jobsInReport.set(j.id, j)
  for (const s of sessions) {
    if (s.job_id && s.jobs) {
      jobsInReport.set(s.job_id, {
        id: s.job_id,
        job_name: s.jobs.job_name,
        client_school_name: s.jobs.client_school_name,
        driver_pay: s.jobs.driver_pay,
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

  const payByJob = new Map()
  for (const row of payHistory) {
    if (!row.job_id || payByJob.has(row.job_id)) continue
    // most recent first — take first as current/latest approved rate
    payByJob.set(row.job_id, row.approved_pay != null ? Number(row.approved_pay) : null)
  }

  for (const s of sessions) {
    const status = String(s.status || '').toLowerCase()
    const isEvening = String(s.direction || '').toLowerCase() === 'inbound'
    const day = String(s.session_date).slice(0, 10)

    if (!byDay.has(day)) byDay.set(day, { date: day, completed: 0, total: 0 })
    const dayRow = byDay.get(day)
    dayRow.total += 1

    if (!byJob.has(s.job_id)) {
      const job = jobsInReport.get(s.job_id) || {}
      const rate =
        payByJob.has(s.job_id) && payByJob.get(s.job_id) != null
          ? payByJob.get(s.job_id)
          : job.driver_pay != null
            ? Number(job.driver_pay)
            : null
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
      if (privateDriver && jobRow.payPerSession != null) {
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
  if (privateDriver) {
    for (const row of byJob.values()) estimatedPay += row.estimatedPay || 0
  }

  const leaveInPeriod = leaves.filter((l) => overlapsLeave(l, start, end))
  const activeDays = [...byDay.values()].filter((d) => d.completed > 0).length

  // Daily series for the whole month (fill zeros)
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
    driver: {
      id: driver.id,
      name: [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim() || 'Driver',
      avatar: driver.profile_picture_url || defaultAvatar(driver.id),
      status: formatStaffStatus(driver.status),
      fleet: driver.fleet,
      fleetLabel: formatFleetLabel(driver.fleet),
      isPrivate: privateDriver,
      phone: driver.phone || null,
      licenseNo: driver.license_no || null,
      vehicleLabel: vehicleLabel(vehicle),
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
      estimatedPay: privateDriver ? Math.round(estimatedPay * 100) / 100 : null,
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
