import { supabase } from '../lib/supabaseClient'
import {
  formatTimeDisplay,
  formatJobDisplayId,
  buildSeatCapacityByDriverId,
} from './jobService'

const WEEKDAY_BY_JS_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const JOB_COLORS = ['green', 'orange', 'blue']
export const MONTH_PREVIEW_LIMIT = 2

function defaultAvatar(seed) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`
}

export function toIsoDateLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a, b) {
  return toIsoDateLocal(a) === toIsoDateLocal(b)
}

function isToday(d) {
  return isSameDay(d, new Date())
}

function isDateInJobSemester(job, isoDate) {
  if (job.semester_start && isoDate < job.semester_start) return false
  if (job.semester_end && isoDate > job.semester_end) return false
  return true
}

function weekdayKeyForDate(d) {
  return WEEKDAY_BY_JS_DAY[d.getDay()]
}

function jobColorForIndex(idx) {
  return JOB_COLORS[idx % JOB_COLORS.length]
}

/** @returns {Set<string>} passenger ids traveling that day */
export function getPassengerIdsForJobOnDate(scheduleRows, jobId, date) {
  const isoDate = typeof date === 'string' ? date : toIsoDateLocal(date)
  const d = typeof date === 'string' ? parseIsoDate(date) : date
  const weekday = weekdayKeyForDate(d)

  const jobRows = scheduleRows.filter((r) => r.job_id === jobId)
  const passengerIds = new Set()

  for (const direction of ['outbound', 'inbound']) {
    const dirRows = jobRows.filter((r) => r.direction === direction)
    const base = dirRows.filter((r) => r.exception_date === null && r.weekday === weekday)
    const exceptions = dirRows.filter((r) => r.exception_date === isoDate)

    const skipIds = new Set(
      exceptions.filter((r) => r.exception_type === 'skip').map((r) => r.passenger_id),
    )

    const extraDayRows = exceptions.filter((r) => r.exception_type === 'extra_day')

    for (const r of base) {
      if (!skipIds.has(r.passenger_id)) passengerIds.add(r.passenger_id)
    }
    for (const r of extraDayRows) {
      passengerIds.add(r.passenger_id)
    }
  }

  return passengerIds
}

export function getJobStartTimeDisplay(job) {
  if (job.has_outbound !== false && job.morning_start_time) {
    return formatTimeDisplay(job.morning_start_time)
  }
  if (job.has_inbound && job.evening_start_time) {
    return formatTimeDisplay(job.evening_start_time)
  }
  if (job.morning_start_time) return formatTimeDisplay(job.morning_start_time)
  if (job.evening_start_time) return formatTimeDisplay(job.evening_start_time)
  return '—'
}

export function getJobTripTimes(job) {
  const showMorning = job.has_outbound !== false && Boolean(job.morning_start_time)
  const showReturn = job.has_inbound !== false && Boolean(job.evening_start_time)

  return {
    showMorning,
    showReturn,
    morningTime: showMorning ? formatTimeDisplay(job.morning_start_time) : null,
    returnTime: showReturn ? formatTimeDisplay(job.evening_start_time) : null,
  }
}

export function getJobTimeRangeDisplay(job) {
  if (job.has_outbound !== false && job.morning_start_time && job.morning_end_time) {
    return `${formatTimeDisplay(job.morning_start_time)} - ${formatTimeDisplay(job.morning_end_time)}`
  }
  return getJobStartTimeDisplay(job)
}

export function buildMonthGrid(anchorDate) {
  const year = anchorDate.getFullYear()
  const month = anchorDate.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = startPad - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day)
    cells.push({ date, day, isPrev: true, isNext: false, isToday: isToday(date) })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    cells.push({ date, day, isPrev: false, isNext: false, isToday: isToday(date) })
  }
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month + 1, nextDay)
    cells.push({ date, day: nextDay, isPrev: false, isNext: true, isToday: isToday(date) })
    nextDay++
  }
  return cells
}

export function buildWeekDays(anchorDate) {
  const d = new Date(anchorDate)
  d.setHours(0, 0, 0, 0)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())

  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return names.map((name, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return { name, date, day: date.getDate(), isToday: isToday(date) }
  })
}

export function formatCalendarHeading(view, anchorDate) {
  if (view === 'month') {
    return anchorDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }
  if (view === 'week') {
    const week = buildWeekDays(anchorDate)
    const start = week[0].date
    const end = week[6].date
    const sameMonth = start.getMonth() === end.getMonth()
    const startStr = start.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-GB', {
      month: sameMonth ? undefined : 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return `${startStr} - ${endStr}`
  }
  return anchorDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function shiftAnchorDate(view, anchorDate, delta) {
  const d = new Date(anchorDate)
  if (view === 'month') d.setMonth(d.getMonth() + delta)
  else if (view === 'week') d.setDate(d.getDate() + delta * 7)
  else d.setDate(d.getDate() + delta)
  return d
}

export function getJobsForDate(calendarData, date) {
  const { jobs, schedules, driversById, seatCapacityByDriverId, jobColorById } = calendarData
  const iso = toIsoDateLocal(date)
  const result = []

  jobs.forEach((job, idx) => {
    if (job.status === 'cancelled') return
    if (!isDateInJobSemester(job, iso)) return

    const passengerIds = getPassengerIdsForJobOnDate(schedules, job.id, iso)
    if (passengerIds.size === 0) return

    const driver = job.assigned_driver_id ? driversById.get(job.assigned_driver_id) : null
    const capacity = job.assigned_driver_id
      ? seatCapacityByDriverId.get(job.assigned_driver_id) ?? null
      : null
    const occupied = passengerIds.size

    const firstName = driver?.first_name || ''
    const lastName = driver?.last_name || ''
    const tripTimes = getJobTripTimes(job)

    result.push({
      jobId: job.id,
      title: job.job_name,
      code: formatJobDisplayId(job.id),
      time: getJobStartTimeDisplay(job),
      timeRange: getJobTimeRangeDisplay(job),
      ...tripTimes,
      color: jobColorById.get(job.id) ?? jobColorForIndex(idx),
      driver: driver
        ? {
            name: [firstName, lastName].filter(Boolean).join(' ').trim(),
            shortName: `${firstName.charAt(0) || ''}. ${lastName}`.trim(),
            avatar: driver.profile_picture_url || defaultAvatar(driver.id),
          }
        : null,
      seats: capacity != null ? `${Math.round(capacity)}(${occupied})seat` : `${occupied} seat`,
      occupied,
      capacity,
    })
  })

  result.sort((a, b) => {
    const key = (j) => j.morningTime || j.returnTime || j.time || ''
    return key(a).localeCompare(key(b))
  })
  return result
}

export function mapMonthDayJobs(jobs) {
  const preview = jobs.slice(0, MONTH_PREVIEW_LIMIT)
  const more = jobs.length > MONTH_PREVIEW_LIMIT ? jobs.length - MONTH_PREVIEW_LIMIT : 0
  return { jobs: preview, more }
}

export async function fetchJobCalendarData(companyId) {
  if (!companyId) throw new Error('company_id is required')

  const [jobsRes, driversRes, vehiclesRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .order('semester_start', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('drivers')
      .select('id, first_name, last_name, profile_picture_url')
      .eq('company_id', companyId),
    supabase
      .from('vehicles')
      .select('driver_id, seating_capacity')
      .eq('company_id', companyId),
  ])

  if (jobsRes.error) throw jobsRes.error
  if (driversRes.error) throw driversRes.error
  if (vehiclesRes.error) throw vehiclesRes.error

  const jobs = jobsRes.data || []
  const jobIds = jobs.map((j) => j.id)

  let schedules = []
  if (jobIds.length) {
    const { data, error } = await supabase
      .from('passenger_schedules')
      .select('job_id, passenger_id, weekday, direction, exception_date, exception_type')
      .in('job_id', jobIds)
    if (error) throw error
    schedules = data || []
  }

  const driversById = new Map((driversRes.data || []).map((d) => [d.id, d]))
  const seatCapacityByDriverId = buildSeatCapacityByDriverId(vehiclesRes.data || [])
  const jobColorById = new Map(jobs.map((j, i) => [j.id, jobColorForIndex(i)]))

  return { jobs, schedules, driversById, seatCapacityByDriverId, jobColorById }
}
