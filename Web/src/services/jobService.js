import { supabase } from '../lib/supabaseClient'

export const JOB_DRAFT_STORAGE_KEY = 'rideRoster_adminJobDraft_v1'

/** Normalise address strings so passengers sharing a location group together */
export const normalizeAddressKey = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const emptyDraft = () => ({
  step1: {
    job_name: '',
    job_type: 'Regular Contract',
    client_school_name: '',
    internal_job_id: '',
  },
  step2: {
    selectedPassengers: [],
    pickupEdits: {},
    dropoffEdits: {},
  },
  step3: {
    job_date: '',
    pickup_time: '',
    estimated_dropoff_time: '',
    is_recurring: false,
    recurrence_pattern: null,
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

/**
 * Passengers for the job creation flow (template rows — never mutated on the server here).
 * Table name matches `Web/src/schemas/jobs.sql` FK: job_passenger_routes.passenger_id → passenger(id).
 */
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

/**
 * Derive unique pickup stops (one per distinct pickup address) and order.
 */
export function derivePickupStops(selectedPassengers, pickupEdits = {}) {
  const seen = new Set()
  const stops = []

  for (const p of selectedPassengers) {
    const key = normalizeAddressKey(p.pickup_address)
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)

    const edits = pickupEdits[key] || {}
    const scheduled =
      edits.scheduled_time != null && edits.scheduled_time !== ''
        ? edits.scheduled_time
        : formatTimeForInput(p.pickup_time)

    stops.push({
      addressKey: key,
      address: edits.address ?? p.pickup_address,
      postcode: edits.postcode ?? p.pickup_postal_code,
      latitude: edits.latitude ?? p.pickup_latitude ?? null,
      longitude: edits.longitude ?? p.pickup_longitude ?? null,
      scheduled_time: scheduled,
      status: 'pending',
      notes_for_driver: edits.notes_for_driver ?? '',
      passenger_ids: selectedPassengers
        .filter((x) => normalizeAddressKey(x.pickup_address) === key)
        .map((x) => x.id),
    })
  }

  stops.forEach((s, i) => {
    s.pickup_order = i + 1
  })
  return stops
}

/**
 * Derive unique drop-off stops (one per distinct drop-off address) and order.
 */
export function deriveDropoffStops(selectedPassengers, dropoffEdits = {}) {
  const seen = new Set()
  const stops = []

  for (const p of selectedPassengers) {
    const key = normalizeAddressKey(p.dropoff_address)
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)

    const edits = dropoffEdits[key] || {}

    stops.push({
      addressKey: key,
      address: edits.address ?? p.dropoff_address,
      postcode: edits.postcode ?? p.dropoff_postal_code,
      latitude: edits.latitude ?? p.dropoff_latitude ?? null,
      longitude: edits.longitude ?? p.dropoff_longitude ?? null,
      scheduled_time: edits.scheduled_time ?? formatTimeForInput(p.dropoff_time),
      status: 'pending',
      notes_for_driver: edits.notes_for_driver ?? '',
      passenger_ids: selectedPassengers
        .filter((x) => normalizeAddressKey(x.dropoff_address) === key)
        .map((x) => x.id),
    })
  }

  stops.forEach((s, i) => {
    s.dropoff_order = i + 1
  })
  return stops
}

function formatTimeForInput(t) {
  if (t == null || t === '') return ''
  const s = String(t)
  if (s.length >= 5) return s.slice(0, 5)
  return s
}

export function buildPassengerRouteRows(selectedPassengers, pickupStops, dropoffStops) {
  const pickupByPassenger = new Map()
  for (const p of selectedPassengers) {
    pickupByPassenger.set(p.id, normalizeAddressKey(p.pickup_address))
  }
  const dropoffByPassenger = new Map()
  for (const p of selectedPassengers) {
    dropoffByPassenger.set(p.id, normalizeAddressKey(p.dropoff_address))
  }

  const pickupIdByKey = new Map(pickupStops.map((s) => [s.addressKey, s]))
  const dropoffIdByKey = new Map(dropoffStops.map((s) => [s.addressKey, s]))

  return selectedPassengers.map((p) => ({
    passenger_id: p.id,
    wheelchair_required: Boolean(p.wheelchair_required),
    pickup_address_key: pickupByPassenger.get(p.id),
    dropoff_address_key: dropoffByPassenger.get(p.id),
    pickupStop: pickupIdByKey.get(pickupByPassenger.get(p.id)),
    dropoffStop: dropoffIdByKey.get(dropoffByPassenger.get(p.id)),
  }))
}

/**
 * Map DB job stops onto edit keys (normalized passenger profile addresses) for edit Step 2 hydration.
 * `passengersById` should be full `passenger` rows keyed by id.
 */
export function buildPickupEditsFromJobBundle(bundle, passengersById) {
  const edits = {}
  const pickupsById = new Map((bundle.pickups || []).map((p) => [p.id, p]))
  for (const r of bundle.routes || []) {
    const pax = passengersById.get(r.passenger_id)
    if (!pax) continue
    const key = normalizeAddressKey(pax.pickup_address)
    if (!key) continue
    const pu = pickupsById.get(r.pickup_id)
    if (!pu) continue
    edits[key] = {
      address: pu.address ?? '',
      postcode: pu.postcode ?? '',
      scheduled_time: timeInputFromDb(pu.scheduled_time),
      status: normalizeStopStatus(pu.status),
      latitude: pu.latitude != null ? String(pu.latitude) : '',
      longitude: pu.longitude != null ? String(pu.longitude) : '',
      notes_for_driver: pu.notes_for_driver || '',
    }
  }
  return edits
}

export function buildDropoffEditsFromJobBundle(bundle, passengersById) {
  const edits = {}
  const dropoffsById = new Map((bundle.dropoffs || []).map((d) => [d.id, d]))
  for (const r of bundle.routes || []) {
    const pax = passengersById.get(r.passenger_id)
    if (!pax) continue
    const key = normalizeAddressKey(pax.dropoff_address)
    if (!key) continue
    const d = dropoffsById.get(r.dropoff_id)
    if (!d) continue
    edits[key] = {
      address: d.address ?? '',
      postcode: d.postcode ?? '',
      scheduled_time: timeInputFromDb(d.scheduled_time),
      status: normalizeStopStatus(d.status),
      latitude: d.latitude != null ? String(d.latitude) : '',
      longitude: d.longitude != null ? String(d.longitude) : '',
      notes_for_driver: d.notes_for_driver || '',
    }
  }
  return edits
}

async function insertJobStopsAndRoutes(jobId, pickupStops, dropoffStops, selectedPassengers) {
  const pickupRows = pickupStops.map((s) => ({
    job_id: jobId,
    pickup_order: s.pickup_order,
    address: s.address,
    postcode: s.postcode,
    latitude: parseCoord(s.latitude),
    longitude: parseCoord(s.longitude),
    scheduled_time: toPgTime(s.scheduled_time),
    status: normalizeStopStatus(s.status),
    notes_for_driver: s.notes_for_driver?.trim() || null,
  }))

  const { data: insertedPickups, error: puErr } = await supabase
    .from('job_pickups')
    .insert(pickupRows)
    .select('id, pickup_order')

  if (puErr) throw puErr

  const pickupUuidByKey = new Map()
  const sortedPu = [...(insertedPickups || [])].sort((a, b) => a.pickup_order - b.pickup_order)
  pickupStops.forEach((s, i) => {
    const row = sortedPu[i]
    if (row) pickupUuidByKey.set(s.addressKey, row.id)
  })

  const dropoffRows = dropoffStops.map((s) => ({
    job_id: jobId,
    dropoff_order: s.dropoff_order,
    address: s.address,
    postcode: s.postcode,
    latitude: parseCoord(s.latitude),
    longitude: parseCoord(s.longitude),
    scheduled_time: toPgTime(s.scheduled_time),
    status: normalizeStopStatus(s.status),
    notes_for_driver: s.notes_for_driver?.trim() || null,
  }))

  const { data: insertedDropoffs, error: doErr } = await supabase
    .from('job_dropoffs')
    .insert(dropoffRows)
    .select('id, dropoff_order')

  if (doErr) throw doErr

  const dropoffUuidByKey = new Map()
  const sortedDo = [...(insertedDropoffs || [])].sort((a, b) => a.dropoff_order - b.dropoff_order)
  dropoffStops.forEach((s, i) => {
    const row = sortedDo[i]
    if (row) dropoffUuidByKey.set(s.addressKey, row.id)
  })

  const routeMeta = buildPassengerRouteRows(selectedPassengers, pickupStops, dropoffStops)
  const routeRows = routeMeta.map((r) => {
    const pickupId = pickupUuidByKey.get(r.pickup_address_key)
    const dropoffId = dropoffUuidByKey.get(r.dropoff_address_key)
    if (!pickupId || !dropoffId) {
      throw new Error('Could not resolve pickup/drop-off for a passenger route.')
    }
    return {
      job_id: jobId,
      passenger_id: r.passenger_id,
      pickup_id: pickupId,
      dropoff_id: dropoffId,
      wheelchair_required: r.wheelchair_required,
    }
  })

  const { error: routeErr } = await supabase.from('job_passenger_routes').insert(routeRows)
  if (routeErr) throw routeErr
}

/**
 * Replace all pickups, drop-offs, and passenger routes for a job (edit flow).
 * Deletes existing rows then inserts from derived stops — same shape as job creation.
 */
export async function replaceJobStopsAndRoutes(jobId, selectedPassengers, pickupEdits, dropoffEdits) {
  if (!jobId) throw new Error('Job id is required.')
  const pickupStops = derivePickupStops(selectedPassengers, pickupEdits)
  const dropoffStops = deriveDropoffStops(selectedPassengers, dropoffEdits)
  if (pickupStops.length === 0 || dropoffStops.length === 0) {
    throw new Error('Pickup and drop-off stops could not be derived from selected passengers.')
  }
  for (const s of pickupStops) {
    if (!String(s.address || '').trim() || !String(s.postcode || '').trim() || !String(s.scheduled_time || '').trim()) {
      throw new Error('Complete all required pickup fields (addresses, postcodes, and pickup times).')
    }
  }
  for (const s of dropoffStops) {
    if (!String(s.address || '').trim() || !String(s.postcode || '').trim()) {
      throw new Error('Complete all required drop-off fields (addresses and postcodes).')
    }
  }

  const { error: delR } = await supabase.from('job_passenger_routes').delete().eq('job_id', jobId)
  if (delR) throw delR
  const { error: delP } = await supabase.from('job_pickups').delete().eq('job_id', jobId)
  if (delP) throw delP
  const { error: delD } = await supabase.from('job_dropoffs').delete().eq('job_id', jobId)
  if (delD) throw delD

  await insertJobStopsAndRoutes(jobId, pickupStops, dropoffStops, selectedPassengers)
}

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
  const value = String(status || '')
    .trim()
    .toLowerCase()
  if (value === 'completed') return 'completed'
  return 'pending'
}

function parseGpsString(gps) {
  if (!gps || typeof gps !== 'string') return { latitude: null, longitude: null }
  const parts = gps.split(',').map((x) => x.trim())
  if (parts.length < 2) return { latitude: null, longitude: null }
  const latitude = parseCoord(parts[0])
  const longitude = parseCoord(parts[1])
  return { latitude, longitude }
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

/**
 * Job + stops + assignments for detail/edit pages (scoped by company_id).
 */
export async function fetchJobDetailBundle(jobId, companyId) {
  if (!jobId || !companyId) throw new Error('Job and company are required.')

  const { data: job, error: jErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (jErr) throw jErr
  if (!job) throw new Error('Job not found.')

  const [puRes, doRes, routesRes, driverRes, paRes, vehRes] = await Promise.all([
    supabase.from('job_pickups').select('*').eq('job_id', jobId).order('pickup_order', { ascending: true }),
    supabase.from('job_dropoffs').select('*').eq('job_id', jobId).order('dropoff_order', { ascending: true }),
    supabase
      .from('job_passenger_routes')
      .select('id, passenger_id, pickup_id, dropoff_id, wheelchair_required')
      .eq('job_id', jobId),
    job.assigned_driver_id
      ? supabase.from('drivers').select('*').eq('id', job.assigned_driver_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    job.assigned_pa_id
      ? supabase.from('passenger_assistant').select('*').eq('id', job.assigned_pa_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    job.assigned_driver_id
      ? supabase
          .from('vehicles')
          .select('*')
          .eq('company_id', companyId)
          .eq('driver_id', job.assigned_driver_id)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (puRes.error) throw puRes.error
  if (doRes.error) throw doRes.error
  if (routesRes.error) throw routesRes.error
  if (driverRes.error) throw driverRes.error
  if (paRes.error) throw paRes.error
  if (vehRes.error) throw vehRes.error

  const pickups = puRes.data || []
  const dropoffs = doRes.data || []
  const routes = routesRes.data || []

  const paxIds = [...new Set(routes.map((r) => r.passenger_id).filter(Boolean))]
  const passengersById = new Map()
  if (paxIds.length > 0) {
    const { data: paxRows, error: paxErr } = await supabase
      .from('passenger')
      .select('id, first_name, surname')
      .in('id', paxIds)
    if (!paxErr && paxRows) {
      for (const p of paxRows) passengersById.set(p.id, p)
    }
  }

  const pickupStops = pickups.map((p) => ({
    id: p.id,
    address: p.address || '',
    gps:
      p.latitude != null && p.longitude != null ? `${p.latitude},${p.longitude}` : '',
    postCode: p.postcode || '',
    status: normalizeStopStatus(p.status),
    passenger: passengerNamesForStop(p.id, routes, 'pickup_id', passengersById),
    notes: p.notes_for_driver || '',
  }))

  const dropoffStops = dropoffs.map((d) => ({
    id: d.id,
    address: d.address || '',
    gps:
      d.latitude != null && d.longitude != null ? `${d.latitude},${d.longitude}` : '',
    postCode: d.postcode || '',
    status: normalizeStopStatus(d.status),
    passenger: passengerNamesForStop(d.id, routes, 'dropoff_id', passengersById),
    notes: d.notes_for_driver || '',
  }))

  return {
    job,
    pickups,
    dropoffs,
    routes,
    pickupStops,
    dropoffStops,
    driver: driverRes.data,
    pa: paRes.data,
    vehicle: vehRes.data,
    passengersById,
  }
}

export async function cancelJobById(jobId, companyId) {
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('company_id', companyId)
  if (error) throw error
}

export async function updateJobById(jobId, companyId, updates) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateJobPickupRow(pickupId, patch) {
  const { latitude, longitude } =
    patch.gps != null && patch.gps !== ''
      ? parseGpsString(patch.gps)
      : { latitude: patch.latitude ?? null, longitude: patch.longitude ?? null }
  const row = {
    address: patch.address,
    postcode: patch.postcode ?? patch.postCode,
    latitude,
    longitude,
    scheduled_time: patch.scheduled_time != null ? toPgTime(patch.scheduled_time) : undefined,
    status: patch.status != null ? normalizeStopStatus(patch.status) : undefined,
    notes_for_driver: patch.notes_for_driver ?? patch.notes ?? null,
  }
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
  const { error } = await supabase.from('job_pickups').update(clean).eq('id', pickupId)
  if (error) throw error
}

export async function updateJobDropoffRow(dropoffId, patch) {
  const { latitude, longitude } =
    patch.gps != null && patch.gps !== ''
      ? parseGpsString(patch.gps)
      : { latitude: patch.latitude ?? null, longitude: patch.longitude ?? null }
  const row = {
    address: patch.address,
    postcode: patch.postcode ?? patch.postCode,
    latitude,
    longitude,
    scheduled_time: patch.scheduled_time != null ? toPgTime(patch.scheduled_time) : undefined,
    status: patch.status != null ? normalizeStopStatus(patch.status) : undefined,
    notes_for_driver: patch.notes_for_driver ?? patch.notes ?? null,
  }
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
  const { error } = await supabase.from('job_dropoffs').update(clean).eq('id', dropoffId)
  if (error) throw error
}

/** Match existing job_pickups row to a passenger template address (same rules as create flow). */
export function resolveJobPickupIdForPassenger(bundle, passenger) {
  const key = normalizeAddressKey(passenger?.pickup_address)
  if (!key) return null
  for (const p of bundle.pickups || []) {
    if (normalizeAddressKey(p.address) === key) return p.id
  }
  return null
}

/** Match existing job_dropoffs row to a passenger template address. */
export function resolveJobDropoffIdForPassenger(bundle, passenger) {
  const key = normalizeAddressKey(passenger?.dropoff_address)
  if (!key) return null
  for (const d of bundle.dropoffs || []) {
    if (normalizeAddressKey(d.address) === key) return d.id
  }
  return null
}

/**
 * Link a passenger to an existing job (insert job_passenger_routes).
 * Pickup/drop-off stops must already exist and match the passenger profile addresses.
 */
export async function addPassengerRouteToJob(jobId, passenger, bundle) {
  if (!jobId || !passenger?.id) throw new Error('Job and passenger are required.')
  const pickupId = resolveJobPickupIdForPassenger(bundle, passenger)
  const dropoffId = resolveJobDropoffIdForPassenger(bundle, passenger)
  if (!pickupId || !dropoffId) {
    throw new Error(
      "This passenger's pickup and drop-off must match existing stops on this job. Check addresses on the passenger profile."
    )
  }
  const { error } = await supabase.from('job_passenger_routes').insert({
    job_id: jobId,
    passenger_id: passenger.id,
    pickup_id: pickupId,
    dropoff_id: dropoffId,
    wheelchair_required: Boolean(passenger.wheelchair_required),
  })
  if (error) throw error
}

export async function removePassengerRouteFromJob(jobId, passengerId) {
  if (!jobId || !passengerId) throw new Error('Job and passenger are required.')
  const { error } = await supabase
    .from('job_passenger_routes')
    .delete()
    .eq('job_id', jobId)
    .eq('passenger_id', passengerId)
  if (error) throw error
}

/**
 * Full job creation: jobs → job_pickups → job_dropoffs → job_passenger_routes
 * (assigned_driver_id / assigned_pa_id stay null until assigned later.)
 */
export async function createJobFromDraft(companyId, draft) {
  if (!companyId) throw new Error('company_id is required')

  const { step1, step2, step3 } = draft
  const selected = step2?.selectedPassengers || []
  const pickupEdits = step2?.pickupEdits || {}
  const dropoffEdits = step2?.dropoffEdits || {}

  if (!step1?.job_name?.trim()) throw new Error('Job name is required.')
  if (!step1?.client_school_name?.trim()) throw new Error('Client / school name is required.')
  if (!step3?.job_date) throw new Error('Job date is required.')
  if (!step3?.pickup_time) throw new Error('Pickup time is required.')
  if (!step3?.estimated_dropoff_time) throw new Error('Estimated drop-off time is required.')
  if (selected.length === 0) throw new Error('Add at least one passenger.')

  const pickupStops = derivePickupStops(selected, pickupEdits)
  const dropoffStops = deriveDropoffStops(selected, dropoffEdits)

  if (pickupStops.length === 0 || dropoffStops.length === 0) {
    throw new Error('Pickup and drop-off stops could not be derived from selected passengers.')
  }

  const jobPayload = {
    company_id: companyId,
    job_name: step1.job_name.trim(),
    job_type: step1.job_type.trim(),
    client_school_name: step1.client_school_name.trim(),
    internal_job_id: step1.internal_job_id?.trim() || null,
    job_date: step3.job_date,
    pickup_time: toPgTime(step3.pickup_time),
    estimated_dropoff_time: toPgTime(step3.estimated_dropoff_time),
    is_recurring: Boolean(step3.is_recurring),
    recurrence_pattern:
      step3.is_recurring && step3.recurrence_pattern ? step3.recurrence_pattern : null,
    driver_pay: parseOptionalMoney(step3.driver_pay),
    passenger_assistant_pay: parseOptionalMoney(step3.passenger_assistant_pay),
    status: 'draft',
    assigned_driver_id: null,
    assigned_pa_id: null,
  }

  const { data: jobRow, error: jobErr } = await supabase
    .from('jobs')
    .insert(jobPayload)
    .select('id')
    .single()

  if (jobErr) throw jobErr
  const jobId = jobRow.id

  await insertJobStopsAndRoutes(jobId, pickupStops, dropoffStops, selected)

  return { jobId, job: jobRow }
}

export async function updateJobAssignedDriver(jobId, driverId) {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      assigned_driver_id: driverId,
      driver_approval_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateJobAssignedPa(jobId, paId) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ assigned_pa_id: paId, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Jobs list / assignment (admin) ------------------------------------------

function defaultAvatar(seed) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`
}

export function formatJobDisplayId(uuid) {
  const s = String(uuid || '').replace(/-/g, '')
  const short = s.slice(0, 8).toUpperCase()
  return `#J-${short}`
}

export function formatTimeDisplay(t) {
  if (t == null || t === '') return '—'
  const raw = String(t)
  const hhmm = raw.length >= 5 ? raw.slice(0, 5) : raw
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return raw
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDurationBetween(start, end) {
  const parse = (t) => {
    const s = String(t || '00:00:00').slice(0, 8)
    const parts = s.split(':').map((x) => parseInt(x, 10) || 0)
    const h = parts[0] ?? 0
    const m = parts[1] ?? 0
    const sec = parts[2] ?? 0
    return h * 3600 + m * 60 + sec
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
  const d = new Date(`${jobDate}T${time}:00`)
  if (Number.isNaN(d.getTime())) return String(jobDate)
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export function deriveJobUiStatus(job) {
  if (!job.assigned_driver_id) {
    return {
      label: 'Unassigned',
      statusColor: 'bg-orange-50 text-orange-600 border-orange-100',
    }
  }
  const s = (job.status || 'draft').toLowerCase()
  if (s === 'active') {
    return {
      label: 'In Progress',
      statusColor: 'bg-green-50 text-green-600 border-green-100',
    }
  }
  if (s === 'completed') {
    return {
      label: 'Completed',
      statusColor: 'bg-gray-50 text-gray-600 border-gray-100',
    }
  }
  if (s === 'cancelled') {
    return {
      label: 'Cancelled',
      statusColor: 'bg-red-50 text-red-600 border-red-100',
    }
  }
  return {
    label: 'Upcoming',
    statusColor: 'bg-blue-50 text-blue-600 border-blue-100',
  }
}

/** `current / total` for table; total from `vehicles.seating_capacity` via assigned driver. */
export function formatPassengersCapacityLabel(passengerCount, seatCapacityTotal) {
  const n = Number(passengerCount) || 0
  const cap =
    seatCapacityTotal == null || seatCapacityTotal === ''
      ? null
      : Number(seatCapacityTotal)
  if (cap == null || !Number.isFinite(cap) || cap <= 0) {
    return `${n} / —`
  }
  return `${n} / ${Math.round(cap)}`
}

/**
 * Sum `seating_capacity` per `driver_id` (a driver may have multiple vehicle rows).
 */
export function buildSeatCapacityByDriverId(vehicleRows) {
  const map = new Map()
  for (const v of vehicleRows || []) {
    if (!v?.driver_id) continue
    const add = v.seating_capacity == null ? 0 : Number(v.seating_capacity)
    if (!Number.isFinite(add) || add <= 0) continue
    const prev = map.get(v.driver_id) || 0
    map.set(v.driver_id, prev + add)
  }
  return map
}

export function mapJobToListRow(job, passengerCount, driver, pa, seatCapacityTotal) {
  const approval = String(job.driver_approval_status || '').trim()
  const ui = deriveJobUiStatus(job)
  return {
    id: job.id,
    displayId: formatJobDisplayId(job.id),
    route: job.job_name,
    startTime: formatTimeDisplay(job.pickup_time),
    endTime: formatTimeDisplay(job.estimated_dropoff_time),
    duration: formatDurationBetween(job.pickup_time, job.estimated_dropoff_time),
    driver: driver
      ? {
          id: driver.id,
          name: [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim(),
          avatar: defaultAvatar(driver.id),
        }
      : null,
    vehicle: driver?.license_no || null,
    pa: pa
      ? {
          id: pa.id,
          name: [pa.first_name, pa.surname].filter(Boolean).join(' ').trim(),
          avatar: pa.profile_picture_url || defaultAvatar(pa.id),
        }
      : null,
    passengers: formatPassengersCapacityLabel(passengerCount, seatCapacityTotal),
    status: ui.label,
    statusColor: ui.statusColor,
    driverApprovalStatus: approval || 'N/A',
    dateTimeStr: formatJobDateTimeLabel(job.job_date, job.pickup_time),
    assigned_driver_id: job.assigned_driver_id,
    assigned_pa_id: job.assigned_pa_id,
    statusRaw: job.status,
  }
}

/**
 * Jobs table + passenger counts + full driver & PA directories for the company.
 * Runs jobs + drivers + PAs in parallel; route counts load right after (depends on job ids).
 */
export async function fetchJobsListPageData(companyId) {
  if (!companyId) throw new Error('company_id is required')

  const [jobsRes, driversRes, pasRes, routesRes, vehiclesRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('job_date', { ascending: false })
      .order('pickup_time', { ascending: false }),
    supabase.from('drivers').select('*').eq('company_id', companyId).order('last_name', { ascending: true }),
    supabase
      .from('passenger_assistant')
      .select('*')
      .eq('company_id', companyId)
      .order('surname', { ascending: true }),
    supabase
      .from('job_passenger_routes')
      .select('job_id, jobs!inner(company_id)')
      .eq('jobs.company_id', companyId),
    supabase.from('vehicles').select('driver_id, seating_capacity').eq('company_id', companyId),
  ])

  if (jobsRes.error) throw jobsRes.error
  if (driversRes.error) throw driversRes.error
  if (pasRes.error) throw pasRes.error
  if (vehiclesRes.error) throw vehiclesRes.error

  const jobsRaw = jobsRes.data || []

  const passengerCounts = {}
  if (routesRes.error) {
    const jobIds = jobsRaw.map((j) => j.id)
    if (jobIds.length > 0) {
      const { data: routes, error: rErr } = await supabase
        .from('job_passenger_routes')
        .select('job_id')
        .in('job_id', jobIds)
      if (rErr) throw rErr
      for (const r of routes || []) {
        passengerCounts[r.job_id] = (passengerCounts[r.job_id] || 0) + 1
      }
    }
  } else {
    for (const r of routesRes.data || []) {
      const jid = r.job_id
      passengerCounts[jid] = (passengerCounts[jid] || 0) + 1
    }
  }

  const drivers = driversRes.data || []
  const pas = pasRes.data || []
  const driversById = new Map(drivers.map((d) => [d.id, d]))
  const pasById = new Map(pas.map((p) => [p.id, p]))
  const seatCapacityByDriverId = buildSeatCapacityByDriverId(vehiclesRes.data || [])

  const jobs = jobsRaw.map((job) => {
    const seatTotal = job.assigned_driver_id
      ? seatCapacityByDriverId.get(job.assigned_driver_id) ?? null
      : null
    return mapJobToListRow(
      job,
      passengerCounts[job.id] || 0,
      driversById.get(job.assigned_driver_id),
      pasById.get(job.assigned_pa_id),
      seatTotal
    )
  })

  const jobsMinimal = jobsRaw.map((j) => ({
    id: j.id,
    assigned_driver_id: j.assigned_driver_id,
    assigned_pa_id: j.assigned_pa_id,
  }))

  return { jobs, jobsMinimal, drivers, passengerAssistants: pas }
}

/** Drivers not assigned to any other job than `forJobId` (so current assignee on `forJobId` stays selectable). */
export function driversAvailableForAssignment(allDrivers, jobsMinimal, forJobId) {
  return allDrivers.filter((d) => {
    return !jobsMinimal.some(
      (j) => j.id !== forJobId && j.assigned_driver_id && j.assigned_driver_id === d.id
    )
  })
}

export function passengerAssistantsAvailableForAssignment(allPAs, jobsMinimal, forJobId) {
  return allPAs.filter((p) => {
    return !jobsMinimal.some(
      (j) => j.id !== forJobId && j.assigned_pa_id && j.assigned_pa_id === p.id
    )
  })
}
