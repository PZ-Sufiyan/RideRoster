import {
  createCompany,
  createCompanyDocument,
  deleteCompany,
  upsertCompanyAdmin,
} from './companyService'
import { uploadCompanyDocument, removeCompanyDocument } from './storageService'
import { supabase } from '../lib/supabaseClient'

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

export async function submitCompanyRegistration(registrationData) {
  const uploaded = []
  const newlyUploaded = []
  let createdCompany = null

  try {
    const companyPayload = {
      company_name: cleanString(registrationData?.company?.company_name),
      company_registration_number: cleanString(registrationData?.company?.company_registration_number),
      company_type: cleanString(registrationData?.company?.company_type),

      company_address: cleanString(registrationData?.company?.company_address),
      company_operating_address: cleanString(registrationData?.company?.company_operating_address),
      company_country: cleanString(registrationData?.company?.company_country || 'United Kingdom'),
      company_email: cleanString(registrationData?.company?.company_email),
      company_phone: cleanString(registrationData?.company?.company_phone),
      company_website: cleanString(registrationData?.company?.company_website || ''), // schema is NOT NULL
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

      status: 'pending',
    }

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

