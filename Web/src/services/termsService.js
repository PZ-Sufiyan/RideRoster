import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminAccess, getAuthUser } from './companyAccessService'
import { toUtcIso } from '../utils/dateTime'
import { TERMS_AUDIENCE_LIST } from '../utils/termsAudiences'

const TERMS_SELECT =
  'id, company_id, audience, version, title, content, published_at, created_at, updated_at, created_by'

const TERMS_TITLE = 'Terms & Conditions'

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
    .order('published_at', { ascending: false, nullsFirst: false })

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
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function publishTermsVersion({
  audience,
  version,
  content,
  createdByUserId,
}) {
  const { companyId } = await assertApprovedCompanyAdmin()

  const trimmedVersion = String(version || '').trim()
  if (!trimmedVersion) {
    throw new Error('Version is required.')
  }

  const trimmedContent = String(content || '').trim()
  if (!trimmedContent) {
    throw new Error('Terms content is required.')
  }

  const { data: existing, error: dupErr } = await supabase
    .from('terms_and_conditions')
    .select('id')
    .eq('company_id', companyId)
    .eq('audience', audience)
    .eq('version', trimmedVersion)
    .maybeSingle()

  if (dupErr) throw dupErr
  if (existing) {
    throw new Error(
      `Version "${trimmedVersion}" already exists for this user type. Choose a different version.`,
    )
  }

  const now = toUtcIso()
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .insert({
      company_id: companyId,
      audience,
      version: trimmedVersion,
      title: TERMS_TITLE,
      content: trimmedContent,
      published_at: now,
      updated_at: now,
      created_by: createdByUserId || null,
    })
    .select(TERMS_SELECT)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        `Version "${trimmedVersion}" already exists for this user type. Choose a different version.`,
      )
    }
    throw error
  }
  return data
}
