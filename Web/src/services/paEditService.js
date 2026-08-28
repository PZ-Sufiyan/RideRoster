import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  uploadPassengerAssistantDocument,
  uploadPassengerAssistantProfileImage,
  removeCompanyDocument,
} from './storageService'
import { PA_DOCUMENT_TYPES } from './passengerAsssistantService'

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
 * Extracts the storage object path from a Supabase public URL.
 * Pattern: .../storage/v1/object/public/{bucket}/{path...}
 */
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

/**
 * Fetches full PA edit data: PA row + documents indexed by type.
 */
export async function getPAEditData(assistantId) {
  if (!assistantId) throw new Error('Passenger assistant ID is required.')

  const [paRes, docsRes] = await Promise.all([
    supabaseAdmin.from('passenger_assistant').select('*').eq('id', assistantId).single(),
    supabaseAdmin
      .from('passenger_assistant_documents')
      .select('*')
      .eq('passenger_assistant_id', assistantId),
  ])

  if (paRes.error) throw paRes.error
  if (docsRes.error) throw docsRes.error

  const docsByType = {}
  for (const doc of docsRes.data || []) {
    // For other_certificate (no unique constraint), store as array
    if (doc.document_type === PA_DOCUMENT_TYPES.OTHER_CERTIFICATE) {
      if (!docsByType[PA_DOCUMENT_TYPES.OTHER_CERTIFICATE]) {
        docsByType[PA_DOCUMENT_TYPES.OTHER_CERTIFICATE] = []
      }
      docsByType[PA_DOCUMENT_TYPES.OTHER_CERTIFICATE].push(doc)
    } else {
      docsByType[doc.document_type] = doc
    }
  }

  return {
    pa: paRes.data,
    docsByType,
  }
}

/**
 * Updates PA personal info, profile picture, and documents.
 *
 * For each document:
 *  - New File provided → upload, upsert DB row (unique constraint), delete old storage file
 *  - Only expiry changed → update expiry on existing row
 *  - Neither → leave untouched
 *
 * @param {object} params
 * @param {string} params.assistantId
 * @param {string} params.companyId
 * @param {object} params.personal
 * @param {object} params.expiry
 * @param {File|null}   params.avatarFile       — null = keep existing
 * @param {string|null} params.existingAvatarUrl — for old file cleanup
 * @param {object}      params.files             — keyed by PA_DOCUMENT_TYPES, null = keep existing
 * @param {object}      params.existingDocs      — docsByType from getPAEditData
 */
export async function updatePAWithRecords({
  assistantId,
  companyId,
  personal,
  expiry = {},
  avatarFile = null,
  existingAvatarUrl = null,
  files = {},
  existingDocs = {},
}) {
  if (!assistantId) throw new Error('Passenger assistant ID is required.')
  if (!companyId) throw new Error('Company ID is required.')

  const passportNumber = toNullableString(personal?.passportNumber)
  const passportFile = files[PA_DOCUMENT_TYPES.PASSPORT]
  const existingPassport = existingDocs[PA_DOCUMENT_TYPES.PASSPORT]
  if (passportNumber && !passportFile && !existingPassport?.file_url) {
    throw new Error('Passport document is required when a passport number is provided.')
  }

  // ── 1. Update PA row ──────────────────────────────────────
  const paUpdates = {
    first_name: cleanString(personal?.firstName),
    surname: cleanString(personal?.lastName),
    phone: cleanString(personal?.phone),
    residential_address: toNullableString(personal?.address),
    emergency_contact_name: toNullableString(personal?.contactName),
    emergency_contact_phone: toNullableString(personal?.contactPhone),
    nationality: toNullableString(personal?.nationality),
    right_to_work_code: personal?.isBritish ? null : toNullableString(personal?.rightToWork),
    passport_number: toNullableString(personal?.passportNumber),
    updated_at: new Date().toISOString(),
  }

  // Upload new avatar if provided
  if (avatarFile) {
    const meta = await uploadPassengerAssistantProfileImage({
      companyId,
      assistantId,
      file: avatarFile,
    })
    paUpdates.profile_picture_url = meta.file_url

    // Delete old avatar (best-effort)
    if (existingAvatarUrl) {
      const oldPath = extractStoragePath(existingAvatarUrl)
      if (oldPath) await removeCompanyDocument({ filePath: oldPath }).catch(() => {})
    }
  }

  const { error: paErr } = await supabaseAdmin
    .from('passenger_assistant')
    .update(paUpdates)
    .eq('id', assistantId)

  if (paErr) throw paErr

  // ── 2. Upsert typed documents (unique per type) ───────────
  const docSpecs = [
    {
      type: PA_DOCUMENT_TYPES.PASSPORT,
      file: files[PA_DOCUMENT_TYPES.PASSPORT],
      expiryValue: null,
    },
    {
      type: PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE,
      file: files[PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE],
      expiryValue: toDateOrNull(expiry.safeguarding),
    },
    {
      type: PA_DOCUMENT_TYPES.BACKGROUND_CHECK,
      file: files[PA_DOCUMENT_TYPES.BACKGROUND_CHECK],
      expiryValue: null,
    },
    {
      type: PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE,
      file: files[PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE],
      expiryValue: null,
    },
  ]

  for (const { type, file, expiryValue } of docSpecs) {
    const existingDoc = existingDocs[type] // may be undefined

    if (file instanceof File) {
      // Upload new file
      const meta = await uploadPassengerAssistantDocument({
        companyId,
        assistantId,
        documentType: type,
        file,
      })

      // Upsert — the unique index on (passenger_assistant_id, document_type)
      // means we can safely upsert by those two columns
      const { error: upsertErr } = await supabaseAdmin
        .from('passenger_assistant_documents')
        .upsert(
          {
            passenger_assistant_id: assistantId,
            document_type: type,
            file_name: meta.file_name,
            file_url: meta.file_url,
            expiry_date: expiryValue,
            verified: false,
            uploaded_at: new Date().toISOString(),
          },
          { onConflict: 'passenger_assistant_id,document_type' }
        )

      if (upsertErr) throw upsertErr

      // Delete old storage file (best-effort)
      if (existingDoc?.file_url) {
        const oldPath = extractStoragePath(existingDoc.file_url)
        if (oldPath) await removeCompanyDocument({ filePath: oldPath }).catch(() => {})
      }
    } else if (existingDoc?.id) {
      // No new file — but update expiry if it changed
      if (existingDoc.expiry_date !== expiryValue) {
        const { error: expiryUpdateErr } = await supabaseAdmin
          .from('passenger_assistant_documents')
          .update({ expiry_date: expiryValue })
          .eq('id', existingDoc.id)
        if (expiryUpdateErr) throw expiryUpdateErr
      }
    }
    // else: no existing doc, no new file — nothing to do
  }

  // ── 3. Append new other_certificates (existing ones kept) ─
  const newOtherCerts = Array.isArray(files.other_certificates) ? files.other_certificates : []
  for (const cert of newOtherCerts) {
    if (!cert?.file) continue
    const label = cleanString(cert.label)
    const meta = await uploadPassengerAssistantDocument({
      companyId,
      assistantId,
      documentType: PA_DOCUMENT_TYPES.OTHER_CERTIFICATE,
      file: cert.file,
    })
    await supabaseAdmin.from('passenger_assistant_documents').insert({
      passenger_assistant_id: assistantId,
      document_type: PA_DOCUMENT_TYPES.OTHER_CERTIFICATE,
      file_name: label ? `${label} - ${meta.file_name}` : meta.file_name,
      file_url: meta.file_url,
      expiry_date: null,
      verified: false,
    })
    // No throw on insert error — best effort for other certs
  }

  return { assistantId }
}

/**
 * Deletes a specific other_certificate document row + its storage file.
 */
export async function deleteOtherCertificate({ docId, fileUrl }) {
  if (!docId) return
  await supabaseAdmin.from('passenger_assistant_documents').delete().eq('id', docId)
  if (fileUrl) {
    const path = extractStoragePath(fileUrl)
    if (path) await removeCompanyDocument({ filePath: path }).catch(() => {})
  }
}