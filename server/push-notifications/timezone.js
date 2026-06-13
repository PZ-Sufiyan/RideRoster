export function isValidTimezone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') return false
  try {
    Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

export function resolveTimezone(stored) {
  if (isValidTimezone(stored)) return stored

  const fallback = process.env.JOB_TIMEZONE || 'UTC'
  return isValidTimezone(fallback) ? fallback : 'UTC'
}

export function isDateInSemester(job, localDate) {
  if (job.semester_start && localDate < job.semester_start) return false
  if (job.semester_end && localDate > job.semester_end) return false
  return true
}
