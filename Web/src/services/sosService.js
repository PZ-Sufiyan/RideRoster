import { supabase } from '../lib/supabaseClient'

const formatDriverLabel = (driver) => {
  if (!driver) return null
  const first = (driver.first_name || '').trim()
  const last = (driver.last_name || '').trim()
  if (!first && !last) return null
  return [first, last].filter(Boolean).join(' ')
}

const formatPassengerAssistantLabel = (assistant) => {
  if (!assistant) return null
  const first = (assistant.first_name || '').trim()
  const last = (assistant.surname || '').trim()
  if (!first && !last) return null
  return [first, last].filter(Boolean).join(' ')
}

/**
 * Maps free-text notes to a headline + severity for UI (no priority column on `sos` yet).
 * Critical = accident-type language; high = medical; default = general SOS.
 */
export const getSosUrgencyPresentation = (notes) => {
  const n = (notes || '').toLowerCase()

  if (
    /\b(accident|collision|crash|rolled|rollover|fire|unconscious|trapped|overturn|emergency services|911|police)\b/.test(
      n
    )
  ) {
    return {
      level: 'critical',
      headline: 'URGENT: Vehicle Accident',
      titleClass: 'text-red-600',
      markerColor: '#dc2626',
    }
  }

  if (
    /\b(medical|allergy|allergic|ambulance|injury|bleeding|chest pain|stroke|heart attack|seizure|cannot breathe|difficulty breathing)\b/.test(
      n
    )
  ) {
    return {
      level: 'high',
      headline: 'Medical Assistance Required',
      titleClass: 'text-amber-600',
      markerColor: '#d97706',
    }
  }

  return {
    level: 'standard',
    headline: 'SOS Emergency',
    titleClass: 'text-[#005580]',
    markerColor: '#005580',
  }
}

const mapSosRowsToAlerts = (rows, companyMap, driverMap, assistantMap, vehiclePlateMap) =>
  rows.map((r) => ({
    id: r.id,
    vehicle_id: r.vehicle_id,
    company_id: r.company_id,
    company_name: companyMap.get(r.company_id) || null,

    driver_id: r.driver_id,
    driver_label: driverMap.get(r.driver_id) || null,

    passenger_assistant_id: r.passenger_assistant_id,
    passenger_assistant_label: assistantMap.get(r.passenger_assistant_id) || null,

    taxi_license_plate_number: vehiclePlateMap.get(r.vehicle_id) || null,

    longitude: Number(r.longitude),
    latitude: Number(r.latitude),
    number_of_passenger: r.number_of_passenger,
    notes: r.notes,
    created_at: r.created_at,
    status: r.status,
  }))

const enrichSosRows = async (rows) => {
  if (!rows?.length) return []

  const companyIds = [...new Set(rows.map((r) => r.company_id).filter(Boolean))]
  const vehicleIds = [...new Set(rows.map((r) => r.vehicle_id).filter(Boolean))]
  const driverIds = [...new Set(rows.map((r) => r.driver_id).filter(Boolean))]
  const passengerAssistantIds = [...new Set(rows.map((r) => r.passenger_assistant_id).filter(Boolean))]

  const [companiesRes, vehiclesRes, driversRes, assistantsRes] = await Promise.all([
    companyIds.length
      ? supabase.from('companies').select('id, company_name').in('id', companyIds)
      : Promise.resolve({ data: [], error: null }),
    vehicleIds.length
      ? supabase.from('vehicles').select('id, taxi_license_plate_number').in('id', vehicleIds)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length
      ? supabase.from('drivers').select('id, first_name, last_name').in('id', driverIds)
      : Promise.resolve({ data: [], error: null }),
    passengerAssistantIds.length
      ? supabase
          .from('passenger_assistant')
          .select('id, first_name, surname')
          .in('id', passengerAssistantIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (companiesRes.error) throw companiesRes.error
  if (vehiclesRes.error) throw vehiclesRes.error
  if (driversRes.error) throw driversRes.error
  if (assistantsRes.error) throw assistantsRes.error

  const companyMap = new Map((companiesRes.data || []).map((c) => [c.id, c.company_name]))
  const vehiclePlateMap = new Map(
    (vehiclesRes.data || []).map((v) => [v.id, v.taxi_license_plate_number])
  )
  const driverMap = new Map((driversRes.data || []).map((d) => [d.id, formatDriverLabel(d)]))
  const assistantMap = new Map(
    (assistantsRes.data || []).map((a) => [a.id, formatPassengerAssistantLabel(a)])
  )

  return mapSosRowsToAlerts(rows, companyMap, driverMap, assistantMap, vehiclePlateMap)
}

export const getActiveSosAlerts = async ({ limit = null } = {}) => {
  let query = supabase
    .from('sos')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (limit && Number.isFinite(Number(limit))) {
    query = query.limit(Number(limit))
  }

  const { data: sosRows, error: sosError } = await query
  if (sosError) throw sosError

  return enrichSosRows(sosRows || [])
}

/**
 * Active SOS rows for a single company (e.g. company admin).
 */
export const getActiveSosAlertsForCompany = async (companyId, { limit = null } = {}) => {
  if (!companyId) return []

  let query = supabase
    .from('sos')
    .select('*')
    .eq('status', 'active')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (limit && Number.isFinite(Number(limit))) {
    query = query.limit(Number(limit))
  }

  const { data: sosRows, error: sosError } = await query
  if (sosError) throw sosError

  return enrichSosRows(sosRows || [])
}

/**
 * Passengers on a job (ordered by passenger_schedules stop_order).
 */
export const getPassengersForJobByJobId = async (jobId) => {
  if (!jobId) return []

  const { data: scheduleRows, error: schedErr } = await supabase
    .from('passenger_schedules')
    .select('passenger_id, stop_order, weekday')
    .eq('job_id', jobId)
    .is('exception_date', null)
    .order('weekday', { ascending: true })
    .order('stop_order', { ascending: true })

  if (schedErr) throw schedErr

  const orderedIds = []
  const seen = new Set()
  for (const row of scheduleRows || []) {
    const id = row.passenger_id
    if (!id || seen.has(id)) continue
    seen.add(id)
    orderedIds.push(id)
  }

  if (!orderedIds.length) return []

  const { data: paxRows, error: pErr } = await supabase
    .from('passenger')
    .select('id, first_name, surname, notes, contact_number_1')
    .in('id', orderedIds)

  if (pErr) throw pErr

  const byId = new Map((paxRows || []).map((p) => [p.id, p]))
  return orderedIds.map((id) => byId.get(id)).filter(Boolean)
}

const formatPassengerLine = (p) => {
  if (!p) return ''
  const first = (p.first_name || '').trim()
  const last = (p.surname || '').trim()
  return [first, last].filter(Boolean).join(' ').trim() || 'Passenger'
}

/**
 * Full SOS detail for admin detail page (scoped by company).
 * Returns null if the row does not exist or is not in this company.
 */
export const getSosDetailForCompany = async (sosId, companyId) => {
  if (!sosId || !companyId) throw new Error('SOS id and company are required.')

  const { data: sos, error: sosErr } = await supabase
    .from('sos')
    .select('*')
    .eq('id', sosId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (sosErr) throw sosErr
  if (!sos) return null

  const [vehicleRes, driverRes, jobRes, assistantRes, passengers] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, name, taxi_license_plate_number')
      .eq('id', sos.vehicle_id)
      .maybeSingle(),
    sos.driver_id
      ? supabase
          .from('drivers')
          .select('id, first_name, last_name, phone, license_no')
          .eq('id', sos.driver_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    sos.job_id
      ? supabase
          .from('jobs')
          .select('id, internal_job_id, job_name')
          .eq('id', sos.job_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    sos.passenger_assistant_id
      ? supabase
          .from('passenger_assistant')
          .select('id, first_name, surname, phone')
          .eq('id', sos.passenger_assistant_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    sos.job_id ? getPassengersForJobByJobId(sos.job_id) : Promise.resolve([]),
  ])

  if (vehicleRes.error) throw vehicleRes.error
  if (driverRes.error) throw driverRes.error
  if (jobRes.error) throw jobRes.error
  if (assistantRes.error) throw assistantRes.error

  const passengerRows = (passengers || []).map((p) => ({
    ...p,
    displayName: formatPassengerLine(p),
    subtitle: (p.notes && String(p.notes).trim()) || p.contact_number_1 || '—',
  }))

  return {
    sos,
    vehicle: vehicleRes.data,
    driver: driverRes.data,
    job: jobRes.data,
    passengerAssistant: assistantRes.data,
    passengers: passengerRows,
  }
}

/**
 * Sets SOS status to `resolved` when the row belongs to the company.
 */
export const resolveSosForCompany = async (sosId, companyId) => {
  if (!sosId || !companyId) throw new Error('SOS id and company are required.')

  const { data, error } = await supabase
    .from('sos')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', sosId)
    .eq('company_id', companyId)
    .select('id, status')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('SOS alert not found or access denied.')
  return data
}

/**
 * Updates SOS notes when the row belongs to the company.
 */
export const updateSosNotesForCompany = async (sosId, companyId, notes) => {
  if (!sosId || !companyId) throw new Error('SOS id and company are required.')

  const normalizedNotes = typeof notes === 'string' ? notes.trim() : ''

  const { data, error } = await supabase
    .from('sos')
    .update({
      notes: normalizedNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosId)
    .eq('company_id', companyId)
    .select('id, notes')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('SOS alert not found or access denied.')
  return data
}

/**
 * Best-effort reverse geocode for map UI (OpenStreetMap Nominatim). Returns null on failure.
 */
export const reverseGeocodeAddress = async (latitude, longitude) => {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'RideRoster/1.0',
      },
    })
    if (!res.ok) return null
    const json = await res.json()
    const line = json?.display_name
    return typeof line === 'string' && line.trim() ? line.trim() : null
  } catch {
    return null
  }
}
