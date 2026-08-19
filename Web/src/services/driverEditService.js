import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  uploadDriverVehicleDocument,
  uploadDriverProfileImage,
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

/**
 * Fetches driver row and driver_documents for the edit form.
 */
export async function getDriverEditData(driverId) {
  if (!driverId) throw new Error('Driver ID is required.')

  const [driverRes, driverDocsRes] = await Promise.all([
    supabaseAdmin.from('drivers').select('*').eq('id', driverId).single(),
    supabaseAdmin.from('driver_documents').select('*').eq('driver_id', driverId),
  ])

  if (driverRes.error) throw driverRes.error
  const driver = driverRes.data

  if (driverDocsRes.error) throw driverDocsRes.error

  const driverDocs = driverDocsRes.data || []

  const driverDocsByType = {}
  for (const doc of driverDocs) {
    driverDocsByType[doc.document_type] = doc
  }

  return {
    driver,
    driverDocsByType,
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
 * @param {File|null}   params.avatarFile       — null = keep existing profile picture
 * @param {string|null} params.existingAvatarUrl — for old file cleanup
 * @param {Record<string, File|null>} params.driverFiles  — null = keep existing; may include optional `passport`
 * @param {object} params.existingDriverDocs — map of document_type → existing DB row
 */
export async function updateDriverWithRecords({
  driverId,
  companyId,
  personal,
  expiry = {},
  avatarFile = null,
  existingAvatarUrl = null,
  driverFiles = {},
  existingDriverDocs = {},
}) {
  if (!driverId) throw new Error('Driver ID is required.')
  if (!companyId) throw new Error('Company ID is required.')

  const passportNumber = toNullableString(personal?.passport)
  const passportFile = driverFiles.passport
  const existingPassport = existingDriverDocs.passport
  if (passportNumber && !passportFile && !existingPassport?.file_url) {
    throw new Error('Passport document is required when a passport number is provided.')
  }

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

  if (avatarFile) {
    const meta = await uploadDriverProfileImage({
      companyId,
      driverId,
      file: avatarFile,
    })
    pushUpload(meta)
    driverUpdates.profile_picture_url = meta.file_url

    if (existingAvatarUrl) {
      const oldPath = extractStoragePath(existingAvatarUrl)
      if (oldPath) await removeCompanyDocument({ filePath: oldPath }).catch(() => {})
    }
  }

  const { error: driverErr } = await supabaseAdmin
    .from('drivers')
    .update(driverUpdates)
    .eq('id', driverId)

  if (driverErr) throw driverErr

  // ── Replace driver documents where new file provided ───
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

  if (passportFile) {
    const meta = await uploadDriverVehicleDocument({
      companyId,
      kind: 'driver',
      scopeId: driverId,
      documentType: 'passport',
      file: passportFile,
    })
    pushUpload(meta)

    if (existingPassport?.id) {
      const { error: updateErr } = await supabaseAdmin
        .from('driver_documents')
        .update({
          file_url: meta.file_url,
          expiry_date: null,
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', existingPassport.id)
      if (updateErr) throw updateErr

      if (existingPassport.file_url) {
        const oldPath = extractStoragePath(existingPassport.file_url)
        if (oldPath) await removeCompanyDocument({ filePath: oldPath }).catch(() => {})
      }
    } else {
      const { error: insertErr } = await supabaseAdmin.from('driver_documents').insert({
        company_id: companyId,
        driver_id: driverId,
        document_type: 'passport',
        file_url: meta.file_url,
        expiry_date: null,
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

  return { driverId }
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