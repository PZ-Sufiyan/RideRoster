import { supabase } from '../lib/supabaseClient'
import { mapLoginError } from '../utils/authEmailGuards'
import {
  passwordsMatch,
  validatePasswordRules,
} from '../utils/passwordRules'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

/**
 * Sends a recovery OTP to the email via Supabase Auth.
 * Email template must include {{ .Token }} (not only the link).
 */
export async function sendPasswordResetCode(email) {
  const normalized = normalizeEmail(email)
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalized)

  if (error) {
    throw new Error(mapLoginError(error))
  }

  return normalized
}

/**
 * Verifies the recovery OTP, sets the new password, then signs out.
 */
export async function resetPasswordWithCode({
  email,
  code,
  password,
  confirmPassword,
}) {
  const normalized = normalizeEmail(email)
  const token = String(code || '').trim()

  if (!normalized || !normalized.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }
  if (!token) {
    throw new Error('Please enter the code from your email.')
  }

  const passwordError = validatePasswordRules(password)
  if (passwordError) throw new Error(passwordError)

  const matchError = passwordsMatch(password, confirmPassword)
  if (matchError) throw new Error(matchError)

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: normalized,
    token,
    type: 'recovery',
  })

  if (verifyError) {
    const message = String(verifyError.message || '').toLowerCase()
    if (
      message.includes('otp') ||
      message.includes('token') ||
      message.includes('expired') ||
      message.includes('invalid')
    ) {
      throw new Error('Invalid or expired code. Please try again or resend.')
    }
    throw new Error(mapLoginError(verifyError))
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
  })

  if (updateError) {
    throw new Error(mapLoginError(updateError))
  }

  await supabase.auth.signOut()
  return true
}
