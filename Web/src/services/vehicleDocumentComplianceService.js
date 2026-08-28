import { supabaseAdmin } from '../lib/supabaseAdmin'
import { isPrivateFleet } from '../utils/fleet'

/** Vehicle documents that block private drivers from jobs when expired. */
export const REQUIRED_VEHICLE_EXPIRY_DOCUMENT_TYPES = [
  'mot_certificate',
  'insurance_certificate',
  'taxi_license_plate',
]

const DOCUMENT_LABELS = {
  mot_certificate: 'MOT Certificate',
  insurance_certificate: 'Insurance Certificate',
  taxi_license_plate: 'Taxi License Plate',
}

function todayYmdLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function documentTypeLabel(documentType) {
  const key = String(documentType || '').trim()
  return DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
}

/**
 * Returns expired required vehicle documents for a vehicle (MOT / insurance / taxi plate).
 * @returns {Promise<Array<{ id: string, document_type: string, expiry_date: string }>>}
 */
export async function getExpiredRequiredVehicleDocuments(vehicleId, { asOfDate = null } = {}) {
  if (!vehicleId) return []
  const today = asOfDate || todayYmdLocal()

  const { data, error } = await supabaseAdmin
    .from('vehicle_documents')
    .select('id, document_type, expiry_date')
    .eq('vehicle_id', vehicleId)
    .in('document_type', REQUIRED_VEHICLE_EXPIRY_DOCUMENT_TYPES)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', today)

  if (error) throw error
  return data || []
}

/**
 * True when a private driver's assigned vehicle has an expired required document.
 * Company/fleet vehicles are not blocked by this check (they use Off-Road instead).
 */
export async function privateDriverBlockedByExpiredVehicleDocs({
  companyId,
  driverId,
  vehicle = null,
} = {}) {
  if (!companyId || !driverId) return { blocked: false, expiredDocs: [], vehicle: null }

  let vehicleRow = vehicle
  if (!vehicleRow) {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select('id, fleet, driver_id, taxi_license_plate_number, make, model, status')
      .eq('company_id', companyId)
      .eq('driver_id', driverId)
      .maybeSingle()
    if (error) throw error
    vehicleRow = data
  }

  if (!vehicleRow?.id || !isPrivateFleet(vehicleRow.fleet)) {
    return { blocked: false, expiredDocs: [], vehicle: vehicleRow || null }
  }

  const expiredDocs = await getExpiredRequiredVehicleDocuments(vehicleRow.id)
  return {
    blocked: expiredDocs.length > 0,
    expiredDocs,
    vehicle: vehicleRow,
  }
}

export function privateVehicleDocsBlockedMessage(expiredDocs) {
  const labels = [...new Set((expiredDocs || []).map((d) => documentTypeLabel(d.document_type)))]
  const docText = labels.length === 0
    ? 'a required vehicle document'
    : labels.length === 1
      ? labels[0]
      : labels.length === 2
        ? `${labels[0]} and ${labels[1]}`
        : `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
  return `This private driver's vehicle has an expired ${docText}. Renew the document(s) before assigning them to a job.`
}
