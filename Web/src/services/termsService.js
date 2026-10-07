import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminAccess, getAuthUser } from './companyAccessService'
import { toUtcIso } from '../utils/dateTime'
import { TERMS_AUDIENCE_LIST } from '../utils/termsAudiences'

const TERMS_SELECT =
  'id, company_id, audience, version, title, content, published_at, created_at, updated_at, created_by'

async function assertApprovedCompanyAdmin() {
  const access = await getCompanyAdminAccess()
  if (access.access !== 'approved' || !access.company?.id) {
    throw new Error('You must be an approved company admin to manage Terms & Conditions.')
  }

  const user = await getAuthUser()
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role ?? null
  if (role !== 'admin') {
    throw new Error('Only company admins can manage Terms & Conditions.')
  }

  return { companyId: access.company.id, user }
}

export async function getTermsSummaryByAudience() {
  const { companyId } = await assertApprovedCompanyAdmin()

  const { data, error } = await supabase
    .from('terms_and_conditions')
    .select(TERMS_SELECT)
    .eq('company_id', companyId)
    .not('published_at', 'is', null)
    .order('audience', { ascending: true })
    .order('version', { ascending: false })

  if (error) throw error

  const latestByAudience = {}
  for (const row of data || []) {
    if (!latestByAudience[row.audience]) {
      latestByAudience[row.audience] = row
    }
  }

  return TERMS_AUDIENCE_LIST.map((audience) => ({
    audience,
    latest: latestByAudience[audience] || null,
  }))
}

export async function listTermsVersionsForAudience(audience) {
  const { companyId } = await assertApprovedCompanyAdmin()

  const { data, error } = await supabase
    .from('terms_and_conditions')
    .select(TERMS_SELECT)
    .eq('company_id', companyId)
    .eq('audience', audience)
    .order('version', { ascending: false })

  if (error) throw error
  return data || []
}

export async function publishTermsVersion({
  audience,
  title,
  content,
  createdByUserId,
}) {
  const { companyId } = await assertApprovedCompanyAdmin()

  const trimmedContent = String(content || '').trim()
  if (!trimmedContent) {
    throw new Error('Terms content is required.')
  }

  const { data: nextVersion, error: versionErr } = await supabase.rpc(
    'next_terms_version',
    { p_company_id: companyId, p_audience: audience },
  )
  if (versionErr) throw versionErr

  const version = Number(nextVersion)
  if (!Number.isFinite(version) || version < 1) {
    throw new Error('Could not determine next version number.')
  }

  const now = toUtcIso()
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .insert({
      company_id: companyId,
      audience,
      version,
      title: String(title || 'Terms & Conditions').trim() || 'Terms & Conditions',
      content: trimmedContent,
      published_at: now,
      updated_at: now,
      created_by: createdByUserId || null,
    })
    .select(TERMS_SELECT)
    .single()

  if (error) throw error
  return data
}
