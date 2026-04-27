import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  uploadPassengerAssistantDocument,
  uploadPassengerAssistantProfileImage,
  removeCompanyDocument,
} from './storageService'

const ROLE = 'passenger_assistant'

/** Matches `public.assistant_document_type` enum */
export const PA_DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  SAFEGUARDING_CERTIFICATE: 'safeguarding_certificate',
  BACKGROUND_CHECK: 'background_check',
  FIRST_AID_CERTIFICATE: 'first_aid_certificate',
  OTHER_CERTIFICATE: 'other_certificate',
}

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
 * Registers a passenger assistant in Auth, then `passenger_assistant` + `passenger_assistant_documents`.
 * Uses the service-role client so the company admin session is unchanged.
 *
 * @param {object} params
 * @param {string} params.companyId
 * @param {object} params.personal
 * @param {object} [params.expiry] — YYYY-MM-DD for passport / safeguarding when those files are provided
 * @param {File|undefined} [params.avatarFile]
 * @param {object} params.files — optional Files keyed by PA_DOCUMENT_TYPES values
 */
export async function registerPassengerAssistantWithAuthAndRecords({
  companyId,
  personal,
  expiry = {},
  avatarFile = null,
  files = {},
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
  if (!cleanString(personal?.nationality)) throw new Error('Nationality is required.')
  if (!personal?.isBritish && !cleanString(personal?.rightToWork)) {
    throw new Error('Right to Work is required for non-British passport holders.')
  }
  if (!cleanString(personal?.contactName)) throw new Error('Emergency contact name is required.')
  if (!cleanString(personal?.contactPhone)) throw new Error('Emergency contact phone is required.')

  const passportFile = files[PA_DOCUMENT_TYPES.PASSPORT]
  const safeguardingFile = files[PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE]
  if (passportFile && !toDateOrNull(expiry.passport)) {
    throw new Error('Passport expiry date is required when a passport document is uploaded.')
  }
  if (safeguardingFile && !toDateOrNull(expiry.safeguarding)) {
    throw new Error('Safeguarding expiry date is required when a safeguarding certificate is uploaded.')
  }

  const uploadedForRollback = []
  let authUserId = null

  const pushUpload = (meta) => {
    if (meta?.file_path) uploadedForRollback.push(meta)
  }

  try {
    const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: ROLE },
      user_metadata: {
        role: ROLE,
        email,
        first_name: cleanString(personal?.firstName),
        last_name: cleanString(personal?.lastName),
      },
    })

    if (createErr) throw createErr
    if (!createdAuth?.user?.id) throw new Error('Could not create auth user.')
    authUserId = createdAuth.user.id

    let profilePictureUrl = null
    if (avatarFile) {
      const meta = await uploadPassengerAssistantProfileImage({
        companyId,
        assistantId: authUserId,
        file: avatarFile,
      })
      pushUpload(meta)
      profilePictureUrl = meta.file_url
    }

    const assistantPayload = {
      id: authUserId,
      company_id: companyId,
      first_name: cleanString(personal?.firstName),
      surname: cleanString(personal?.lastName),
      email,
      phone: cleanString(personal?.phone),
      residential_address: toNullableString(personal?.address),
      profile_picture_url: profilePictureUrl,
      emergency_contact_name: cleanString(personal?.contactName),
      emergency_contact_phone: cleanString(personal?.contactPhone),
      nationality: cleanString(personal?.nationality),
      right_to_work_code: personal?.isBritish ? null : toNullableString(personal?.rightToWork),
    }

    const { error: paErr } = await supabaseAdmin.from('passenger_assistant').insert(assistantPayload)
    if (paErr) throw paErr

    const docRows = []

    const docSpecs = [
      { type: PA_DOCUMENT_TYPES.PASSPORT, file: files[PA_DOCUMENT_TYPES.PASSPORT], expiry: toDateOrNull(expiry.passport) },
      {
        type: PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE,
        file: files[PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE],
        expiry: toDateOrNull(expiry.safeguarding),
      },
      { type: PA_DOCUMENT_TYPES.BACKGROUND_CHECK, file: files[PA_DOCUMENT_TYPES.BACKGROUND_CHECK], expiry: null },
      { type: PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE, file: files[PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE], expiry: null },
    ]

    for (const { type, file, expiry: exp } of docSpecs) {
      if (!file) continue
      const meta = await uploadPassengerAssistantDocument({
        companyId,
        assistantId: authUserId,
        documentType: type,
        file,
      })
      pushUpload(meta)
      docRows.push({
        passenger_assistant_id: authUserId,
        document_type: type,
        file_name: meta.file_name,
        file_url: meta.file_url,
        expiry_date: exp,
        verified: false,
      })
    }

    const otherCertificates = Array.isArray(files?.other_certificates)
      ? files.other_certificates
      : []
    for (const cert of otherCertificates) {
      if (!cert?.file) continue
      const label = cleanString(cert.label)
      const meta = await uploadPassengerAssistantDocument({
        companyId,
        assistantId: authUserId,
        documentType: PA_DOCUMENT_TYPES.OTHER_CERTIFICATE,
        file: cert.file,
      })
      pushUpload(meta)
      docRows.push({
        passenger_assistant_id: authUserId,
        document_type: PA_DOCUMENT_TYPES.OTHER_CERTIFICATE,
        file_name: label ? `${label} - ${meta.file_name}` : meta.file_name,
        file_url: meta.file_url,
        expiry_date: null,
        verified: false,
      })
    }

    if (docRows.length) {
      const { error: docsErr } = await supabaseAdmin.from('passenger_assistant_documents').insert(docRows)
      if (docsErr) throw docsErr
    }

    return {
      userId: authUserId,
      email,
    }
  } catch (err) {
    await rollbackPassengerAssistantRegistration({
      authUserId,
      uploadedMeta: uploadedForRollback,
    })
    throw err
  }
}

async function rollbackPassengerAssistantRegistration({ authUserId, uploadedMeta }) {
  if (authUserId) {
    await supabaseAdmin.from('passenger_assistant').delete().eq('id', authUserId)
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
