/**
 * Date/time helpers for DB ↔ UI.
 * - Store: local (or any Date) → UTC ISO string
 * - Display: UTC from DB → browser local timezone
 */

/** Convert a Date (or now) to UTC ISO for writing to the DB. */
export const toUtcIso = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

/** UTC timestamp from DB → local date string (YYYY-MM-DD). */
export const formatLocalDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** UTC timestamp from DB → local datetime (YYYY-MM-DD HH:mm:ss). */
export const formatLocalDateTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (type) => parts.find((p) => p.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

/**
 * Local calendar day (YYYY-MM-DD from a date input) → UTC ISO range for DB queries.
 * Covers that full local day in UTC.
 */
export const localDayToUtcRange = (yyyyMmDd) => {
  const trimmed = (yyyyMmDd || '').trim()
  if (!trimmed) return { from: null, to: null }
  const start = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(start.getTime())) return { from: null, to: null }
  const end = new Date(`${trimmed}T23:59:59.999`)
  return { from: start.toISOString(), to: end.toISOString() }
}
