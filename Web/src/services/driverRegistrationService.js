import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  createAuthUserRequiringEmailConfirm,
} from '../utils/authEmailGuards'
import {
  uploadDriverVehicleDocument,
  uploadDriverProfileImage,
  removeCompanyDocument,
} from './storageService'
import { FLEET } from '../utils/fleet'

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

function sanitizeSegment(v) {
  return cleanString(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** Driver document enum keys required for registration (excluding optional safeguarding). */
export const REQUIRED_DRIVER_DOC_TYPES = [
  'driving_license_front',
  'driving_license_back',
  'taxi_badge_front',
  'taxi_badge_back',
  'dbs_certificate_front',
  'dbs_certificate_back',
]

/**
 * Registers a company driver in Auth, then persists drivers + driver_documents.
 * Web portal registrations are fleet=company, status=approved, vehicle_assigned=false.
 */
export async function registerDriverWithAuthAndRecords({
  companyId,
  personal,
  expiry = {},
  avatarFile = null,
  driverFiles = {},
}) {
  const email = cleanString(personal?.email).toLowerCase()
  const password = personal?.password
  if (!email) throw new Error('Email is required.')
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }
  if (!cleanString(personal?.firstName)) throw new Error('First name is required.')
  if (!cleanString(personal?.lastName)) throw new Error('Last name is required.')
  if (!cleanString(personal?.phone)) throw new Error('Phone is required.')
  if (!cleanString(personal?.address)) throw new Error('Residential address is required.')
  if (!cleanString(personal?.emergencyName)) throw new Error('Emergency contact name is required.')
  if (!cleanString(personal?.emergencyPhone)) throw new Error('Emergency contact phone is required.')
  if (!cleanString(personal?.nationality)) throw new Error('Nationality is required.')
  if (!avatarFile) throw new Error('Profile picture is required.')

  const passportNumber = toNullableString(personal?.passport)
  const passportFile = driverFiles.passport
  if (passportNumber && !passportFile) {
    throw new Error('Passport document is required when a passport number is provided.')
  }

  for (const key of REQUIRED_DRIVER_DOC_TYPES) {
    if (!driverFiles[key]) throw new Error(`Missing required document: ${key.replace(/_/g, ' ')}`)
  }

  const licenseNo = cleanString(personal?.licenseNo)
  if (!licenseNo) throw new Error('Driving license number is required.')

  const uploadedForRollback = []
  let authUserId = null

  const pushUpload = (meta) => {
    if (meta?.file_path) uploadedForRollback.push(meta)
  }

  try {
    const created = await createAuthUserRequiringEmailConfirm({
      email,
      password,
      appMetadata: { role: 'driver' },
      userMetadata: {
        role: 'driver',
        email,
        first_name: cleanString(personal?.firstName),
        last_name: cleanString(personal?.lastName),
      },
    })
    authUserId = created.userId

    const profileMeta = await uploadDriverProfileImage({
      companyId,
      driverId: authUserId,
      file: avatarFile,
    })
    pushUpload(profileMeta)

    const driverPayload = {
      id: authUserId,
      company_id: companyId,
      first_name: cleanString(personal?.firstName),
      last_name: cleanString(personal?.lastName),
      email,
      phone: cleanString(personal?.phone),
      residential_address: cleanString(personal?.address),
      emergency_contact_name: cleanString(personal?.emergencyName),
      emergency_contact_phone: cleanString(personal?.emergencyPhone),
      passport_number: passportNumber,
      nationality: cleanString(personal?.nationality),
      right_to_work_code: toNullableString(personal?.rightToWork),
      license_no: licenseNo,
      dbs_service_update_id: toNullableString(personal?.dbsUpdateId),
      profile_picture_url: profileMeta.file_url,
      status: 'approved',
      fleet: FLEET.COMPANY,
      vehicle_assigned: false,
    }

    const { error: driverErr } = await supabaseAdmin.from('drivers').insert(driverPayload)
    if (driverErr) throw driverErr

    const driverDocRows = []

    for (const documentType of REQUIRED_DRIVER_DOC_TYPES) {
      const file = driverFiles[documentType]
      const meta = await uploadDriverVehicleDocument({
        companyId,
        kind: 'driver',
        scopeId: authUserId,
        documentType,
        file,
      })
      pushUpload(meta)

      let expiryDate = null
      if (documentType === 'driving_license_front' || documentType === 'driving_license_back') {
        expiryDate = toDateOrNull(expiry.license)
      } else if (documentType.startsWith('taxi_badge')) {
        expiryDate = toDateOrNull(expiry.taxiBadge)
      } else if (documentType.startsWith('dbs_certificate')) {
        expiryDate = toDateOrNull(expiry.dbs)
      }

      driverDocRows.push({
        company_id: companyId,
        driver_id: authUserId,
        document_type: documentType,
        file_url: meta.file_url,
        expiry_date: expiryDate,
      })
    }

    if (passportFile) {
      const meta = await uploadDriverVehicleDocument({
        companyId,
        kind: 'driver',
        scopeId: authUserId,
        documentType: 'passport',
        file: passportFile,
      })
      pushUpload(meta)
      driverDocRows.push({
        company_id: companyId,
        driver_id: authUserId,
        document_type: 'passport',
        file_url: meta.file_url,
        expiry_date: null,
      })
    }

    if (driverFiles.safeguarding_certificate) {
      const meta = await uploadDriverVehicleDocument({
        companyId,
        kind: 'driver',
        scopeId: authUserId,
        documentType: 'safeguarding_certificate',
        file: driverFiles.safeguarding_certificate,
      })
      pushUpload(meta)
      driverDocRows.push({
        company_id: companyId,
        driver_id: authUserId,
        document_type: 'safeguarding_certificate',
        file_url: meta.file_url,
        expiry_date: toDateOrNull(expiry.safeguarding),
      })
    }

    const otherCertificates = Array.isArray(driverFiles.other_certificates)
      ? driverFiles.other_certificates
      : []
    for (const cert of otherCertificates) {
      if (!cert?.file) continue
      const label = cleanString(cert.label)
      const safeLabel = sanitizeSegment(label || 'certificate')
      const meta = await uploadDriverVehicleDocument({
        companyId,
        kind: 'driver',
        scopeId: authUserId,
        documentType: `other_certificate_${safeLabel}`,
        file: cert.file,
      })
      pushUpload(meta)
      driverDocRows.push({
        company_id: companyId,
        driver_id: authUserId,
        document_type: 'other_certificate',
        file_url: meta.file_url,
        expiry_date: null,
      })
    }

    const { error: insertDriverDocsErr } = await supabaseAdmin.from('driver_documents').insert(driverDocRows)
    if (insertDriverDocsErr) throw insertDriverDocsErr

    return {
      userId: authUserId,
      email,
    }
  } catch (err) {
    await rollbackDriverRegistration({
      authUserId,
      uploadedMeta: uploadedForRollback,
    })
    throw err
  }
}

async function rollbackDriverRegistration({ authUserId, uploadedMeta }) {
  if (authUserId) {
    await supabaseAdmin.from('drivers').delete().eq('id', authUserId)
    try {
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
    } catch {
      // best effort
    }
  }
  await Promise.allSettled(
    (uploadedMeta || []).map((u) => removeCompanyDocument({ filePath: u.file_path, bucket: u.bucket }))
  )
}
