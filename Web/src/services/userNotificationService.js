import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from './companyService'
import { getSubAdminById } from './subAdminService'

export const NOTIFICATION_TYPE_MESSAGE = 'message'
export const NOTIFICATION_TYPE_LEAVE_STATUS = 'leave_status'

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
 *   notificationType: 'message'|'leave_status',
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
