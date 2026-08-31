import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { getCompanyAdminById } from './companyService'
import { getSubAdminById } from './subAdminService'

function formatPersonName(first, last) {
  return [first, last].filter(Boolean).join(' ').trim()
}

async function getCurrentPortalActor() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return null

  const admin = await getCompanyAdminById(userId)
  if (admin?.company_id) {
    return {
      userId,
      companyId: admin.company_id,
      name: admin.full_name || admin.name || 'Admin',
      role: admin.role === 'subadmin' ? 'subadmin' : 'admin',
    }
  }

  const subAdmin = await getSubAdminById(userId)
  if (subAdmin?.company_id) {
    return {
      userId,
      companyId: subAdmin.company_id,
      name: subAdmin.name || 'Sub-Admin',
      role: 'subadmin',
    }
  }

  return { userId, companyId: null, name: 'Portal user', role: 'unknown' }
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
  for (const portalUserId of userIds) {
    try {
      await pushToPortalUser({
        userId: portalUserId,
        title,
        body,
        type,
        notificationId,
        referenceId,
      })
    } catch (err) {
      console.warn('job reassignment resolved portal push failed', {
        userId: portalUserId,
        error: err?.message || err,
      })
    }
  }
}

async function loadDriverName(driverId) {
  if (!driverId) return 'a driver'
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return formatPersonName(data?.first_name, data?.last_name) || 'a driver'
}

/**
 * Close open reassignment tracking, record who assigned the replacement driver,
 * and notify all portal admins/sub-admins.
 */
export async function resolveJobReassignmentOnDriverAssign(jobId, newDriverId) {
  if (!jobId || !newDriverId) return null

  const { data: openTracking, error: trackingErr } = await supabaseAdmin
    .from('job_reassignment_alerts')
    .select('id, company_id, driver_id, vehicle_id, job_id, reason, fleet, title, body, payload')
    .eq('job_id', jobId)
    .eq('record_type', 'tracking')
    .eq('status', 'open')
    .maybeSingle()

  if (trackingErr) throw trackingErr
  if (!openTracking?.id) return null

  const actor = await getCurrentPortalActor()
  const resolvedAt = new Date().toISOString()
  const resolverName = actor?.name || 'An administrator'
  const resolverId = actor?.userId || null
  const newDriverName = await loadDriverName(newDriverId)
  const previousDriverName = await loadDriverName(openTracking.driver_id)
  const jobName = openTracking.payload?.job_name
    || openTracking.body?.match(/"([^"]+)"/)?.[1]
    || 'the job'

  const resolvedTitle = 'Job Reassignment Resolved'
  const resolvedBody = `${resolverName} assigned ${newDriverName} to "${jobName}". The reassignment issue opened after ${previousDriverName} was removed is now resolved.`

  const resolvedPayload = {
    ...(openTracking.payload || {}),
    event: 'job_reassignment_resolved',
    is_resolved: true,
    resolved_by_id: resolverId,
    resolved_by_name: resolverName,
    resolved_by_role: actor?.role || null,
    resolved_at: resolvedAt,
    previous_driver_id: openTracking.driver_id,
    previous_driver_name: previousDriverName,
    new_driver_id: newDriverId,
    new_driver_name: newDriverName,
    job_id: jobId,
    job_name: jobName,
  }

  const { error: updateErr } = await supabaseAdmin
    .from('job_reassignment_alerts')
    .update({
      status: 'resolved',
      resolved_at: resolvedAt,
      resolved_by_id: resolverId,
      resolved_by_name: resolverName,
      new_driver_id: newDriverId,
      payload: resolvedPayload,
    })
    .eq('id', openTracking.id)
    .eq('status', 'open')

  if (updateErr) throw updateErr

  const { data: notification, error: insertErr } = await supabaseAdmin
    .from('job_reassignment_alerts')
    .insert({
      company_id: openTracking.company_id,
      driver_id: openTracking.driver_id,
      vehicle_id: openTracking.vehicle_id,
      job_id: jobId,
      reason: openTracking.reason,
      fleet: openTracking.fleet,
      record_type: 'notification',
      status: 'sent',
      title: resolvedTitle,
      body: resolvedBody,
      resolved_at: resolvedAt,
      resolved_by_id: resolverId,
      resolved_by_name: resolverName,
      new_driver_id: newDriverId,
      payload: resolvedPayload,
    })
    .select('id')
    .single()

  if (insertErr) throw insertErr

  await notifyPortalUsersPush({
    companyId: openTracking.company_id,
    title: resolvedTitle,
    body: resolvedBody,
    type: 'job_reassignment_resolved',
    notificationId: notification?.id,
    referenceId: jobId,
  })

  return {
    trackingId: openTracking.id,
    notificationId: notification?.id,
    resolvedBy: resolverName,
    newDriverName,
  }
}
