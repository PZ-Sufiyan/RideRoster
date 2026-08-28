import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'
import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

/** Fleet vehicle documents that force Off-Road when they reach expiry. */
const EXPIRY_OFF_ROAD_DOCUMENT_TYPES = [
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
  return [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim() || 'the assigned driver'
}

function operatingTimezone() {
  return resolveTimezone(process.env.DOCUMENT_EXPIRY_TIMEZONE || 'Europe/London')
}

async function claimProcessed(supabase, record) {
  const { error } = await supabase
    .from('vehicle_document_expiry_off_road_processed')
    .insert(record)

  if (error?.code === '23505') return false
  if (error) throw error
  return true
}

async function unclaimProcessed(supabase, documentId, expiryDate) {
  await supabase
    .from('vehicle_document_expiry_off_road_processed')
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
        vehicle_id: row.reference_id || null,
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
  vehicleId,
  payload,
}) {
  const notification = await insertUserNotification(supabase, {
    user_id: driverId,
    company_id: companyId,
    notification_type: notificationType,
    title,
    body,
    reference_id: vehicleId,
    payload,
  })

  await pushToUser(supabase, {
    userId: driverId,
    title,
    body,
    type: notificationType,
    notificationId: notification?.id,
    referenceId: vehicleId,
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
      console.warn('portal user vehicle expiry push failed', {
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
    .select('id, first_name, last_name')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function loadExpiredFleetVehicleDocuments(supabase, todayYmd) {
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
      .in('document_type', EXPIRY_OFF_ROAD_DOCUMENT_TYPES)
      .eq('vehicles.fleet', 'company')
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
    if (String(vehicle.fleet || '').toLowerCase() !== 'company') return false
    const expiry = parseYmd(row.expiry_date)
    if (Number.isNaN(expiry.getTime())) return false
    return daysBetween(parseYmd(todayYmd), expiry) <= 0
  })
}

async function applyOffRoadAndUnassign(supabase, vehicle) {
  const previousDriverId = vehicle.driver_id || null
  const now = new Date().toISOString()

  const { error: vehicleErr } = await supabase
    .from('vehicles')
    .update({
      status: 'off_road',
      driver_id: null,
      updated_at: now,
    })
    .eq('id', vehicle.id)
  if (vehicleErr) throw vehicleErr

  if (previousDriverId) {
    const { error: driverErr } = await supabase
      .from('drivers')
      .update({
        vehicle_assigned: false,
        updated_at: now,
      })
      .eq('id', previousDriverId)
    if (driverErr) {
      await supabase
        .from('vehicles')
        .update({
          status: vehicle.status || 'active',
          driver_id: previousDriverId,
          updated_at: now,
        })
        .eq('id', vehicle.id)
      throw driverErr
    }
  }

  return previousDriverId
}

async function processVehicleExpiry({ supabase, vehicle, documents, summary }) {
  const alreadyOffRoad = String(vehicle.status || '').toLowerCase() === 'off_road'
  const claimed = []
  for (const document of documents) {
    const expiryDate = String(document.expiry_date).slice(0, 10)
    const ok = await claimProcessed(supabase, {
      document_id: document.id,
      vehicle_id: vehicle.id,
      company_id: document.company_id ?? vehicle.company_id ?? null,
      expiry_date: expiryDate,
    })
    if (ok) claimed.push({ ...document, expiry_date: expiryDate })
  }

  // Already handled and still Off-Road: skip unless a newly expired document was claimed.
  // If an admin later sets the vehicle Active without renewing, force Off-Road again.
  if (!claimed.length && alreadyOffRoad && !vehicle.driver_id) {
    summary.skipped += 1
    return
  }

  const docsForMessage = claimed.length
    ? claimed
    : documents.map((document) => ({
        ...document,
        expiry_date: String(document.expiry_date).slice(0, 10),
      }))

  let previousDriverId = null
  try {
    previousDriverId = alreadyOffRoad && !vehicle.driver_id
      ? null
      : await applyOffRoadAndUnassign(supabase, vehicle)
  } catch (err) {
    for (const document of claimed) {
      await unclaimProcessed(supabase, document.id, document.expiry_date)
    }
    throw err
  }

  const driverId = previousDriverId || null
  const driver = driverId ? await loadDriver(supabase, driverId) : null
  const driverName = formatDriverName(driver)
  const label = formatVehicleLabel(vehicle)
  const docNames = joinDocNames(docsForMessage.map((d) => d.document_type))
  const expiryLabel = formatDisplayDate(docsForMessage[0].expiry_date)
  const companyId = vehicle.company_id || docsForMessage[0].company_id || null
  const payload = {
    event: 'vehicle_off_road',
    reason: 'document_expiry',
    vehicle_id: vehicle.id,
    vehicle_label: label,
    document_types: docsForMessage.map((d) => d.document_type),
    document_labels: docsForMessage.map((d) => documentLabel(d.document_type)),
    expiry_date: docsForMessage[0].expiry_date,
    taxi_license_plate_number: vehicle.taxi_license_plate_number || null,
  }

  const offRoadTitle = 'Vehicle Set to Off Road'
  const offRoadDriverBody = driverId
    ? `${label} has been set to Off Road because its ${docNames} expired on ${expiryLabel}. You will be unassigned from this vehicle.`
    : `${label} has been set to Off Road because its ${docNames} expired on ${expiryLabel}.`
  const offRoadAdminBody = `${label} was set to Off Road because its ${docNames} expired on ${expiryLabel}.`

  try {
    if (driverId) {
      await notifyDriverInAppAndPush(supabase, {
        driverId,
        companyId,
        notificationType: 'vehicle_off_road',
        title: offRoadTitle,
        body: offRoadDriverBody,
        vehicleId: vehicle.id,
        payload,
      })

      await notifyDriverInAppAndPush(supabase, {
        driverId,
        companyId,
        notificationType: 'vehicle_unassigned',
        title: 'Vehicle Unassigned',
        body: `You have been unassigned from ${label}.`,
        vehicleId: vehicle.id,
        payload: {
          ...payload,
          event: 'vehicle_unassigned',
        },
      })
    }

    if (companyId) {
      const portalOffRoad = await insertPortalEvent(supabase, {
        company_id: companyId,
        vehicle_id: vehicle.id,
        driver_id: driverId,
        actor_id: null,
        event_type: 'vehicle_off_road',
        title: 'Vehicle Set to Off Road:',
        body: offRoadAdminBody,
        payload,
      })

      await notifyPortalUsersPush(supabase, {
        companyId,
        title: offRoadTitle,
        body: offRoadAdminBody,
        type: 'vehicle_off_road',
        notificationId: portalOffRoad?.id,
        referenceId: vehicle.id,
      })

      if (driverId) {
        await insertPortalEvent(supabase, {
          company_id: companyId,
          vehicle_id: vehicle.id,
          driver_id: driverId,
          actor_id: null,
          event_type: 'vehicle_unassigned',
          title: 'Driver Unassigned:',
          body: `${driverName} was unassigned from ${label}.`,
          payload: {
            ...payload,
            event: 'vehicle_unassigned',
            driver_name: driverName,
          },
        })
      }
    }

    summary.processed += 1
    if (driverId) summary.unassigned += 1
  } catch (err) {
    console.error('vehicle document expiry off-road notify failed after status update', {
      vehicleId: vehicle.id,
      error: err instanceof Error ? err.message : err,
    })
    summary.processed += 1
    if (driverId) summary.unassigned += 1
  }
}

export async function runVehicleDocumentExpiryOffRoadTick(supabase) {
  const timeZone = operatingTimezone()
  const todayYmd = getZonedNow(timeZone).date

  const rows = await loadExpiredFleetVehicleDocuments(supabase, todayYmd)
  const byVehicle = new Map()
  for (const row of rows) {
    const vehicle = row.vehicles
    const list = byVehicle.get(vehicle.id) ?? { vehicle, documents: [] }
    list.documents.push(row)
    byVehicle.set(vehicle.id, list)
  }

  const summary = {
    timezone: timeZone,
    today: todayYmd,
    documents: rows.length,
    vehicles: byVehicle.size,
    processed: 0,
    unassigned: 0,
    skipped: 0,
  }

  for (const { vehicle, documents } of byVehicle.values()) {
    try {
      await processVehicleExpiry({ supabase, vehicle, documents, summary })
    } catch (err) {
      console.error('vehicle document expiry off-road failed', {
        vehicleId: vehicle.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }

  if (summary.processed > 0) {
    console.info('vehicle document expiry off-road tick', {
      utcAt: new Date().toISOString(),
      ...summary,
    })
  }

  return summary
}

export function startVehicleDocumentExpiryOffRoadScheduler(supabase) {
  const enabled = (process.env.VEHICLE_DOC_EXPIRY_OFF_ROAD_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('vehicle document expiry off-road scheduler disabled (VEHICLE_DOC_EXPIRY_OFF_ROAD_ENABLED=false)')
    return
  }

  const cronExpr = process.env.DOCUMENT_EXPIRY_CRON ?? '* * * * *'
  console.info(`vehicle document expiry off-road scheduler enabled (cron="${cronExpr}")`)

  cron.schedule(cronExpr, async () => {
    try {
      await runVehicleDocumentExpiryOffRoadTick(supabase)
    } catch (error) {
      console.error(
        'vehicle document expiry off-road tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
