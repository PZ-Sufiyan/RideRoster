import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { getEmailConfirmRedirectUrl } from './authRedirects'

export const EMAIL_CONFIRM_REQUIRED_MESSAGE =
  'Please check your email and confirm your account before logging in.'

export const DUPLICATE_EMAIL_MESSAGE =
  'An account with this email already exists. Use a different email or sign in.'

export const LOGIN_MSG = {
  network: 'Connection problem. Check your internet and try again.',
  credentials: 'Incorrect email or password.',
  emailUnconfirmed: EMAIL_CONFIRM_REQUIRED_MESSAGE,
  server: 'Something went wrong on our side. Please try again in a moment.',
  generic: 'Unable to sign in right now. Please try again.',
}

/**
 * Map any login/auth failure to a short user-facing message (no technical text).
 */
export function mapLoginError(err, fallbackRoleMessage) {
  if (fallbackRoleMessage) return fallbackRoleMessage

  const message = String(err?.message || err || '').toLowerCase()
  const name = String(err?.name || '').toLowerCase()
  const status = err?.status ?? err?.statusCode ?? err?.code

  if (
    message.includes('confirm your email') ||
    message.includes('email not confirmed') ||
    message.includes('email_not_confirmed') ||
    message.includes('check your email and confirm')
  ) {
    return LOGIN_MSG.emailUnconfirmed
  }

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('wrong password') ||
    message.includes('user not found') ||
    status === 400
  ) {
    return LOGIN_MSG.credentials
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('network error') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('offline') ||
    message.includes('err_connection') ||
    message.includes('load failed') ||
    name === 'typeerror' ||
    name === 'aborterror'
  ) {
    return LOGIN_MSG.network
  }

  if (
    message.includes('server') ||
    message.includes('internal') ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return LOGIN_MSG.server
  }

  // Never surface raw/technical Auth errors in the UI.
  return LOGIN_MSG.generic
}

/**
 * True when Supabase has recorded email confirmation.
 */
export function isEmailConfirmed(user) {
  return Boolean(user?.email_confirmed_at)
}

/**
 * Detect fake/obfuscated signUp responses for an already-registered email
 * (when Confirm email is enabled).
 */
export function isDuplicateSignUpResponse(data) {
  const user = data?.user
  if (!user) return false
  const identities = user.identities
  return Array.isArray(identities) && identities.length === 0
}

/**
 * Map Auth / Admin API errors that mean the email is taken.
 */
export function mapDuplicateAuthError(err) {
  if (!err) return null
  const message = String(err.message || '').toLowerCase()
  const code = String(err.code || err.error_code || '').toLowerCase()
  const status = err.status ?? err.statusCode

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message.includes('already been registered') ||
    message.includes('already registered') ||
    message.includes('user already exists') ||
    message.includes('email address has already') ||
    (status === 422 && message.includes('email'))
  ) {
    return DUPLICATE_EMAIL_MESSAGE
  }
  return null
}

/**
 * After password login: block unconfirmed accounts and clear the session.
 */
export async function requireConfirmedEmailOrSignOut(user) {
  if (isEmailConfirmed(user)) return
  await supabase.auth.signOut()
  throw new Error(EMAIL_CONFIRM_REQUIRED_MESSAGE)
}

/**
 * Create Auth user that must confirm email before login.
 * Sends the signup confirmation email (requires Confirm email + working SMTP).
 */
export async function createAuthUserRequiringEmailConfirm({
  email,
  password,
  appMetadata = {},
  userMetadata = {},
  emailRedirectTo,
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Email is required.')
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  const role = appMetadata?.role || userMetadata?.role || ''
  const redirectTo = emailRedirectTo || getEmailConfirmRedirectUrl(role)

  const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: false,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  })

  if (createErr) {
    const duplicate = mapDuplicateAuthError(createErr)
    if (duplicate) throw new Error(duplicate)
    throw createErr
  }

  if (!createdAuth?.user?.id) {
    throw new Error('Could not create auth user.')
  }

  try {
    await sendSignupConfirmationEmail(normalizedEmail, redirectTo)
  } catch (emailErr) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id)
    } catch {
      /* best effort */
    }
    throw emailErr
  }

  return {
    user: createdAuth.user,
    userId: createdAuth.user.id,
    email: normalizedEmail,
  }
}

/**
 * Ask Supabase Auth to send / resend the signup confirmation email.
 * Uses a disposable anon client so the logged-in admin session is untouched.
 */
export async function sendSignupConfirmationEmail(email, emailRedirectTo) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
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
      `Account was created but the confirmation email could not be sent: ${message}. ` +
        'Enable Confirm email and configure SMTP under Supabase Authentication settings.'
    )
  }
}
