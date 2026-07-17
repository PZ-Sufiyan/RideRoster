import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from './supabaseClient.js'

const ALLOWED_MOBILE_ROLES = new Set(['driver', 'passenger_assistant'])

function getAppOrigin() {
  const fromEnv = String(process.env.APP_URL || '')
    .trim()
    .replace(/\/$/, '')
  return fromEnv || 'https://nst-sch.com'
}

export function getEmailConfirmRedirectUrl(role) {
  const normalized = String(role || '').trim().toLowerCase()
  const params = new URLSearchParams()
  if (normalized) params.set('role', normalized)
  const qs = params.toString()
  return `${getAppOrigin()}/auth/confirmed${qs ? `?${qs}` : ''}`
}

/**
 * Send signup confirmation email via a disposable anon client so the
 * caller's session (if any) is not disturbed.
 */
export async function sendSignupConfirmationEmail(email, emailRedirectTo) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const mailClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: 'sb-auth-mailer-temp',
    },
  })

  const { error } = await mailClient.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  })

  if (error) {
    const message = String(error.message || '')
    throw new Error(
      `Confirmation email could not be sent: ${message}. ` +
        'Enable Confirm email and configure SMTP under Supabase Authentication settings.',
    )
  }
}

/**
 * Force the Auth user to remain unconfirmed and send the confirmation email.
 * Matches the web Admin registration policy (email_confirm: false + resend).
 *
 * If the email cannot be sent, the Auth user is deleted so registration can
 * be retried cleanly.
 */
export async function requireEmailConfirmationForUser({
  user,
  role,
  emailRedirectTo,
}) {
  const normalizedRole = String(role || '').trim().toLowerCase()
  if (!ALLOWED_MOBILE_ROLES.has(normalizedRole)) {
    throw new Error('Only driver and passenger_assistant registrations are supported.')
  }

  const email = String(user.email || '').trim().toLowerCase()
  if (!email) {
    throw new Error('Authenticated user has no email address.')
  }

  const redirectTo =
    String(emailRedirectTo || '').trim() || getEmailConfirmRedirectUrl(normalizedRole)

  const supabaseAdmin = createSupabaseAdminClient()
  const existingAppMeta =
    user.app_metadata && typeof user.app_metadata === 'object' ? user.app_metadata : {}
  const existingUserMeta =
    user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {}

  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email_confirm: false,
    app_metadata: {
      ...existingAppMeta,
      role: normalizedRole,
    },
    user_metadata: {
      ...existingUserMeta,
      role: normalizedRole,
    },
  })

  if (updateErr) {
    throw updateErr
  }

  try {
    await sendSignupConfirmationEmail(email, redirectTo)
  } catch (emailErr) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    } catch {
      /* best effort */
    }
    throw emailErr
  }

  return {
    ok: true,
    userId: user.id,
    email,
    role: normalizedRole,
    emailRedirectTo: redirectTo,
  }
}
