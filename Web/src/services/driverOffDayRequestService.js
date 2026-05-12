import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from './companyService'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

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

function semesterOverlapsJobRange(job, leaveStartStr, leaveEndStr) {
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

function normalizeDriverLeaveRow(row) {
  const d = row.drivers
  const driver = Array.isArray(d) ? d[0] : d
  return {
    id: row.id,
    driver_id: row.driver_id,
    leave_type: row.leave_type,
    start_date: String(row.start_date || '').slice(0, 10),
    end_date: String(row.end_date || '').slice(0, 10),
    reason: row.reason ?? '',
    attachment_url: row.attachment_url ?? null,
    status: (row.status ?? 'pending').toString().toLowerCase(),
    admin_notes: row.admin_notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    total_leave_days: row.total_leave_days ?? null,
    driver_first_name: driver?.first_name ?? '',
    driver_last_name: driver?.last_name ?? '',
  }
}

/**
 * Approve or reject a driver leave / off-day request (same table the mobile app uses).
 * @param {string} requestId
 * @param {{ status: 'approved'|'rejected', adminNotes?: string|null }} payload
 */
export async function updateOffDayRequestStatus(requestId, { status, adminNotes = null }) {
  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('status must be approved or rejected')
  }
  const { data, error } = await supabase
    .from('driver_leave_requests')
    .update({
      status,
      admin_notes: adminNotes != null && String(adminNotes).trim() !== '' ? String(adminNotes).trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * All driver leave requests for the admin's company, each enriched with assigned-job
 * passenger schedule context for weekdays that fall within the request range
 * (outbound / inbound rows with passenger wheelchair / harness flags).
 */
export async function getOffDayRequestsEnrichedForCurrentAdmin() {
  const companyId = await getCompanyIdForCurrentAdmin()

  const { data: rawRows, error: reqErr } = await supabase
    .from('driver_leave_requests')
    .select(
      `
      id,
      driver_id,
      leave_type,
      start_date,
      end_date,
      reason,
      attachment_url,
      status,
      admin_notes,
      created_at,
      updated_at,
      drivers!inner (
        first_name,
        last_name,
        company_id
      )
    `,
    )
    .eq('drivers.company_id', companyId)
    .order('created_at', { ascending: false })

  if (reqErr) throw reqErr
  if (!rawRows?.length) return []

  const requests = rawRows.map(normalizeDriverLeaveRow)

  const driverIds = [...new Set(requests.map((r) => r.driver_id).filter(Boolean))]
  if (!driverIds.length) return requests.map((r) => ({ ...r, jobContexts: [] }))

  const { data: jobRows, error: jobErr } = await supabase
    .from('jobs')
    .select(
      `
      id,
      company_id,
      assigned_driver_id,
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
    .in('assigned_driver_id', driverIds)
    .eq('driver_approval_status', 'accepted')
    .neq('status', 'cancelled')

  if (jobErr) throw jobErr
  const jobs = jobRows || []

  const allWeekdays = new Set()
  for (const r of requests) {
    const s = parseYmd(r.start_date)
    const e = parseYmd(r.end_date)
    if (!s || !e) continue
    weekdayKeysBetween(s, e).forEach((w) => allWeekdays.add(w))
  }
  const weekdayList = [...allWeekdays]
  const jobIds = [...new Set(jobs.map((j) => j.id))]

  /** @type {Record<string, any[]>} */
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
      const jid = row.job_id
      if (!schedulesByJobId[jid]) schedulesByJobId[jid] = []
      schedulesByJobId[jid].push(row)
    }
  }

  return requests.map((req) => {
    const leaveStart = req.start_date
    const leaveEnd = req.end_date
    const s = parseYmd(leaveStart)
    const e = parseYmd(leaveEnd)
    const leaveWeekdays = s && e ? weekdayKeysBetween(s, e) : []

    const jobContexts = []
    for (const job of jobs) {
      if (job.assigned_driver_id !== req.driver_id) continue
      if (!semesterOverlapsJobRange(job, leaveStart, leaveEnd)) continue

      const list = schedulesByJobId[job.id] || []
      const relevant = list.filter(
        (row) => row.weekday && leaveWeekdays.includes(String(row.weekday).toLowerCase()),
      )
      if (!relevant.length) continue

      const outbound = relevant
        .filter((row) => String(row.direction).toLowerCase() === 'outbound')
        .sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0))
      const inbound = relevant
        .filter((row) => String(row.direction).toLowerCase() === 'inbound')
        .sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0))

      jobContexts.push({ job, outbound, inbound })
    }

    return { ...req, jobContexts }
  })
}
