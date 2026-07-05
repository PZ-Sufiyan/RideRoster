import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'
import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

/** Days until expiry_date when each reminder should fire. */
const REMINDER_WINDOWS = [
  { type: '30d', daysUntilExpiry: 30, label: '30 days' },
  { type: '14d', daysUntilExpiry: 14, label: '14 days' },
  { type: '7d', daysUntilExpiry: 7, label: '7 days' },
  { type: '48h', daysUntilExpiry: 2, label: '48 hours' },
  { type: '24h', daysUntilExpiry: 1, label: '24 hours' },
]

const DRIVER_DOCUMENT_LABELS = {
  passport: 'Passport',
  driving_license_front: 'Driving License (Front)',
  driving_license_back: 'Driving License (Back)',
  taxi_badge_front: 'Taxi Badge (Front)',
  taxi_badge_back: 'Taxi Badge (Back)',
  dbs_certificate_front: 'DBS Certificate (Front)',
  dbs_certificate_back: 'DBS Certificate (Back)',
  safeguarding_certificate: 'Safeguarding Certificate',
  right_to_work: 'Right to Work',
  v5_front: 'V5 (Front)',
  v5_inside: 'V5 (Inside)',
}

const VEHICLE_DOCUMENT_LABELS = {
  mot_certificate: 'MOT Certificate',
  taxi_license_plate: 'Taxi License Plate',
  insurance_certificate: 'Insurance Certificate',
  v5_front: 'V5 (Front)',
  v5_inside: 'V5 (Inside)',
  vehicle_photo: 'Vehicle Photo',
}

const PA_DOCUMENT_LABELS = {
  passport: 'Passport',
  safeguarding_certificate: 'Safeguarding Certificate',
  background_check: 'Background Check Certificate',
  first_aid_certificate: 'First Aid Certification',
  other_certificate: 'Other Certificate',
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

function documentLabel(documentType, documentSource) {
  const key = String(documentType || '').trim()
  if (documentSource === 'vehicle') {
    return VEHICLE_DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
  }
  if (documentSource === 'passenger_assistant') {
    return PA_DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
  }
  return DRIVER_DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
}

async function claimReminder(supabase, record) {
  const { error } = await supabase
    .from('document_expiry_notifications_sent')
    .insert(record)

  if (error?.code === '23505') return false
  if (error) throw error
  return true
}

async function loadUserTokens(supabase, userId) {
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('fcm_token')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? [])
    .map((row) => row.fcm_token)
    .filter((token) => typeof token === 'string' && token.trim().length > 0)
}

async function createDocumentExpiryNotification({
  supabase,
  userId,
  companyId,
  documentId,
  documentSource,
  documentType,
  expiryDate,
  reminder,
}) {
  const docName = documentLabel(documentType, documentSource)
  const expiryLabel = formatDisplayDate(expiryDate)
  const title = 'Document Expiring Soon'
  const body = `Your ${docName} expires on ${expiryLabel}. Please renew within ${reminder.label}.`

  const { data: notification, error } = await supabase
    .from('user_notifications')
    .insert({
      user_id: userId,
      company_id: companyId,
      notification_type: 'document_expiry',
      title,
      body,
      reference_id: documentId,
      payload: {
        document_id: documentId,
        document_source: documentSource,
        document_type: documentType,
        document_name: docName,
        expiry_date: expiryDate,
        reminder_type: reminder.type,
        reminder_label: reminder.label,
        full_message: body,
      },
    })
    .select('id')
    .single()

  if (error) throw error

  const tokens = await loadUserTokens(supabase, userId)
  if (tokens.length) {
    await sendUserNotificationPush({
      userId,
      title,
      body,
      data: {
        type: 'document_expiry',
        notification_id: String(notification.id),
        reference_id: String(documentId),
        document_type: String(documentType),
        reminder_type: reminder.type,
      },
      tokens,
      supabaseAdmin: supabase,
    })
  }

  return notification
}

async function processDocument({
  supabase,
  today,
  document,
  summary,
}) {
  const expiryDate = String(document.expiry_date).slice(0, 10)
  const expiry = parseYmd(expiryDate)
  if (Number.isNaN(expiry.getTime())) {
    summary.skipped += 1
    return
  }

  const daysLeft = daysBetween(today, expiry)
  if (daysLeft < 0) {
    summary.skipped += 1
    return
  }

  const reminder = REMINDER_WINDOWS.find((row) => row.daysUntilExpiry === daysLeft)
  if (!reminder) {
    summary.skipped += 1
    return
  }

  summary.checked += 1

  const claimed = await claimReminder(supabase, {
    document_id: document.id,
    document_source: document.document_source,
    user_id: document.user_id,
    reminder_type: reminder.type,
  })
  if (!claimed) {
    summary.skipped += 1
    return
  }

  try {
    await createDocumentExpiryNotification({
      supabase,
      userId: document.user_id,
      companyId: document.company_id ?? null,
      documentId: document.id,
      documentSource: document.document_source,
      documentType: document.document_type,
      expiryDate,
      reminder,
    })
    summary.sent += 1
  } catch (err) {
    await supabase
      .from('document_expiry_notifications_sent')
      .delete()
      .eq('document_id', document.id)
      .eq('document_source', document.document_source)
      .eq('reminder_type', reminder.type)

    throw err
  }
}

const SEND_HOUR = 0
const SEND_MINUTE = 0

function isSendTimeForUser(timeZone) {
  const now = getZonedNow(resolveTimezone(timeZone))
  return now.hour === SEND_HOUR && now.minute === SEND_MINUTE
}

function localTodayFromZonedNow(zonedNow) {
  return parseYmd(zonedNow.date)
}

async function loadUserTimezones(supabase, userIds) {
  if (!userIds.length) return new Map()

  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('user_id, timezone, updated_at')
    .in('user_id', userIds)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const map = new Map()
  for (const row of data ?? []) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, resolveTimezone(row.timezone))
    }
  }
  return map
}

async function loadExpiringDocuments(supabase) {
  const [driverDocsRes, vehicleDocsRes, paDocsRes] = await Promise.all([
    supabase
      .from('driver_documents')
      .select('id, driver_id, company_id, document_type, expiry_date')
      .not('expiry_date', 'is', null),
    supabase
      .from('vehicle_documents')
      .select(
        'id, company_id, document_type, expiry_date, vehicles!inner(driver_id)',
      )
      .not('expiry_date', 'is', null),
    supabase
      .from('passenger_assistant_documents')
      .select(
        'id, passenger_assistant_id, document_type, expiry_date, passenger_assistant!inner(company_id)',
      )
      .not('expiry_date', 'is', null),
  ])

  if (driverDocsRes.error) throw driverDocsRes.error
  if (vehicleDocsRes.error) throw vehicleDocsRes.error
  if (paDocsRes.error) throw paDocsRes.error

  const documents = []

  for (const row of driverDocsRes.data ?? []) {
    if (!row.driver_id) continue
    documents.push({
      id: row.id,
      user_id: row.driver_id,
      company_id: row.company_id,
      document_type: row.document_type,
      expiry_date: row.expiry_date,
      document_source: 'driver',
    })
  }

  for (const row of vehicleDocsRes.data ?? []) {
    const driverId = row.vehicles?.driver_id
    if (!driverId) continue
    documents.push({
      id: row.id,
      user_id: driverId,
      company_id: row.company_id,
      document_type: row.document_type,
      expiry_date: row.expiry_date,
      document_source: 'vehicle',
    })
  }

  for (const row of paDocsRes.data ?? []) {
    const paId = row.passenger_assistant_id
    if (!paId) continue
    documents.push({
      id: row.id,
      user_id: paId,
      company_id: row.passenger_assistant?.company_id ?? null,
      document_type: row.document_type,
      expiry_date: row.expiry_date,
      document_source: 'passenger_assistant',
    })
  }

  return documents
}

export async function runDocumentExpirySchedulerTick(supabase) {
  const fallbackTz = resolveTimezone(null)
  const documents = await loadExpiringDocuments(supabase)
  const userIds = [...new Set(documents.map((doc) => doc.user_id))]
  const userTimezones = await loadUserTimezones(supabase, userIds)

  const summary = {
    documents: documents.length,
    users: userIds.length,
    checked: 0,
    sent: 0,
    skipped: 0,
  }

  const documentsByUser = new Map()
  for (const document of documents) {
    const list = documentsByUser.get(document.user_id) ?? []
    list.push(document)
    documentsByUser.set(document.user_id, list)
  }

  for (const [userId, userDocuments] of documentsByUser) {
    const timeZone = userTimezones.get(userId) ?? fallbackTz
    if (!isSendTimeForUser(timeZone)) {
      summary.skipped += userDocuments.length
      continue
    }

    const today = localTodayFromZonedNow(getZonedNow(timeZone))

    for (const document of userDocuments) {
      try {
        await processDocument({ supabase, today, document, summary })
      } catch (err) {
        console.error('document expiry notification failed', {
          documentId: document.id,
          userId: document.user_id,
          error: err instanceof Error ? err.message : err,
        })
      }
    }
  }

  if (summary.sent > 0) {
    console.info('document expiry scheduler tick', {
      utcAt: new Date().toISOString(),
      fallbackTimezone: fallbackTz,
      sendTime: '00:00',
      ...summary,
    })
  }

  return summary
}

export function startDocumentExpiryScheduler(supabase) {
  const enabled = (process.env.DOCUMENT_EXPIRY_SCHEDULER_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('document expiry scheduler disabled (DOCUMENT_EXPIRY_SCHEDULER_ENABLED=false)')
    return
  }

  const fallbackTz = resolveTimezone(null)
  const cronExpr = process.env.DOCUMENT_EXPIRY_CRON ?? '* * * * *'

  console.info(
    `document expiry scheduler enabled (per-user timezone at 00:00, fallback=${fallbackTz}, cron="${cronExpr}")`,
  )

  cron.schedule(cronExpr, async () => {
    try {
      await runDocumentExpirySchedulerTick(supabase)
    } catch (error) {
      console.error(
        'document expiry scheduler tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
