import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from './companyService'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const USER_ROLE_DRIVER = 'driver'
export const USER_ROLE_PA = 'passenger_assistant'

/**
 * Weekday keys (mon…sun) that occur at least once between start and end (local calendar dates).
 */
export function weekdayKeysBetween(startDate, endDate) {
  const start = startOfDay(startDate)
  const end = startOfDay(endDate)
  const found = new Set()
  let cursor = new Date(start)
  while (cursor <= end) {
    found.add(WEEKDAY_KEYS[cursor.getDay() === 0 ? 6 : cursor.getDay() - 1])
    if (found.size === 7) break
    cursor.setDate(cursor.getDate() + 1)
  }
  return [...found]
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** @param {string} isoOrYmd */
function parseYmd(isoOrYmd) {
  const s = String(isoOrYmd || '').slice(0, 10)
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function semesterOverlapsLeaveRange(job, leaveStartStr, leaveEndStr) {
  const ss = job.semester_start
  const se = job.semester_end
  if (!ss || !se) return true
  return String(ss) <= leaveEndStr && String(se) >= leaveStartStr
}

async function getCompanyIdForCurrentAdmin() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid) {
    const err = new Error('Not authenticated')
    err.code = 'AUTH'
    throw err
  }
  const admin = await getCompanyAdminById(uid)
  if (!admin?.company_id) {
    const err = new Error('No company linked to your account')
    err.code = 'NO_COMPANY'
    throw err
  }
  return admin.company_id
}

function normalizeLeaveRequestRow(row, profileByUserId) {
  const userId = row.user_id
  const userRole = (row.user_role ?? '').toString().toLowerCase()
  const profile = profileByUserId.get(userId) || {}

  return {
    id: row.id,
    user_id: userId,
    user_role: userRole,
    /** @deprecated use user_id — kept for older UI references */
    driver_id: userRole === USER_ROLE_DRIVER ? userId : null,
    leave_type: row.leave_type,
    start_date: String(row.start_date || '').slice(0, 10),
    end_date: String(row.end_date || '').slice(0, 10),
    reason: row.reason ?? '',
    attachment_url: row.attachment_url ?? null,
    status: (row.status ?? 'pending').toString().toLowerCase(),
    admin_notes: row.admin_notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    requester_first_name: profile.first_name ?? '',
    requester_last_name: profile.last_name ?? '',
    /** @deprecated use requester_* — kept for older UI */
    driver_first_name: profile.first_name ?? '',
    driver_last_name: profile.last_name ?? '',
  }
}

/**
 * Approve or reject a leave request (driver or passenger assistant).
 * @param {string} requestId
 * @param {{ status: 'approved'|'rejected', adminNotes?: string|null }} payload
 */
export async function updateLeaveRequestStatus(requestId, { status, adminNotes = null }) {
  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('status must be approved or rejected')
  }
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      admin_notes:
        adminNotes != null && String(adminNotes).trim() !== ''
          ? String(adminNotes).trim()
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** @deprecated use updateLeaveRequestStatus */
export const updateOffDayRequestStatus = updateLeaveRequestStatus

/**
 * All leave requests for users in the admin's company (drivers + passenger assistants),
 * enriched with assigned-job passenger schedule context for weekdays in the request range.
 *
 * Each request gets a `jobContexts` array:
 *   [{ job, outbound: ScheduleRow[], inbound: ScheduleRow[] }, …]
 */
export async function getLeaveRequestsEnrichedForCurrentAdmin() {
  const companyId = await getCompanyIdForCurrentAdmin()

  const [driversRes, pasRes] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, first_name, last_name, company_id')
      .eq('company_id', companyId),
    supabase
      .from('passenger_assistant')
      .select('id, first_name, surname, company_id')
      .eq('company_id', companyId),
  ])

  if (driversRes.error) throw driversRes.error
  if (pasRes.error) throw pasRes.error

  const profileByUserId = new Map()
  const companyUserIds = []

  for (const d of driversRes.data || []) {
    if (!d?.id) continue
    companyUserIds.push(d.id)
    profileByUserId.set(d.id, {
      first_name: d.first_name ?? '',
      last_name: d.last_name ?? '',
      user_role: USER_ROLE_DRIVER,
    })
  }

  for (const pa of pasRes.data || []) {
    if (!pa?.id) continue
    companyUserIds.push(pa.id)
    profileByUserId.set(pa.id, {
      first_name: pa.first_name ?? '',
      last_name: pa.surname ?? '',
      user_role: USER_ROLE_PA,
    })
  }

  if (!companyUserIds.length) return []

  const { data: rawRows, error: reqErr } = await supabase
    .from('leave_requests')
    .select(
      `
      id,
      user_id,
      user_role,
      leave_type,
      start_date,
      end_date,
      reason,
      attachment_url,
      status,
      admin_notes,
      created_at,
      updated_at
    `,
    )
    .in('user_id', companyUserIds)
    .order('created_at', { ascending: false })

  if (reqErr) throw reqErr
  if (!rawRows?.length) return []

  const requests = rawRows.map((row) => normalizeLeaveRequestRow(row, profileByUserId))

  const driverIds = requests
    .filter((r) => r.user_role === USER_ROLE_DRIVER)
    .map((r) => r.user_id)
    .filter(Boolean)
  const paIds = requests
    .filter((r) => r.user_role === USER_ROLE_PA)
    .map((r) => r.user_id)
    .filter(Boolean)

  const jobQueries = []
  if (driverIds.length) {
    jobQueries.push(
      supabase
        .from('jobs')
        .select(
          `
          id,
          company_id,
          assigned_driver_id,
          assigned_pa_id,
          job_name,
          job_type,
          client_school_name,
          internal_job_id,
          status,
          driver_approval_status,
          semester_start,
          semester_end,
          has_outbound,
          has_inbound
        `,
        )
        .eq('company_id', companyId)
        .in('assigned_driver_id', [...new Set(driverIds)])
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled'),
    )
  }
  if (paIds.length) {
    jobQueries.push(
      supabase
        .from('jobs')
        .select(
          `
          id,
          company_id,
          assigned_driver_id,
          assigned_pa_id,
          job_name,
          job_type,
          client_school_name,
          internal_job_id,
          status,
          driver_approval_status,
          semester_start,
          semester_end,
          has_outbound,
          has_inbound
        `,
        )
        .eq('company_id', companyId)
        .in('assigned_pa_id', [...new Set(paIds)])
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled'),
    )
  }

  const jobResults = jobQueries.length ? await Promise.all(jobQueries) : []
  const jobs = []
  for (const res of jobResults) {
    if (res.error) throw res.error
    for (const j of res.data || []) {
      if (!jobs.some((x) => x.id === j.id)) jobs.push(j)
    }
  }

  if (!jobs.length) return requests.map((r) => ({ ...r, jobContexts: [] }))

  const allWeekdays = new Set()
  for (const r of requests) {
    const s = parseYmd(r.start_date)
    const e = parseYmd(r.end_date)
    if (s && e) weekdayKeysBetween(s, e).forEach((w) => allWeekdays.add(w))
  }
  const weekdayList = [...allWeekdays]
  const jobIds = [...new Set(jobs.map((j) => j.id))]

  const schedulesByJobId = {}
  if (jobIds.length && weekdayList.length) {
    const { data: schedRows, error: schErr } = await supabase
      .from('passenger_schedules')
      .select(
        `
        id,
        job_id,
        passenger_id,
        weekday,
        direction,
        pickup_address,
        pickup_time,
        dropoff_address,
        dropoff_time,
        stop_order,
        notes,
        passenger:passenger_id (
          first_name,
          surname,
          wheelchair_required,
          harness_required
        )
      `,
      )
      .in('job_id', jobIds)
      .in('weekday', weekdayList)
      .is('exception_date', null)

    if (schErr) throw schErr
    for (const row of schedRows || []) {
      if (!schedulesByJobId[row.job_id]) schedulesByJobId[row.job_id] = []
      schedulesByJobId[row.job_id].push(row)
    }
  }

  return requests.map((req) => {
    const s = parseYmd(req.start_date)
    const e = parseYmd(req.end_date)
    const leaveWeekdays = s && e ? weekdayKeysBetween(s, e) : []

    const jobContexts = jobs
      .filter((job) => {
        if (!semesterOverlapsLeaveRange(job, req.start_date, req.end_date)) return false
        if (req.user_role === USER_ROLE_DRIVER) {
          return job.assigned_driver_id === req.user_id
        }
        if (req.user_role === USER_ROLE_PA) {
          return job.assigned_pa_id === req.user_id
        }
        return false
      })
      .reduce((acc, job) => {
        const relevant = (schedulesByJobId[job.id] || []).filter((row) =>
          leaveWeekdays.includes(String(row.weekday).toLowerCase()),
        )
        if (!relevant.length) return acc

        const outbound = relevant
          .filter((r) => String(r.direction).toLowerCase() === 'outbound')
          .sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0))
        const inbound = relevant
          .filter((r) => String(r.direction).toLowerCase() === 'inbound')
          .sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0))

        acc.push({ job, outbound, inbound })
        return acc
      }, [])

    return { ...req, jobContexts }
  })
}

/** @deprecated use getLeaveRequestsEnrichedForCurrentAdmin */
export const getOffDayRequestsEnrichedForCurrentAdmin = getLeaveRequestsEnrichedForCurrentAdmin
