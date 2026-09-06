import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

export const REMIND_AFTER_MS = 60 * 60 * 1000

export const REASSIGNMENT_REASON = {
  COMPANY_VEHICLE_DOCUMENT: 'company_vehicle_document_expiry',
  COMPANY_DRIVER_DOCUMENT: 'company_driver_document_expiry',
  PRIVATE_VEHICLE_DOCUMENT: 'private_vehicle_document_expiry',
  PRIVATE_DRIVER_DOCUMENT: 'private_driver_document_expiry',
}

function operatingTimezone() {
  return resolveTimezone(process.env.DOCUMENT_EXPIRY_TIMEZONE || 'Europe/London')
}

export function isCancelledJobStatus(status) {
  const s = String(status || '').trim().toLowerCase()
  return s === 'cancelled' || s === 'canceled'
}

export function isActiveOrUpcomingJob(job, todayYmd) {
  if (!job || isCancelledJobStatus(job.status)) return false
  if (job.semester_end && String(job.semester_end).slice(0, 10) < todayYmd) return false
  return true
}

export async function loadDriverJobsForRemoval(supabase, driverId, todayYmd) {
  if (!driverId) return []
  const { data, error } = await supabase
    .from('jobs')
    .select('id, job_name, status, semester_start, semester_end, company_id, assigned_driver_id, internal_job_id, driver_approval_status')
    .eq('assigned_driver_id', driverId)
    .neq('status', 'cancelled')

  if (error) throw error
  return (data || []).filter((job) => isActiveOrUpcomingJob(job, todayYmd))
}

export async function removeDriverFromJob(supabase, jobId) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('jobs')
    .update({
      assigned_driver_id: null,
      driver_approval_status: null,
      driver_counter_offer_pay: null,
      updated_at: now,
    })
    .eq('id', jobId)
    .select('id, job_name, company_id, internal_job_id')

  if (error) throw error
  if (!data?.length) return null
  return data[0]
}

export async function removeDriverFromJobs(supabase, jobs) {
  const removed = []
  for (const job of jobs) {
    const updated = await removeDriverFromJob(supabase, job.id)
    if (updated) removed.push(updated)
  }
  return removed
}

function buildHourlyReminderBody({ jobName, reason }) {
  const label = jobName || 'Job'
  if (reason === REASSIGNMENT_REASON.COMPANY_VEHICLE_DOCUMENT
    || reason === REASSIGNMENT_REASON.PRIVATE_VEHICLE_DOCUMENT) {
    return `Driver was removed from ${label} because the assigned vehicle document expired. This job still requires reassignment.`
  }
  return `Driver was removed from ${label} because the driver's document expired. This job still requires reassignment.`
}

async function insertNotificationRow(supabase, row) {
  const { data, error } = await supabase
    .from('job_reassignment_alerts')
    .insert({
      ...row,
      record_type: 'notification',
      status: 'sent',
    })
    .select('id, created_at')
    .single()

  if (error) throw error
  return data
}

async function upsertTrackingRow(supabase, row) {
  const { data: existing, error: existingErr } = await supabase
    .from('job_reassignment_alerts')
    .select('id')
    .eq('job_id', row.job_id)
    .eq('record_type', 'tracking')
    .eq('status', 'open')
    .maybeSingle()

  if (existingErr) throw existingErr

  const now = new Date().toISOString()
  if (existing?.id) {
    const { data, error } = await supabase
      .from('job_reassignment_alerts')
      .update({
        title: row.title,
        body: row.body,
        payload: row.payload,
        last_notified_at: now,
      })
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('job_reassignment_alerts')
    .insert({
      ...row,
      record_type: 'tracking',
      status: 'open',
      last_notified_at: now,
    })
    .select('id')
    .single()

  if (error?.code === '23505') {
    const { data: retry, error: retryErr } = await supabase
      .from('job_reassignment_alerts')
      .select('id')
      .eq('job_id', row.job_id)
      .eq('record_type', 'tracking')
      .eq('status', 'open')
      .maybeSingle()
    if (retryErr) throw retryErr
    return retry
  }
  if (error) throw error
  return data
}

/**
 * Creates a notification history row plus (or updates) the open tracking row for hourly reminders.
 */
export async function createJobReassignmentAlert(supabase, {
  companyId,
  driverId,
  vehicleId = null,
  job,
  reason,
  fleet = null,
  title,
  body,
  payload = {},
}) {
  const base = {
    company_id: companyId,
    driver_id: driverId,
    vehicle_id: vehicleId,
    job_id: job.id,
    reason,
    fleet,
    title,
    body,
    payload: {
      ...payload,
      reason,
      fleet,
      job_id: job.id,
      job_name: job.job_name || null,
      internal_job_id: job.internal_job_id || null,
      requires_reassignment: true,
      event: 'job_reassignment',
    },
  }

  const notification = await insertNotificationRow(supabase, base)
  const tracking = await upsertTrackingRow(supabase, base)
  return { notification, tracking }
}

export async function resolveOpenJobReassignmentAlerts(supabase) {
  const { data: openAlerts, error } = await supabase
    .from('job_reassignment_alerts')
    .select('id, job_id')
    .eq('record_type', 'tracking')
    .eq('status', 'open')

  if (error) throw error
  if (!openAlerts?.length) return 0

  const jobIds = [...new Set(openAlerts.map((a) => a.job_id).filter(Boolean))]
  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select('id, assigned_driver_id, status, semester_end')
    .in('id', jobIds)
  if (jobsErr) throw jobsErr

  const todayYmd = getZonedNow(operatingTimezone()).date
  const jobById = new Map((jobs || []).map((j) => [j.id, j]))
  const now = new Date().toISOString()
  let resolved = 0

  for (const alert of openAlerts) {
    const job = jobById.get(alert.job_id)
    const shouldResolve = !job
      || Boolean(job.assigned_driver_id)
      || isCancelledJobStatus(job.status)
      || (job.semester_end && String(job.semester_end).slice(0, 10) < todayYmd)

    if (!shouldResolve) continue

    const updatePayload = { status: 'resolved', resolved_at: now }
    if (job?.assigned_driver_id) {
      updatePayload.new_driver_id = job.assigned_driver_id
    }

    const { error: updateErr } = await supabase
      .from('job_reassignment_alerts')
      .update(updatePayload)
      .eq('id', alert.id)
      .eq('status', 'open')
    if (updateErr) {
      console.warn('failed to resolve job reassignment tracking alert', {
        alertId: alert.id,
        error: updateErr.message,
      })
      continue
    }
    resolved += 1
  }

  return resolved
}

export async function remindOpenJobReassignmentAlerts(supabase, summary, notifyPortalUsersPush) {
  const cutoff = new Date(Date.now() - REMIND_AFTER_MS).toISOString()
  const { data: alerts, error } = await supabase
    .from('job_reassignment_alerts')
    .select('id, company_id, driver_id, vehicle_id, job_id, reason, fleet, title, body, payload, last_notified_at')
    .eq('record_type', 'tracking')
    .eq('status', 'open')
    .lte('last_notified_at', cutoff)

  if (error) throw error
  if (!alerts?.length) return

  for (const alert of alerts) {
    try {
      const jobName = alert.payload?.job_name || alert.body?.match(/"([^"]+)"/)?.[1] || 'Job'
      const reminderTitle = 'Job Reassignment Required'
      const reminderBody = buildHourlyReminderBody({ jobName, reason: alert.reason })

      const notification = await insertNotificationRow(supabase, {
        company_id: alert.company_id,
        driver_id: alert.driver_id,
        vehicle_id: alert.vehicle_id,
        job_id: alert.job_id,
        reason: alert.reason,
        fleet: alert.fleet,
        title: reminderTitle,
        body: reminderBody,
        payload: {
          ...(alert.payload || {}),
          event: 'job_reassignment_reminder',
          is_hourly_reminder: true,
        },
      })

      await notifyPortalUsersPush(supabase, {
        companyId: alert.company_id,
        title: reminderTitle,
        body: reminderBody,
        type: 'job_reassignment',
        notificationId: notification?.id,
        referenceId: alert.job_id,
      })

      const { error: updateErr } = await supabase
        .from('job_reassignment_alerts')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', alert.id)
        .eq('status', 'open')
      if (updateErr) throw updateErr

      summary.reminded = (summary.reminded || 0) + 1
    } catch (err) {
      console.warn('job reassignment hourly reminder failed', {
        alertId: alert.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }
}

export async function runJobReassignmentMaintenanceTick(supabase, notifyPortalUsersPush) {
  const summary = { resolved: 0, reminded: 0 }

  try {
    summary.resolved = await resolveOpenJobReassignmentAlerts(supabase)
  } catch (err) {
    console.error('resolve job reassignment alerts failed', {
      error: err instanceof Error ? err.message : err,
    })
  }

  try {
    await remindOpenJobReassignmentAlerts(supabase, summary, notifyPortalUsersPush)
  } catch (err) {
    console.error('job reassignment hourly remind failed', {
      error: err instanceof Error ? err.message : err,
    })
  }

  if (summary.resolved > 0 || summary.reminded > 0) {
    console.info('job reassignment maintenance tick', {
      utcAt: new Date().toISOString(),
      ...summary,
    })
  }

  return summary
}

export async function unassignCompanyDriverFromVehicle(supabase, driverId) {
  if (!driverId) return null

  const { data: vehicle, error: vehicleErr } = await supabase
    .from('vehicles')
    .select('id, company_id, fleet, driver_id, make, model, taxi_license_plate_number, registration_number, status')
    .eq('driver_id', driverId)
    .eq('fleet', 'company')
    .maybeSingle()

  if (vehicleErr) throw vehicleErr
  if (!vehicle?.id) return null

  const now = new Date().toISOString()
  const { error: clearVehicleErr } = await supabase
    .from('vehicles')
    .update({ driver_id: null, updated_at: now })
    .eq('id', vehicle.id)
  if (clearVehicleErr) throw clearVehicleErr

  const { error: driverErr } = await supabase
    .from('drivers')
    .update({ vehicle_assigned: false, updated_at: now })
    .eq('id', driverId)
  if (driverErr) {
    await supabase
      .from('vehicles')
      .update({ driver_id: driverId, updated_at: now })
      .eq('id', vehicle.id)
    throw driverErr
  }

  return vehicle
}

export async function loadPaJobsForRemoval(supabase, paId, todayYmd) {
  if (!paId) return []
  const { data, error } = await supabase
    .from('jobs')
    .select('id, job_name, status, semester_start, semester_end, company_id, assigned_pa_id, internal_job_id, client_school_name')
    .eq('assigned_pa_id', paId)
    .neq('status', 'cancelled')

  if (error) throw error
  return (data || []).filter((job) => isActiveOrUpcomingJob(job, todayYmd))
}

export async function removePaFromJob(supabase, jobId) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('jobs')
    .update({
      assigned_pa_id: null,
      updated_at: now,
    })
    .eq('id', jobId)
    .select('id, job_name, company_id, internal_job_id, client_school_name')

  if (error) throw error
  if (!data?.length) return null
  return data[0]
}

export async function removePaFromJobs(supabase, jobs) {
  const removed = []
  for (const job of jobs) {
    const updated = await removePaFromJob(supabase, job.id)
    if (updated) removed.push({ ...job, ...updated })
  }
  return removed
}

export async function suspendApprovedPa(supabase, paId) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('passenger_assistant')
    .update({
      status: 'suspend',
      updated_at: now,
    })
    .eq('id', paId)
    .in('status', ['approve', 'approved'])
    .select('id, status')

  if (error) throw error
  return data?.length ? data[0] : null
}

export async function suspendApprovedDriver(supabase, driverId) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('drivers')
    .update({
      status: 'suspended',
      updated_at: now,
    })
    .eq('id', driverId)
    .eq('status', 'approved')
    .select('id, status')

  if (error) throw error
  return data?.length ? data[0] : null
}

export async function setVehicleOffRoad(supabase, vehicleId, keepDriver = false) {
  const now = new Date().toISOString()
  const update = {
    status: 'off_road',
    updated_at: now,
  }
  if (!keepDriver) {
    update.driver_id = null
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update(update)
    .eq('id', vehicleId)
    .select('id, driver_id, company_id, fleet, make, model, taxi_license_plate_number, registration_number')
    .maybeSingle()

  if (error) throw error
  return data
}
