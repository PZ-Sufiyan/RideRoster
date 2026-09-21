import { supabase } from '../lib/supabaseClient'

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase()
}

/**
 * Prefer session from storage (immediate after sign-in). getUser() validates with the server
 * and can briefly fail right after navigation.
 */
export async function getAuthUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) return session.user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

/**
 * Where an admin belongs in the portal based on company link + companies.status.
 * @returns {{ access: 'no-company' | 'pending' | 'approved' | 'rejected', company: object | null }}
 */
export async function getCompanyAdminAccess() {
  const user = await getAuthUser()
  if (!user) {
    return { access: 'no-company', company: null }
  }

  const { data: row, error } = await supabase
    .from('company_admins')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  // Unknown read failure: keep the admin off the dashboard.
  if (error) {
    return { access: 'pending', company: null }
  }

  if (!row?.company_id) {
    return { access: 'no-company', company: null }
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, status, company_name, company_email')
    .eq('id', row.company_id)
    .maybeSingle()

  if (companyError || !company) {
    return { access: 'pending', company: { id: row.company_id, status: 'pending' } }
  }
  const status = normalizeStatus(company.status)

  if (status === 'approved') {
    return { access: 'approved', company }
  }
  if (status === 'rejected') {
    return { access: 'rejected', company }
  }
  return { access: 'pending', company }
}

export function adminPortalPathForAccess(access) {
  if (access === 'approved') return '/portal/dashboard'
  if (access === 'pending') return '/portal/pending'
  if (access === 'rejected') return '/portal/rejected'
  return '/portal/register'
}
