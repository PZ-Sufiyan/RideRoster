import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'
import { notifyDriverPortalEvent } from './driverEventNotifications.js'
import {
  REASSIGNMENT_REASON,
  createJobReassignmentAlert,
  loadDriverJobsForRemoval,
  removeDriverFromJobs,
  suspendApprovedDriver,
  unassignCompanyDriverFromVehicle,
} from './jobReassignmentAlerts.js'
import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

const DRIVER_DOCUMENT_LABELS = {
  passport: 'Passport',
  driving_license_front: 'Driving License (Front)',
  driving_license_back: 'Driving License (Back)',
  taxi_badge_front: 'Taxi Badge (Front)',
  taxi_badge_back: 'Taxi Badge (Back)',
  dbs_certificate_front: 'DBS Certificate (Front)',
  dbs_certificate_back: 'DBS Certificate (Back)',
  safeguarding_certificate: 'Safeguarding Certificate',
}

/** Passport expiry must not suspend company or private drivers. */
const SUSPEND_EXCLUDED_DOCUMENT_TYPES = ['passport']

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
  return DRIVER_DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
}

function joinDocNames(types) {
  const labels = [...new Set(types.map(documentLabel))]
  if (labels.length === 0) return 'a required document'
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function formatDriverName(driver) {
  return [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim() || 'Driver'
}

function formatVehicleLabel(vehicle) {
  if (!vehicle) return 'vehicle'
  const name = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ').trim()
  const plate = vehicle?.taxi_license_plate_number || vehicle?.registration_number
  if (name && plate) return `${name} (${plate})`
  return name || plate || 'vehicle'
}

function normalizeDriverStatus(status) {
  return String(status || '').trim().toLowerCase()
}

function isPrivateFleet(fleet) {
  return String(fleet || '').trim().toLowerCase() === 'private'
}

function operatingTimezone() {
  return resolveTimezone(process.env.DOCUMENT_EXPIRY_TIMEZONE || 'Europe/London')
}

async function claimProcessed(supabase, record) {
  const { error } = await supabase
    .from('driver_document_expiry_suspend_processed')
    .insert(record)

  if (error?.code === '23505') return false
  if (error) throw error
  return true
}

async function unclaimProcessed(supabase, documentId, expiryDate) {
  await supabase
    .from('driver_document_expiry_suspend_processed')
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

async function notifyAdminDriverDocumentExpired(supabase, {
  companyId,
  driverId,
  vehicleId = null,
  title,
  body,
  payload,
}) {
  return notifyDriverPortalEvent(supabase, {
    companyId,
    driverId,
    vehicleId,
    eventType: 'driver_document_expired',
    title,
    body,
    payload,
    notifyPortalUsersPush,
  })
}

async function notifyAdminDriverSuspended(supabase, {
  companyId,
  driverId,
  vehicleId = null,
  title,
  body,
  payload,
}) {
  return notifyDriverPortalEvent(supabase, {
    companyId,
    driverId,
    vehicleId,
    eventType: 'driver_suspended',
    title,
    body,
    payload,
    notifyPortalUsersPush,
  })
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
      console.warn('portal user driver document expiry suspend push failed', {
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
    .select('id, first_name, last_name, status, fleet, company_id, vehicle_assigned')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function loadExpiredDriverDocuments(supabase, todayYmd) {
  const pageSize = 1000
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('driver_documents')
      .select(
        `
        id,
        company_id,
        driver_id,
        document_type,
        expiry_date,
        drivers!inner (
          id,
          company_id,
          first_name,
          last_name,
          status,
          fleet,
          vehicle_assigned
        )
      `,
      )
      .not('expiry_date', 'is', null)
      .lte('expiry_date', todayYmd)
      .not('document_type', 'in', `(${SUSPEND_EXCLUDED_DOCUMENT_TYPES.join(',')})`)
      .range(from, from + pageSize - 1)

    if (error) throw error
    const batch = data || []
    rows.push(...batch)
    if (batch.length < pageSize) break
  }

  return rows.filter((row) => {
    if (!row.driver_id || !row.drivers?.id) return false
    if (SUSPEND_EXCLUDED_DOCUMENT_TYPES.includes(String(row.document_type || '').trim())) {
      return false
    }
    const expiry = parseYmd(row.expiry_date)
    if (Number.isNaN(expiry.getTime())) return false
    return daysBetween(parseYmd(todayYmd), expiry) <= 0
  })
}

async function processDriverDocumentExpiry({
  supabase,
  driver,
  documents,
  todayYmd,
  summary,
}) {
  const driverStatus = normalizeDriverStatus(driver.status)

  if (driverStatus === 'rejected') {
    summary.skipped += 1
    return
  }

  const claimed = []
  for (const document of documents) {
    const expiryDate = String(document.expiry_date).slice(0, 10)
    const ok = await claimProcessed(supabase, {
      document_id: document.id,
      driver_id: driver.id,
      company_id: document.company_id ?? driver.company_id ?? null,
      expiry_date: expiryDate,
    })
    if (ok) claimed.push({ ...document, expiry_date: expiryDate })
  }

  const stillApproved = driverStatus === 'approved'
  const docsForMessage = claimed.length
    ? claimed
    : (stillApproved ? documents.map((document) => ({
        ...document,
        expiry_date: String(document.expiry_date).slice(0, 10),
      })) : [])

  if (!claimed.length && !stillApproved) {
    summary.skipped += 1
    return
  }

  if (!docsForMessage.length) {
    summary.skipped += 1
    return
  }

  const privateFleet = isPrivateFleet(driver.fleet)
  let suspended = false
  let unassignedVehicle = null
  let removedJobs = []

  try {
    if (stillApproved) {
      const updated = await suspendApprovedDriver(supabase, driver.id)
      suspended = Boolean(updated)
      if (updated) summary.suspended += 1
    }

    if (!privateFleet && driver.vehicle_assigned) {
      unassignedVehicle = await unassignCompanyDriverFromVehicle(supabase, driver.id)
      if (unassignedVehicle) summary.unassigned += 1
    }

    const jobs = await loadDriverJobsForRemoval(supabase, driver.id, todayYmd)
    removedJobs = await removeDriverFromJobs(supabase, jobs)
    if (removedJobs.length) summary.jobsRemoved = (summary.jobsRemoved || 0) + removedJobs.length
  } catch (err) {
    for (const document of claimed) {
      await unclaimProcessed(supabase, document.id, document.expiry_date)
    }
    throw err
  }

  if (!suspended && !claimed.length) {
    summary.skipped += 1
    return
  }

  const companyId = driver.company_id || docsForMessage[0].company_id || null
  const driverName = formatDriverName(driver)
  const docNames = joinDocNames(docsForMessage.map((d) => d.document_type))
  const expiryLabel = formatDisplayDate(docsForMessage[0].expiry_date)
  const vehicleLabel = formatVehicleLabel(unassignedVehicle)
  const payloadBase = {
    event: 'driver_document_expired',
    reason: 'document_expiry',
    driver_id: driver.id,
    driver_name: driverName,
    fleet: driver.fleet || null,
    document_types: docsForMessage.map((d) => d.document_type),
    document_labels: docsForMessage.map((d) => documentLabel(d.document_type)),
    expiry_date: docsForMessage[0].expiry_date,
    suspended,
    vehicle_unassigned: Boolean(unassignedVehicle),
    jobs_removed: removedJobs.map((j) => j.id),
  }

  const driverBody = removedJobs.length
    ? (privateFleet
      ? 'Your document has expired. You have been suspended and removed from your job.'
      : 'Your document has expired. You have been suspended, unassigned from your vehicle, and removed from your job.')
    : (unassignedVehicle && !privateFleet
      ? `Your ${docNames} expired on ${expiryLabel}. You have been suspended and unassigned from ${vehicleLabel}.`
      : `Your ${docNames} expired on ${expiryLabel}. Your account has been suspended until your documents are renewed.`)

  const adminSuspendBody = `The driver was suspended due to document expiry. (${driverName}: ${docNames} expired on ${expiryLabel}.)`
  const adminUnassignBody = unassignedVehicle
    ? `${driverName} was unassigned from ${vehicleLabel} because the driver's document expired.`
    : null
  const adminJobRemovalBody = removedJobs.length
    ? `The driver was removed from ${removedJobs.length === 1 ? `"${removedJobs[0].job_name || 'a job'}"` : `${removedJobs.length} jobs`}.`
    : null

  try {
    if (claimed.length || suspended) {
      await notifyDriverInAppAndPush(supabase, {
        driverId: driver.id,
        companyId,
        notificationType: removedJobs.length ? 'job_removed' : 'document_expiry',
        title: removedJobs.length ? 'Removed from Job' : 'Document Expired',
        body: driverBody,
        referenceId: docsForMessage[0].id,
        payload: {
          ...payloadBase,
          full_message: driverBody,
          document_name: docNames,
        },
      })

      if (companyId) {
        const docExpiredTitle = 'Driver Document Expired'
        const docExpiredBody = `${driverName}'s ${docNames} expired on ${expiryLabel}.`
        await notifyAdminDriverDocumentExpired(supabase, {
          companyId,
          driverId: driver.id,
          vehicleId: unassignedVehicle?.id || null,
          title: docExpiredTitle,
          body: docExpiredBody,
          payload: payloadBase,
        })

        if (suspended) {
          const suspendTitle = 'Driver Suspended — Document Expired'
          await notifyAdminDriverSuspended(supabase, {
            companyId,
            driverId: driver.id,
            vehicleId: unassignedVehicle?.id || null,
            title: suspendTitle,
            body: adminSuspendBody,
            payload: { ...payloadBase, suspended: true, reason: 'document_expiry' },
          })
        }

        if (unassignedVehicle && !privateFleet) {
          await insertPortalEvent(supabase, {
            company_id: companyId,
            vehicle_id: unassignedVehicle.id,
            driver_id: driver.id,
            actor_id: null,
            event_type: 'vehicle_unassigned',
            title: 'Driver Unassigned:',
            body: adminUnassignBody,
            payload: {
              ...payloadBase,
              event: 'vehicle_unassigned',
              driver_name: driverName,
              vehicle_id: unassignedVehicle.id,
              vehicle_label: vehicleLabel,
            },
          })

          await notifyPortalUsersPush(supabase, {
            companyId,
            title: 'Driver Unassigned',
            body: adminUnassignBody,
            type: 'vehicle_unassigned',
            notificationId: null,
            referenceId: unassignedVehicle.id,
          })
        }

        if (adminJobRemovalBody) {
          await notifyPortalUsersPush(supabase, {
            companyId,
            title: 'Driver Removed from Job',
            body: adminJobRemovalBody,
            type: 'job_removed',
            notificationId: null,
            referenceId: removedJobs[0]?.id || driver.id,
          })
        }

        const reason = privateFleet
          ? REASSIGNMENT_REASON.PRIVATE_DRIVER_DOCUMENT
          : REASSIGNMENT_REASON.COMPANY_DRIVER_DOCUMENT

        for (const job of removedJobs) {
          const alertTitle = 'Driver Removed from Job'
          const alertBody = `${driverName} was removed from "${job.job_name || 'a job'}" because the driver's document (${docNames}) expired. Please assign a new driver.`
          const alert = await createJobReassignmentAlert(supabase, {
            companyId: job.company_id || companyId,
            driverId: driver.id,
            vehicleId: unassignedVehicle?.id || null,
            job,
            reason,
            fleet: privateFleet ? 'private' : 'company',
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
    }

    summary.processed += 1
  } catch (err) {
    console.error('driver document expiry suspend notify failed after status update', {
      driverId: driver.id,
      error: err instanceof Error ? err.message : err,
    })
    summary.processed += 1
  }
}

export async function runDriverDocumentExpirySuspendTick(supabase) {
  const timeZone = operatingTimezone()
  const todayYmd = getZonedNow(timeZone).date

  const summary = {
    timezone: timeZone,
    today: todayYmd,
    documents: 0,
    drivers: 0,
    processed: 0,
    suspended: 0,
    unassigned: 0,
    jobsRemoved: 0,
    skipped: 0,
  }

  const rows = await loadExpiredDriverDocuments(supabase, todayYmd)
  summary.documents = rows.length

  const byDriver = new Map()
  for (const row of rows) {
    const driver = row.drivers
    const list = byDriver.get(driver.id) ?? { driver, documents: [] }
    list.documents.push(row)
    byDriver.set(driver.id, list)
  }
  summary.drivers = byDriver.size

  for (const { driver, documents } of byDriver.values()) {
    try {
      const freshDriver = await loadDriver(supabase, driver.id)
      await processDriverDocumentExpiry({
        supabase,
        driver: freshDriver || driver,
        documents,
        todayYmd,
        summary,
      })
    } catch (err) {
      console.error('driver document expiry suspend failed', {
        driverId: driver.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }

  if (summary.processed > 0 || summary.suspended > 0) {
    console.info('driver document expiry suspend tick', {
      utcAt: new Date().toISOString(),
      ...summary,
    })
  }

  return summary
}

export function startDriverDocumentExpirySuspendScheduler(supabase) {
  const enabled = (process.env.DRIVER_DOC_EXPIRY_SUSPEND_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('driver document expiry suspend scheduler disabled (DRIVER_DOC_EXPIRY_SUSPEND_ENABLED=false)')
    return
  }

  const cronExpr = process.env.DOCUMENT_EXPIRY_CRON ?? '* * * * *'
  console.info(`driver document expiry suspend scheduler enabled (cron="${cronExpr}")`)

  cron.schedule(cronExpr, async () => {
    try {
      await runDriverDocumentExpirySuspendTick(supabase)
    } catch (error) {
      console.error(
        'driver document expiry suspend tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
