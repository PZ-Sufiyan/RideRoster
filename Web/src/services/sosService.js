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

  const rows = sosRows || []

  const companyIds = [...new Set(rows.map((r) => r.company_id).filter(Boolean))]
  const driverIds = [...new Set(rows.map((r) => r.driver_id).filter(Boolean))]
  const passengerAssistantIds = [...new Set(rows.map((r) => r.passenger_assistant_id).filter(Boolean))]

  const [companiesRes, driversRes, assistantsRes] = await Promise.all([
    companyIds.length
      ? supabase.from('companies').select('id, company_name').in('id', companyIds)
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
  if (driversRes.error) throw driversRes.error
  if (assistantsRes.error) throw assistantsRes.error

  const companyMap = new Map((companiesRes.data || []).map((c) => [c.id, c.company_name]))
  const driverMap = new Map((driversRes.data || []).map((d) => [d.id, formatDriverLabel(d)]))
  const assistantMap = new Map(
    (assistantsRes.data || []).map((a) => [a.id, formatPassengerAssistantLabel(a)])
  )

  return rows.map((r) => ({
    id: r.id,
    vehicle_id: r.vehicle_id,
    company_id: r.company_id,
    company_name: companyMap.get(r.company_id) || null,

    driver_id: r.driver_id,
    driver_label: driverMap.get(r.driver_id) || null,

    passenger_assistant_id: r.passenger_assistant_id,
    passenger_assistant_label: assistantMap.get(r.passenger_assistant_id) || null,

    longitude: Number(r.longitude),
    latitude: Number(r.latitude),
    number_of_passenger: r.number_of_passenger,
    notes: r.notes,
    created_at: r.created_at,
    status: r.status,
  }))
}

