import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'
import { notifyPaPortalEvent } from './paEventNotifications.js'
import {
  loadPaJobsForRemoval,
  removePaFromJobs,
  suspendApprovedPa,
} from './jobReassignmentAlerts.js'
import { getZonedNow } from './scheduleResolver.js'
import { resolveTimezone } from './timezone.js'

const SAFEGUARDING_DOCUMENT_TYPE = 'safeguarding_certificate'
const SAFEGUARDING_LABEL = 'Safeguarding Certificate'

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

function formatPaName(pa) {
  return [pa?.first_name, pa?.surname].filter(Boolean).join(' ').trim() || 'Passenger Assistant'
}

function formatJobLabel(job) {
  if (job?.internal_job_id) return String(job.internal_job_id)
  if (job?.job_name) return String(job.job_name)
  return job?.id ? `Job ${String(job.id).slice(0, 8)}` : 'a job'
}

function normalizePaStatus(status) {
  return String(status || '').trim().toLowerCase()
}

function isPaApprovedStatus(status) {
  const s = normalizePaStatus(status)
  return s === 'approve' || s === 'approved'
}

function isPaRejectedStatus(status) {
  const s = normalizePaStatus(status)
  return s === 'reject' || s === 'rejected'
}

function operatingTimezone() {
  return resolveTimezone(process.env.DOCUMENT_EXPIRY_TIMEZONE || 'Europe/London')
}

async function claimProcessed(supabase, record) {
  const { error } = await supabase
    .from('pa_document_expiry_suspend_processed')
    .insert(record)

  if (error?.code === '23505') return false
  if (error) throw error
  return true
}

async function unclaimProcessed(supabase, documentId, expiryDate) {
  await supabase
    .from('pa_document_expiry_suspend_processed')
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

async function notifyPaInAppAndPush(supabase, {
  paId,
  companyId,
  notificationType,
  title,
  body,
  referenceId,
  payload,
}) {
  const notification = await insertUserNotification(supabase, {
    user_id: paId,
    company_id: companyId,
    notification_type: notificationType,
    title,
    body,
    reference_id: referenceId || null,
    payload,
  })

  await pushToUser(supabase, {
    userId: paId,
    title,
    body,
    type: notificationType,
    notificationId: notification?.id,
    referenceId,
  })

  return notification
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
      console.warn('portal user PA document expiry suspend push failed', {
        userId,
        error: err instanceof Error ? err.message : err,
      })
    }
  }
}

async function loadPa(supabase, paId) {
  if (!paId) return null
  const { data, error } = await supabase
    .from('passenger_assistant')
    .select('id, first_name, surname, status, fleet, company_id')
    .eq('id', paId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function loadExpiredSafeguardingDocuments(supabase, todayYmd) {
  const pageSize = 1000
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('passenger_assistant_documents')
      .select(
        `
        id,
        passenger_assistant_id,
        document_type,
        expiry_date,
        passenger_assistant!inner (
          id,
          company_id,
          first_name,
          surname,
          status,
          fleet
        )
      `,
      )
      .eq('document_type', SAFEGUARDING_DOCUMENT_TYPE)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', todayYmd)
      .range(from, from + pageSize - 1)

    if (error) throw error
    const batch = data || []
    rows.push(...batch)
    if (batch.length < pageSize) break
  }

  return rows.filter((row) => {
    if (!row.passenger_assistant_id || !row.passenger_assistant?.id) return false
    const expiry = parseYmd(row.expiry_date)
    if (Number.isNaN(expiry.getTime())) return false
    return daysBetween(parseYmd(todayYmd), expiry) <= 0
  })
}

async function processPaSafeguardingExpiry({
  supabase,
  pa,
  documents,
  todayYmd,
  summary,
}) {
  if (isPaRejectedStatus(pa.status)) {
    summary.skipped += 1
    return
  }

  const claimed = []
  for (const document of documents) {
    const expiryDate = String(document.expiry_date).slice(0, 10)
    const ok = await claimProcessed(supabase, {
      document_id: document.id,
      pa_id: pa.id,
      company_id: document.passenger_assistant?.company_id ?? pa.company_id ?? null,
      expiry_date: expiryDate,
    })
    if (ok) claimed.push({ ...document, expiry_date: expiryDate })
  }

  const stillApproved = isPaApprovedStatus(pa.status)
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

  let suspended = false
  let removedJobs = []

  try {
    if (stillApproved) {
      const updated = await suspendApprovedPa(supabase, pa.id)
      suspended = Boolean(updated)
      if (updated) summary.suspended += 1
    }

    const jobs = await loadPaJobsForRemoval(supabase, pa.id, todayYmd)
    removedJobs = await removePaFromJobs(supabase, jobs)
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

  const companyId = pa.company_id || docsForMessage[0].passenger_assistant?.company_id || null
  const paName = formatPaName(pa)
  const expiryLabel = formatDisplayDate(docsForMessage[0].expiry_date)
  const payloadBase = {
    event: 'pa_document_expired',
    reason: 'document_expiry',
    pa_id: pa.id,
    pa_name: paName,
    fleet: pa.fleet || null,
    document_types: [SAFEGUARDING_DOCUMENT_TYPE],
    document_labels: [SAFEGUARDING_LABEL],
    document_name: SAFEGUARDING_LABEL,
    expiry_date: docsForMessage[0].expiry_date,
    suspended,
    jobs_removed: removedJobs.map((j) => j.id),
  }

  const paDocBody = `Your ${SAFEGUARDING_LABEL} expired on ${expiryLabel}. Your account has been suspended until the document is renewed.`
  const adminDocBody = `${paName}'s ${SAFEGUARDING_LABEL} expired on ${expiryLabel}. The PA has been suspended.`

  try {
    if (claimed.length || suspended) {
      await notifyPaInAppAndPush(supabase, {
        paId: pa.id,
        companyId,
        notificationType: 'document_expiry',
        title: 'Document Expired',
        body: paDocBody,
        referenceId: docsForMessage[0].id,
        payload: {
          ...payloadBase,
          full_message: paDocBody,
          document_name: SAFEGUARDING_LABEL,
        },
      })

      if (companyId) {
        await notifyPaPortalEvent(supabase, {
          companyId,
          paId: pa.id,
          eventType: 'pa_document_expired',
          title: 'PA Document Expired',
          body: adminDocBody,
          payload: payloadBase,
          notifyPortalUsersPush,
        })
      }

      for (const job of removedJobs) {
        const jobName = job.job_name?.trim() || formatJobLabel(job)
        const school = job.client_school_name?.trim() || ''
        const paJobBody = school
          ? `You have been removed from ${jobName} at ${school} because your ${SAFEGUARDING_LABEL} expired.`
          : `You have been removed from ${jobName} because your ${SAFEGUARDING_LABEL} expired.`
        const adminJobBody = `${paName} was removed from "${jobName}" because their ${SAFEGUARDING_LABEL} expired.`

        await notifyPaInAppAndPush(supabase, {
          paId: pa.id,
          companyId: job.company_id || companyId,
          notificationType: 'job_removed',
          title: 'Removed from Job',
          body: paJobBody,
          referenceId: job.id,
          payload: {
            ...payloadBase,
            event: 'pa_removed_from_job',
            job_id: job.id,
            job_name: job.job_name || null,
            client_school_name: school || null,
            internal_job_id: job.internal_job_id ?? null,
            full_message: paJobBody,
          },
        })

        if (job.company_id || companyId) {
          await notifyPaPortalEvent(supabase, {
            companyId: job.company_id || companyId,
            paId: pa.id,
            jobId: job.id,
            eventType: 'pa_removed_from_job',
            title: 'PA Removed from Job',
            body: adminJobBody,
            payload: {
              ...payloadBase,
              event: 'pa_removed_from_job',
              job_id: job.id,
              job_name: job.job_name || null,
              client_school_name: school || null,
              internal_job_id: job.internal_job_id ?? null,
            },
            notifyPortalUsersPush,
          })
        }
      }
    }

    summary.processed += 1
  } catch (err) {
    console.error('PA document expiry suspend notify failed after status update', {
      paId: pa.id,
      error: err instanceof Error ? err.message : err,
    })
    summary.processed += 1
  }
}

export async function runPaDocumentExpirySuspendTick(supabase) {
  const timeZone = operatingTimezone()
  const todayYmd = getZonedNow(timeZone).date

  const summary = {
    timezone: timeZone,
    today: todayYmd,
    documents: 0,
    pas: 0,
    processed: 0,
    suspended: 0,
    jobsRemoved: 0,
    skipped: 0,
  }

  const rows = await loadExpiredSafeguardingDocuments(supabase, todayYmd)
  summary.documents = rows.length

  const byPa = new Map()
  for (const row of rows) {
    const pa = row.passenger_assistant
    const list = byPa.get(pa.id) ?? { pa, documents: [] }
    list.documents.push(row)
    byPa.set(pa.id, list)
  }
  summary.pas = byPa.size

  for (const { pa, documents } of byPa.values()) {
    try {
      const freshPa = await loadPa(supabase, pa.id)
      await processPaSafeguardingExpiry({
        supabase,
        pa: freshPa || pa,
        documents,
        todayYmd,
        summary,
      })
    } catch (err) {
      console.error('PA document expiry suspend failed', {
        paId: pa.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }

  if (summary.processed > 0 || summary.suspended > 0) {
    console.info('PA document expiry suspend tick', {
      utcAt: new Date().toISOString(),
      ...summary,
    })
  }

  return summary
}

export function startPaDocumentExpirySuspendScheduler(supabase) {
  const enabled = (process.env.PA_DOC_EXPIRY_SUSPEND_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('PA document expiry suspend scheduler disabled (PA_DOC_EXPIRY_SUSPEND_ENABLED=false)')
    return
  }

  const cronExpr = process.env.DOCUMENT_EXPIRY_CRON ?? '* * * * *'
  console.info(`PA document expiry suspend scheduler enabled (cron="${cronExpr}")`)

  cron.schedule(cronExpr, async () => {
    try {
      await runPaDocumentExpirySuspendTick(supabase)
    } catch (error) {
      console.error(
        'PA document expiry suspend tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
