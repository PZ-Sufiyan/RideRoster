import cron from 'node-cron'
import {
  getDailyScheduleForJob,
  getZonedNow,
  hasRunOnDate,
  parseTimeToMinutes,
  startTimeForDirection,
} from './scheduleResolver.js'
import {
  sendJobReminderPush,
  sendJobStartPush,
} from './fcm.js'
import { isDateInSemester, resolveTimezone } from './timezone.js'

const DIRECTIONS = ['outbound', 'inbound']

async function claimNotification(supabase, record) {
  const { error } = await supabase
    .from('job_push_notifications_sent')
    .insert(record)

  if (error?.code === '23505') return false
  if (error) throw error
  return true
}

async function loadDriverTokens(supabase, driverId) {
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('fcm_token')
    .eq('user_id', driverId)

  if (error) throw error
  return (data ?? [])
    .map((row) => row.fcm_token)
    .filter((token) => typeof token === 'string' && token.trim().length > 0)
}

async function loadDriverTimezones(supabase, driverIds) {
  if (!driverIds.length) return new Map()

  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('user_id, timezone, updated_at')
    .in('user_id', driverIds)
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

async function processJobNotifications({
  supabase,
  job,
  timeZone,
}) {
  const summary = { checked: 0, sent: 0, skipped: 0 }
  const today = getZonedNow(timeZone)

  if (!isDateInSemester(job, today.date)) {
    summary.skipped += 1
    return summary
  }

  for (const direction of DIRECTIONS) {
    summary.checked += 1

    const schedule = await getDailyScheduleForJob(
      supabase,
      job.id,
      today.date,
      direction,
      timeZone,
    )

    if (!hasRunOnDate(job, direction, schedule)) {
      summary.skipped += 1
      continue
    }

    const startTime = startTimeForDirection(job, direction)
    const startMinutes = parseTimeToMinutes(startTime)
    if (startMinutes == null) {
      summary.skipped += 1
      continue
    }

    const reminderMinutes = startMinutes >= 30 ? startMinutes - 30 : null
    const isStartTime = today.minutesOfDay === startMinutes
    const isReminderTime = reminderMinutes != null && today.minutesOfDay === reminderMinutes

    if (!isStartTime && !isReminderTime) continue

    const tokens = await loadDriverTokens(supabase, job.assigned_driver_id)
    if (!tokens.length) {
      summary.skipped += 1
      continue
    }

    if (isReminderTime) {
      const claimed = await claimNotification(supabase, {
        job_id: job.id,
        driver_id: job.assigned_driver_id,
        run_date: today.date,
        direction,
        notification_type: 'reminder_30',
      })
      if (!claimed) continue

      const result = await sendJobReminderPush({
        job,
        direction,
        startTime,
        tokens,
        supabase,
      })
      summary.sent += result.sent ?? 0
    }

    if (isStartTime) {
      const claimed = await claimNotification(supabase, {
        job_id: job.id,
        driver_id: job.assigned_driver_id,
        run_date: today.date,
        direction,
        notification_type: 'job_start',
      })
      if (!claimed) continue

      const result = await sendJobStartPush({
        job,
        direction,
        startTime,
        tokens,
        supabase,
      })
      summary.sent += result.sent ?? 0
    }
  }

  return summary
}

export async function runJobSchedulerTick(supabase) {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(
      'id, job_name, client_school_name, assigned_driver_id, driver_approval_status, '
      + 'status, semester_start, semester_end, has_outbound, has_inbound, '
      + 'morning_start_time, evening_start_time',
    )
    .not('assigned_driver_id', 'is', null)
    .eq('driver_approval_status', 'accepted')
    .neq('status', 'cancelled')

  if (error) throw error

  const driverIds = [...new Set((jobs ?? []).map((job) => job.assigned_driver_id))]
  const driverTimezones = await loadDriverTimezones(supabase, driverIds)

  const totals = { jobs: jobs?.length ?? 0, sent: 0, skipped: 0 }

  for (const job of jobs ?? []) {
    try {
      const timeZone = driverTimezones.get(job.assigned_driver_id)
        ?? resolveTimezone(null)

      const result = await processJobNotifications({
        supabase,
        job,
        timeZone,
      })
      totals.sent += result.sent
      totals.skipped += result.skipped
    } catch (err) {
      console.error('job scheduler job failed', {
        jobId: job.id,
        error: err instanceof Error ? err.message : err,
      })
    }
  }

  if (totals.sent > 0) {
    console.info('job scheduler tick', {
      utcAt: new Date().toISOString(),
      ...totals,
    })
  }

  return totals
}

export function startJobScheduler(supabase) {
  const enabled = (process.env.JOB_SCHEDULER_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('job scheduler disabled (JOB_SCHEDULER_ENABLED=false)')
    return
  }

  const fallbackTz = resolveTimezone(null)
  console.info(
    `job scheduler enabled (per-driver timezone, fallback=${fallbackTz}, every minute)`,
  )

  cron.schedule('* * * * *', async () => {
    try {
      await runJobSchedulerTick(supabase)
    } catch (error) {
      console.error(
        'job scheduler tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
