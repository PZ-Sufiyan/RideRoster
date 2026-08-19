import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  uploadDriverVehicleDocument,
  removeCompanyDocument,
} from './storageService'
import { FLEET } from '../utils/fleet'
import { VEHICLE_STATUS } from '../utils/vehicleStatus'

function cleanString(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function toNullableString(v) {
  const s = cleanString(v)
  return s.length ? s : null
}

function toDateOrNull(v) {
  const s = cleanString(v)
  if (!s) return null
  return s
}

function toSeatingCapacity(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function toBoolean(v) {
  if (typeof v === 'boolean') return v
  const s = cleanString(v).toLowerCase()
  return s === 'true' || s === 'yes' || s === '1'
}

export const REQUIRED_VEHICLE_DOC_TYPES = [
  'v5_front',
  'v5_inside',
  'mot_certificate',
  'taxi_license_plate',
  'insurance_certificate',
]

/**
 * Registers a company vehicle with documents. driver_id stays null until assigned.
 */
export async function registerVehicleWithRecords({
  companyId,
  expiry = {},
  vehicleFiles = {},
  vehicle = {},
}) {
  if (!companyId) throw new Error('Company is required.')

  for (const key of REQUIRED_VEHICLE_DOC_TYPES) {
    if (!vehicleFiles[key]) throw new Error(`Missing required document: ${key.replace(/_/g, ' ')}`)
  }
  if (!vehicleFiles.vehicle_photo) {
    throw new Error('Vehicle photo is required.')
  }

  const taxiPlate = cleanString(vehicle?.taxiLicensePlate)
  if (!taxiPlate) throw new Error('Taxi license plate number is required.')

  const uploadedForRollback = []
  let vehicleId = null

  const pushUpload = (meta) => {
    if (meta?.file_path) uploadedForRollback.push(meta)
  }

  try {
    const { data: vehicleRow, error: vehicleErr } = await supabaseAdmin
      .from('vehicles')
      .insert({
        company_id: companyId,
        driver_id: null,
        taxi_license_plate_number: toNullableString(vehicle?.taxiPlateNumber) || taxiPlate,
        seating_capacity: toSeatingCapacity(vehicle?.seatingCapacity),
        vehicle_photo_url: null,
        name: cleanString(`${vehicle?.make || ''} ${vehicle?.model || ''}`) || null,
        registration_number: toNullableString(vehicle?.registrationNumber),
        make: toNullableString(vehicle?.make),
        model: toNullableString(vehicle?.model),
        vehicle_colour: toNullableString(vehicle?.vehicleColour),
        year_of_first_registration: toDateOrNull(vehicle?.yearOfFirstRegistration),
        licensing_type: toNullableString(vehicle?.licensingType),
        body_style: toNullableString(vehicle?.bodyStyle),
        wheelchair_accessible: toBoolean(vehicle?.wheelchairAccessible),
        fleet: FLEET.COMPANY,
        status: VEHICLE_STATUS.ACTIVE,
      })
      .select('id')
      .single()

    if (vehicleErr) throw vehicleErr
    vehicleId = vehicleRow?.id
    if (!vehicleId) throw new Error('Vehicle record was not created.')

    const photoMeta = await uploadDriverVehicleDocument({
      companyId,
      kind: 'vehicle',
      scopeId: vehicleId,
      documentType: 'vehicle_photo',
      file: vehicleFiles.vehicle_photo,
    })
    pushUpload(photoMeta)

    const { error: vehiclePhotoErr } = await supabaseAdmin
      .from('vehicles')
      .update({
        vehicle_photo_url: photoMeta.file_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId)

    if (vehiclePhotoErr) throw vehiclePhotoErr

    const vehicleDocRows = []

    for (const documentType of REQUIRED_VEHICLE_DOC_TYPES) {
      const file = vehicleFiles[documentType]
      let expiryDate = null
      if (documentType === 'mot_certificate') expiryDate = toDateOrNull(expiry.mot)
      if (documentType === 'taxi_license_plate') expiryDate = toDateOrNull(expiry.taxiPlate)
      if (documentType === 'insurance_certificate') expiryDate = toDateOrNull(expiry.insurance)

      const meta = await uploadDriverVehicleDocument({
        companyId,
        kind: 'vehicle',
        scopeId: vehicleId,
        documentType,
        file,
      })
      pushUpload(meta)

      vehicleDocRows.push({
        company_id: companyId,
        vehicle_id: vehicleId,
        document_type: documentType,
        file_url: meta.file_url,
        expiry_date: expiryDate,
      })
    }

    const { error: insertVehicleDocsErr } = await supabaseAdmin.from('vehicle_documents').insert(vehicleDocRows)
    if (insertVehicleDocsErr) throw insertVehicleDocsErr

    return { vehicleId }
  } catch (err) {
    if (vehicleId) {
      await supabaseAdmin.from('vehicles').delete().eq('id', vehicleId)
    }
    await Promise.allSettled(
      (uploadedForRollback || []).map((u) => removeCompanyDocument({ filePath: u.file_path, bucket: u.bucket }))
    )
    throw err
  }
}
