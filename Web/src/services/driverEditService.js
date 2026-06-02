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

/**
 * Fetches full driver edit data: driver row, vehicle row, driver_documents, vehicle_documents.
 * Returns a structured object ready to hydrate the edit form.
 */
export async function getDriverEditData(driverId) {
  if (!driverId) throw new Error('Driver ID is required.')

  const [driverRes, vehicleRes, driverDocsRes] = await Promise.all([
    supabaseAdmin.from('drivers').select('*').eq('id', driverId).single(),
    supabaseAdmin.from('vehicles').select('*').eq('driver_id', driverId).maybeSingle(),
    supabaseAdmin.from('driver_documents').select('*').eq('driver_id', driverId),
  ])

  if (driverRes.error) throw driverRes.error
  const driver = driverRes.data

  const vehicle = vehicleRes.data || null

  if (vehicleRes.error && vehicleRes.error.code !== 'PGRST116') throw vehicleRes.error
  if (driverDocsRes.error) throw driverDocsRes.error

  const driverDocs = driverDocsRes.data || []

  let vehicleDocs = []
  if (vehicle?.id) {
    const vehicleDocsRes = await supabaseAdmin
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicle.id)
    if (vehicleDocsRes.error) throw vehicleDocsRes.error
    vehicleDocs = vehicleDocsRes.data || []
  }

  // Index docs by document_type for easy lookup
  const driverDocsByType = {}
  for (const doc of driverDocs) {
    driverDocsByType[doc.document_type] = doc
  }

  const vehicleDocsByType = {}
  for (const doc of vehicleDocs) {
    vehicleDocsByType[doc.document_type] = doc
  }

  return {
    driver,
    vehicle,
    driverDocsByType,
    vehicleDocsByType,
  }
}

/**
 * Updates driver personal info, vehicle info, and optionally replaces documents.
 *
 * For each document key: if a new File is provided → upload new, delete old, update DB row.
 * If null/undefined → leave existing document untouched.
 *
 * @param {object} params
 * @param {string} params.driverId
 * @param {string} params.companyId
 * @param {string} params.vehicleId  — may be null if no vehicle exists yet
 * @param {object} params.personal
 * @param {object} params.expiry
 * @param {Record<string, File|null>} params.driverFiles  — null = keep existing
 * @param {Record<string, File|null>} params.vehicleFiles — null = keep existing
 * @param {object} params.vehicle
 * @param {object} params.existingDriverDocs — map of document_type → existing DB row
 * @param {object} params.existingVehicleDocs — map of document_type → existing DB row
 */
export async function updateDriverWithRecords({
  driverId,
  companyId,
  vehicleId,
  personal,
  expiry = {},
  driverFiles = {},
  vehicleFiles = {},
  vehicle = {},
  existingDriverDocs = {},
  existingVehicleDocs = {},
}) {
  if (!driverId) throw new Error('Driver ID is required.')
  if (!companyId) throw new Error('Company ID is required.')

  const uploadedForRollback = []

  const pushUpload = (meta) => {
    if (meta?.file_path) uploadedForRollback.push(meta)
  }

  // ── 1. Update driver row ───────────────────────────────────
  const driverUpdates = {
    first_name: cleanString(personal?.firstName),
    last_name: cleanString(personal?.lastName),
    phone: cleanString(personal?.phone),
    residential_address: cleanString(personal?.address),
    emergency_contact_name: cleanString(personal?.emergencyName),
    emergency_contact_phone: cleanString(personal?.emergencyPhone),
    passport_number: toNullableString(personal?.passport),
    nationality: cleanString(personal?.nationality),
    right_to_work_code: toNullableString(personal?.rightToWork),
    license_no: cleanString(personal?.licenseNo),
    dbs_service_update_id: toNullableString(personal?.dbsUpdateId),
    updated_at: new Date().toISOString(),
  }

  const { error: driverErr } = await supabaseAdmin
    .from('drivers')
    .update(driverUpdates)
    .eq('id', driverId)

  if (driverErr) throw driverErr

  // ── 2. Update or insert vehicle row ───────────────────────
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

  let resolvedVehicleId = vehicleId

  if (vehicleId) {
    const { error: vehicleErr } = await supabaseAdmin
      .from('vehicles')
      .update(vehiclePayload)
      .eq('id', vehicleId)
    if (vehicleErr) throw vehicleErr
  } else {
    // No vehicle yet — create one
    const { data: newVehicle, error: insertErr } = await supabaseAdmin
      .from('vehicles')
      .insert({ ...vehiclePayload, company_id: companyId, driver_id: driverId })
      .select('id')
      .single()
    if (insertErr) throw insertErr
    resolvedVehicleId = newVehicle.id
  }

  // ── 3. Replace driver documents where new file provided ───
  const DRIVER_DOC_TYPES = [
    'driving_license_front',
    'driving_license_back',
    'taxi_badge_front',
    'taxi_badge_back',
    'dbs_certificate_front',
    'dbs_certificate_back',
    'safeguarding_certificate',
  ]

  for (const documentType of DRIVER_DOC_TYPES) {
    const newFile = driverFiles[documentType]
    if (!newFile) continue // keep existing

    const meta = await uploadDriverVehicleDocument({
      companyId,
      kind: 'driver',
      scopeId: driverId,
      documentType,
      file: newFile,
    })
    pushUpload(meta)

    let expiryDate = null
    if (documentType === 'driving_license_front' || documentType === 'driving_license_back') {
      expiryDate = toDateOrNull(expiry.license)
    } else if (documentType.startsWith('taxi_badge')) {
      expiryDate = toDateOrNull(expiry.taxiBadge)
    } else if (documentType.startsWith('dbs_certificate')) {
      expiryDate = toDateOrNull(expiry.dbs)
    } else if (documentType === 'safeguarding_certificate') {
      expiryDate = toDateOrNull(expiry.safeguarding)
    }

    const existingDoc = existingDriverDocs[documentType]
    if (existingDoc?.id) {
      // Update existing row
      const { error: updateErr } = await supabaseAdmin
        .from('driver_documents')
        .update({
          file_url: meta.file_url,
          expiry_date: expiryDate,
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id)
      if (updateErr) throw updateErr

      // Delete old file from storage (best-effort)
      if (existingDoc.file_url) {
        const oldPath = extractStoragePath(existingDoc.file_url)
        if (oldPath) {
          await removeCompanyDocument({ filePath: oldPath }).catch(() => {})
        }
      }
    } else {
      // Insert new row (doc didn't exist before)
      const { error: insertErr } = await supabaseAdmin.from('driver_documents').insert({
        company_id: companyId,
        driver_id: driverId,
        document_type: documentType,
        file_url: meta.file_url,
        expiry_date: expiryDate,
      })
      if (insertErr) throw insertErr
    }
  }

  // ── 4. Update expiry dates even if no new file uploaded ───
  // (admin may correct a wrong expiry date without re-uploading)
  const driverExpiryMap = {
    driving_license_front: toDateOrNull(expiry.license),
    driving_license_back: toDateOrNull(expiry.license),
    taxi_badge_front: toDateOrNull(expiry.taxiBadge),
    taxi_badge_back: toDateOrNull(expiry.taxiBadge),
    dbs_certificate_front: toDateOrNull(expiry.dbs),
    dbs_certificate_back: toDateOrNull(expiry.dbs),
    safeguarding_certificate: toDateOrNull(expiry.safeguarding),
  }

  for (const [documentType, expiryDate] of Object.entries(driverExpiryMap)) {
    if (driverFiles[documentType]) continue // already handled above
    const existingDoc = existingDriverDocs[documentType]
    if (!existingDoc?.id) continue
    if (existingDoc.expiry_date === expiryDate) continue // no change
    await supabaseAdmin
      .from('driver_documents')
      .update({ expiry_date: expiryDate })
      .eq('id', existingDoc.id)
      .catch(() => {}) // non-fatal
  }

  // ── 5. Replace vehicle documents where new file provided ──
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
      scopeId: resolvedVehicleId,
      documentType,
      file: newFile,
    })
    pushUpload(meta)

    if (isPhoto) {
      await supabaseAdmin
        .from('vehicles')
        .update({ vehicle_photo_url: meta.file_url, updated_at: new Date().toISOString() })
        .eq('id', resolvedVehicleId)

      // Delete old photo (best-effort)
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
        vehicle_id: resolvedVehicleId,
        document_type: documentType,
        file_url: meta.file_url,
        expiry_date: expiryDate,
      })
      if (insertErr) throw insertErr
    }
  }

  // ── 6. Update vehicle doc expiry dates (no new file) ──────
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

  return { driverId, vehicleId: resolvedVehicleId }
}

/**
 * Extracts the storage object path from a public URL.
 * Assumes URL pattern: .../storage/v1/object/public/{bucket}/{path}
 */
function extractStoragePath(publicUrl) {
  if (!publicUrl) return null
  try {
    const marker = '/object/public/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    const withBucket = publicUrl.slice(idx + marker.length)
    // Strip bucket prefix (first segment)
    const slashIdx = withBucket.indexOf('/')
    if (slashIdx === -1) return null
    return withBucket.slice(slashIdx + 1)
  } catch {
    return null
  }
}