const WEEKDAY_KEYS_SUN_FIRST = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function weekdayForDate(dateStr, timeZone) {
  const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
  })
  const short = weekdayFormatter.format(new Date(`${dateStr}T12:00:00Z`)).toLowerCase()
  const map = {
    sun: 'sun',
    mon: 'mon',
    tue: 'tue',
    wed: 'wed',
    thu: 'thu',
    fri: 'fri',
    sat: 'sat',
  }
  return map[short.slice(0, 3)] ?? WEEKDAY_KEYS_SUN_FIRST[new Date(`${dateStr}T12:00:00Z`).getUTCDay()]
}

/**
 * Mirrors Web getDailyScheduleForJob():
 * base weekday rows minus skips, with alternative_location overrides and extra_day rows.
 */
export async function getDailyScheduleForJob(supabase, jobId, dateStr, direction, timeZone) {
  const weekday = weekdayForDate(dateStr, timeZone)

  const { data: rows, error } = await supabase
    .from('passenger_schedules')
    .select('*')
    .eq('job_id', jobId)
    .eq('direction', direction)
    .or(
      `and(weekday.eq.${weekday},exception_date.is.null),exception_date.eq.${dateStr}`,
    )

  if (error) throw error

  const base = (rows ?? []).filter(
    (row) => row.exception_date == null && row.weekday === weekday,
  )
  const exceptions = (rows ?? []).filter((row) => row.exception_date === dateStr)

  const skipIds = new Set(
    exceptions
      .filter((row) => row.exception_type === 'skip')
      .map((row) => row.passenger_id),
  )

  const altOverrides = new Map(
    exceptions
      .filter((row) => row.exception_type === 'alternative_location')
      .map((row) => [row.passenger_id, row]),
  )

  const extraDayRows = exceptions.filter((row) => row.exception_type === 'extra_day')

  const schedule = base
    .filter((row) => !skipIds.has(row.passenger_id))
    .map((row) => (altOverrides.has(row.passenger_id)
      ? altOverrides.get(row.passenger_id)
      : row))

  for (const extra of extraDayRows) {
    if (!schedule.some((row) => row.passenger_id === extra.passenger_id)) {
      schedule.push(extra)
    }
  }

  return schedule
}

export function hasRunOnDate(job, direction, scheduleRows) {
  if (!scheduleRows.length) return false
  if (direction === 'outbound') return job.has_outbound === true
  if (direction === 'inbound') return job.has_inbound === true
  return false
}

export function startTimeForDirection(job, direction) {
  if (direction === 'outbound') return job.morning_start_time
  if (direction === 'inbound') return job.evening_start_time
  return null
}

export function parseTimeToMinutes(rawTime) {
  if (rawTime == null || rawTime === '') return null
  const parts = String(rawTime).trim().split(':')
  if (parts.length < 2) return null
  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

export function formatTimeLabel(rawTime) {
  const minutes = parseTimeToMinutes(rawTime)
  if (minutes == null) return '--:--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getZonedNow(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  )

  const year = parts.year
  const month = parts.month
  const day = parts.day
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)

  return {
    date: `${year}-${month}-${day}`,
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  }
}
