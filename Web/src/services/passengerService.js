import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'

function cleanString(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function toNullableString(v) {
  const s = cleanString(v)
  return s.length ? s : null
}

function toNullableNumeric(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// ── Read ──────────────────────────────────────────────────────────────────────

export const getPassengers = async ({ companyId = null } = {}) => {
  let query = supabase
    .from('passenger')
    .select('*')
    .order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const getPassengerById = async (passengerId) => {
  const { data, error } = await supabase
    .from('passenger')
    .select('*')
    .eq('id', passengerId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Returns the passenger row + all their passenger_locations rows.
 */
export const getPassengerWithLocations = async (passengerId) => {
  const [passengerRes, locationsRes] = await Promise.all([
    supabase.from('passenger').select('*').eq('id', passengerId).maybeSingle(),
    supabase.from('passenger_locations').select('*').eq('passenger_id', passengerId),
  ])

  if (passengerRes.error) throw passengerRes.error
  if (locationsRes.error) throw locationsRes.error

  return {
    passenger: passengerRes.data,
    locations: locationsRes.data || [],
  }
}

/**
 * Passenger plus assigned job, driver, PA.
 * Uses passenger_schedules (new model) to resolve job; falls back to
 * job_passenger_routes (legacy) if no schedule rows exist.
 */
export const getPassengerDetailBundle = async (passengerId) => {
  const { passenger, locations } = await getPassengerWithLocations(passengerId)

  if (!passenger) {
    return { passenger: null, locations: [], job: null, driver: null, passengerAssistant: null, route: null }
  }

  // Try new model first: passenger_schedules → job_id
  const { data: scheduleRows, error: schedErr } = await supabase
    .from('passenger_schedules')
    .select('job_id')
    .eq('passenger_id', passengerId)
    .limit(1)
    .maybeSingle()

  if (schedErr) throw schedErr

  // Fall back to legacy job_passenger_routes if no schedule rows
  let jobId = scheduleRows?.job_id ?? null

  if (!jobId) {
    const { data: routeRows, error: routeListErr } = await supabase
      .from('job_passenger_routes')
      .select('id, job_id, passenger_id, pickup_id, dropoff_id, wheelchair_required, created_at')
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (routeListErr) throw routeListErr
    jobId = routeRows?.[0]?.job_id ?? null
  }

  if (!jobId) {
    return { passenger, locations, job: null, driver: null, passengerAssistant: null, route: null }
  }

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle()

  if (jobErr) throw jobErr
  if (!job) return { passenger, locations, job: null, driver: null, passengerAssistant: null, route: null }

  const [driverRes, paRes] = await Promise.all([
    job.assigned_driver_id
      ? supabase.from('drivers').select('*').eq('id', job.assigned_driver_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    job.assigned_pa_id
      ? supabase.from('passenger_assistant').select('*').eq('id', job.assigned_pa_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (driverRes.error) throw driverRes.error
  if (paRes.error) throw paRes.error

  return {
    passenger,
    locations,
    job,
    driver: driverRes.data,
    passengerAssistant: paRes.data,
    route: null, // schedule-based model — no single route row
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export const updatePassenger = async (passengerId, updates) => {
  const { data, error } = await supabase
    .from('passenger')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', passengerId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Upsert a single passenger_locations row.
 * location_type must be 'secondary_pickup' | 'educational_site_1' | 'respite'
 */
export const upsertPassengerLocation = async (passengerId, locationType, payload) => {
  const row = {
    passenger_id: passengerId,
    location_type: locationType,
    address: cleanString(payload.address),
    postcode: cleanString(payload.postcode),
    latitude: toNullableNumeric(payload.lat),
    longitude: toNullableNumeric(payload.lng),
    label: toNullableString(payload.label),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('passenger_locations')
    .upsert(row, { onConflict: 'passenger_id,location_type' })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Register (create new passenger) ──────────────────────────────────────────

export const registerPassengerWithAuthAndRecord = async ({ companyId, form }) => {
  if (!companyId) throw new Error('Company is required.')

  // Required field guards
  if (!cleanString(form?.firstName)) throw new Error('First name is required.')
  if (!cleanString(form?.surname)) throw new Error('Surname is required.')
  if (!cleanString(form?.contact1)) throw new Error('Contact number 1 is required.')
  if (!cleanString(form?.primaryLocation?.address)) throw new Error('Primary address is required.')
  if (!cleanString(form?.primaryLocation?.postcode)) throw new Error('Primary postcode is required.')
  if (!cleanString(form?.pickupTime)) throw new Error('Pickup time is required.')
  if (!cleanString(form?.educationalLocation?.address)) throw new Error('Educational site address is required.')
  if (!cleanString(form?.educationalLocation?.postcode)) throw new Error('Educational site postcode is required.')
  if (!cleanString(form?.returnTime)) throw new Error('Drop-off time is required.')

  // Weekly schedule — at least one day required
  const schedule = form?.weeklySchedule ?? {}
  const hasActiveDay = Object.values(schedule).some(Boolean)
  if (!hasActiveDay) throw new Error('At least one active day must be selected.')

  // Build passenger row — primary pickup + educational site stored directly
  // (matches renamed columns from migration)
  const passengerPayload = {
    company_id: companyId,
    first_name: cleanString(form.firstName),
    surname: cleanString(form.surname),
    email: toNullableString(cleanString(form?.email ?? '').toLowerCase()),
    contact_number_1: cleanString(form.contact1),
    contact_number_2: toNullableString(form?.contact2),

    // Primary pickup (renamed columns)
    primary_pickup_address: cleanString(form.primaryLocation.address),
    primary_pickup_postcode: cleanString(form.primaryLocation.postcode),
    primary_pickup_time: cleanString(form.pickupTime),
    primary_pickup_latitude: toNullableNumeric(form.primaryLocation.lat),
    primary_pickup_longitude: toNullableNumeric(form.primaryLocation.lng),

    // Educational site (renamed columns)
    educational_site_address: cleanString(form.educationalLocation.address),
    educational_site_postcode: cleanString(form.educationalLocation.postcode),
    educational_site_dropoff_time: cleanString(form.returnTime),
    educational_site_latitude: toNullableNumeric(form.educationalLocation.lat),
    educational_site_longitude: toNullableNumeric(form.educationalLocation.lng),

    // Accessibility
    wheelchair_required: cleanString(form?.wheelchair).toLowerCase() === 'yes',
    harness_required: cleanString(form?.harness).toLowerCase() === 'yes',

    // Notes
    notes: toNullableString(form?.notes),

    // Weekly schedule
    weekly_schedule: {
      mon: Boolean(schedule.mon),
      tue: Boolean(schedule.tue),
      wed: Boolean(schedule.wed),
      thu: Boolean(schedule.thu),
      fri: Boolean(schedule.fri),
      sat: Boolean(schedule.sat),
      sun: Boolean(schedule.sun),
    },

    status: 'active',
  }

  const { data: passenger, error: passengerErr } = await supabaseAdmin
    .from('passenger')
    .insert(passengerPayload)
    .select()
    .single()

  if (passengerErr) throw passengerErr

  // Insert optional locations into passenger_locations
  const optionalLocations = [
    { type: 'secondary_pickup', loc: form?.secondaryLocation },
    { type: 'respite', loc: form?.respiteLocation },
  ]

  const locationInserts = optionalLocations
    .filter(({ loc }) => cleanString(loc?.address) && cleanString(loc?.postcode))
    .map(({ type, loc }) => ({
      passenger_id: passenger.id,
      location_type: type,
      address: cleanString(loc.address),
      postcode: cleanString(loc.postcode),
      latitude: toNullableNumeric(loc.lat),
      longitude: toNullableNumeric(loc.lng),
      label: null,
    }))

  if (locationInserts.length > 0) {
    const { error: locErr } = await supabaseAdmin
      .from('passenger_locations')
      .insert(locationInserts)

    if (locErr) throw locErr
  }

  return passenger
}

// ── Schedule sync after passenger edit ───────────────────────────────────────

/**
 * After editing a passenger's profile (address, weekly schedule, times),
 * regenerate all base passenger_schedule rows for every job they're on.
 *
 * Steps:
 * 1. Find all job_ids this passenger has base schedule rows for
 * 2. For each job, load the job row (need evening_start_time, has_outbound, has_inbound)
 * 3. Delete all base rows (exception_date IS NULL) for this passenger on that job
 * 4. Re-insert fresh base rows from the updated passenger profile
 *
 * Exception rows (exception_date IS NOT NULL) are never touched.
 */
export const syncPassengerSchedules = async (passenger) => {
  if (!passenger?.id) return

  // Find all distinct jobs this passenger has base schedule rows on
  const { data: jobLinks, error: jobLinksErr } = await supabase
    .from('passenger_schedules')
    .select('job_id')
    .eq('passenger_id', passenger.id)
    .is('exception_date', null)

  if (jobLinksErr) throw jobLinksErr

  const jobIds = [...new Set((jobLinks || []).map((r) => r.job_id).filter(Boolean))]
  if (jobIds.length === 0) return // passenger has no scheduled jobs yet, nothing to sync

  // Load all relevant job rows
  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select('id, has_outbound, has_inbound, evening_start_time')
    .in('id', jobIds)

  if (jobsErr) throw jobsErr

  for (const job of jobs || []) {
    // Delete all base rows for this passenger on this job
    const { error: delErr } = await supabase
      .from('passenger_schedules')
      .delete()
      .eq('job_id', job.id)
      .eq('passenger_id', passenger.id)
      .is('exception_date', null)

    if (delErr) throw delErr

    // Rebuild base rows using the updated passenger profile
    const weeklySchedule = passenger.weekly_schedule || {}
    const weekdayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    const activeDays = weekdayKeys.filter((d) => Boolean(weeklySchedule[d]))

    if (activeDays.length === 0) continue // passenger has no active days, skip insert

    const pickupAddr = passenger.primary_pickup_address ?? ''
    const pickupPostcode = passenger.primary_pickup_postcode ?? ''
    const pickupLat = passenger.primary_pickup_latitude ?? null
    const pickupLng = passenger.primary_pickup_longitude ?? null
    const pickupTime = String(passenger.primary_pickup_time ?? '').slice(0, 5)

    const eduAddr = passenger.educational_site_address ?? ''
    const eduPostcode = passenger.educational_site_postcode ?? ''
    const eduLat = passenger.educational_site_latitude ?? null
    const eduLng = passenger.educational_site_longitude ?? null
    const dropoffTime = String(passenger.educational_site_dropoff_time ?? '').slice(0, 5)

    const eveningStartTime = job.evening_start_time
      ? String(job.evening_start_time).slice(0, 5)
      : ''

    const newRows = []

    for (const day of activeDays) {
      if (job.has_outbound && pickupAddr && eduAddr) {
        newRows.push({
          job_id: job.id,
          passenger_id: passenger.id,
          weekday: day,
          direction: 'outbound',
          pickup_address: pickupAddr,
          pickup_postcode: pickupPostcode || null,
          pickup_latitude: toNullableNumeric(pickupLat),
          pickup_longitude: toNullableNumeric(pickupLng),
          pickup_time: pickupTime ? `${pickupTime}:00` : '08:00:00',
          dropoff_address: eduAddr,
          dropoff_postcode: eduPostcode || null,
          dropoff_latitude: toNullableNumeric(eduLat),
          dropoff_longitude: toNullableNumeric(eduLng),
          dropoff_time: dropoffTime ? `${dropoffTime}:00` : null,
          exception_date: null,
          exception_type: null,
          notes: null,
        })
      }

      if (job.has_inbound && eduAddr && pickupAddr) {
        newRows.push({
          job_id: job.id,
          passenger_id: passenger.id,
          weekday: day,
          direction: 'inbound',
          pickup_address: eduAddr,
          pickup_postcode: eduPostcode || null,
          pickup_latitude: toNullableNumeric(eduLat),
          pickup_longitude: toNullableNumeric(eduLng),
          pickup_time: eveningStartTime ? `${eveningStartTime}:00` : '15:00:00',
          dropoff_address: pickupAddr,
          dropoff_postcode: pickupPostcode || null,
          dropoff_latitude: toNullableNumeric(pickupLat),
          dropoff_longitude: toNullableNumeric(pickupLng),
          dropoff_time: null,
          exception_date: null,
          exception_type: null,
          notes: null,
        })
      }
    }

    if (newRows.length > 0) {
      const { error: insErr } = await supabase
        .from('passenger_schedules')
        .insert(newRows)

      if (insErr) throw insErr
    }
  }
}

/**
 * Fetch today's schedule for a given job.
 * Applies base rows, removes skips, applies alternative_location overrides,
 * adds extra_day rows — all for a specific date.
 *
 * @param {string} jobId
 * @param {Date|string} date  - JS Date or ISO date string
 * @param {'outbound'|'inbound'} direction
 */
export const getDailyScheduleForJob = async (jobId, date, direction) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const weekday = weekdayKeys[d.getDay()]
  const isoDate = d.toISOString().slice(0, 10)

  // Fetch base rows + exception rows for this job/direction in one query
  const { data: rows, error } = await supabase
    .from('passenger_schedules')
    .select('*')
    .eq('job_id', jobId)
    .eq('direction', direction)
    .or(`and(weekday.eq.${weekday},exception_date.is.null),exception_date.eq.${isoDate}`)

  if (error) throw error

  const base = (rows || []).filter((r) => r.exception_date === null && r.weekday === weekday)
  const exceptions = (rows || []).filter((r) => r.exception_date === isoDate)

  const skipIds = new Set(
    exceptions.filter((r) => r.exception_type === 'skip').map((r) => r.passenger_id)
  )

  const altOverrides = new Map(
    exceptions
      .filter((r) => r.exception_type === 'alternative_location')
      .map((r) => [r.passenger_id, r])
  )

  const extraDayRows = exceptions.filter((r) => r.exception_type === 'extra_day')

  // Build final list
  const schedule = base
    .filter((r) => !skipIds.has(r.passenger_id))
    .map((r) => altOverrides.has(r.passenger_id) ? altOverrides.get(r.passenger_id) : r)

  // Add extra day passengers
  for (const extra of extraDayRows) {
    if (!schedule.some((r) => r.passenger_id === extra.passenger_id)) {
      schedule.push(extra)
    }
  }

  return schedule
}