/**
 * Public web origin used in auth emails (confirm / reset redirects).
 * Prefer VITE_APP_URL so local admin tools still send production-safe links.
 */
export function getAppOrigin() {
  const fromEnv = String(import.meta.env.VITE_APP_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return 'https://nst-sch.com'
}

/**
 * Where the confirmation link should land after Supabase verifies the token.
 * Query `role` is a fallback if the session is missing when the page loads.
 */
export function getEmailConfirmRedirectUrl(role) {
  const normalized = String(role || '').trim().toLowerCase()
  const params = new URLSearchParams()
  if (normalized) params.set('role', normalized)
  const qs = params.toString()
  return `${getAppOrigin()}/auth/confirmed${qs ? `?${qs}` : ''}`
}

/**
 * Post-confirm destination (login pages / public home).
 */
export function getPostConfirmDestination(role) {
  switch (String(role || '').trim().toLowerCase()) {
    case 'admin':
      return '/portal/login?verified=1'
    case 'subadmin':
      return '/team/login?verified=1'
    case 'superadmin':
      return '/platform/login?verified=1'
    case 'driver':
    case 'passenger_assistant':
      return '/home?verified=1'
    default:
      return '/home?verified=1'
  }
}
