import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'
import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

/** Private vehicle documents that block jobs when expired. */
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

const REMIND_AFTER_MS = 60 * 60 * 1000

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

function operatingTimezone() {
  return resolveTimezone(process.env.DOCUMENT_EXPIRY_TIMEZONE || 'Europe/London')
}

function isCancelledJobStatus(status) {
  const s = String(status || '').trim().toLowerCase()
  return s === 'cancelled' || s === 'canceled'
}

function isActiveOrUpcomingJob(job, todayYmd) {
  if (!job || isCancelledJobStatus(job.status)) return false
  if (job.semester_end && String(job.semester_end).slice(0, 10) < todayYmd) return false
  return true
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
    .select('id, first_name, last_name, fleet')
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

async function loadDriverActiveUpcomingJobs(supabase, { companyId, driverId, todayYmd }) {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, job_name, status, semester_start, semester_end, company_id, assigned_driver_id, internal_job_id')
    .eq('company_id', companyId)
    .eq('assigned_driver_id', driverId)

  if (error) throw error
  return (data || []).filter((job) => isActiveOrUpcomingJob(job, todayYmd))
}

async function removeDriverFromJob(supabase, jobId) {
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
    .single()
  if (error) throw error
  return data
}

async function createPriorityAlert(supabase, row) {
  const { data, error } = await supabase
    .from('private_driver_job_removal_alerts')
    .insert(row)
    .select('id')
    .single()

  if (error?.code === '23505') {
    const { data: existing, error: existingErr } = await supabase
      .from('private_driver_job_removal_alerts')
      .select('id')
      .eq('job_id', row.job_id)
      .eq('driver_id', row.driver_id)
      .eq('status', 'open')
      .maybeSingle()
    if (existingErr) throw existingErr
    return existing
  }
  if (error) throw error
  return data
}

async function resolveOpenAlerts(supabase) {
  const { data: openAlerts, error } = await supabase
    .from('private_driver_job_removal_alerts')
    .select('id, job_id')
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

    const { error: updateErr } = await supabase
      .from('private_driver_job_removal_alerts')
      .update({ status: 'resolved', resolved_at: now })
      .eq('id', alert.id)
      .eq('status', 'open')
    if (updateErr) {
      console.warn('failed to resolve private driver job removal alert', {
        alertId: alert.id,
        error: updateErr.message,
      })
      continue
    }
    resolved += 1
  }

  return resolved
}

async function remindOpenAlerts(supabase, summary) {
  const cutoff = new Date(Date.now() - REMIND_AFTER_MS).toISOString()
  const { data: alerts, error } = await supabase
    .from('private_driver_job_removal_alerts')
    .select('id, company_id, driver_id, vehicle_id, job_id, title, body, payload, last_notified_at')
    .eq('status', 'open')
    .lte('last_notified_at', cutoff)

  if (error) throw error
  if (!alerts?.length) return

  for (const alert of alerts) {
    try {
      const title = `Reminder: ${String(alert.title || '').replace(/:$/, '')}`
      const body = alert.body
      await notifyPortalUsersPush(supabase, {
        companyId: alert.company_id,
        title,
        body,
        type: 'private_driver_job_removal',
        notificationId: alert.id,
        referenceId: alert.job_id,
      })

      const { error: updateErr } = await supabase
        .from('private_driver_job_removal_alerts')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', alert.id)
        .eq('status', 'open')
      if (updateErr) throw updateErr

      summary.reminded += 1
    } catch (err) {
      console.warn('private driver job removal reminder failed', {
        alertId: alert.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }
}

/**
 * Safety net: if a private driver is still on a job while required vehicle docs are expired,
 * remove them and open a priority alert (without re-firing document-expiry driver pushes).
 */
async function reconcileExpiredPrivateDriversStillOnJobs(supabase, todayYmd, summary) {
  const rows = await loadExpiredPrivateVehicleDocuments(supabase, todayYmd)
  const seenDrivers = new Set()

  for (const row of rows) {
    const vehicle = row.vehicles
    const driverId = vehicle?.driver_id
    const companyId = vehicle?.company_id || row.company_id
    if (!driverId || !companyId || seenDrivers.has(driverId)) continue
    seenDrivers.add(driverId)

    const jobs = await loadDriverActiveUpcomingJobs(supabase, {
      companyId,
      driverId,
      todayYmd,
    })
    if (!jobs.length) continue

    const driver = await loadDriver(supabase, driverId)
    const driverName = formatDriverName(driver)
    const label = formatVehicleLabel(vehicle)
    const expiredTypes = rows
      .filter((r) => r.vehicles?.id === vehicle.id)
      .map((r) => r.document_type)
    const docNames = joinDocNames(expiredTypes)

    for (const job of jobs) {
      await removeDriverFromJob(supabase, job.id)
      summary.jobsRemoved += 1

      const alertTitle = 'Driver Removed from Job:'
      const alertBody = `Private driver ${driverName} was removed from "${job.job_name || 'a job'}" because a required vehicle document (${docNames}) expired. Please assign a new eligible driver.`
      const alert = await createPriorityAlert(supabase, {
        company_id: companyId,
        driver_id: driverId,
        vehicle_id: vehicle.id,
        job_id: job.id,
        title: alertTitle,
        body: alertBody,
        payload: {
          reason: 'document_expiry',
          fleet: 'private',
          event: 'private_driver_job_removal',
          vehicle_id: vehicle.id,
          vehicle_label: label,
          driver_id: driverId,
          driver_name: driverName,
          job_id: job.id,
          job_name: job.job_name || null,
          requires_reassignment: true,
        },
        status: 'open',
        last_notified_at: new Date().toISOString(),
      })

      await notifyPortalUsersPush(supabase, {
        companyId,
        title: 'Priority: Driver Removed from Job',
        body: alertBody,
        type: 'private_driver_job_removal',
        notificationId: alert?.id,
        referenceId: job.id,
      })
    }
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
  const driverId = vehicle.driver_id || null
  const driver = driverId ? await loadDriver(supabase, driverId) : null
  const driverName = formatDriverName(driver)
  const label = formatVehicleLabel(vehicle)
  const docNames = joinDocNames(claimed.map((d) => d.document_type))
  const expiryLabel = formatDisplayDate(claimed[0].expiry_date)
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
  try {
    if (driverId && companyId) {
      const jobs = await loadDriverActiveUpcomingJobs(supabase, {
        companyId,
        driverId,
        todayYmd,
      })
      for (const job of jobs) {
        const updated = await removeDriverFromJob(supabase, job.id)
        removedJobs.push(updated || job)
      }
    }
  } catch (err) {
    for (const document of claimed) {
      await unclaimProcessed(supabase, document.id, document.expiry_date)
    }
    throw err
  }

  try {
    if (driverId) {
      await notifyDriverInAppAndPush(supabase, {
        driverId,
        companyId,
        notificationType: 'document_expiry',
        title: 'Vehicle Document Expired',
        body: 'Your vehicle document has expired.',
        referenceId: vehicle.id,
        payload: {
          ...payloadBase,
          event: 'document_expiry',
          full_message: `Your ${docNames} expired on ${expiryLabel}. Please renew your vehicle documents before accepting new jobs.`,
          document_name: docNames,
          expiry_date: claimed[0].expiry_date,
        },
      })

      if (removedJobs.length) {
        const jobNames = removedJobs.map((j) => j.job_name || 'a job')
        const jobList = jobNames.length === 1
          ? `"${jobNames[0]}"`
          : jobNames.map((n) => `"${n}"`).join(', ')
        await notifyDriverInAppAndPush(supabase, {
          driverId,
          companyId,
          notificationType: 'job_removed',
          title: 'Removed from Job',
          body: 'You have been removed from your assigned job. Please update your vehicle documents before accepting new jobs.',
          referenceId: removedJobs[0].id,
          payload: {
            ...payloadBase,
            event: 'job_removed',
            job_ids: removedJobs.map((j) => j.id),
            job_names: jobNames,
            full_message: `You have been removed from ${jobList} because a required vehicle document expired. Please update your vehicle documents before accepting new jobs.`,
          },
        })
      }
    }

    if (companyId) {
      const normalBody = `The vehicle document for ${driverName} / ${label} has expired. The driver has been removed from their assigned job and requires document renewal.`
      await insertPortalEvent(supabase, {
        company_id: companyId,
        vehicle_id: vehicle.id,
        driver_id: driverId,
        actor_id: null,
        event_type: 'vehicle_document_expired',
        title: 'Vehicle Document Expired:',
        body: normalBody,
        payload: {
          ...payloadBase,
          event: 'vehicle_document_expired',
          removed_job_ids: removedJobs.map((j) => j.id),
          removed_job_names: removedJobs.map((j) => j.job_name || 'Job'),
        },
      })

      await notifyPortalUsersPush(supabase, {
        companyId,
        title: 'Vehicle Document Expired',
        body: normalBody,
        type: 'vehicle_document_expired',
        notificationId: null,
        referenceId: vehicle.id,
      })

      for (const job of removedJobs) {
        const alertTitle = 'Driver Removed from Job:'
        const alertBody = `Private driver ${driverName} was removed from "${job.job_name || 'a job'}" because a required vehicle document (${docNames}) expired. Please assign a new eligible driver.`
        const alertPayload = {
          ...payloadBase,
          event: 'private_driver_job_removal',
          job_id: job.id,
          job_name: job.job_name || null,
          internal_job_id: job.internal_job_id || null,
          requires_reassignment: true,
        }

        const alert = await createPriorityAlert(supabase, {
          company_id: companyId,
          driver_id: driverId,
          vehicle_id: vehicle.id,
          job_id: job.id,
          title: alertTitle,
          body: alertBody,
          payload: alertPayload,
          status: 'open',
          last_notified_at: new Date().toISOString(),
        })

        await notifyPortalUsersPush(supabase, {
          companyId,
          title: 'Priority: Driver Removed from Job',
          body: alertBody,
          type: 'private_driver_job_removal',
          notificationId: alert?.id,
          referenceId: job.id,
        })
      }
    }

    summary.processed += 1
    summary.jobsRemoved += removedJobs.length
  } catch (err) {
    console.error('private vehicle document expiry notify failed after job removal', {
      vehicleId: vehicle.id,
      error: err instanceof Error ? err.message : err,
    })
    summary.processed += 1
    summary.jobsRemoved += removedJobs.length
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
    skipped: 0,
    reminded: 0,
    resolved: 0,
  }

  try {
    summary.resolved = await resolveOpenAlerts(supabase)
  } catch (err) {
    console.error('resolve private driver job removal alerts failed', {
      error: err instanceof Error ? err.message : err,
    })
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

  try {
    await remindOpenAlerts(supabase, summary)
  } catch (err) {
    console.error('private driver job removal remind failed', {
      error: err instanceof Error ? err.message : err,
    })
  }

  if (summary.processed > 0 || summary.reminded > 0 || summary.resolved > 0) {
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
