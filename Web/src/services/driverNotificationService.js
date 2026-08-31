import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  createUserNotification,
  NOTIFICATION_TYPE_MESSAGE,
} from './userNotificationService'

function formatDriverName(driver) {
  return [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim() || 'Driver'
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
      console.warn('portal driver event push failed', { userId, error: err?.message || err })
    }
  }
}

async function insertDriverPortalEvent({
  companyId,
  driverId,
  vehicleId = null,
  eventType,
  title,
  body,
  payload = {},
}) {
  const actorId = await getActorId()
  const { data, error } = await supabaseAdmin
    .from('driver_event_notifications')
    .insert({
      company_id: companyId,
      driver_id: driverId,
      vehicle_id: vehicleId || null,
      actor_id: actorId,
      event_type: eventType,
      title,
      body,
      payload: {
        ...payload,
        event: eventType,
        driver_id: driverId,
        vehicle_id: vehicleId || null,
      },
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

const STATUS_EVENT_MAP = {
  approved: {
    eventType: 'driver_approved',
    driverTitle: 'Account Approved',
    driverBody: 'Your account has been approved. You can now be assigned to jobs.',
    adminTitle: 'Driver Approved',
    adminBody: (name) => `${name} has been approved.`,
  },
  rejected: {
    eventType: 'driver_rejected',
    driverTitle: 'Account Rejected',
    driverBody: 'Your account registration has been rejected. Please contact your administrator.',
    adminTitle: 'Driver Rejected',
    adminBody: (name) => `${name} has been rejected.`,
  },
  suspended: {
    eventType: 'driver_suspended',
    driverTitle: 'Account Suspended',
    driverBody: 'Your account has been suspended. Please contact your administrator.',
    adminTitle: 'Driver Suspended',
    adminBody: (name) => `${name} has been suspended.`,
  },
  active: {
    eventType: 'driver_active',
    driverTitle: 'Account Active',
    driverBody: 'Your account is now active again.',
    adminTitle: 'Driver Set to Active',
    adminBody: (name) => `${name} has been set to active.`,
  },
}

/**
 * Notify driver (in-app + push) and portal admins (in-app + push) on manual status change.
 */
export async function notifyDriverStatusChange({ driver, previousStatus = null }) {
  if (!driver?.id || !driver?.company_id) return

  const status = String(driver.status || '').trim().toLowerCase()
  const config = STATUS_EVENT_MAP[status]
  if (!config) return

  const previous = String(previousStatus || '').trim().toLowerCase()
  if (previous === status) return

  const driverName = formatDriverName(driver)
  const adminBody = config.adminBody(driverName)
  const payload = {
    event: config.eventType,
    driver_id: driver.id,
    driver_name: driverName,
    previous_status: previous || null,
    new_status: status,
    source: 'manual',
  }

  try {
    const portalEvent = await insertDriverPortalEvent({
      companyId: driver.company_id,
      driverId: driver.id,
      eventType: config.eventType,
      title: config.adminTitle,
      body: adminBody,
      payload,
    })

    await notifyPortalUsersPush({
      companyId: driver.company_id,
      title: config.adminTitle,
      body: adminBody,
      type: config.eventType,
      notificationId: portalEvent?.id,
      referenceId: driver.id,
    })

    await createUserNotification({
      userId: driver.id,
      companyId: driver.company_id,
      notificationType: NOTIFICATION_TYPE_MESSAGE,
      title: config.driverTitle,
      body: config.driverBody,
      referenceId: driver.id,
      payload,
      sendPush: true,
    })
  } catch (err) {
    console.warn('Driver status notification failed:', err?.message || err)
  }
}
