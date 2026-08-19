import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  uploadDriverVehicleDocument,
  removeCompanyDocument,
} from './storageService'

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

function extractStoragePath(publicUrl) {
  if (!publicUrl) return null
  try {
    const marker = '/object/public/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    const withBucket = publicUrl.slice(idx + marker.length)
    const slashIdx = withBucket.indexOf('/')
    if (slashIdx === -1) return null
    return withBucket.slice(slashIdx + 1)
  } catch {
    return null
  }
}

export async function getVehicleEditData(vehicleId) {
  if (!vehicleId) throw new Error('Vehicle ID is required.')

  const [vehicleRes, docsRes] = await Promise.all([
    supabaseAdmin.from('vehicles').select('*').eq('id', vehicleId).single(),
    supabaseAdmin.from('vehicle_documents').select('*').eq('vehicle_id', vehicleId),
  ])

  if (vehicleRes.error) throw vehicleRes.error
  if (docsRes.error) throw docsRes.error

  const vehicleDocsByType = {}
  for (const doc of docsRes.data || []) {
    vehicleDocsByType[doc.document_type] = doc
  }

  return {
    vehicle: vehicleRes.data,
    vehicleDocsByType,
  }
}

export async function updateVehicleWithRecords({
  vehicleId,
  companyId,
  expiry = {},
  vehicleFiles = {},
  vehicle = {},
  existingVehicleDocs = {},
}) {
  if (!vehicleId) throw new Error('Vehicle ID is required.')
  if (!companyId) throw new Error('Company ID is required.')

  const uploadedForRollback = []
  const pushUpload = (meta) => {
    if (meta?.file_path) uploadedForRollback.push(meta)
  }

  const vehiclePayload = {
    taxi_license_plate_number: toNullableString(vehicle?.taxiPlateNumber) || cleanString(vehicle?.taxiLicensePlate),
    seating_capacity: toSeatingCapacity(vehicle?.seatingCapacity),
    name: cleanString(`${vehicle?.make || ''} ${vehicle?.model || ''}`) || null,
    registration_number: toNullableString(vehicle?.registrationNumber),
    make: toNullableString(vehicle?.make),
    model: toNullableString(vehicle?.model),
    vehicle_colour: toNullableString(vehicle?.vehicleColour),
    year_of_first_registration: toDateOrNull(vehicle?.yearOfFirstRegistration),
    licensing_type: toNullableString(vehicle?.licensingType),
    body_style: toNullableString(vehicle?.bodyStyle),
    wheelchair_accessible: toBoolean(vehicle?.wheelchairAccessible),
    updated_at: new Date().toISOString(),
  }

  const { error: vehicleErr } = await supabaseAdmin
    .from('vehicles')
    .update(vehiclePayload)
    .eq('id', vehicleId)
    .eq('company_id', companyId)
  if (vehicleErr) throw vehicleErr

  const VEHICLE_DOC_TYPES = [
    'v5_front',
    'v5_inside',
    'mot_certificate',
    'taxi_license_plate',
    'insurance_certificate',
    'vehicle_photo',
  ]

  for (const documentType of VEHICLE_DOC_TYPES) {
    const newFile = vehicleFiles[documentType]
    if (!newFile) continue

    const isPhoto = documentType === 'vehicle_photo'

    const meta = await uploadDriverVehicleDocument({
      companyId,
      kind: 'vehicle',
      scopeId: vehicleId,
      documentType,
      file: newFile,
    })
    pushUpload(meta)

    if (isPhoto) {
      await supabaseAdmin
        .from('vehicles')
        .update({ vehicle_photo_url: meta.file_url, updated_at: new Date().toISOString() })
        .eq('id', vehicleId)

      const oldUrl = vehicle?._existingPhotoUrl
      if (oldUrl) {
        const oldPath = extractStoragePath(oldUrl)
        if (oldPath) await removeCompanyDocument({ filePath: oldPath }).catch(() => {})
      }
      continue
    }

    let expiryDate = null
    if (documentType === 'mot_certificate') expiryDate = toDateOrNull(expiry.mot)
    if (documentType === 'taxi_license_plate') expiryDate = toDateOrNull(expiry.taxiPlate)
    if (documentType === 'insurance_certificate') expiryDate = toDateOrNull(expiry.insurance)

    const existingDoc = existingVehicleDocs[documentType]
    if (existingDoc?.id) {
      const { error: updateErr } = await supabaseAdmin
        .from('vehicle_documents')
        .update({
          file_url: meta.file_url,
          expiry_date: expiryDate,
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id)
      if (updateErr) throw updateErr

      if (existingDoc.file_url) {
        const oldPath = extractStoragePath(existingDoc.file_url)
        if (oldPath) await removeCompanyDocument({ filePath: oldPath }).catch(() => {})
      }
    } else {
      const { error: insertErr } = await supabaseAdmin.from('vehicle_documents').insert({
        company_id: companyId,
        vehicle_id: vehicleId,
        document_type: documentType,
        file_url: meta.file_url,
        expiry_date: expiryDate,
      })
      if (insertErr) throw insertErr
    }
  }

  const vehicleExpiryMap = {
    mot_certificate: toDateOrNull(expiry.mot),
    taxi_license_plate: toDateOrNull(expiry.taxiPlate),
    insurance_certificate: toDateOrNull(expiry.insurance),
  }

  for (const [documentType, expiryDate] of Object.entries(vehicleExpiryMap)) {
    if (vehicleFiles[documentType]) continue
    const existingDoc = existingVehicleDocs[documentType]
    if (!existingDoc?.id) continue
    if (existingDoc.expiry_date === expiryDate) continue
    await supabaseAdmin
      .from('vehicle_documents')
      .update({ expiry_date: expiryDate })
      .eq('id', existingDoc.id)
      .catch(() => {})
  }

  return { vehicleId }
}
