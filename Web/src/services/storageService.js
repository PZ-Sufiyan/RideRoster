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
    mime === 'image/png' ||
    mime === 'image/webp'
  )
}

export function assertValidCompanyDocFile(file, { maxBytes = 10 * 1024 * 1024 } = {}) {
  if (!file) throw new Error('No file selected.')
  if (!isAllowedDocMime(file.type)) throw new Error('File must be a PDF, JPG, PNG, or WebP.')
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

/**
 * Paths under `{companyId}/drivers/{driverId}/...` or `{companyId}/vehicles/{vehicleId}/...`
 * so storage policies can scope by company.
 */
export function buildDriverVehicleDocPath({ companyId, kind, scopeId, documentType, file }) {
  const safeName = (file?.name || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
  const segment = kind === 'driver' ? 'drivers' : 'vehicles'
  return `${companyId}/${segment}/${scopeId}/${documentType}/${randomId()}_${safeName}`
}

export function buildPassengerAssistantDocPath({ companyId, assistantId, documentType, file }) {
  const safeName = (file?.name || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
  return `${companyId}/passenger-assistants/${assistantId}/${documentType}/${randomId()}_${safeName}`
}

export function buildPassengerAssistantProfilePath({ companyId, assistantId, file }) {
  const safeName = (file?.name || 'profile')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
  return `${companyId}/passenger-assistants/${assistantId}/profile/${randomId()}_${safeName}`
}

export function assertValidProfileImageFile(file, { maxBytes = 8 * 1024 * 1024 } = {}) {
  if (!file) throw new Error('No file selected.')
  const ok =
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/gif' ||
    file.type === 'image/webp'
  if (!ok) throw new Error('Profile image must be JPEG, PNG, GIF, or WebP.')
  if (file.size > maxBytes) throw new Error(`Image must be <= ${formatBytes(maxBytes)}.`)
}

export async function uploadPassengerAssistantDocument({
  companyId,
  assistantId,
  documentType,
  file,
  bucket = COMPANY_DOCS_BUCKET,
}) {
  assertValidCompanyDocFile(file)

  const filePath = buildPassengerAssistantDocPath({ companyId, assistantId, documentType, file })
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

export async function uploadPassengerAssistantProfileImage({
  companyId,
  assistantId,
  file,
  bucket = COMPANY_DOCS_BUCKET,
}) {
  assertValidProfileImageFile(file)

  const filePath = buildPassengerAssistantProfilePath({ companyId, assistantId, file })
  const { error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(filePath, file, { upsert: false, contentType: file.type })

  if (uploadError) throw uploadError

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath)
  const fileUrl = publicData?.publicUrl || ''

  if (!fileUrl) throw new Error('Uploaded but could not resolve public URL for profile image.')

  return {
    file_name: file.name,
    file_path: filePath,
    file_url: fileUrl,
    bucket,
  }
}

export async function uploadDriverVehicleDocument({
  companyId,
  kind,
  scopeId,
  documentType,
  file,
  bucket = COMPANY_DOCS_BUCKET,
}) {
  assertValidCompanyDocFile(file)

  const filePath = buildDriverVehicleDocPath({ companyId, kind, scopeId, documentType, file })
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

