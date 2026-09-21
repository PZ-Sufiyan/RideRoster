import {
  createCompany,
  createCompanyDocument,
  deleteCompany,
  deleteCompanyDocument,
  getCompanyAdminById,
  getCompanyById,
  updateCompany,
  updateCompanyDocument,
  upsertCompanyAdmin,
} from './companyService'
import { uploadCompanyDocument, removeCompanyDocument } from './storageService'
import { supabase } from '../lib/supabaseClient'
import { assertCompanyRegistrationValid } from '../utils/companyRegistrationValidation'

export const COMPANY_DOCUMENT_TYPES = [
  'certificate_of_incorporation',
  'operator_license',
  'public_liability_insurance',
  'commercial_insurance_certificate',
  'vat_certificate',
  'primary_admin_id',
]

function cleanString(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function toNullableString(v) {
  const s = cleanString(v)
  return s.length ? s : null
}

function toNullableInt(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/**
 * registrationData shape (from UI):
 * {
 *   company: { company_name, company_registration_number, company_type, vat_number, primary_business_activity, ...contact fields... , driver_estimate, operator_licence_number, operator_licence_issuing_authority, coioe_registration_number, coioe_issue_date, cic_policy_number, cic_coverage_amount, cic_expiry_date }
 *   admin: { full_name, email, phone }
 *   documents: { [document_type]: File | uploadedDocMeta | null }
 * }
 */
function isUploadedDocMeta(v) {
  return (
    v &&
    typeof v === 'object' &&
    typeof v.file_path === 'string' &&
    typeof v.file_url === 'string' &&
    typeof v.file_name === 'string'
  )
}

function isFileLike(v) {
  return (
    v &&
    typeof v === 'object' &&
    typeof v.size === 'number' &&
    typeof v.type === 'string' &&
    typeof v.name === 'string'
  )
}

function toCompanyPayload(registrationData, status = 'pending') {
  return {
    company_name: cleanString(registrationData?.company?.company_name),
    company_registration_number: cleanString(registrationData?.company?.company_registration_number),
    company_type: cleanString(registrationData?.company?.company_type),

    company_address: cleanString(registrationData?.company?.company_address),
    company_operating_address: cleanString(registrationData?.company?.company_operating_address),
    company_country: cleanString(registrationData?.company?.company_country || 'United Kingdom'),
    company_email: cleanString(registrationData?.company?.company_email),
    company_phone: cleanString(registrationData?.company?.company_phone),
    company_website: cleanString(registrationData?.company?.company_website || ''),
    company_preferred_language: cleanString(registrationData?.company?.company_preferred_language || ''),

    vat_number: toNullableString(registrationData?.company?.vat_number),
    primary_business_activity: cleanString(registrationData?.company?.primary_business_activity),
    driver_estimate: toNullableInt(registrationData?.company?.driver_estimate),

    operator_licence_number: toNullableString(registrationData?.company?.operator_licence_number),
    operator_licence_issuing_authority: toNullableString(registrationData?.company?.operator_licence_issuing_authority),

    coioe_registration_number: toNullableString(registrationData?.company?.coioe_registration_number),
    coioe_issue_date: registrationData?.company?.coioe_issue_date || null,

    cic_policy_number: toNullableString(registrationData?.company?.cic_policy_number),
    cic_coverage_amount: toNullableString(registrationData?.company?.cic_coverage_amount),
    cic_expiry_date: registrationData?.company?.cic_expiry_date || null,

    status,
  }
}

function mapCompanyWriteError(err) {
  const code = err?.code || err?.cause?.code
  const message = String(err?.message || '')
  if (code === '23505' || /duplicate|unique/i.test(message)) {
    return new Error('That company registration number is already in use.')
  }
  return err instanceof Error ? err : new Error(message || 'Could not save company details.')
}

export async function submitCompanyRegistration(registrationData) {
  const uploaded = []
  const newlyUploaded = []
  let createdCompany = null

  try {
    assertCompanyRegistrationValid(registrationData)

    const companyPayload = toCompanyPayload(registrationData, 'pending')

    createdCompany = await createCompany(companyPayload)

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user?.id) {
      throw new Error('You must be signed in to submit company registration.')
    }

    // company_admins.id is the auth user id; a stub row may already exist from admin signup.
    await upsertCompanyAdmin({
      id: user.id,
      company_id: createdCompany.id,
      full_name: cleanString(registrationData?.admin?.full_name),
      email: cleanString(registrationData?.admin?.email),
      phone: cleanString(registrationData?.admin?.phone),
    })

    const docs = registrationData?.documents || {}
    const entries = Object.entries(docs).filter(([, doc]) => !!doc)

    for (const [documentType, doc] of entries) {
      let uploadedMeta = null

      // The UI currently uploads documents immediately and stores the returned metadata in `registrationData.documents`.
      // On submit, we therefore mostly get `uploadedDocMeta` objects, but we still support `File` inputs.
      if (isUploadedDocMeta(doc)) {
        uploadedMeta = doc
      } else if (isFileLike(doc)) {
        uploadedMeta = await uploadCompanyDocument({
          companyId: createdCompany.id,
          documentType,
          file: doc,
        })
        newlyUploaded.push(uploadedMeta)
      } else {
        throw new Error(`Unsupported document value for "${documentType}".`)
      }

      uploaded.push(uploadedMeta)

      await createCompanyDocument({
        company_id: createdCompany.id,
        document_type: documentType,
        file_name: uploadedMeta.file_name,
        file_path: uploadedMeta.file_path,
        file_url: uploadedMeta.file_url,
      })
    }

    return {
      company: createdCompany,
      uploadedDocuments: uploaded,
    }
  } catch (err) {
    // Best-effort rollback
    try {
      await Promise.allSettled(
        newlyUploaded.map((u) => removeCompanyDocument({ filePath: u.file_path, bucket: u.bucket }))
      )
    } catch {
      // ignore rollback failure
    }

    if (createdCompany?.id) {
      try {
        await deleteCompany(createdCompany.id)
      } catch {
        // ignore rollback failure
      }
    }

    throw err
  }
}

function docMeta(doc) {
  if (!isUploadedDocMeta(doc)) return null
  return {
    id: doc.id || null,
    file_name: doc.file_name,
    file_path: doc.file_path,
    file_url: doc.file_url,
    bucket: doc.bucket,
  }
}

async function persistDocumentChange({ companyId, documentType, previous, next }) {
  const prev = docMeta(previous)
  const curr = docMeta(next)

  if (!curr && !prev) return
  if (curr && prev && curr.file_path === prev.file_path) return

  if (curr && !prev) {
    await createCompanyDocument({
      company_id: companyId,
      document_type: documentType,
      file_name: curr.file_name,
      file_path: curr.file_path,
      file_url: curr.file_url,
    })
    return
  }

  if (curr && prev) {
    if (prev.id) {
      await updateCompanyDocument(prev.id, {
        file_name: curr.file_name,
        file_path: curr.file_path,
        file_url: curr.file_url,
      })
    } else {
      await createCompanyDocument({
        company_id: companyId,
        document_type: documentType,
        file_name: curr.file_name,
        file_path: curr.file_path,
        file_url: curr.file_url,
      })
    }
    if (prev.file_path && prev.file_path !== curr.file_path) {
      try {
        await removeCompanyDocument({ filePath: prev.file_path, bucket: prev.bucket })
      } catch {
        // ignore storage cleanup
      }
    }
    return
  }

  if (!curr && prev?.id) {
    await deleteCompanyDocument(prev.id)
    if (prev.file_path) {
      try {
        await removeCompanyDocument({ filePath: prev.file_path, bucket: prev.bucket })
      } catch {
        // ignore storage cleanup
      }
    }
  }
}

/**
 * Update a rejected company application and send it back to Super Admin review.
 */
export async function resubmitCompanyRegistration(companyId, registrationData, originalDocuments = {}) {
  assertCompanyRegistrationValid(registrationData)

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user?.id) {
    throw new Error('You must be signed in to resubmit company registration.')
  }

  const existing = await getCompanyById(companyId)
  if (String(existing?.status || '').toLowerCase() !== 'rejected') {
    throw new Error('Only a rejected application can be updated and resubmitted.')
  }

  const adminRow = await getCompanyAdminById(user.id)
  if (adminRow?.company_id !== companyId) {
    throw new Error('You can only resubmit your own company application.')
  }

  try {
    await updateCompany(companyId, toCompanyPayload(registrationData, 'pending'))
  } catch (err) {
    throw mapCompanyWriteError(err)
  }

  await upsertCompanyAdmin({
    id: user.id,
    company_id: companyId,
    full_name: cleanString(registrationData?.admin?.full_name),
    email: cleanString(registrationData?.admin?.email),
    phone: cleanString(registrationData?.admin?.phone),
  })

  const nextDocs = registrationData?.documents || {}
  for (const documentType of COMPANY_DOCUMENT_TYPES) {
    let next = nextDocs[documentType] || null
    if (next && isFileLike(next) && !isUploadedDocMeta(next)) {
      next = await uploadCompanyDocument({ companyId, documentType, file: next })
    }
    await persistDocumentChange({
      companyId,
      documentType,
      previous: originalDocuments[documentType],
      next,
    })
  }

  return { companyId }
}
