import {
  createSupabaseAdminClient,
  createSupabaseAuthClient,
} from './supabaseClient.js'
import { notifyDriverPortalEvent } from './driverEventNotifications.js'
import { notifyPaPortalEvent } from './paEventNotifications.js'
import {
  REASSIGNMENT_REASON,
  createJobReassignmentAlert,
  loadDriverJobsForRemoval,
  loadPaJobsForRemoval,
  removeDriverFromJobs,
  removePaFromJobs,
  unassignCompanyDriverFromVehicle,
} from './jobReassignmentAlerts.js'
import { notifyPortalUsersPush } from './portalNotify.js'
import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

const ALLOWED_ROLES = new Set(['driver', 'passenger_assistant'])
const DELETED_STATUS = 'deleted'
const INACTIVE_VEHICLE_STATUS = 'inactive'

function extractRole(user) {
  return (
    user?.app_metadata?.role ??
    user?.user_metadata?.role ??
    null
  )
}

function operatingTimezone() {
  return resolveTimezone(process.env.DOCUMENT_EXPIRY_TIMEZONE || 'Europe/London')
}

function todayYmd() {
  return getZonedNow(operatingTimezone()).date
}

function isDeletedStatus(status) {
  return String(status || '').trim().toLowerCase() === DELETED_STATUS
}

function isPrivateFleet(fleet) {
  return String(fleet || '').trim().toLowerCase() === 'private'
}

function dummyAuthEmail(userId) {
  const compact = String(userId || '').replace(/-/g, '')
  return `deleted.${compact}@noreply.local`
}

function formatPersonName(row, fallback) {
  const first = row?.first_name || ''
  const last = row?.last_name || row?.surname || ''
  return `${first} ${last}`.trim() || fallback
}

function formatVehicleLabel(vehicle) {
  if (!vehicle) return 'the vehicle'
  const name = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim()
  const plate = vehicle.taxi_license_plate_number || vehicle.registration_number
  if (name && plate) return `${name} (${plate})`
  return name || plate || 'the vehicle'
}

function formatJobNames(jobs) {
  const names = (jobs || []).map(
    (job) => job.job_name?.trim() || job.internal_job_id || 'a job',
  )
  if (!names.length) return ''
  if (names.length === 1) return `"${names[0]}"`
  if (names.length === 2) return `"${names[0]}" and "${names[1]}"`
  return `"${names[0]}", "${names[1]}" and ${names.length - 2} more`
}

function joinSentences(parts) {
  return parts.filter(Boolean).join(' ')
}

/**
 * Authenticated self-service account close for mobile driver / PA users.
 *
 * Requires Authorization: Bearer <access_token>.
 * Keeps profile + history, frees the Auth email, and blocks login.
 */
export async function deleteAuthenticatedAccount(authHeader) {
  if (!authHeader) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  const supabaseAuth = createSupabaseAuthClient(authHeader)
  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser()

  if (userError || !user) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  const role = String(extractRole(user) || '')
    .trim()
    .toLowerCase()
  if (!ALLOWED_ROLES.has(role)) {
    const err = new Error(
      'Only drivers and passenger assistants can delete their account here.',
    )
    err.status = 403
    throw err
  }

  const userId = user.id
  const supabaseAdmin = createSupabaseAdminClient()

  if (role === 'driver') {
    await closeDriverAccount(supabaseAdmin, user, userId)
  } else {
    await closePassengerAssistantAccount(supabaseAdmin, user, userId)
  }

  await tombstoneAuthUser(supabaseAdmin, user)
  await clearDeviceTokens(supabaseAdmin, userId)

  console.info('delete-account ok', { userId, role })
  return { ok: true, userId, role }
}

async function closeDriverAccount(supabase, user, userId) {
  const { data: driver, error } = await supabase
    .from('drivers')
    .select(
      'id, company_id, first_name, last_name, email, status, fleet, vehicle_assigned',
    )
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!driver) {
    const err = new Error('Driver profile not found.')
    err.status = 404
    throw err
  }

  const alreadyDeleted = isDeletedStatus(driver.status)
  const today = todayYmd()
  const jobs = alreadyDeleted
    ? []
    : await loadDriverJobsForRemoval(supabase, userId, today)

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select(
      'id, company_id, fleet, driver_id, make, model, taxi_license_plate_number, registration_number, status',
    )
    .eq('driver_id', userId)
    .maybeSingle()

  let unassignedVehicle = null
  let inactivatedVehicle = null

  if (!alreadyDeleted) {
    const removedJobs = await removeDriverFromJobs(supabase, jobs)

    if (isPrivateFleet(driver.fleet) && vehicle?.id) {
      inactivatedVehicle = await setPrivateVehicleInactive(supabase, vehicle.id)
    } else if (!isPrivateFleet(driver.fleet)) {
      unassignedVehicle = await unassignCompanyDriverFromVehicle(supabase, userId)
    }

    const now = new Date().toISOString()
    const { error: statusErr } = await supabase
      .from('drivers')
      .update({
        status: DELETED_STATUS,
        vehicle_assigned: isPrivateFleet(driver.fleet)
          ? driver.vehicle_assigned
          : false,
        updated_at: now,
      })
      .eq('id', userId)
    if (statusErr) throw statusErr

    await notifyDriverClosed(supabase, {
      driver,
      user,
      vehicle: inactivatedVehicle || unassignedVehicle || vehicle,
      unassignedVehicle,
      inactivatedVehicle,
      removedJobs,
    })
  }
}

async function closePassengerAssistantAccount(supabase, user, userId) {
  const { data: pa, error } = await supabase
    .from('passenger_assistant')
    .select('id, company_id, first_name, surname, email, status, fleet')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!pa) {
    const err = new Error('Passenger assistant profile not found.')
    err.status = 404
    throw err
  }

  const alreadyDeleted = isDeletedStatus(pa.status)
  const today = todayYmd()
  const jobs = alreadyDeleted
    ? []
    : await loadPaJobsForRemoval(supabase, userId, today)

  if (!alreadyDeleted) {
    const removedJobs = await removePaFromJobs(supabase, jobs)

    const now = new Date().toISOString()
    const { error: statusErr } = await supabase
      .from('passenger_assistant')
      .update({
        status: DELETED_STATUS,
        updated_at: now,
      })
      .eq('id', userId)
    if (statusErr) throw statusErr

    await notifyPaClosed(supabase, { pa, user, removedJobs })
  }
}

async function setPrivateVehicleInactive(supabase, vehicleId) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      status: INACTIVE_VEHICLE_STATUS,
      updated_at: now,
    })
    .eq('id', vehicleId)
    .select(
      'id, company_id, fleet, driver_id, make, model, taxi_license_plate_number, registration_number, status',
    )
    .maybeSingle()
  if (error) throw error
  return data
}

async function tombstoneAuthUser(supabase, user) {
  const userId = user.id
  const originalEmail = String(user.email || '').trim().toLowerCase()
  const dummyEmail = dummyAuthEmail(userId)
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email: dummyEmail,
    email_confirm: true,
    ban_duration: '876000h',
    app_metadata: {
      ...(user.app_metadata || {}),
      account_deleted: true,
      original_email: originalEmail || null,
      deleted_at: new Date().toISOString(),
    },
    user_metadata: {
      ...(user.user_metadata || {}),
      account_deleted: true,
    },
  })
  if (error) throw error
}

async function clearDeviceTokens(supabase, userId) {
  const { error } = await supabase
    .from('device_push_tokens')
    .delete()
    .eq('user_id', userId)
  if (error) {
    console.warn('delete-account token cleanup failed', {
      userId,
      error: error.message,
    })
  }
}

async function notifyDriverClosed(supabase, {
  driver,
  user,
  vehicle,
  unassignedVehicle,
  inactivatedVehicle,
  removedJobs,
}) {
  const companyId = driver.company_id
  const driverName = formatPersonName(driver, 'A driver')
  const vehicleLabel = (unassignedVehicle || inactivatedVehicle || vehicle)
    ? formatVehicleLabel(unassignedVehicle || inactivatedVehicle || vehicle)
    : null
  const jobList = formatJobNames(removedJobs)
  const privateFleet = isPrivateFleet(driver.fleet)

  const details = joinSentences([
    `${driverName} deleted their account.`,
    unassignedVehicle
      ? `They were unassigned from ${vehicleLabel}.`
      : '',
    inactivatedVehicle
      ? `Their private vehicle ${vehicleLabel} was marked inactive.`
      : '',
    jobList
      ? `They were unassigned from ${jobList}.`
      : '',
    removedJobs.length
      ? 'Those jobs still need a driver assigned.'
      : '',
  ])

  try {
    if (companyId) {
      const portalEvent = await notifyDriverPortalEvent(supabase, {
        companyId,
        driverId: driver.id,
        vehicleId: vehicle?.id || unassignedVehicle?.id || inactivatedVehicle?.id || null,
        eventType: 'driver_deleted',
        title: 'Driver Deleted Account',
        body: details,
        payload: {
          driver_name: driverName,
          fleet: driver.fleet || null,
          previous_status: driver.status || null,
          new_status: DELETED_STATUS,
          source: 'self_service',
          vehicle_id: vehicle?.id || null,
          vehicle_label: vehicleLabel,
          vehicle_unassigned: Boolean(unassignedVehicle),
          vehicle_inactive: Boolean(inactivatedVehicle),
          jobs_removed: (removedJobs || []).map((job) => job.id),
          original_email: driver.email || user.email || null,
        },
        notifyPortalUsersPush,
      })

      if (!portalEvent) {
        await notifyPortalUsersPush(supabase, {
          companyId,
          title: 'Driver Deleted Account',
          body: details,
          type: 'driver_deleted',
          referenceId: driver.id,
        })
      }
    }

    for (const job of removedJobs || []) {
      const jobName = job.job_name?.trim() || 'a job'
      const alertTitle = 'Job Reassignment Required'
      const alertBody = `${driverName} deleted their account and was removed from "${jobName}". Please assign a new driver.`
      const alert = await createJobReassignmentAlert(supabase, {
        companyId: job.company_id || companyId,
        driverId: driver.id,
        vehicleId: vehicle?.id || null,
        job,
        reason: REASSIGNMENT_REASON.DRIVER_ACCOUNT_DELETED,
        fleet: privateFleet ? 'private' : 'company',
        title: alertTitle,
        body: alertBody,
        payload: {
          driver_name: driverName,
          source: 'self_service',
        },
      })

      if (job.company_id || companyId) {
        await notifyPortalUsersPush(supabase, {
          companyId: job.company_id || companyId,
          title: alertTitle,
          body: alertBody,
          type: 'job_reassignment',
          notificationId: alert.notification?.id,
          referenceId: job.id,
        })
      }
    }
  } catch (err) {
    console.warn('delete-account driver notify failed', {
      driverId: driver.id,
      error: err instanceof Error ? err.message : err,
    })
  }
}

async function notifyPaClosed(supabase, { pa, user, removedJobs }) {
  const companyId = pa.company_id
  const paName = formatPersonName(pa, 'A passenger assistant')
  const jobList = formatJobNames(removedJobs)

  const details = joinSentences([
    `${paName} deleted their account.`,
    jobList ? `They were unassigned from ${jobList}.` : '',
  ])

  try {
    if (companyId) {
      await notifyPaPortalEvent(supabase, {
        companyId,
        paId: pa.id,
        eventType: 'pa_deleted',
        title: 'PA Deleted Account',
        body: details,
        payload: {
          pa_name: paName,
          fleet: pa.fleet || null,
          previous_status: pa.status || null,
          new_status: DELETED_STATUS,
          source: 'self_service',
          jobs_removed: (removedJobs || []).map((job) => job.id),
          original_email: pa.email || user.email || null,
        },
        notifyPortalUsersPush,
      })
    }

    for (const job of removedJobs || []) {
      const jobName = job.job_name?.trim() || 'a job'
      const school = job.client_school_name?.trim() || ''
      const adminJobBody = school
        ? `${paName} deleted their account and was removed from "${jobName}" at ${school}.`
        : `${paName} deleted their account and was removed from "${jobName}".`

      if (job.company_id || companyId) {
        await notifyPaPortalEvent(supabase, {
          companyId: job.company_id || companyId,
          paId: pa.id,
          jobId: job.id,
          eventType: 'pa_removed_from_job',
          title: 'PA Removed from Job',
          body: adminJobBody,
          payload: {
            pa_name: paName,
            source: 'self_service',
            reason: 'account_deleted',
            job_id: job.id,
            job_name: job.job_name || null,
            client_school_name: school || null,
            internal_job_id: job.internal_job_id ?? null,
          },
          notifyPortalUsersPush,
        })
      }
    }
  } catch (err) {
    console.warn('delete-account PA notify failed', {
      paId: pa.id,
      error: err instanceof Error ? err.message : err,
    })
  }
}
