import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'

export function isCancelledJobStatus(status) {
  const s = String(status || '').trim().toLowerCase()
  return s === 'cancelled' || s === 'canceled'
}

/** Matches portal `isJobCompleted` (UTC calendar date). */
export function isJobCompleted(job) {
  if (!job || isCancelledJobStatus(job.status)) return false

  const status = String(job.status || '').trim().toLowerCase()
  if (status === 'completed' || status === 'complete') return true

  const semesterEnd = job.semester_end
  if (semesterEnd) {
    const today = new Date().toISOString().slice(0, 10)
    if (today > String(semesterEnd).slice(0, 10)) return true
  }
  return false
}

function formatDriverName(driver) {
  return [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim() || 'Driver'
}

function formatJobLabel(job) {
  if (job?.internal_job_id) return String(job.internal_job_id)
  if (job?.job_name) return String(job.job_name)
  return job?.id ? `Job ${String(job.id).slice(0, 8)}` : 'a job'
}

function formatPaName(pa) {
  return [pa?.first_name, pa?.surname].filter(Boolean).join(' ').trim() || 'Passenger Assistant'
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

async function loadPa(supabase, paId) {
  if (!paId) return null
  const { data, error } = await supabase
    .from('passenger_assistant')
    .select('id, first_name, surname')
    .eq('id', paId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function notifyJobCompletedDriverReleased(supabase, { job, driverId, driver = null }) {
  const driverRow = driver?.id ? driver : await loadDriver(supabase, driverId)
  if (!driverRow?.id) return null

  const driverName = formatDriverName(driverRow)
  const jobLabel = formatJobLabel(job)
  const jobName = job.job_name?.trim() || jobLabel
  const school = job.client_school_name?.trim() || ''
  const payload = {
    event: 'job_completed',
    driver_name: driverName,
    job_id: job.id,
    job_name: job.job_name || null,
    job_label: jobLabel,
    client_school_name: school || null,
    internal_job_id: job.internal_job_id ?? null,
  }

  if (job.company_id) {
    const portalBody = school
      ? `${jobLabel} at ${school} is completed. ${driverName} is now available for other jobs.`
      : `${jobLabel} is completed. ${driverName} is now available for other jobs.`

    const { error: portalErr } = await supabase
      .from('job_event_notifications')
      .insert({
        company_id: job.company_id,
        job_id: job.id,
        driver_id: driverRow.id,
        actor_id: null,
        event_type: 'job_completed',
        title: 'Job Completed:',
        body: portalBody,
        payload,
      })
    if (portalErr) {
      console.warn('job completion portal notification failed:', portalErr.message)
    }
  }

  const driverTitle = 'Job Completed'
  const driverBody = school
    ? `${jobName} at ${school} is completed. You are now available for other jobs.`
    : `${jobName} is completed. You are now available for other jobs.`

  const { data: notification, error: notifyErr } = await supabase
    .from('user_notifications')
    .insert({
      user_id: driverRow.id,
      company_id: job.company_id ?? null,
      notification_type: 'job_completed',
      title: driverTitle,
      body: driverBody,
      reference_id: job.id,
      payload,
    })
    .select('id')
    .single()

  if (notifyErr) {
    console.warn('job completion driver notification failed:', notifyErr.message)
    return null
  }

  const tokens = await loadUserTokens(supabase, driverRow.id)
  if (tokens.length) {
    await sendUserNotificationPush({
      userId: driverRow.id,
      title: driverTitle,
      body: driverBody,
      data: {
        type: 'job_completed',
        notification_id: String(notification.id),
        reference_id: String(job.id),
      },
      tokens,
      supabaseAdmin: supabase,
    })
  }

  return notification
}

async function notifyJobCompletedPaReleased(supabase, { job, paId, pa = null }) {
  const paRow = pa?.id ? pa : await loadPa(supabase, paId)
  if (!paRow?.id) return null

  const paName = formatPaName(paRow)
  const jobLabel = formatJobLabel(job)
  const jobName = job.job_name?.trim() || jobLabel
  const school = job.client_school_name?.trim() || ''
  const payload = {
    event: 'job_completed',
    pa_name: paName,
    job_id: job.id,
    job_name: job.job_name || null,
    job_label: jobLabel,
    client_school_name: school || null,
    internal_job_id: job.internal_job_id ?? null,
  }

  if (job.company_id) {
    const portalBody = school
      ? `${jobLabel} at ${school} is completed. ${paName} is now available for other jobs.`
      : `${jobLabel} is completed. ${paName} is now available for other jobs.`

    const { error: portalErr } = await supabase
      .from('job_event_notifications')
      .insert({
        company_id: job.company_id,
        job_id: job.id,
        pa_id: paRow.id,
        actor_id: null,
        event_type: 'job_completed',
        title: 'Job Completed:',
        body: portalBody,
        payload,
      })
    if (portalErr) {
      console.warn('job completion PA portal notification failed:', portalErr.message)
    }
  }

  const paTitle = 'Job Completed'
  const paBody = school
    ? `${jobName} at ${school} is completed. You are now available for other jobs.`
    : `${jobName} is completed. You are now available for other jobs.`

  const { data: notification, error: notifyErr } = await supabase
    .from('user_notifications')
    .insert({
      user_id: paRow.id,
      company_id: job.company_id ?? null,
      notification_type: 'job_completed',
      title: paTitle,
      body: paBody,
      reference_id: job.id,
      payload,
    })
    .select('id')
    .single()

  if (notifyErr) {
    console.warn('job completion PA notification failed:', notifyErr.message)
    return null
  }

  const tokens = await loadUserTokens(supabase, paRow.id)
  if (tokens.length) {
    await sendUserNotificationPush({
      userId: paRow.id,
      title: paTitle,
      body: paBody,
      data: {
        type: 'job_completed',
        notification_id: String(notification.id),
        reference_id: String(job.id),
      },
      tokens,
      supabaseAdmin: supabase,
    })
  }

  return notification
}

export async function releaseAssignedDriverIfJobCompleted(supabase, job) {
  if (!job?.id || !job.assigned_driver_id) return null
  if (!isJobCompleted(job)) return null

  const previousDriverId = job.assigned_driver_id
  const { data, error } = await supabase
    .from('jobs')
    .update({
      assigned_driver_id: null,
      driver_approval_status: null,
      driver_counter_offer_pay: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)
    .eq('assigned_driver_id', previousDriverId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  try {
    await notifyJobCompletedDriverReleased(supabase, {
      job,
      driverId: previousDriverId,
    })
  } catch (notifyErr) {
    console.warn(
      'job completion driver release notification failed:',
      notifyErr instanceof Error ? notifyErr.message : notifyErr,
    )
  }

  return { jobId: job.id, driverId: previousDriverId }
}

export async function releaseAssignedPaIfJobCompleted(supabase, job) {
  if (!job?.id || !job.assigned_pa_id) return null
  if (!isJobCompleted(job)) return null

  const previousPaId = job.assigned_pa_id
  const { data, error } = await supabase
    .from('jobs')
    .update({
      assigned_pa_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)
    .eq('assigned_pa_id', previousPaId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  try {
    await notifyJobCompletedPaReleased(supabase, {
      job,
      paId: previousPaId,
    })
  } catch (notifyErr) {
    console.warn(
      'job completion PA release notification failed:',
      notifyErr instanceof Error ? notifyErr.message : notifyErr,
    )
  }

  return { jobId: job.id, paId: previousPaId }
}

export async function runJobCompletionReleaseTick(supabase) {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(
      'id, company_id, job_name, client_school_name, internal_job_id, status, semester_end, assigned_driver_id, assigned_pa_id',
    )
    .or('assigned_driver_id.not.is.null,assigned_pa_id.not.is.null')
    .neq('status', 'cancelled')

  if (error) throw error

  const summary = { checked: jobs?.length ?? 0, released: 0, skipped: 0 }
  for (const job of jobs || []) {
    try {
      const driverReleased = await releaseAssignedDriverIfJobCompleted(supabase, job)
      const paReleased = await releaseAssignedPaIfJobCompleted(supabase, job)
      if (driverReleased || paReleased) summary.released += 1
      else summary.skipped += 1
    } catch (err) {
      summary.skipped += 1
      console.error('job completion release failed', {
        jobId: job.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }

  if (summary.released > 0) {
    console.info('job completion release tick', {
      utcAt: new Date().toISOString(),
      ...summary,
    })
  }

  return summary
}

export function startJobCompletionReleaseScheduler(supabase) {
  const enabled = (process.env.JOB_COMPLETION_RELEASE_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('job completion release scheduler disabled (JOB_COMPLETION_RELEASE_ENABLED=false)')
    return
  }

  const cronExpr = process.env.DOCUMENT_EXPIRY_CRON ?? '* * * * *'
  console.info(`job completion release scheduler enabled (cron="${cronExpr}")`)

  cron.schedule(cronExpr, async () => {
    try {
      await runJobCompletionReleaseTick(supabase)
    } catch (error) {
      console.error(
        'job completion release tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
