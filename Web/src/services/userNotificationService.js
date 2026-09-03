import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from './companyService'
import { getSubAdminById } from './subAdminService'

export const NOTIFICATION_TYPE_MESSAGE = 'message'
export const NOTIFICATION_TYPE_LEAVE_STATUS = 'leave_status'
export const NOTIFICATION_TYPE_JOB_ASSIGNMENT = 'job_assignment'
export const NOTIFICATION_TYPE_DOCUMENT_EXPIRY = 'document_expiry'
export const NOTIFICATION_TYPE_VEHICLE_ASSIGNED = 'vehicle_assigned'
export const NOTIFICATION_TYPE_VEHICLE_UNASSIGNED = 'vehicle_unassigned'
export const NOTIFICATION_TYPE_VEHICLE_OFF_ROAD = 'vehicle_off_road'
export const NOTIFICATION_TYPE_JOB_REMOVED = 'job_removed'

const MAX_PREVIEW_LEN = 160

function truncatePreview(text, maxLen = MAX_PREVIEW_LEN) {
  const s = String(text || '').trim()
  if (!s) return ''
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 1)}…`
}

async function getAdminContext() {
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
  if (admin?.company_id) {
    return {
      adminUserId: uid,
      companyId: admin.company_id,
      senderName: admin.full_name || 'Admin',
    }
  }

  const sub = await getSubAdminById(uid)
  if (sub?.company_id) {
    return {
      adminUserId: uid,
      companyId: sub.company_id,
      senderName: sub.name || 'Admin',
    }
  }

  const err = new Error('No company linked to your account')
  err.code = 'NO_COMPANY'
  throw err
}

async function sendUserNotificationPush({ userId, title, body, data }) {
  try {
    const pushApiUrl = (import.meta.env.VITE_PUSH_API_URL || '').replace(/\/$/, '')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const accessToken = session?.access_token

    if (!accessToken || !pushApiUrl) return { ok: false, skipped: 'push_unavailable' }

    const res = await fetch(`${pushApiUrl}/notify/user-notification`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        data,
      }),
    })

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.warn('User notification push failed:', payload)
      return { ok: false, error: payload?.error || res.statusText }
    }
    return { ok: true, ...payload }
  } catch (err) {
    console.warn('User notification push failed:', err?.message || err)
    return { ok: false, error: err?.message || String(err) }
  }
}

/**
 * Insert an in-app notification row for a driver or PA.
 * @param {{
 *   userId: string,
 *   companyId?: string|null,
 *   notificationType: 'message'|'leave_status'|'job_assignment'|'document_expiry'|'vehicle_assigned'|'vehicle_unassigned'|'vehicle_off_road'|'job_removed',
 *   title: string,
 *   body: string,
 *   payload?: object,
 *   referenceId?: string|null,
 *   sendPush?: boolean,
 * }} params
 */
export async function createUserNotification({
  userId,
  companyId = null,
  notificationType,
  title,
  body,
  payload = {},
  referenceId = null,
  sendPush = true,
}) {
  const { data, error } = await supabase.rpc('insert_user_notification_admin', {
    p_user_id: userId,
    p_company_id: companyId,
    p_notification_type: notificationType,
    p_title: title,
    p_body: body,
    p_payload: payload,
    p_reference_id: referenceId,
  })

  if (error) throw error

  if (sendPush) {
    await sendUserNotificationPush({
      userId,
      title,
      body,
      data: {
        type: notificationType,
        notification_id: String(data.id),
        reference_id: referenceId ? String(referenceId) : '',
      },
    })
  }

  return data
}

function formatYmd(ymdStr) {
  if (!ymdStr) return '—'
  const d = new Date(`${String(ymdStr).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymdStr
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Notify requester when admin approves or rejects a leave request.
 * @param {object} leaveRow — updated leave_requests row
 */
export async function notifyLeaveRequestDecision(leaveRow) {
  if (!leaveRow?.user_id) return null

  const status = String(leaveRow.status || '').toLowerCase()
  if (status !== 'approved' && status !== 'rejected') return null

  const { companyId } = await getAdminContext()
  const leaveType = leaveRow.leave_type || 'Leave'
  const start = formatYmd(leaveRow.start_date)
  const end = formatYmd(leaveRow.end_date)
  const period =
    leaveRow.end_date && leaveRow.end_date !== leaveRow.start_date
      ? `${start} – ${end}`
      : start

  const statusLabel = status === 'approved' ? 'approved' : 'rejected'
  const title = status === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected'
  const bodyParts = [`Your ${leaveType} (${period}) has been ${statusLabel}.`]
  const adminNotes = leaveRow.admin_notes?.trim()
  if (adminNotes) bodyParts.push(adminNotes)
  const body = truncatePreview(bodyParts.join(' '))

  return createUserNotification({
    userId: leaveRow.user_id,
    companyId,
    notificationType: NOTIFICATION_TYPE_LEAVE_STATUS,
    title,
    body,
    referenceId: leaveRow.id,
    payload: {
      leave_request_id: leaveRow.id,
      status,
      admin_notes: adminNotes || null,
      leave_type: leaveType,
      start_date: leaveRow.start_date,
      end_date: leaveRow.end_date,
      reason: leaveRow.reason ?? null,
    },
  })
}

/**
 * Notify a PA when admin assigns them to a job.
 * @param {object} job — updated jobs row (must include assigned_pa_id)
 */
export async function notifyPaJobAssignment(job) {
  const paId = job?.assigned_pa_id
  if (!paId) return null

  const jobName = job.job_name?.trim() || 'New job'
  const school = job.client_school_name?.trim() || ''
  const title = 'You are Assigned to New Job'
  const body = school
    ? `You have been assigned to ${jobName} at ${school}.`
    : `You have been assigned to ${jobName}.`

  return createUserNotification({
    userId: paId,
    companyId: job.company_id ?? null,
    notificationType: NOTIFICATION_TYPE_JOB_ASSIGNMENT,
    title,
    body: truncatePreview(body),
    referenceId: job.id,
    payload: {
      job_id: job.id,
      job_name: jobName,
      client_school_name: school || null,
      internal_job_id: job.internal_job_id ?? null,
    },
  })
}

/**
 * In-app + push notification for a driver when admin assigns a job.
 * Company drivers (accepted) get a direct-assignment message;
 * private drivers (pending) get a request-to-review message.
 * @param {object} job — updated jobs row (must include assigned_driver_id)
 * @param {'accepted'|'pending'} [approvalStatus]
 */
export async function notifyDriverJobAssignment(job, approvalStatus = null) {
  const driverId = job?.assigned_driver_id
  if (!driverId) return null

  const status = String(approvalStatus || job.driver_approval_status || '')
    .trim()
    .toLowerCase()
  const isDirect = status === 'accepted'
  const jobName = job.job_name?.trim() || 'New job'
  const school = job.client_school_name?.trim() || ''
  const payNum = job.driver_pay == null || job.driver_pay === '' ? null : Number(job.driver_pay)
  const payLabel = Number.isFinite(payNum) ? `£${payNum.toFixed(2)}/week` : null

  const title = isDirect ? 'Job Assigned' : 'New Job Assignment'
  let body
  if (isDirect) {
    // Company drivers: no pay in notification copy
    body = school
      ? `You have been assigned to ${jobName} at ${school}.`
      : `You have been assigned to ${jobName}.`
  } else {
    body = school
      ? `New job request for ${jobName} at ${school}. Review it.`
      : `New job request for ${jobName}. Review it.`
    if (payLabel) body = `${body} ${payLabel}.`
  }

  return createUserNotification({
    userId: driverId,
    companyId: job.company_id ?? null,
    notificationType: NOTIFICATION_TYPE_JOB_ASSIGNMENT,
    title,
    body: truncatePreview(body),
    referenceId: job.id,
    sendPush: true,
    payload: {
      job_id: job.id,
      job_name: jobName,
      client_school_name: school || null,
      internal_job_id: job.internal_job_id ?? null,
      assignment_mode: isDirect ? 'direct' : 'request',
      driver_approval_status: status || null,
      ...(isDirect ? {} : { driver_pay: job.driver_pay ?? null }),
    },
  })
}

export async function sendPaMessage({ paId, message }) {
  const text = String(message || '').trim()
  if (!text) throw new Error('Message cannot be empty.')

  const { adminUserId, companyId, senderName } = await getAdminContext()

  const { data: pa, error: paErr } = await supabase
    .from('passenger_assistant')
    .select('id, company_id, first_name, surname')
    .eq('id', paId)
    .maybeSingle()

  if (paErr) throw paErr
  if (!pa?.id) throw new Error('Passenger assistant not found.')
  if (pa.company_id !== companyId) {
    throw new Error('Passenger assistant not found or access denied.')
  }

  const { data: msgRow, error: msgErr } = await supabase
    .from('admin_pa_messages')
    .insert({
      company_id: companyId,
      pa_id: paId,
      sender_admin_id: adminUserId,
      message: text,
    })
    .select()
    .single()

  if (msgErr) throw msgErr

  const title = 'New Message from Admin'
  const body = truncatePreview(text)

  const notification = await createUserNotification({
    userId: paId,
    companyId,
    notificationType: NOTIFICATION_TYPE_MESSAGE,
    title,
    body,
    referenceId: msgRow.id,
    payload: {
      message_id: msgRow.id,
      full_message: text,
      sender_admin_id: adminUserId,
      sender_name: senderName,
    },
  })

  return { message: msgRow, notification }
}

/**
 * Send an admin message to a driver and create an in-app notification.
 * @param {{ driverId: string, message: string }} params
 */
export async function sendDriverMessage({ driverId, message }) {
  const text = String(message || '').trim()
  if (!text) throw new Error('Message cannot be empty.')

  const { adminUserId, companyId, senderName } = await getAdminContext()

  const { data: driver, error: driverErr } = await supabase
    .from('drivers')
    .select('id, company_id, first_name, last_name')
    .eq('id', driverId)
    .maybeSingle()

  if (driverErr) throw driverErr
  if (!driver?.id) throw new Error('Driver not found.')
  if (driver.company_id !== companyId) throw new Error('Driver not found or access denied.')

  const { data: msgRow, error: msgErr } = await supabase
    .from('admin_driver_messages')
    .insert({
      company_id: companyId,
      driver_id: driverId,
      sender_admin_id: adminUserId,
      message: text,
    })
    .select()
    .single()

  if (msgErr) throw msgErr

  const title = 'New Message from Admin'
  const body = truncatePreview(text)

  const notification = await createUserNotification({
    userId: driverId,
    companyId,
    notificationType: NOTIFICATION_TYPE_MESSAGE,
    title,
    body,
    referenceId: msgRow.id,
    payload: {
      message_id: msgRow.id,
      full_message: text,
      sender_admin_id: adminUserId,
      sender_name: senderName,
    },
  })

  return { message: msgRow, notification }
}
