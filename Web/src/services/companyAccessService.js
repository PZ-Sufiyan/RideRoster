import { supabase } from '../lib/supabaseClient'

const ACCESS_CACHE_KEY = 'rideRoster_companyAdminAccess_v1'

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase()
}

function readAccessCache(userId) {
  if (!userId) return null
  try {
    const raw = sessionStorage.getItem(ACCESS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.userId !== userId) return null
    if (!parsed.access) return null
    return parsed
  } catch {
    return null
  }
}

function writeAccessCache(userId, access, company) {
  if (!userId || !access) return
  try {
    sessionStorage.setItem(
      ACCESS_CACHE_KEY,
      JSON.stringify({
        userId,
        access,
        company: company || null,
        at: Date.now(),
      }),
    )
  } catch {
    // ignore quota / private mode
  }
}

export function clearCompanyAdminAccessCache() {
  try {
    sessionStorage.removeItem(ACCESS_CACHE_KEY)
  } catch {
    // ignore
  }
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
 * On network/read failure, reuses the last successful access for this user so
 * an offline blip does not bounce approved admins to /portal/pending.
 * @returns {{ access: 'no-company' | 'pending' | 'approved' | 'rejected', company: object | null }}
 */
export async function getCompanyAdminAccess() {
  const user = await getAuthUser()
  if (!user) {
    return { access: 'no-company', company: null }
  }

  const cached = readAccessCache(user.id)

  // Offline: do not treat a failed company lookup as "pending" (that redirects to /portal/pending).
  if (typeof navigator !== 'undefined' && navigator.onLine === false && cached?.access) {
    return { access: cached.access, company: cached.company || null }
  }

  const { data: row, error } = await supabase
    .from('company_admins')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  // Network / read failure: keep last known access (approved users stay in portal).
  if (error) {
    if (cached?.access) {
      return { access: cached.access, company: cached.company || null }
    }
    return { access: 'pending', company: null }
  }

  if (!row?.company_id) {
    const result = { access: 'no-company', company: null }
    writeAccessCache(user.id, result.access, result.company)
    return result
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, status, company_name, company_email')
    .eq('id', row.company_id)
    .maybeSingle()

  if (companyError) {
    if (cached?.access) {
      return { access: cached.access, company: cached.company || null }
    }
    return { access: 'pending', company: { id: row.company_id, status: 'pending' } }
  }

  if (!company) {
    const result = { access: 'pending', company: { id: row.company_id, status: 'pending' } }
    writeAccessCache(user.id, result.access, result.company)
    return result
  }

  const status = normalizeStatus(company.status)
  let access = 'pending'
  if (status === 'approved') access = 'approved'
  else if (status === 'rejected') access = 'rejected'

  const result = { access, company }
  writeAccessCache(user.id, result.access, result.company)
  return result
}

export function adminPortalPathForAccess(access) {
  if (access === 'approved') return '/portal/dashboard'
  if (access === 'pending') return '/portal/pending'
  if (access === 'rejected') return '/portal/rejected'
  return '/portal/register'
}
