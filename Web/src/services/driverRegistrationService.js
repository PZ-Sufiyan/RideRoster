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

export const REQUIRED_VEHICLE_DOC_TYPES = [
  'v5_front',
  'v5_inside',
  'mot_certificate',
  'taxi_license_plate',
  'insurance_certificate',
]

/**
 * Registers a driver in Auth, then persists drivers + driver_documents + vehicles + vehicle_documents.
 * Uses the service-role client for auth.admin.createUser and inserts so the company admin session is unchanged.
 *
 * @param {object} params
 * @param {string} params.companyId
 * @param {object} params.personal
 * @param {object} params.expiry — optional ISO date strings (YYYY-MM-DD) per doc group
 * @param {Record<string, File|undefined>} params.driverFiles
 * @param {Record<string, File|undefined>} params.vehicleFiles — must include `vehicle_photo` File
 * @param {object} params.vehicle — taxiLicensePlate, seatingCapacity
 */
export async function registerDriverWithAuthAndRecords({
  companyId,
  personal,
  expiry = {},
  driverFiles = {},
  vehicleFiles = {},
  vehicle = {},
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

  for (const key of REQUIRED_DRIVER_DOC_TYPES) {
    if (!driverFiles[key]) throw new Error(`Missing required document: ${key.replace(/_/g, ' ')}`)
  }
  for (const key of REQUIRED_VEHICLE_DOC_TYPES) {
    if (!vehicleFiles[key]) throw new Error(`Missing required document: ${key.replace(/_/g, ' ')}`)
  }
  if (!vehicleFiles.vehicle_photo) {
    throw new Error('Vehicle photo is required.')
  }

  const taxiPlate = cleanString(vehicle?.taxiLicensePlate)
  if (!taxiPlate) throw new Error('Taxi license plate number is required.')

  const licenseNo = cleanString(personal?.licenseNo)
  if (!licenseNo) throw new Error('Driving license number is required.')

  const uploadedForRollback = []
  let authUserId = null
  let vehicleId = null

  const pushUpload = (meta) => {
    if (meta?.file_path) uploadedForRollback.push(meta)
  }

  try {
    const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'driver' },
      user_metadata: {
        role: 'driver',
        email,
        first_name: cleanString(personal?.firstName),
        last_name: cleanString(personal?.lastName),
      },
    })

    if (createErr) throw createErr
    if (!createdAuth?.user?.id) throw new Error('Could not create auth user.')
    authUserId = createdAuth.user.id

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
      passport_number: toNullableString(personal?.passport),
      nationality: cleanString(personal?.nationality),
      right_to_work_code: toNullableString(personal?.rightToWork),
      license_no: licenseNo,
      dbs_service_update_id: toNullableString(personal?.dbsUpdateId),
      status: 'pending',
    }

    const { error: driverErr } = await supabaseAdmin.from('drivers').insert(driverPayload)
    if (driverErr) throw driverErr

    const { data: vehicleRow, error: vehicleErr } = await supabaseAdmin
      .from('vehicles')
      .insert({
        company_id: companyId,
        driver_id: authUserId,
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
      })
      .select('id')
      .single()

    if (vehicleErr) throw vehicleErr
    vehicleId = vehicleRow?.id
    if (!vehicleId) throw new Error('Vehicle record was not created.')

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

    return {
      userId: authUserId,
      vehicleId,
      email,
    }
  } catch (err) {
    await rollbackDriverRegistration({
      authUserId,
      vehicleId,
      uploadedMeta: uploadedForRollback,
    })
    throw err
  }
}

async function rollbackDriverRegistration({ authUserId, vehicleId, uploadedMeta }) {
  if (vehicleId) {
    await supabaseAdmin.from('vehicles').delete().eq('id', vehicleId)
  }
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
