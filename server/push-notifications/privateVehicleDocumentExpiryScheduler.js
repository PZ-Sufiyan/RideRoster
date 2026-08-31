import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'
import {
  REASSIGNMENT_REASON,
  createJobReassignmentAlert,
  loadDriverJobsForRemoval,
  removeDriverFromJobs,
  setVehicleOffRoad,
  suspendApprovedDriver,
} from './jobReassignmentAlerts.js'
import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

/** Private vehicle documents that trigger off-road + suspend when expired. */
const EXPIRY_DOCUMENT_TYPES = [
  'mot_certificate',
  'insurance_certificate',
  'taxi_license_plate',
]

const DOCUMENT_LABELS = {
  mot_certificate: 'MOT Certificate',
  insurance_certificate: 'Insurance Certificate',
  taxi_license_plate: 'Taxi License Plate',
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysBetween(fromDate, toDate) {
  const msPerDay = 24 * 60 * 60 * 1000
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
  return Math.round((to.getTime() - from.getTime()) / msPerDay)
}

function formatDisplayDate(ymd) {
  const d = parseYmd(ymd)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function documentLabel(documentType) {
  const key = String(documentType || '').trim()
  return DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
}

function formatVehicleLabel(vehicle) {
  const name = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ').trim()
  const plate = vehicle?.taxi_license_plate_number || vehicle?.registration_number
  if (name && plate) return `${name} (${plate})`
  return name || plate || 'Vehicle'
}

function joinDocNames(types) {
  const labels = [...new Set(types.map(documentLabel))]
  if (labels.length === 0) return 'a required vehicle document'
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function formatDriverName(driver) {
  return [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim() || 'Private driver'
}

function buildAdminDocumentExpiredBody({ removedJobs }) {
  if (removedJobs.length) {
    return 'Vehicle has been set to Off-Road because a vehicle document expired. The assigned driver has been suspended. The driver was removed from the job.'
  }
  return 'Vehicle has been set to Off-Road because a vehicle document expired. The assigned driver has been suspended.'
}

function operatingTimezone() {
  return resolveTimezone(process.env.DOCUMENT_EXPIRY_TIMEZONE || 'Europe/London')
}

async function claimProcessed(supabase, record) {
  const { error } = await supabase
    .from('private_vehicle_document_expiry_processed')
    .insert(record)

  if (error?.code === '23505') return false
  if (error) throw error
  return true
}

async function unclaimProcessed(supabase, documentId, expiryDate) {
  await supabase
    .from('private_vehicle_document_expiry_processed')
    .delete()
    .eq('document_id', documentId)
    .eq('expiry_date', expiryDate)
}

async function loadUserTokens(supabase, userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('fcm_token, platform, updated_at')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

async function insertUserNotification(supabase, row) {
  const { data, error } = await supabase
    .from('user_notifications')
    .insert({
      ...row,
      payload: {
        ...(row.payload || {}),
      },
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

async function pushToUser(supabase, { userId, title, body, type, notificationId, referenceId }) {
  const tokens = await loadUserTokens(supabase, userId)
  if (!tokens.length) return { ok: true, skipped: 'no_tokens' }
  return sendUserNotificationPush({
    userId,
    title,
    body,
    data: {
      type,
      notification_id: String(notificationId || ''),
      reference_id: String(referenceId || ''),
    },
    tokens,
    supabaseAdmin: supabase,
  })
}

async function notifyDriverInAppAndPush(supabase, {
  driverId,
  companyId,
  notificationType,
  title,
  body,
  referenceId,
  payload,
}) {
  const notification = await insertUserNotification(supabase, {
    user_id: driverId,
    company_id: companyId,
    notification_type: notificationType,
    title,
    body,
    reference_id: referenceId || null,
    payload,
  })

  await pushToUser(supabase, {
    userId: driverId,
    title,
    body,
    type: notificationType,
    notificationId: notification?.id,
    referenceId,
  })

  return notification
}

async function insertPortalEvent(supabase, row) {
  const { data, error } = await supabase
    .from('vehicle_event_notifications')
    .insert(row)
    .select('id')
    .single()
  if (error) throw error
  return data
}

async function loadCompanyPortalUserIds(supabase, companyId) {
  if (!companyId) return []
  const [adminsRes, subsRes] = await Promise.all([
    supabase.from('company_admins').select('id').eq('company_id', companyId),
    supabase.from('sub_admins').select('id').eq('company_id', companyId),
  ])
  if (adminsRes.error) throw adminsRes.error
  if (subsRes.error) throw subsRes.error
  return [...new Set([
    ...(adminsRes.data || []).map((r) => r.id),
    ...(subsRes.data || []).map((r) => r.id),
  ].filter(Boolean))]
}

async function notifyPortalUsersPush(supabase, { companyId, title, body, type, notificationId, referenceId }) {
  const userIds = await loadCompanyPortalUserIds(supabase, companyId)
  for (const userId of userIds) {
    try {
      await pushToUser(supabase, {
        userId,
        title,
        body,
        type,
        notificationId,
        referenceId,
      })
    } catch (err) {
      console.warn('portal user private vehicle expiry push failed', {
        userId,
        error: err instanceof Error ? err.message : err,
      })
    }
  }
}

async function loadDriver(supabase, driverId) {
  if (!driverId) return null
  const { data, error } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, fleet, company_id, status')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function loadExpiredPrivateVehicleDocuments(supabase, todayYmd) {
  const pageSize = 1000
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('vehicle_documents')
      .select(
        `
        id,
        company_id,
        vehicle_id,
        document_type,
        expiry_date,
        vehicles!inner (
          id,
          company_id,
          driver_id,
          fleet,
          status,
          make,
          model,
          taxi_license_plate_number,
          registration_number
        )
      `,
      )
      .in('document_type', EXPIRY_DOCUMENT_TYPES)
      .eq('vehicles.fleet', 'private')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', todayYmd)
      .range(from, from + pageSize - 1)

    if (error) throw error
    const batch = data || []
    rows.push(...batch)
    if (batch.length < pageSize) break
  }

  return rows.filter((row) => {
    const vehicle = row.vehicles
    if (!vehicle?.id) return false
    if (String(vehicle.fleet || '').toLowerCase() !== 'private') return false
    const expiry = parseYmd(row.expiry_date)
    if (Number.isNaN(expiry.getTime())) return false
    return daysBetween(parseYmd(todayYmd), expiry) <= 0
  })
}

async function resolveVehicleDriverId(supabase, vehicle) {
  if (vehicle?.driver_id) return vehicle.driver_id
  if (!vehicle?.id) return null
  const { data, error } = await supabase
    .from('vehicles')
    .select('driver_id')
    .eq('id', vehicle.id)
    .maybeSingle()
  if (error) throw error
  return data?.driver_id || null
}

async function createJobReassignmentAlertsForRemovedJobs({
  supabase,
  removedJobs,
  companyId,
  driverId,
  vehicle,
  driverName,
  docNames,
  payloadBase,
}) {
  for (const job of removedJobs) {
    const alertTitle = 'Driver Removed from Job'
    const alertBody = `${driverName} was removed from "${job.job_name || 'a job'}" because the vehicle document (${docNames}) expired. Please assign a new driver.`
    const alert = await createJobReassignmentAlert(supabase, {
      companyId: job.company_id || companyId,
      driverId,
      vehicleId: vehicle.id,
      job,
      reason: REASSIGNMENT_REASON.PRIVATE_VEHICLE_DOCUMENT,
      fleet: 'private',
      title: alertTitle,
      body: alertBody,
      payload: payloadBase,
    })

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

async function processPrivateVehicleExpiry({ supabase, vehicle, documents, todayYmd, summary }) {
  const claimed = []
  for (const document of documents) {
    const expiryDate = String(document.expiry_date).slice(0, 10)
    const ok = await claimProcessed(supabase, {
      document_id: document.id,
      vehicle_id: vehicle.id,
      company_id: document.company_id ?? vehicle.company_id ?? null,
      driver_id: vehicle.driver_id || null,
      expiry_date: expiryDate,
    })
    if (ok) claimed.push({ ...document, expiry_date: expiryDate })
  }

  if (!claimed.length) {
    summary.skipped += 1
    return
  }

  const companyId = vehicle.company_id || claimed[0].company_id || null
  const driverId = await resolveVehicleDriverId(supabase, vehicle)
  const driver = driverId ? await loadDriver(supabase, driverId) : null
  const driverName = formatDriverName(driver)
  const label = formatVehicleLabel(vehicle)
  const docNames = joinDocNames(claimed.map((d) => d.document_type))
  const payloadBase = {
    reason: 'document_expiry',
    fleet: 'private',
    vehicle_id: vehicle.id,
    vehicle_label: label,
    driver_id: driverId,
    driver_name: driverName,
    document_types: claimed.map((d) => d.document_type),
    document_labels: claimed.map((d) => documentLabel(d.document_type)),
    expiry_date: claimed[0].expiry_date,
    taxi_license_plate_number: vehicle.taxi_license_plate_number || null,
  }

  let removedJobs = []
  let suspended = false

  try {
    await setVehicleOffRoad(supabase, vehicle.id, true)

    if (driverId && String(driver?.status || '').toLowerCase() === 'approved') {
      const updated = await suspendApprovedDriver(supabase, driverId)
      suspended = Boolean(updated)
      if (updated) summary.suspended = (summary.suspended || 0) + 1
    }

    if (driverId) {
      const jobs = await loadDriverJobsForRemoval(supabase, driverId, todayYmd)
      removedJobs = await removeDriverFromJobs(supabase, jobs)
    }
  } catch (err) {
    for (const document of claimed) {
      await unclaimProcessed(supabase, document.id, document.expiry_date)
    }
    throw err
  }

  const driverBody = removedJobs.length
    ? 'Your vehicle document has expired. You have been suspended and removed from your job.'
    : 'Your vehicle document has expired. Your vehicle has been set to Off-Road and your account has been suspended.'

  const adminBody = buildAdminDocumentExpiredBody({ removedJobs })

  try {
    if (driverId) {
      await notifyDriverInAppAndPush(supabase, {
        driverId,
        companyId,
        notificationType: removedJobs.length ? 'job_removed' : 'document_expiry',
        title: removedJobs.length ? 'Removed from Job' : 'Vehicle Document Expired',
        body: driverBody,
        referenceId: vehicle.id,
        payload: {
          ...payloadBase,
          event: removedJobs.length ? 'job_removed' : 'document_expiry',
          suspended,
          job_ids: removedJobs.map((j) => j.id),
        },
      })
    }

    if (companyId) {
      await insertPortalEvent(supabase, {
        company_id: companyId,
        vehicle_id: vehicle.id,
        driver_id: driverId,
        actor_id: null,
        event_type: 'vehicle_off_road',
        title: 'Vehicle Set to Off Road:',
        body: 'Vehicle has been set to Off-Road because a vehicle document expired.',
        payload: {
          ...payloadBase,
          event: 'vehicle_off_road',
        },
      })

      await notifyPortalUsersPush(supabase, {
        companyId,
        title: 'Vehicle Set to Off Road',
        body: 'Vehicle has been set to Off-Road because a vehicle document expired.',
        type: 'vehicle_off_road',
        notificationId: null,
        referenceId: vehicle.id,
      })

      if (driverId && suspended) {
        await notifyPortalUsersPush(supabase, {
          companyId,
          title: 'Driver Suspended',
          body: 'The assigned driver has been suspended.',
          type: 'document_expiry',
          notificationId: null,
          referenceId: driverId,
        })
      }

      await insertPortalEvent(supabase, {
        company_id: companyId,
        vehicle_id: vehicle.id,
        driver_id: driverId,
        actor_id: null,
        event_type: 'vehicle_document_expired',
        title: 'Vehicle Document Expired:',
        body: adminBody,
        payload: {
          ...payloadBase,
          event: 'vehicle_document_expired',
          removed_job_ids: removedJobs.map((j) => j.id),
        },
      })

      await notifyPortalUsersPush(supabase, {
        companyId,
        title: 'Vehicle Document Expired',
        body: adminBody,
        type: 'vehicle_document_expired',
        notificationId: null,
        referenceId: vehicle.id,
      })

      await createJobReassignmentAlertsForRemovedJobs({
        supabase,
        removedJobs,
        companyId,
        driverId,
        vehicle,
        driverName,
        docNames,
        payloadBase,
      })
    }

    summary.processed += 1
    summary.jobsRemoved = (summary.jobsRemoved || 0) + removedJobs.length
  } catch (err) {
    console.error('private vehicle document expiry notify failed', {
      vehicleId: vehicle.id,
      error: err instanceof Error ? err.message : err,
    })
    summary.processed += 1
    summary.jobsRemoved = (summary.jobsRemoved || 0) + removedJobs.length
  }
}

/**
 * Safety net: if a private driver is still on a job while required vehicle docs are expired,
 * remove them and open reassignment alerts (without re-firing full expiry notifications).
 */
async function reconcileExpiredPrivateDriversStillOnJobs(supabase, todayYmd, summary) {
  const rows = await loadExpiredPrivateVehicleDocuments(supabase, todayYmd)
  const driverIds = new Set()

  for (const row of rows) {
    const fromJoin = row.vehicles?.driver_id
    if (fromJoin) driverIds.add(fromJoin)
    const resolved = await resolveVehicleDriverId(supabase, row.vehicles || { id: row.vehicle_id })
    if (resolved) driverIds.add(resolved)
  }

  for (const driverId of driverIds) {
    const jobs = await loadDriverJobsForRemoval(supabase, driverId, todayYmd)
    if (!jobs.length) continue

    const driver = await loadDriver(supabase, driverId)
    const driverName = formatDriverName(driver)
    const vehicleRow = rows.find((r) => r.vehicles?.driver_id === driverId)?.vehicles
      || rows.find((r) => r.vehicle_id)?.vehicles
    const label = formatVehicleLabel(vehicleRow || {})
    const expiredTypes = rows
      .filter((r) => {
        const vDriver = r.vehicles?.driver_id
        return vDriver === driverId || (vehicleRow?.id && r.vehicles?.id === vehicleRow.id)
      })
      .map((r) => r.document_type)
    const docNames = joinDocNames(expiredTypes)
    const companyId = vehicleRow?.company_id || driver?.company_id || null

    const removedJobs = await removeDriverFromJobs(supabase, jobs)
    summary.jobsRemoved = (summary.jobsRemoved || 0) + removedJobs.length
    if (!removedJobs.length || !vehicleRow?.id) continue

    const payloadBase = {
      reason: 'document_expiry',
      fleet: 'private',
      vehicle_id: vehicleRow.id,
      vehicle_label: label,
      driver_id: driverId,
      driver_name: driverName,
      document_labels: docNames,
      event: 'job_reassignment',
    }

    await createJobReassignmentAlertsForRemovedJobs({
      supabase,
      removedJobs,
      companyId,
      driverId,
      vehicle: vehicleRow,
      driverName,
      docNames,
      payloadBase,
    })

    if (companyId) {
      await notifyDriverInAppAndPush(supabase, {
        driverId,
        companyId,
        notificationType: 'job_removed',
        title: 'Removed from Job',
        body: 'Your vehicle document has expired. You have been suspended and removed from your job.',
        referenceId: removedJobs[0].id,
        payload: {
          ...payloadBase,
          event: 'job_removed',
          job_ids: removedJobs.map((j) => j.id),
        },
      })
    }
  }
}

export async function runPrivateVehicleDocumentExpiryTick(supabase) {
  const timeZone = operatingTimezone()
  const todayYmd = getZonedNow(timeZone).date

  const summary = {
    timezone: timeZone,
    today: todayYmd,
    documents: 0,
    vehicles: 0,
    processed: 0,
    jobsRemoved: 0,
    suspended: 0,
    skipped: 0,
  }

  const rows = await loadExpiredPrivateVehicleDocuments(supabase, todayYmd)
  summary.documents = rows.length

  const byVehicle = new Map()
  for (const row of rows) {
    const vehicle = row.vehicles
    const list = byVehicle.get(vehicle.id) ?? { vehicle, documents: [] }
    list.documents.push(row)
    byVehicle.set(vehicle.id, list)
  }
  summary.vehicles = byVehicle.size

  for (const { vehicle, documents } of byVehicle.values()) {
    try {
      await processPrivateVehicleExpiry({
        supabase,
        vehicle,
        documents,
        todayYmd,
        summary,
      })
    } catch (err) {
      console.error('private vehicle document expiry failed', {
        vehicleId: vehicle.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }

  try {
    await reconcileExpiredPrivateDriversStillOnJobs(supabase, todayYmd, summary)
  } catch (err) {
    console.error('private vehicle expiry job reconcile failed', {
      error: err instanceof Error ? err.message : err,
    })
  }

  if (summary.processed > 0) {
    console.info('private vehicle document expiry tick', {
      utcAt: new Date().toISOString(),
      ...summary,
    })
  }

  return summary
}

export function startPrivateVehicleDocumentExpiryScheduler(supabase) {
  const enabled = (process.env.PRIVATE_VEHICLE_DOC_EXPIRY_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('private vehicle document expiry scheduler disabled (PRIVATE_VEHICLE_DOC_EXPIRY_ENABLED=false)')
    return
  }

  const cronExpr = process.env.DOCUMENT_EXPIRY_CRON ?? '* * * * *'
  console.info(`private vehicle document expiry scheduler enabled (cron="${cronExpr}")`)

  cron.schedule(cronExpr, async () => {
    try {
      await runPrivateVehicleDocumentExpiryTick(supabase)
    } catch (error) {
      console.error(
        'private vehicle document expiry tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
