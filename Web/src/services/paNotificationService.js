import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  createUserNotification,
  NOTIFICATION_TYPE_MESSAGE,
} from './userNotificationService'

function formatPaName(pa) {
  return [pa?.first_name, pa?.surname].filter(Boolean).join(' ').trim() || 'Passenger Assistant'
}

function normalizePaStatus(status) {
  return String(status || '').trim().toLowerCase()
}

async function getActorId() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id || null
}

async function loadCompanyPortalUserIds(companyId) {
  if (!companyId) return []
  const [adminsRes, subsRes] = await Promise.all([
    supabaseAdmin.from('company_admins').select('id').eq('company_id', companyId),
    supabaseAdmin.from('sub_admins').select('id').eq('company_id', companyId),
  ])
  if (adminsRes.error) throw adminsRes.error
  if (subsRes.error) throw subsRes.error
  return [...new Set([
    ...(adminsRes.data || []).map((r) => r.id),
    ...(subsRes.data || []).map((r) => r.id),
  ].filter(Boolean))]
}

async function pushToPortalUser({ userId, title, body, type, notificationId, referenceId }) {
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
        data: {
          type,
          notification_id: String(notificationId || ''),
          reference_id: String(referenceId || ''),
        },
      }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: payload?.error || res.statusText }
    return { ok: true, ...payload }
  } catch (err) {
    return { ok: false, error: err?.message || String(err) }
  }
}

async function notifyPortalUsersPush({ companyId, title, body, type, notificationId, referenceId }) {
  const userIds = await loadCompanyPortalUserIds(companyId)
  for (const userId of userIds) {
    try {
      await pushToPortalUser({ userId, title, body, type, notificationId, referenceId })
    } catch (err) {
      console.warn('portal PA event push failed', { userId, error: err?.message || err })
    }
  }
}

async function insertPaPortalEvent({
  companyId,
  paId,
  jobId = null,
  eventType,
  title,
  body,
  payload = {},
}) {
  const actorId = await getActorId()
  const { data, error } = await supabaseAdmin
    .from('pa_event_notifications')
    .insert({
      company_id: companyId,
      pa_id: paId,
      job_id: jobId || null,
      actor_id: actorId,
      event_type: eventType,
      title,
      body,
      payload: {
        ...payload,
        event: eventType,
        pa_id: paId,
        job_id: jobId || null,
      },
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

const STATUS_EVENT_MAP = {
  approve: {
    eventType: 'pa_approved',
    paTitle: 'Account Approved',
    paBody: 'Your account has been approved. You can now be assigned to jobs.',
    adminTitle: 'PA Approved',
    adminBody: (name) => `${name} has been approved.`,
  },
  approved: {
    eventType: 'pa_approved',
    paTitle: 'Account Approved',
    paBody: 'Your account has been approved. You can now be assigned to jobs.',
    adminTitle: 'PA Approved',
    adminBody: (name) => `${name} has been approved.`,
  },
  reject: {
    eventType: 'pa_rejected',
    paTitle: 'Account Rejected',
    paBody: 'Your account registration has been rejected. Please contact your administrator.',
    adminTitle: 'PA Rejected',
    adminBody: (name) => `${name} has been rejected.`,
  },
  rejected: {
    eventType: 'pa_rejected',
    paTitle: 'Account Rejected',
    paBody: 'Your account registration has been rejected. Please contact your administrator.',
    adminTitle: 'PA Rejected',
    adminBody: (name) => `${name} has been rejected.`,
  },
  suspend: {
    eventType: 'pa_suspended',
    paTitle: 'Account Suspended',
    paBody: 'Your account has been suspended. Please contact your administrator.',
    adminTitle: 'PA Suspended',
    adminBody: (name) => `${name} has been suspended.`,
  },
  suspended: {
    eventType: 'pa_suspended',
    paTitle: 'Account Suspended',
    paBody: 'Your account has been suspended. Please contact your administrator.',
    adminTitle: 'PA Suspended',
    adminBody: (name) => `${name} has been suspended.`,
  },
}

/**
 * Notify PA (in-app + push) and portal admins (in-app + push) on manual status change.
 */
export async function notifyPaStatusChange({ pa, previousStatus = null }) {
  if (!pa?.id || !pa?.company_id) return

  const status = normalizePaStatus(pa.status)
  const config = STATUS_EVENT_MAP[status]
  if (!config) return

  const previous = normalizePaStatus(previousStatus)
  if (previous === status) return
  if (
    (previous === 'approve' || previous === 'approved') &&
    (status === 'approve' || status === 'approved')
  ) return
  if (
    (previous === 'reject' || previous === 'rejected') &&
    (status === 'reject' || status === 'rejected')
  ) return
  if (
    (previous === 'suspend' || previous === 'suspended') &&
    (status === 'suspend' || status === 'suspended')
  ) return

  const paName = formatPaName(pa)
  const adminBody = config.adminBody(paName)
  const payload = {
    event: config.eventType,
    pa_id: pa.id,
    pa_name: paName,
    previous_status: previous || null,
    new_status: status,
    source: 'manual',
  }

  try {
    const portalEvent = await insertPaPortalEvent({
      companyId: pa.company_id,
      paId: pa.id,
      eventType: config.eventType,
      title: config.adminTitle,
      body: adminBody,
      payload,
    })

    await notifyPortalUsersPush({
      companyId: pa.company_id,
      title: config.adminTitle,
      body: adminBody,
      type: config.eventType,
      notificationId: portalEvent?.id,
      referenceId: pa.id,
    })

    await createUserNotification({
      userId: pa.id,
      companyId: pa.company_id,
      notificationType: NOTIFICATION_TYPE_MESSAGE,
      title: config.paTitle,
      body: config.paBody,
      referenceId: pa.id,
      payload,
      sendPush: true,
    })
  } catch (err) {
    console.warn('PA status notification failed:', err?.message || err)
  }
}
