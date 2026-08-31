import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { getCompanyAdminById } from './companyService'
import { notifyPaJobAssignment } from './userNotificationService'
import {
  privateDriverBlockedByExpiredVehicleDocs,
  privateVehicleDocsBlockedMessage,
} from './vehicleDocumentComplianceService'
import { resolveJobReassignmentOnDriverAssign } from './jobReassignmentService'

export const JOB_DRAFT_STORAGE_KEY = 'rideRoster_adminJobDraft_v1'

/** Normalise address strings so passengers sharing a location group together */
export const normalizeAddressKey = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

// ── Draft helpers ─────────────────────────────────────────────────────────────

const emptyDraft = () => ({
  step1: {
    city: '',
    job_name: '',
    job_type: 'School Contract',
    client_school_name: '',
    internal_job_id: '',
  },
  step2: {
    selectedPassengers: [],
    pickupEdits: {},
    dropoffEdits: {},
  },
  step3: {
    semester_start: '',
    semester_end: '',
    has_outbound: true,
    has_inbound: true,
    morning_start_time: '',
    morning_end_time: '',
    evening_start_time: '',
    driver_pay: '',
    passenger_assistant_pay: '',
  },
})

export function loadJobDraft() {
  try {
    const raw = sessionStorage.getItem(JOB_DRAFT_STORAGE_KEY)
    if (!raw) return emptyDraft()
    const parsed = JSON.parse(raw)
    return {
      ...emptyDraft(),
      ...parsed,
      step1: { ...emptyDraft().step1, ...parsed.step1 },
      step2: {
        ...emptyDraft().step2,
        ...parsed.step2,
        selectedPassengers: parsed.step2?.selectedPassengers || [],
        pickupEdits: parsed.step2?.pickupEdits || {},
        dropoffEdits: parsed.step2?.dropoffEdits || {},
      },
      step3: { ...emptyDraft().step3, ...parsed.step3 },
    }
  } catch {
    return emptyDraft()
  }
}

export function saveJobDraft(partial) {
  const prev = loadJobDraft()
  const next = {
    ...prev,
    ...partial,
    step1: { ...prev.step1, ...partial.step1 },
    step2: {
      ...prev.step2,
      ...partial.step2,
      selectedPassengers: partial.step2?.selectedPassengers ?? prev.step2.selectedPassengers,
      pickupEdits: partial.step2?.pickupEdits ?? prev.step2.pickupEdits,
      dropoffEdits: partial.step2?.dropoffEdits ?? prev.step2.dropoffEdits,
    },
    step3: { ...prev.step3, ...partial.step3 },
  }
  sessionStorage.setItem(JOB_DRAFT_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function clearJobDraft() {
  sessionStorage.removeItem(JOB_DRAFT_STORAGE_KEY)
}

// ── Passenger helpers ─────────────────────────────────────────────────────────

export async function getPassengersForJobCreation(companyId) {
  if (!companyId) throw new Error('company_id is required')

  const { data, error } = await supabase
    .from('passenger')
    .select('*')
    .eq('company_id', companyId)
    .order('surname', { ascending: true })

  if (error) throw error
  return data || []
}

export function passengerDisplayName(p) {
  if (!p) return ''
  return [p.first_name, p.surname].filter(Boolean).join(' ').trim() || 'Passenger'
}

// ── Stop derivation ───────────────────────────────────────────────────────────

/**
 * Compound grouping key for a PICKUP stop.
 * Passengers share a pickup stop card only when ALL THREE match:
 *   address + postcode + pickup_time
 */
function pickupStopKey(p) {
  const addr = normalizeAddressKey(p.primary_pickup_address ?? p.pickup_address ?? '')
  const post = (p.primary_pickup_postcode ?? p.pickup_postal_code ?? '').trim().toLowerCase()
  const rawTime = p.primary_pickup_time ?? p.pickup_time ?? ''
  const time = formatTimeForInput(rawTime) || '__none__'
  return `${addr}|${post}|${time}`
}

/**
 * Compound grouping key for a DROPOFF stop.
 * Passengers share a dropoff stop card only when ALL THREE match:
 *   address + postcode + dropoff_time
 *
 * BUG FIX: Previously deriveDropoffStops only keyed by address alone, meaning
 * passengers at the same school but with different postcodes or drop-off times
 * were incorrectly merged into one card. Now mirrors the pickup key logic.
 */
function dropoffStopKey(p) {
  const addr = normalizeAddressKey(p.educational_site_address ?? p.dropoff_address ?? '')
  const post = (p.educational_site_postcode ?? p.dropoff_postal_code ?? '').trim().toLowerCase()
  const rawTime = p.educational_site_dropoff_time ?? p.dropoff_time ?? ''
  const time = formatTimeForInput(rawTime) || '__none__'
  return `${addr}|${post}|${time}`
}

/**
 * Derive unique OUTBOUND pickup stops.
 * Two passengers share a stop card only when address + postcode + pickup_time all match.
 */
export function derivePickupStops(selectedPassengers, pickupEdits = {}) {
  const seen  = new Set()
  const stops = []

  for (const p of selectedPassengers) {
    const addr = p.primary_pickup_address ?? p.pickup_address ?? ''
    const key  = normalizeAddressKey(addr)
    if (!key) continue

    const stopKey = pickupStopKey(p)
    if (seen.has(stopKey)) continue
    seen.add(stopKey)

    const rawTime       = p.primary_pickup_time ?? p.pickup_time ?? ''
    const formattedTime = formatTimeForInput(rawTime)

    const edits     = pickupEdits[stopKey] || {}
    const scheduled =
      edits.scheduled_time != null && edits.scheduled_time !== ''
        ? edits.scheduled_time
        : formattedTime

    stops.push({
      addressKey:       stopKey,
      address:          edits.address  ?? addr,
      postcode:         edits.postcode ?? (p.primary_pickup_postcode ?? p.pickup_postal_code ?? ''),
      latitude:         edits.latitude  ?? (p.primary_pickup_latitude  ?? p.pickup_latitude  ?? null),
      longitude:        edits.longitude ?? (p.primary_pickup_longitude ?? p.pickup_longitude ?? null),
      scheduled_time:   scheduled,
      status:           'pending',
      notes_for_driver: edits.notes_for_driver ?? '',
      // passenger_ids already filtered by compound key — only exact matches grouped here
      passenger_ids: selectedPassengers
        .filter((x) => pickupStopKey(x) === stopKey)
        .map((x) => x.id),
    })
  }

  stops.forEach((s, i) => { s.pickup_order = i + 1 })
  return stops
}

/**
 * Derive unique OUTBOUND dropoff stops.
 * Two passengers share a stop card only when address + postcode + dropoff_time all match.
 * Previously only address was used as the key — this caused incorrect grouping.
 */
export function deriveDropoffStops(selectedPassengers, dropoffEdits = {}) {
  const seen  = new Set()
  const stops = []

  for (const p of selectedPassengers) {
    const addr = p.educational_site_address ?? p.dropoff_address ?? ''
    const key  = normalizeAddressKey(addr)
    if (!key) continue

    const stopKey = dropoffStopKey(p)       // ← was: normalizeAddressKey(addr) only
    if (seen.has(stopKey)) continue
    seen.add(stopKey)

    const rawTime = p.educational_site_dropoff_time ?? p.dropoff_time ?? ''
    const edits   = dropoffEdits[stopKey] || {}  // ← was: dropoffEdits[key]

    stops.push({
      addressKey:       stopKey,
      address:          edits.address  ?? addr,
      postcode:         edits.postcode ?? (p.educational_site_postcode ?? p.dropoff_postal_code ?? ''),
      latitude:         edits.latitude  ?? (p.educational_site_latitude  ?? p.dropoff_latitude  ?? null),
      longitude:        edits.longitude ?? (p.educational_site_longitude ?? p.dropoff_longitude ?? null),
      scheduled_time:   edits.scheduled_time ?? formatTimeForInput(rawTime),
      status:           'pending',
      notes_for_driver: edits.notes_for_driver ?? '',
      // passenger_ids filtered by compound key — was: normalizeAddressKey(addr) only
      passenger_ids: selectedPassengers
        .filter((x) => dropoffStopKey(x) === stopKey)
        .map((x) => x.id),
    })
  }

  stops.forEach((s, i) => { s.dropoff_order = i + 1 })
  return stops
}

function formatTimeForInput(t) {
  if (t == null || t === '') return ''
  const s = String(t)
  return s.length >= 5 ? s.slice(0, 5) : s
}

// ── passenger_schedules generation ───────────────────────────────────────────

function buildPassengerScheduleRows(jobId, selectedPassengers, hasOutbound, hasInbound, eveningStartTime) {
  const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const rows = []

  for (let passengerIndex = 0; passengerIndex < selectedPassengers.length; passengerIndex++) {
    const p         = selectedPassengers[passengerIndex]
    const stopOrder = passengerIndex + 1

    const schedule   = p.weekly_schedule || {}
    const activeDays = WEEKDAY_KEYS.filter((d) => Boolean(schedule[d]))

    const pickupAddr     = p.primary_pickup_address   ?? p.pickup_address    ?? ''
    const pickupPostcode = p.primary_pickup_postcode  ?? p.pickup_postal_code ?? ''
    const pickupLat      = p.primary_pickup_latitude  ?? p.pickup_latitude   ?? null
    const pickupLng      = p.primary_pickup_longitude ?? p.pickup_longitude  ?? null
    const pickupTime     = formatTimeForInput(p.primary_pickup_time ?? p.pickup_time ?? '')

    const eduAddr     = p.educational_site_address   ?? p.dropoff_address    ?? ''
    const eduPostcode = p.educational_site_postcode  ?? p.dropoff_postal_code ?? ''
    const eduLat      = p.educational_site_latitude  ?? p.dropoff_latitude   ?? null
    const eduLng      = p.educational_site_longitude ?? p.dropoff_longitude  ?? null
    const dropoffTime = formatTimeForInput(p.educational_site_dropoff_time ?? p.dropoff_time ?? '')

    for (const day of activeDays) {
      if (hasOutbound && pickupAddr && eduAddr) {
        rows.push({
          job_id:            jobId,
          passenger_id:      p.id,
          weekday:           day,
          direction:         'outbound',
          stop_order:        stopOrder,
          pickup_address:    pickupAddr,
          pickup_postcode:   pickupPostcode || null,
          pickup_latitude:   parseCoord(pickupLat),
          pickup_longitude:  parseCoord(pickupLng),
          pickup_time:       toPgTime(pickupTime) || '08:00:00',
          dropoff_address:   eduAddr,
          dropoff_postcode:  eduPostcode || null,
          dropoff_latitude:  parseCoord(eduLat),
          dropoff_longitude: parseCoord(eduLng),
          dropoff_time:      toPgTime(dropoffTime) || null,
          exception_date:    null,
          exception_type:    null,
          notes:             null,
        })
      }

      if (hasInbound && eduAddr && pickupAddr) {
        rows.push({
          job_id:            jobId,
          passenger_id:      p.id,
          weekday:           day,
          direction:         'inbound',
          stop_order:        stopOrder,
          pickup_address:    eduAddr,
          pickup_postcode:   eduPostcode || null,
          pickup_latitude:   parseCoord(eduLat),
          pickup_longitude:  parseCoord(eduLng),
          pickup_time:       toPgTime(eveningStartTime) || '15:00:00',
          dropoff_address:   pickupAddr,
          dropoff_postcode:  pickupPostcode || null,
          dropoff_latitude:  parseCoord(pickupLat),
          dropoff_longitude: parseCoord(pickupLng),
          dropoff_time:      null,
          exception_date:    null,
          exception_type:    null,
          notes:             null,
        })
      }
    }
  }

  return rows
}

// ── Job creation ──────────────────────────────────────────────────────────────

export async function createJobFromDraft(companyId, draft) {
  if (!companyId) throw new Error('company_id is required')

  const { step1, step2, step3 } = draft
  const selected = step2?.selectedPassengers || []

  if (!step1?.job_name?.trim())           throw new Error('Job name is required.')
  if (!step1?.client_school_name?.trim()) throw new Error('Client / school name is required.')
  if (!step3?.semester_start)             throw new Error('Semester start date is required.')
  if (!step3?.semester_end)               throw new Error('Semester end date is required.')
  if (step3.semester_end < step3.semester_start)
    throw new Error('Semester end date must be after start date.')
  if (selected.length === 0)
    throw new Error('Add at least one passenger.')
  if (!step3.has_outbound && !step3.has_inbound)
    throw new Error('At least one of morning or evening jobs must be enabled.')

  const jobPayload = {
    company_id:              companyId,
    job_name:                step1.job_name.trim(),
    city:                    step1.city.trim(),
    job_type:                step1.job_type.trim(),
    client_school_name:      step1.client_school_name.trim(),
    internal_job_id:         step1.internal_job_id?.trim() || null,
    semester_start:          step3.semester_start,
    semester_end:            step3.semester_end,
    has_outbound:            Boolean(step3.has_outbound),
    has_inbound:             Boolean(step3.has_inbound),
    morning_start_time:      toPgTime(step3.morning_start_time) || null,
    morning_end_time:        toPgTime(step3.morning_end_time)   || null,
    evening_start_time:      toPgTime(step3.evening_start_time) || null,
    driver_pay:              parseOptionalMoney(step3.driver_pay),
    passenger_assistant_pay: parseOptionalMoney(step3.passenger_assistant_pay),
    status:                  'draft',
    assigned_driver_id:      null,
    assigned_pa_id:          null,
  }

  const { data: jobRow, error: jobErr } = await supabase
    .from('jobs')
    .insert(jobPayload)
    .select('id')
    .single()

  if (jobErr) throw jobErr
  const jobId = jobRow.id

  const scheduleRows = buildPassengerScheduleRows(
    jobId,
    selected,
    Boolean(step3.has_outbound),
    Boolean(step3.has_inbound),
    step3.evening_start_time || ''
  )

  if (scheduleRows.length > 0) {
    const { error: schedErr } = await supabase
      .from('passenger_schedules')
      .insert(scheduleRows)
    if (schedErr) throw schedErr
  }

  return { jobId, job: jobRow }
}

// ── Legacy route helpers ──────────────────────────────────────────────────────

export function buildPassengerRouteRows(selectedPassengers, pickupStops, dropoffStops) {
  const pickupByPassenger  = new Map()
  const dropoffByPassenger = new Map()
  for (const p of selectedPassengers) {
    pickupByPassenger.set(p.id,  pickupStopKey(p))
    dropoffByPassenger.set(p.id, dropoffStopKey(p))
  }

  const pickupIdByKey  = new Map(pickupStops.map((s)  => [s.addressKey, s]))
  const dropoffIdByKey = new Map(dropoffStops.map((s) => [s.addressKey, s]))

  return selectedPassengers.map((p) => ({
    passenger_id:        p.id,
    wheelchair_required: Boolean(p.wheelchair_required),
    pickup_address_key:  pickupByPassenger.get(p.id),
    dropoff_address_key: dropoffByPassenger.get(p.id),
    pickupStop:  pickupIdByKey.get(pickupByPassenger.get(p.id)),
    dropoffStop: dropoffIdByKey.get(dropoffByPassenger.get(p.id)),
  }))
}

export function buildPickupEditsFromJobBundle(bundle, passengersById) {
  const edits       = {}
  const pickupsById = new Map((bundle.pickups || []).map((p) => [p.id, p]))
  for (const r of bundle.routes || []) {
    const pax = passengersById.get(r.passenger_id)
    if (!pax) continue
    const key = pickupStopKey(pax)   // compound key — consistent with derivePickupStops
    if (!key) continue
    const pu = pickupsById.get(r.pickup_id)
    if (!pu) continue
    edits[key] = {
      address:          pu.address  ?? '',
      postcode:         pu.postcode ?? '',
      scheduled_time:   timeInputFromDb(pu.scheduled_time),
      status:           normalizeStopStatus(pu.status),
      latitude:         pu.latitude  != null ? String(pu.latitude)  : '',
      longitude:        pu.longitude != null ? String(pu.longitude) : '',
      notes_for_driver: pu.notes_for_driver || '',
    }
  }
  return edits
}

export function buildDropoffEditsFromJobBundle(bundle, passengersById) {
  const edits        = {}
  const dropoffsById = new Map((bundle.dropoffs || []).map((d) => [d.id, d]))
  for (const r of bundle.routes || []) {
    const pax = passengersById.get(r.passenger_id)
    if (!pax) continue
    const key = dropoffStopKey(pax)  // compound key — consistent with deriveDropoffStops
    if (!key) continue
    const d = dropoffsById.get(r.dropoff_id)
    if (!d) continue
    edits[key] = {
      address:          d.address  ?? '',
      postcode:         d.postcode ?? '',
      scheduled_time:   timeInputFromDb(d.scheduled_time),
      status:           normalizeStopStatus(d.status),
      latitude:         d.latitude  != null ? String(d.latitude)  : '',
      longitude:        d.longitude != null ? String(d.longitude) : '',
      notes_for_driver: d.notes_for_driver || '',
    }
  }
  return edits
}

export async function replaceJobStopsAndRoutes(jobId, selectedPassengers, pickupEdits, dropoffEdits) {
  if (!jobId) throw new Error('Job id is required.')

  const { data: job } = await supabase.from('jobs').select('semester_start').eq('id', jobId).maybeSingle()
  if (job?.semester_start) {
    throw new Error('This job uses passenger schedules. Edit stops via the passenger profile instead.')
  }

  const pickupStops  = derivePickupStops(selectedPassengers, pickupEdits)
  const dropoffStops = deriveDropoffStops(selectedPassengers, dropoffEdits)
  if (pickupStops.length === 0 || dropoffStops.length === 0) {
    throw new Error('Pickup and drop-off stops could not be derived from selected passengers.')
  }

  const { error: delR } = await supabase.from('job_passenger_routes').delete().eq('job_id', jobId)
  if (delR) throw delR
  const { error: delP } = await supabase.from('job_pickups').delete().eq('job_id', jobId)
  if (delP) throw delP
  const { error: delD } = await supabase.from('job_dropoffs').delete().eq('job_id', jobId)
  if (delD) throw delD

  await insertJobStopsAndRoutes(jobId, pickupStops, dropoffStops, selectedPassengers)
}

async function insertJobStopsAndRoutes(jobId, pickupStops, dropoffStops, selectedPassengers) {
  const pickupRows = pickupStops.map((s) => ({
    job_id:           jobId,
    pickup_order:     s.pickup_order,
    address:          s.address,
    postcode:         s.postcode,
    latitude:         parseCoord(s.latitude),
    longitude:        parseCoord(s.longitude),
    scheduled_time:   toPgTime(s.scheduled_time),
    status:           normalizeStopStatus(s.status),
    notes_for_driver: s.notes_for_driver?.trim() || null,
  }))

  const { data: insertedPickups, error: puErr } = await supabase
    .from('job_pickups').insert(pickupRows).select('id, pickup_order')
  if (puErr) throw puErr

  const pickupUuidByKey = new Map()
  const sortedPu = [...(insertedPickups || [])].sort((a, b) => a.pickup_order - b.pickup_order)
  pickupStops.forEach((s, i) => {
    const row = sortedPu[i]
    if (row) pickupUuidByKey.set(s.addressKey, row.id)
  })

  const dropoffRows = dropoffStops.map((s) => ({
    job_id:           jobId,
    dropoff_order:    s.dropoff_order,
    address:          s.address,
    postcode:         s.postcode,
    latitude:         parseCoord(s.latitude),
    longitude:        parseCoord(s.longitude),
    scheduled_time:   toPgTime(s.scheduled_time),
    status:           normalizeStopStatus(s.status),
    notes_for_driver: s.notes_for_driver?.trim() || null,
  }))

  const { data: insertedDropoffs, error: doErr } = await supabase
    .from('job_dropoffs').insert(dropoffRows).select('id, dropoff_order')
  if (doErr) throw doErr

  const dropoffUuidByKey = new Map()
  const sortedDo = [...(insertedDropoffs || [])].sort((a, b) => a.dropoff_order - b.dropoff_order)
  dropoffStops.forEach((s, i) => {
    const row = sortedDo[i]
    if (row) dropoffUuidByKey.set(s.addressKey, row.id)
  })

  const routeMeta = buildPassengerRouteRows(selectedPassengers, pickupStops, dropoffStops)
  const routeRows = routeMeta.map((r) => {
    const pickupId  = pickupUuidByKey.get(r.pickup_address_key)
    const dropoffId = dropoffUuidByKey.get(r.dropoff_address_key)
    if (!pickupId || !dropoffId)
      throw new Error('Could not resolve pickup/drop-off for a passenger route.')
    return {
      job_id:              jobId,
      passenger_id:        r.passenger_id,
      pickup_id:           pickupId,
      dropoff_id:          dropoffId,
      wheelchair_required: r.wheelchair_required,
    }
  })

  const { error: routeErr } = await supabase.from('job_passenger_routes').insert(routeRows)
  if (routeErr) throw routeErr
}

// ── Shared utils ──────────────────────────────────────────────────────────────

function parseCoord(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function parseOptionalMoney(value) {
  if (value == null || String(value).trim() === '') return null
  const n = Number(String(value).replace(/[^0-9.]/g, ''))
  if (Number.isNaN(n) || n < 0) return null
  return n
}

export function toPgTime(hhmm) {
  if (!hhmm) return null
  const s = String(hhmm).trim()
  if (s.length === 5) return `${s}:00`
  return s
}

export function timeInputFromDb(t) {
  if (t == null || t === '') return ''
  return String(t).slice(0, 5)
}

function normalizeStopStatus(status) {
  const value = String(status || '').trim().toLowerCase()
  return value === 'completed' ? 'completed' : 'pending'
}

function parseGpsString(gps) {
  if (!gps || typeof gps !== 'string') return { latitude: null, longitude: null }
  const parts = gps.split(',').map((x) => x.trim())
  if (parts.length < 2) return { latitude: null, longitude: null }
  return { latitude: parseCoord(parts[0]), longitude: parseCoord(parts[1]) }
}

function passengerNamesForStop(stopId, routes, key, passengersById) {
  const names = (routes || [])
    .filter((r) => r[key] === stopId)
    .map((r) => {
      const p = passengersById.get(r.passenger_id)
      return p ? [p.first_name, p.surname].filter(Boolean).join(' ').trim() : ''
    })
    .filter(Boolean)
  return [...new Set(names)].join(', ') || '—'
}

// ── Job detail / edit ─────────────────────────────────────────────────────────

export async function fetchJobSchedulePassengers(jobId) {
  if (!jobId) return []

  const { data: schedRows, error } = await supabase
    .from('passenger_schedules')
    .select('passenger_id, weekday, direction, stop_order')
    .eq('job_id', jobId)
    .is('exception_date', null)

  if (error) throw error
  if (!schedRows?.length) return []

  const passengerIds = [...new Set(schedRows.map((r) => r.passenger_id).filter(Boolean))]
  if (!passengerIds.length) return []

  const { data: passengers, error: paxErr } = await supabase
    .from('passenger')
    .select(`
      id,
      first_name,
      surname,
      wheelchair_required,
      harness_required,
      weekly_schedule,
      primary_pickup_address,
      primary_pickup_postcode,
      primary_pickup_latitude,
      primary_pickup_longitude,
      primary_pickup_time,
      educational_site_address,
      educational_site_postcode,
      educational_site_latitude,
      educational_site_longitude,
      educational_site_dropoff_time
    `)
    .in('id', passengerIds)

  if (paxErr) throw paxErr

  const stopOrderByPassenger = new Map()
  for (const r of schedRows) {
    if (r.direction !== 'outbound') continue
    const existing = stopOrderByPassenger.get(r.passenger_id)
    if (existing == null || r.stop_order < existing) {
      stopOrderByPassenger.set(r.passenger_id, r.stop_order)
    }
  }

  const enriched = (passengers || []).map((p) => {
    const days = [...new Set(
      schedRows
        .filter((r) => r.passenger_id === p.id && r.direction === 'outbound')
        .map((r) => r.weekday)
    )]
    return {
      ...p,
      activeWeekdays: days,
      _stopOrder: stopOrderByPassenger.get(p.id) ?? 9999,
    }
  })

  enriched.sort((a, b) => a._stopOrder - b._stopOrder)

  return enriched
}

export async function fetchJobDetailBundle(jobId, companyId) {
  if (!jobId || !companyId) throw new Error('Job and company are required.')

  const { data: job, error: jErr } = await supabase
    .from('jobs').select('*').eq('id', jobId).eq('company_id', companyId).maybeSingle()
  if (jErr) throw jErr
  if (!job) throw new Error('Job not found.')

  const isNewModel = Boolean(job.semester_start)

  const [driverRes, paRes, vehRes] = await Promise.all([
    job.assigned_driver_id
      ? supabase.from('drivers').select('*').eq('id', job.assigned_driver_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    job.assigned_pa_id
      ? supabase.from('passenger_assistant').select('*').eq('id', job.assigned_pa_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    job.assigned_driver_id
      ? supabase.from('vehicles').select('*').eq('company_id', companyId).eq('driver_id', job.assigned_driver_id).limit(1).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (driverRes.error) throw driverRes.error
  if (paRes.error)     throw paRes.error
  if (vehRes.error)    throw vehRes.error

  if (isNewModel) {
    return {
      job,
      pickups:        [],
      dropoffs:       [],
      routes:         [],
      pickupStops:    [],
      dropoffStops:   [],
      driver:         driverRes.data,
      pa:             paRes.data,
      vehicle:        vehRes.data,
      passengersById: new Map(),
    }
  }

  const [puRes, doRes, routesRes] = await Promise.all([
    supabase.from('job_pickups').select('*').eq('job_id', jobId).order('pickup_order',  { ascending: true }),
    supabase.from('job_dropoffs').select('*').eq('job_id', jobId).order('dropoff_order', { ascending: true }),
    supabase.from('job_passenger_routes').select('id, passenger_id, pickup_id, dropoff_id, wheelchair_required').eq('job_id', jobId),
  ])

  if (puRes.error)     throw puRes.error
  if (doRes.error)     throw doRes.error
  if (routesRes.error) throw routesRes.error

  const pickups  = puRes.data     || []
  const dropoffs = doRes.data     || []
  const routes   = routesRes.data || []

  const paxIds         = [...new Set(routes.map((r) => r.passenger_id).filter(Boolean))]
  const passengersById = new Map()
  if (paxIds.length > 0) {
    const { data: paxRows, error: paxErr } = await supabase
      .from('passenger').select('id, first_name, surname').in('id', paxIds)
    if (!paxErr && paxRows) { for (const p of paxRows) passengersById.set(p.id, p) }
  }

  const pickupStops = pickups.map((p) => ({
    id:        p.id,
    address:   p.address || '',
    gps:       p.latitude != null && p.longitude != null ? `${p.latitude},${p.longitude}` : '',
    postCode:  p.postcode || '',
    status:    normalizeStopStatus(p.status),
    passenger: passengerNamesForStop(p.id, routes, 'pickup_id', passengersById),
    notes:     p.notes_for_driver || '',
  }))

  const dropoffStops = dropoffs.map((d) => ({
    id:        d.id,
    address:   d.address || '',
    gps:       d.latitude != null && d.longitude != null ? `${d.latitude},${d.longitude}` : '',
    postCode:  d.postcode || '',
    status:    normalizeStopStatus(d.status),
    passenger: passengerNamesForStop(d.id, routes, 'dropoff_id', passengersById),
    notes:     d.notes_for_driver || '',
  }))

  return {
    job, pickups, dropoffs, routes,
    pickupStops, dropoffStops,
    driver: driverRes.data, pa: paRes.data, vehicle: vehRes.data,
    passengersById,
  }
}

export async function cancelJobById(jobId, companyId) {
  const { error } = await supabase
    .from('jobs').update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', jobId).eq('company_id', companyId)
  if (error) throw error
}

export async function updateJobById(jobId, companyId, updates) {
  const { data, error } = await supabase
    .from('jobs').update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId).eq('company_id', companyId).select().single()
  if (error) throw error
  return data
}

export async function updateJobPickupRow(pickupId, patch) {
  const { latitude, longitude } = patch.gps != null && patch.gps !== ''
    ? parseGpsString(patch.gps)
    : { latitude: patch.latitude ?? null, longitude: patch.longitude ?? null }
  const row = {
    address:          patch.address,
    postcode:         patch.postcode ?? patch.postCode,
    latitude,
    longitude,
    scheduled_time:   patch.scheduled_time != null ? toPgTime(patch.scheduled_time) : undefined,
    status:           patch.status         != null ? normalizeStopStatus(patch.status) : undefined,
    notes_for_driver: patch.notes_for_driver ?? patch.notes ?? null,
  }
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
  const { error } = await supabase.from('job_pickups').update(clean).eq('id', pickupId)
  if (error) throw error
}

export async function updateJobDropoffRow(dropoffId, patch) {
  const { latitude, longitude } = patch.gps != null && patch.gps !== ''
    ? parseGpsString(patch.gps)
    : { latitude: patch.latitude ?? null, longitude: patch.longitude ?? null }
  const row = {
    address:          patch.address,
    postcode:         patch.postcode ?? patch.postCode,
    latitude,
    longitude,
    scheduled_time:   patch.scheduled_time != null ? toPgTime(patch.scheduled_time) : undefined,
    status:           patch.status         != null ? normalizeStopStatus(patch.status) : undefined,
    notes_for_driver: patch.notes_for_driver ?? patch.notes ?? null,
  }
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
  const { error } = await supabase.from('job_dropoffs').update(clean).eq('id', dropoffId)
  if (error) throw error
}

export function resolveJobPickupIdForPassenger(bundle, passenger) {
  const addr = passenger?.primary_pickup_address ?? passenger?.pickup_address ?? ''
  const key  = normalizeAddressKey(addr)
  if (!key) return null
  for (const p of bundle.pickups || []) {
    if (normalizeAddressKey(p.address) === key) return p.id
  }
  return null
}

export function resolveJobDropoffIdForPassenger(bundle, passenger) {
  const addr = passenger?.educational_site_address ?? passenger?.dropoff_address ?? ''
  const key  = normalizeAddressKey(addr)
  if (!key) return null
  for (const d of bundle.dropoffs || []) {
    if (normalizeAddressKey(d.address) === key) return d.id
  }
  return null
}

export async function addPassengerRouteToJob(jobId, passenger, bundle) {
  if (!jobId || !passenger?.id) throw new Error('Job and passenger are required.')
  const pickupId  = resolveJobPickupIdForPassenger(bundle, passenger)
  const dropoffId = resolveJobDropoffIdForPassenger(bundle, passenger)
  if (!pickupId || !dropoffId) {
    throw new Error("This passenger's pickup and drop-off must match existing stops on this job.")
  }
  const { error } = await supabase.from('job_passenger_routes').insert({
    job_id:              jobId,
    passenger_id:        passenger.id,
    pickup_id:           pickupId,
    dropoff_id:          dropoffId,
    wheelchair_required: Boolean(passenger.wheelchair_required),
  })
  if (error) throw error
}

export async function removePassengerRouteFromJob(jobId, passengerId) {
  if (!jobId || !passengerId) throw new Error('Job and passenger are required.')
  const { error } = await supabase.from('job_passenger_routes')
    .delete().eq('job_id', jobId).eq('passenger_id', passengerId)
  if (error) throw error
}

// ── Driver assignment ─────────────────────────────────────────────────────────

export async function validateDriverAssignment(jobId, driverId, companyId) {
  if (!jobId || !driverId || !companyId) throw new Error('Job, driver, and company are required.')

  const { data: conflictingJobs, error: conflictErr } = await supabase
    .from('jobs')
    .select('id, job_name')
    .eq('assigned_driver_id', driverId)
    .neq('id', jobId)
    .neq('status', 'cancelled')

  if (conflictErr) throw conflictErr

  if (conflictingJobs && conflictingJobs.length > 0) {
    const conflictName = conflictingJobs[0].job_name || 'another job'
    throw new Error(
      `This driver is already assigned to "${conflictName}". Remove them from that job first.`
    )
  }

  const [vehicleRes, passengerRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, fleet, seating_capacity, wheelchair_accessible, taxi_license_plate_number, make, model, status')
      .eq('driver_id', driverId)
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle(),
    Promise.all([
      supabase
        .from('passenger_schedules')
        .select('passenger_id, passenger:passenger_id(wheelchair_required)')
        .eq('job_id', jobId)
        .is('exception_date', null),
      supabase
        .from('job_passenger_routes')
        .select('passenger_id, passenger:passenger_id(wheelchair_required)')
        .eq('job_id', jobId),
    ]),
  ])

  if (vehicleRes.error) throw vehicleRes.error

  const [schedRes, routesRes] = passengerRes
  const schedRows  = schedRes.data  || []
  const routeRows  = routesRes.data || []

  const passengerMap = new Map()
  const allRows = schedRows.length > 0 ? schedRows : routeRows
  for (const r of allRows) {
    if (!r.passenger_id) continue
    if (!passengerMap.has(r.passenger_id)) {
      passengerMap.set(r.passenger_id, r.passenger)
    }
  }

  const passengerCount  = passengerMap.size
  const needsWheelchair = [...passengerMap.values()].some((p) => p?.wheelchair_required === true)

  const { data: driverRow, error: driverErr } = await supabase
    .from('drivers')
    .select('id, status, vehicle_assigned')
    .eq('id', driverId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (driverErr) throw driverErr
  if (!driverRow) throw new Error('Driver not found.')
  if (String(driverRow.status || '').trim().toLowerCase() !== 'approved') {
    throw new Error('Only approved drivers can be assigned to a job.')
  }
  if (driverRow.vehicle_assigned !== true) {
    throw new Error('This driver has no vehicle assigned. Assign a vehicle first.')
  }

  const vehicle = vehicleRes.data
  if (!vehicle) {
    throw new Error(
      'This driver has no vehicle assigned. Please assign a vehicle before assigning the job.'
    )
  }

  const compliance = await privateDriverBlockedByExpiredVehicleDocs({
    companyId,
    driverId,
    vehicle,
  })
  if (compliance.blocked) {
    throw new Error(privateVehicleDocsBlockedMessage(compliance.expiredDocs))
  }

  const seatCapacity = vehicle.seating_capacity
  if (seatCapacity != null && passengerCount > seatCapacity) {
    throw new Error(
      `This job has ${passengerCount} passenger${passengerCount !== 1 ? 's' : ''} but the driver's vehicle only has ${seatCapacity} seat${seatCapacity !== 1 ? 's' : ''}. Please choose a driver with a larger vehicle.`
    )
  }

  if (needsWheelchair && !vehicle.wheelchair_accessible) {
    throw new Error(
      'One or more passengers on this job require a wheelchair-accessible vehicle. Please choose a driver whose vehicle is wheelchair accessible.'
    )
  }
}

async function sendJobAssignmentNotification(jobId) {
  try {
    const pushApiUrl = (import.meta.env.VITE_PUSH_API_URL || '').replace(/\/$/, '')
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token

    if (!accessToken) {
      console.warn('Push notification skipped: admin session not available.')
      return { ok: false, skipped: 'no_admin_session' }
    }

    if (!pushApiUrl) {
      console.warn('Push notification skipped: VITE_PUSH_API_URL is not set.')
      return { ok: false, skipped: 'push_api_url_missing' }
    }

    const res = await fetch(`${pushApiUrl}/notify/job-assignment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_id: jobId }),
    })

    const body = await res.json().catch(async () => {
      const text = await res.text()
      return { error: text || res.statusText }
    })

    if (!res.ok) {
      console.warn('Push notification failed:', body)
      return { ok: false, error: body?.error || res.statusText, details: body }
    }

    console.info('Push notification result:', body)
    return { ok: true, ...body }
  } catch (err) {
    console.warn('Push notification failed:', err?.message || err)
    return { ok: false, error: err?.message || String(err) }
  }
}

export async function updateJobAssignedDriver(jobId, driverId) {
  const { data, error } = await supabase
    .from('jobs').update({
      assigned_driver_id:     driverId,
      driver_approval_status: 'pending',
      driver_counter_offer_pay: null,
      updated_at:             new Date().toISOString(),
    })
    .eq('id', jobId).select().single()
  if (error) throw error

  try {
    await resolveJobReassignmentOnDriverAssign(jobId, driverId)
  } catch (resolveErr) {
    console.warn('Failed to resolve job reassignment alerts:', resolveErr?.message || resolveErr)
  }

  const pushResult = await sendJobAssignmentNotification(jobId)
  return { job: data, pushResult }
}

export async function removeJobAssignedDriver(jobId) {
  if (!jobId) throw new Error('Job id is required.')
  const { data, error } = await supabase
    .from('jobs').update({
      assigned_driver_id:     null,
      driver_approval_status: null,
      driver_counter_offer_pay: null,
      updated_at:             new Date().toISOString(),
    })
    .eq('id', jobId).select().single()
  if (error) throw error
  return data
}

export async function updateJobAssignedPa(jobId, paId) {
  const { data, error } = await supabase
    .from('jobs').update({ assigned_pa_id: paId, updated_at: new Date().toISOString() })
    .eq('id', jobId).select().single()
  if (error) throw error

  try {
    await notifyPaJobAssignment(data)
  } catch (notifyErr) {
    console.warn('PA job assignment notification failed:', notifyErr?.message || notifyErr)
  }

  return data
}

export async function removeJobAssignedPa(jobId) {
  if (!jobId) throw new Error('Job id is required.')
  const { data, error } = await supabase
    .from('jobs').update({
      assigned_pa_id: null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', jobId).select().single()
  if (error) throw error
  return data
}

// ── Jobs list ─────────────────────────────────────────────────────────────────

function defaultAvatar(seed) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`
}

export function formatJobDisplayId(uuid) {
  const s = String(uuid || '').replace(/-/g, '')
  return `#J-${s.slice(0, 8).toUpperCase()}`
}

export function formatTimeDisplay(t) {
  if (t == null || t === '') return '—'
  const raw  = String(t)
  const hhmm = raw.length >= 5 ? raw.slice(0, 5) : raw
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return raw
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDurationBetween(start, end) {
  const parse = (t) => {
    const s     = String(t || '00:00:00').slice(0, 8)
    const parts = s.split(':').map((x) => parseInt(x, 10) || 0)
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
  }
  let secs = parse(end) - parse(start)
  if (secs < 0) secs += 24 * 3600
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m > 0 ? `${m}m ` : ''}duration`.trim()
  return `${m}m duration`
}

export function formatJobDateTimeLabel(jobDate, pickupTime) {
  if (!jobDate) return '—'
  const time = String(pickupTime || '00:00:00').slice(0, 5)
  const d    = new Date(`${jobDate}T${time}:00`)
  if (Number.isNaN(d.getTime())) return String(jobDate)
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export function deriveJobUiStatus(job) {
  const s = (job.status || 'draft').toLowerCase()
  if (s === 'cancelled') return { label: 'Cancelled', statusColor: 'bg-red-50 text-red-600 border-red-100' }

  if (job.semester_start && job.semester_end) {
    const today = new Date().toISOString().slice(0, 10)
    if (today > job.semester_end)    return { label: 'Completed', statusColor: 'bg-gray-50 text-gray-600 border-gray-100' }
    if (today >= job.semester_start) return { label: 'Active',    statusColor: 'bg-green-50 text-green-600 border-green-100' }
    return { label: 'Upcoming', statusColor: 'bg-blue-50 text-blue-600 border-blue-100' }
  }

  if (!job.assigned_driver_id) return { label: 'Unassigned',  statusColor: 'bg-orange-50 text-orange-600 border-orange-100' }
  if (s === 'active')          return { label: 'In Progress',  statusColor: 'bg-green-50 text-green-600 border-green-100' }
  if (s === 'completed')       return { label: 'Completed',    statusColor: 'bg-gray-50 text-gray-600 border-gray-100' }
  return { label: 'Upcoming', statusColor: 'bg-blue-50 text-blue-600 border-blue-100' }
}

export function formatPassengersCapacityLabel(passengerCount, seatCapacityTotal) {
  const n   = Number(passengerCount) || 0
  const cap = seatCapacityTotal == null || seatCapacityTotal === '' ? null : Number(seatCapacityTotal)
  if (cap == null || !Number.isFinite(cap) || cap <= 0) return `${n} / —`
  return `${n} / ${Math.round(cap)}`
}

export function buildSeatCapacityByDriverId(vehicleRows) {
  const map = new Map()
  for (const v of vehicleRows || []) {
    if (!v?.driver_id) continue
    const add = v.seating_capacity == null ? 0 : Number(v.seating_capacity)
    if (!Number.isFinite(add) || add <= 0) continue
    map.set(v.driver_id, (map.get(v.driver_id) || 0) + add)
  }
  return map
}

export function mapJobToListRow(job, passengerCount, driver, pa, seatCapacityTotal) {
  const approval = String(job.driver_approval_status || '').trim()
  const ui       = deriveJobUiStatus(job)
  const counterOfferPay = job.driver_counter_offer_pay == null ? null : Number(job.driver_counter_offer_pay)
  const driverCounterOfferLabel = Number.isFinite(counterOfferPay) ? `$${counterOfferPay.toFixed(2)}` : null

  return {
    id:          job.id,
    displayId:   formatJobDisplayId(job.id),
    route:       job.job_name,
    startTime:   job.morning_start_time ? formatTimeDisplay(job.morning_start_time) : '—',
    endTime:     job.morning_end_time   ? formatTimeDisplay(job.morning_end_time)   : '—',
    duration:    (job.morning_start_time && job.morning_end_time)
      ? formatDurationBetween(job.morning_start_time, job.morning_end_time)
      : '—',
    semesterStart:   job.semester_start || null,
    semesterEnd:     job.semester_end   || null,
    semesterDisplay: job.semester_start ? `${job.semester_start} – ${job.semester_end}` : null,
    driver: driver
      ? { id: driver.id, name: [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim(), avatar: defaultAvatar(driver.id) }
      : null,
    vehicle: driver?.license_no || null,
    pa: pa
      ? { id: pa.id, name: [pa.first_name, pa.surname].filter(Boolean).join(' ').trim(), avatar: pa.profile_picture_url || defaultAvatar(pa.id) }
      : null,
    passengers:           formatPassengersCapacityLabel(passengerCount, seatCapacityTotal),
    status:               ui.label,
    statusColor:          ui.statusColor,
    driverApprovalStatus: approval || 'N/A',
    driverCounterOfferPay: counterOfferPay,
    driverCounterOfferLabel,
    dateTimeStr: job.semester_start
      ? new Date(job.semester_start + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—',
    assigned_driver_id: job.assigned_driver_id,
    assigned_pa_id:     job.assigned_pa_id,
    statusRaw:          job.status,
    has_outbound:       job.has_outbound,
    has_inbound:        job.has_inbound,
    eveningStartTime:   job.evening_start_time ? formatTimeDisplay(job.evening_start_time) : '—',
  }
}

async function countPassengersByJobId(jobIds) {
  const passengerCounts = {}
  if (!jobIds?.length) return passengerCounts

  const { data: schedCounts, error: schedError } = await supabase
    .from('passenger_schedules')
    .select('job_id, passenger_id')
    .in('job_id', jobIds)
    .is('exception_date', null)
  if (schedError) throw schedError

  for (const r of schedCounts || []) {
    passengerCounts[r.job_id] = passengerCounts[r.job_id] || new Set()
    passengerCounts[r.job_id].add(r.passenger_id)
  }

  return passengerCounts
}

function mapRawJobsToListRows(jobsRaw, passengerCounts, drivers, pas, vehicleRows) {
  const driversById            = new Map(drivers.map((d) => [d.id, d]))
  const pasById                = new Map(pas.map((p) => [p.id, p]))
  const seatCapacityByDriverId = buildSeatCapacityByDriverId(vehicleRows || [])

  const jobs = jobsRaw.map((job) => {
    const countSet  = passengerCounts[job.id]
    const count     = countSet instanceof Set ? countSet.size : 0
    const seatTotal = job.assigned_driver_id
      ? seatCapacityByDriverId.get(job.assigned_driver_id) ?? null
      : null
    return mapJobToListRow(
      job,
      count,
      driversById.get(job.assigned_driver_id),
      pasById.get(job.assigned_pa_id),
      seatTotal
    )
  })

  const jobsMinimal = jobsRaw.map((j) => ({
    id:                 j.id,
    assigned_driver_id: j.assigned_driver_id,
    assigned_pa_id:     j.assigned_pa_id,
  }))

  return { jobs, jobsMinimal }
}

/**
 * Apply a single `jobs` Realtime event to the jobs list (driver approval, assignment, etc.).
 * Re-fetches the affected row so driver_approval_status is always current.
 */
export async function applyJobsListRealtimeChange({
  companyId,
  eventType,
  newRecord,
  oldRecord,
  drivers = [],
  passengerAssistants = [],
}) {
  const jobId = newRecord?.id ?? oldRecord?.id
  if (!jobId) return { type: 'reload' }

  if (eventType === 'DELETE') {
    return { type: 'remove', jobId }
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (error) throw error
  if (!job) return { type: 'remove', jobId }

  const [passengerCounts, vehiclesRes] = await Promise.all([
    countPassengersByJobId([jobId]),
    supabase
      .from('vehicles')
      .select('driver_id, seating_capacity, wheelchair_accessible')
      .eq('company_id', companyId),
  ])
  if (vehiclesRes.error) throw vehiclesRes.error

  const { jobs, jobsMinimal } = mapRawJobsToListRows(
    [job],
    passengerCounts,
    drivers,
    passengerAssistants,
    vehiclesRes.data || []
  )

  return { type: 'upsert', row: jobs[0], minimal: jobsMinimal[0] }
}

export async function fetchJobsListPageData(companyId) {
  if (!companyId) throw new Error('company_id is required')

  const [jobsRes, driversRes, pasRes, vehiclesRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('company_id', companyId)
      .order('semester_start', { ascending: false, nullsFirst: false })
      .order('created_at',     { ascending: false }),
    supabase.from('drivers').select('*').eq('company_id', companyId).order('last_name',  { ascending: true }),
    supabase.from('passenger_assistant').select('*').eq('company_id', companyId).order('surname', { ascending: true }),
    supabase
      .from('vehicles')
      .select('id, driver_id, seating_capacity, wheelchair_accessible, fleet')
      .eq('company_id', companyId),
  ])

  if (jobsRes.error)     throw jobsRes.error
  if (driversRes.error)  throw driversRes.error
  if (pasRes.error)      throw pasRes.error
  if (vehiclesRes.error) throw vehiclesRes.error

  const jobsRaw         = jobsRes.data || []
  const passengerCounts = await countPassengersByJobId(jobsRaw.map((j) => j.id))
  const vehicles        = vehiclesRes.data || []
  const privateVehicleIds = vehicles
    .filter((v) => String(v.fleet || '').toLowerCase() === 'private' && v.id)
    .map((v) => v.id)

  const expiredPrivateVehicleIds = new Set()
  if (privateVehicleIds.length) {
    const today = new Date()
    const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const { data: expiredDocs, error: expiredErr } = await supabase
      .from('vehicle_documents')
      .select('vehicle_id')
      .in('vehicle_id', privateVehicleIds)
      .in('document_type', ['mot_certificate', 'insurance_certificate', 'taxi_license_plate'])
      .not('expiry_date', 'is', null)
      .lte('expiry_date', todayYmd)
    if (expiredErr) throw expiredErr
    for (const row of expiredDocs || []) {
      if (row.vehicle_id) expiredPrivateVehicleIds.add(row.vehicle_id)
    }
  }

  const blockedDriverIds = new Set(
    vehicles
      .filter((v) => v.driver_id && expiredPrivateVehicleIds.has(v.id))
      .map((v) => v.driver_id),
  )

  const drivers = (driversRes.data || []).map((d) => ({
    ...d,
    privateVehicleDocsExpired: blockedDriverIds.has(d.id),
  }))
  const pas             = pasRes.data || []
  const { jobs, jobsMinimal } = mapRawJobsToListRows(
    jobsRaw,
    passengerCounts,
    drivers,
    pas,
    vehicles
  )

  return { jobs, jobsMinimal, drivers, passengerAssistants: pas }
}

/**
 * Jobs list page payload for the logged-in company admin / sub-admin.
 */
export async function fetchJobsListPageDataForCurrentAdmin() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid) {
    const err = new Error('Not authenticated')
    err.code = 'AUTH'
    throw err
  }
  const admin = await getCompanyAdminById(uid)
  if (!admin?.company_id) {
    const err = new Error('No company linked to your account')
    err.code = 'NO_COMPANY'
    throw err
  }
  const data = await fetchJobsListPageData(admin.company_id)
  return { companyId: admin.company_id, ...data }
}

export function driversAvailableForAssignment(allDrivers, jobsMinimal, forJobId) {
  return allDrivers.filter((d) => {
    const status = String(d.status || '').trim().toLowerCase()
    if (status !== 'approved') return false
    if (d.vehicle_assigned !== true) return false
    if (d.privateVehicleDocsExpired === true) return false
    return !jobsMinimal.some((j) => j.id !== forJobId && j.assigned_driver_id && j.assigned_driver_id === d.id)
  })
}

export function passengerAssistantsAvailableForAssignment(allPAs, jobsMinimal, forJobId) {
  return allPAs.filter((p) =>
    !jobsMinimal.some((j) => j.id !== forJobId && j.assigned_pa_id && j.assigned_pa_id === p.id)
  )
}

// ── Session tracking ──────────────────────────────────────────────────────────

export async function fetchJobSessionsForDisplay(jobId) {
  if (!jobId) return { morning: null, evening: null, source: 'none' }

  const todayIso  = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayIso = yesterday.toISOString().slice(0, 10)

  const { data: todaySessions, error: todayErr } = await supabase
    .from('job_sessions').select('*').eq('job_id', jobId).eq('session_date', todayIso)
  if (todayErr) throw todayErr

  if (todaySessions?.length > 0) {
    return {
      morning: todaySessions.find((s) => s.direction === 'outbound') || null,
      evening: todaySessions.find((s) => s.direction === 'inbound')  || null,
      source:  'today',
    }
  }

  const { data: yestSessions, error: yestErr } = await supabase
    .from('job_sessions').select('*').eq('job_id', jobId).eq('session_date', yesterdayIso)
  if (yestErr) throw yestErr

  if (yestSessions?.length > 0) {
    return {
      morning: yestSessions.find((s) => s.direction === 'outbound') || null,
      evening: yestSessions.find((s) => s.direction === 'inbound')  || null,
      source:  'yesterday',
    }
  }

  return { morning: null, evening: null, source: 'none' }
}

export async function fetchSessionPassengers(sessionId, direction = 'outbound') {
  if (!sessionId) return []

  const { data: rows, error } = await supabase
    .from('job_session_passengers')
    .select('*, passenger:passenger_id(id, first_name, surname, wheelchair_required)')
    .eq('session_id', sessionId)
    .order('stop_order', { ascending: direction === 'outbound' })

  if (error) throw error
  return rows || []
}

// ── Counter-offer service functions ───────────────────────────────────────────
/**
 * Accept a driver's counter-offer.
 * - Updates driver_pay to the counter offer value
 * - Sets driver_approval_status to 'accepted'
 * - Clears driver_counter_offer_pay
 */
export async function acceptCounterOffer(jobId, counterOfferPay) {
  if (!jobId) throw new Error('Job id is required.');
  if (counterOfferPay == null) throw new Error('Counter offer pay value is missing.');

  const { data, error } = await supabase
      .from('jobs')
      .update({
          driver_pay: counterOfferPay,
          driver_approval_status: 'accepted',
          driver_counter_offer_pay: null,
          updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

  if (error) throw error;
  return data;
}

/**
* Reject a driver's counter-offer.
* - Removes the assigned driver (sets to null)
* - Clears driver_approval_status
* - Clears driver_counter_offer_pay
* - driver_pay remains untouched
*/
export async function rejectCounterOffer(jobId) {
  if (!jobId) throw new Error('Job id is required.');

  const { data, error } = await supabase
      .from('jobs')
      .update({
          assigned_driver_id: null,
          driver_approval_status: null,
          driver_counter_offer_pay: null,
          updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

  if (error) throw error;
  return data;
}