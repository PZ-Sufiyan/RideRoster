import { supabase } from '../lib/supabaseClient'

export const COMPANY_DOCS_BUCKET = 'company-documents'

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const val = bytes / (1024 ** i)
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function isAllowedDocMime(mime) {
  return (
    mime === 'application/pdf' ||
    mime === 'image/jpeg' ||
    mime === 'image/png'
  )
}

export function assertValidCompanyDocFile(file, { maxBytes = 10 * 1024 * 1024 } = {}) {
  if (!file) throw new Error('No file selected.')
  if (!isAllowedDocMime(file.type)) throw new Error('File must be a PDF, JPG, or PNG.')
  if (file.size > maxBytes) throw new Error(`File must be <= ${formatBytes(maxBytes)}.`)
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function buildCompanyDocPath(companyId, documentType, file) {
  const safeName = (file?.name || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
  return `${companyId}/${documentType}/${randomId()}_${safeName}`
}

export async function uploadCompanyDocument({
  companyId,
  documentType,
  file,
  bucket = COMPANY_DOCS_BUCKET,
}) {
  assertValidCompanyDocFile(file)

  const filePath = buildCompanyDocPath(companyId, documentType, file)
  const { error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(filePath, file, { upsert: false, contentType: file.type })

  if (uploadError) throw uploadError

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath)
  const fileUrl = publicData?.publicUrl || ''

  if (!fileUrl) throw new Error('Uploaded but could not resolve public URL for document.')

  return {
    file_name: file.name,
    file_path: filePath,
    file_url: fileUrl,
    bucket,
  }
}

export async function removeCompanyDocument({
  filePath,
  bucket = COMPANY_DOCS_BUCKET,
}) {
  if (!filePath) return
  const { error } = await supabase.storage.from(bucket).remove([filePath])
  if (error) throw error
}

