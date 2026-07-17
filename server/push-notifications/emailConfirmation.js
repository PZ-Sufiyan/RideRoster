import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { createSupabaseAdminClient } from './supabaseClient.js'

const ALLOWED_MOBILE_ROLES = new Set(['driver', 'passenger_assistant'])

const DUPLICATE_EMAIL_MESSAGE =
  'An account with this email already exists. Use a different email or sign in.'

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

function mapDuplicateAuthError(err) {
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

function createAnonAuthClient() {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: `sb-reg-session-${Date.now()}`,
    },
    realtime: {
      transport: ws,
    },
  })
}

/**
 * Send signup confirmation email via GoTrue HTTP API (no supabase-js Realtime).
 */
export async function sendSignupConfirmationEmail(email, emailRedirectTo) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const baseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!baseUrl || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required to send confirmation email.')
  }

  const params = new URLSearchParams()
  if (emailRedirectTo) params.set('redirect_to', emailRedirectTo)
  const qs = params.toString()
  const endpoint = `${baseUrl}/auth/v1/resend${qs ? `?${qs}` : ''}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      type: 'signup',
      email: normalizedEmail,
    }),
  })

  if (!response.ok) {
    let message = `HTTP ${response.status}`
    try {
      const data = await response.json()
      message =
        data?.msg ||
        data?.error_description ||
        data?.message ||
        data?.error ||
        message
    } catch {
      /* keep status message */
    }
    throw new Error(
      `Confirmation email could not be sent: ${message}. ` +
        'Enable Confirm email and configure SMTP under Supabase Authentication settings.',
    )
  }
}

async function forceUnconfirmUser(supabaseAdmin, userId) {
  const { error: rpcError } = await supabaseAdmin.rpc('force_unconfirm_auth_user', {
    target_user: userId,
  })

  if (rpcError) {
    // Fallback for environments where the SQL helper is not installed yet.
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: false,
    })
    if (updateErr) {
      throw new Error(
        `Could not keep account unconfirmed: ${rpcError.message}. ` +
          'Run Web/src/schemas/force_unconfirm_auth_user.sql on the database.',
      )
    }
  }

  const { data: checked, error: getErr } =
    await supabaseAdmin.auth.admin.getUserById(userId)
  if (getErr) throw getErr

  if (checked?.user?.email_confirmed_at) {
    throw new Error(
      'Could not keep account unconfirmed after registration session. ' +
        'Run Web/src/schemas/force_unconfirm_auth_user.sql on the database.',
    )
  }
}

/**
 * Create a mobile Auth user the same way web Admin registration does:
 * email_confirm: false + explicit confirmation email.
 *
 * Also mints a short-lived registration session (password sign-in is blocked
 * for unconfirmed users on this GoTrue). Flow:
 * 1) create unconfirmed + send email
 * 2) temporarily confirm + sign in to get tokens
 * 3) force unconfirm again (SQL) so login stays blocked
 * 4) return tokens — JWT still works for profile/document writes
 */
export async function createUnconfirmedMobileUser({
  email,
  password,
  role,
  userMetadata = {},
  emailRedirectTo,
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedRole = String(role || '').trim().toLowerCase()

  if (!normalizedEmail) throw new Error('Email is required.')
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }
  if (!ALLOWED_MOBILE_ROLES.has(normalizedRole)) {
    throw new Error('Only driver and passenger_assistant registrations are supported.')
  }

  const redirectTo =
    String(emailRedirectTo || '').trim() || getEmailConfirmRedirectUrl(normalizedRole)

  const supabaseAdmin = createSupabaseAdminClient()
  const meta =
    userMetadata && typeof userMetadata === 'object' ? { ...userMetadata } : {}

  const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: String(password),
    email_confirm: false,
    app_metadata: { role: normalizedRole },
    user_metadata: {
      ...meta,
      role: normalizedRole,
      email: normalizedEmail,
    },
  })

  if (createErr) {
    const duplicate = mapDuplicateAuthError(createErr)
    if (duplicate) throw new Error(duplicate)
    throw createErr
  }

  const userId = createdAuth?.user?.id
  if (!userId) {
    throw new Error('Could not create auth user.')
  }

  if (createdAuth.user.email_confirmed_at) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    } catch {
      /* best effort */
    }
    throw new Error(
      'Auth created the account as already confirmed. ' +
        'Check GoTrue email confirmation settings on the server.',
    )
  }

  try {
    await sendSignupConfirmationEmail(normalizedEmail, redirectTo)
  } catch (emailErr) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    } catch {
      /* best effort */
    }
    throw emailErr
  }

  // Mint registration session (GoTrue blocks password login while unconfirmed).
  let accessToken
  let refreshToken
  try {
    const { error: tempConfirmErr } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true },
    )
    if (tempConfirmErr) throw tempConfirmErr

    const anon = createAnonAuthClient()
    const { data: signedIn, error: signInErr } = await anon.auth.signInWithPassword({
      email: normalizedEmail,
      password: String(password),
    })
    if (signInErr) throw signInErr
    if (!signedIn?.session?.access_token || !signedIn?.session?.refresh_token) {
      throw new Error('Could not create registration session.')
    }

    accessToken = signedIn.session.access_token
    refreshToken = signedIn.session.refresh_token

    await forceUnconfirmUser(supabaseAdmin, userId)
  } catch (sessionErr) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    } catch {
      /* best effort */
    }
    throw sessionErr
  }

  console.info('create-unconfirmed-mobile-user ok', {
    userId,
    email: normalizedEmail,
    role: normalizedRole,
  })

  return {
    ok: true,
    userId,
    email: normalizedEmail,
    role: normalizedRole,
    emailRedirectTo: redirectTo,
    access_token: accessToken,
    refresh_token: refreshToken,
  }
}
