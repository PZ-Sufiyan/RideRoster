import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { getCompanyAdminById } from './companyService'
import { getSubAdminById } from './subAdminService'
import {
  createUserNotification,
  NOTIFICATION_TYPE_JOB_REMOVED,
} from './userNotificationService'

export const PORTAL_JOB_EVENT = {
  DRIVER_ASSIGNED: 'job_driver_assigned',
  DRIVER_REMOVED: 'job_driver_removed',
  PA_ASSIGNED: 'job_pa_assigned',
  PA_REMOVED: 'job_pa_removed',
}

function formatDriverName(driver) {
  return [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim() || 'Driver'
}

function formatJobLabel(job) {
  if (job?.internal_job_id) return String(job.internal_job_id)
  if (job?.job_name) return String(job.job_name)
  return job?.id ? `Job ${String(job.id).slice(0, 8)}` : 'a job'
}

async function getActor() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const uid = session?.user?.id || null
  if (!uid) return { actorId: null, actorName: 'Admin' }

  const admin = await getCompanyAdminById(uid)
  if (admin?.company_id) {
    return { actorId: uid, actorName: admin.full_name || 'Admin' }
  }

  const sub = await getSubAdminById(uid)
  if (sub?.company_id) {
    return { actorId: uid, actorName: sub.name || 'Admin' }
  }

  return { actorId: uid, actorName: 'Admin' }
}

async function loadDriver(driverId) {
  if (!driverId) return null
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .select('id, first_name, last_name, fleet')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function loadPa(paId) {
  if (!paId) return null
  const { data, error } = await supabaseAdmin
    .from('passenger_assistant')
    .select('id, first_name, surname, fleet')
    .eq('id', paId)
    .maybeSingle()
  if (error) throw error
  return data
}

function formatPaName(pa) {
  return [pa?.first_name, pa?.surname].filter(Boolean).join(' ').trim() || 'Passenger Assistant'
}

async function insertPortalEvent({
  companyId,
  jobId,
  driverId = null,
  paId = null,
  eventType,
  title,
  body,
  payload = {},
}) {
  if (!companyId || !jobId) return null
  const { actorId } = await getActor()
  const row = {
    company_id: companyId,
    job_id: jobId,
    driver_id: driverId || null,
    actor_id: actorId,
    event_type: eventType,
    title,
    body,
    payload,
  }
  if (paId) row.pa_id = paId
  const { data, error } = await supabaseAdmin
    .from('job_event_notifications')
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

function warn(label, err) {
  console.warn(`${label}:`, err?.message || err)
}

/**
 * Portal notification when a company driver is directly assigned (auto-accepted).
 */
export async function notifyPortalCompanyDriverAssigned({ job, driverId, driver = null }) {
  try {
    if (!job?.id || !job?.company_id || !driverId) return null

    const driverRow = driver?.id ? driver : await loadDriver(driverId)
    if (!driverRow?.id) return null

    const { actorName } = await getActor()
    const driverName = formatDriverName(driverRow)
    const jobLabel = formatJobLabel(job)
    const school = job.client_school_name?.trim() || ''

    return insertPortalEvent({
      companyId: job.company_id,
      jobId: job.id,
      driverId: driverRow.id,
      eventType: PORTAL_JOB_EVENT.DRIVER_ASSIGNED,
      title: 'Driver Assigned:',
      body: school
        ? `${actorName} assigned ${driverName} to ${jobLabel} (${school}).`
        : `${actorName} assigned ${driverName} to ${jobLabel}.`,
      payload: {
        event: PORTAL_JOB_EVENT.DRIVER_ASSIGNED,
        actor_name: actorName,
        driver_name: driverName,
        job_name: job.job_name || null,
        job_label: jobLabel,
        client_school_name: school || null,
        internal_job_id: job.internal_job_id ?? null,
      },
    })
  } catch (err) {
    warn('Company driver assignment portal notification failed', err)
    return null
  }
}

/**
 * Manual driver removal: portal event for admins/sub-admins + driver in-app/push.
 */
export async function notifyManualDriverJobRemoval({
  job,
  driverId,
  driver = null,
}) {
  try {
    if (!job?.id || !driverId) return null

    const driverRow = driver?.id ? driver : await loadDriver(driverId)
    if (!driverRow?.id) return null

    const { actorName } = await getActor()
    const driverName = formatDriverName(driverRow)
    const jobLabel = formatJobLabel(job)
    const jobName = job.job_name?.trim() || jobLabel
    const school = job.client_school_name?.trim() || ''
    const payload = {
      event: PORTAL_JOB_EVENT.DRIVER_REMOVED,
      actor_name: actorName,
      driver_name: driverName,
      job_id: job.id,
      job_name: job.job_name || null,
      job_label: jobLabel,
      client_school_name: school || null,
      internal_job_id: job.internal_job_id ?? null,
    }

    if (job.company_id) {
      await insertPortalEvent({
        companyId: job.company_id,
        jobId: job.id,
        driverId: driverRow.id,
        eventType: PORTAL_JOB_EVENT.DRIVER_REMOVED,
        title: 'Driver Removed:',
        body: school
          ? `${actorName} removed ${driverName} from ${jobLabel} (${school}).`
          : `${actorName} removed ${driverName} from ${jobLabel}.`,
        payload,
      })
    }

    const driverBody = school
      ? `You have been removed from ${jobName} at ${school}.`
      : `You have been removed from ${jobName}.`

    await createUserNotification({
      userId: driverRow.id,
      companyId: job.company_id ?? null,
      notificationType: NOTIFICATION_TYPE_JOB_REMOVED,
      title: 'Removed from Job',
      body: driverBody,
      referenceId: job.id,
      sendPush: true,
      payload,
    })

    return true
  } catch (err) {
    warn('Manual driver job removal notification failed', err)
    return null
  }
}

/**
 * Portal notification when a PA is assigned to a job.
 */
export async function notifyPortalPaAssigned({ job, paId, pa = null }) {
  try {
    if (!job?.id || !job?.company_id || !paId) return null

    const paRow = pa?.id ? pa : await loadPa(paId)
    if (!paRow?.id) return null

    const { actorName } = await getActor()
    const paName = formatPaName(paRow)
    const jobLabel = formatJobLabel(job)
    const school = job.client_school_name?.trim() || ''

    return insertPortalEvent({
      companyId: job.company_id,
      jobId: job.id,
      paId: paRow.id,
      eventType: PORTAL_JOB_EVENT.PA_ASSIGNED,
      title: 'PA Assigned:',
      body: school
        ? `${actorName} assigned ${paName} to ${jobLabel} (${school}).`
        : `${actorName} assigned ${paName} to ${jobLabel}.`,
      payload: {
        event: PORTAL_JOB_EVENT.PA_ASSIGNED,
        actor_name: actorName,
        pa_name: paName,
        job_name: job.job_name || null,
        job_label: jobLabel,
        client_school_name: school || null,
        internal_job_id: job.internal_job_id ?? null,
      },
    })
  } catch (err) {
    warn('PA assignment portal notification failed', err)
    return null
  }
}

/**
 * Manual PA removal: portal event for admins/sub-admins + PA in-app/push.
 */
export async function notifyManualPaJobRemoval({
  job,
  paId,
  pa = null,
}) {
  try {
    if (!job?.id || !paId) return null

    const paRow = pa?.id ? pa : await loadPa(paId)
    if (!paRow?.id) return null

    const { actorName } = await getActor()
    const paName = formatPaName(paRow)
    const jobLabel = formatJobLabel(job)
    const jobName = job.job_name?.trim() || jobLabel
    const school = job.client_school_name?.trim() || ''
    const payload = {
      event: PORTAL_JOB_EVENT.PA_REMOVED,
      actor_name: actorName,
      pa_name: paName,
      job_id: job.id,
      job_name: job.job_name || null,
      job_label: jobLabel,
      client_school_name: school || null,
      internal_job_id: job.internal_job_id ?? null,
    }

    if (job.company_id) {
      await insertPortalEvent({
        companyId: job.company_id,
        jobId: job.id,
        paId: paRow.id,
        eventType: PORTAL_JOB_EVENT.PA_REMOVED,
        title: 'PA Removed:',
        body: school
          ? `${actorName} removed ${paName} from ${jobLabel} (${school}).`
          : `${actorName} removed ${paName} from ${jobLabel}.`,
        payload,
      })
    }

    const paBody = school
      ? `You have been removed from ${jobName} at ${school}.`
      : `You have been removed from ${jobName}.`

    await createUserNotification({
      userId: paRow.id,
      companyId: job.company_id ?? null,
      notificationType: NOTIFICATION_TYPE_JOB_REMOVED,
      title: 'Removed from Job',
      body: paBody,
      referenceId: job.id,
      sendPush: true,
      payload,
    })

    return true
  } catch (err) {
    warn('Manual PA job removal notification failed', err)
    return null
  }
}
