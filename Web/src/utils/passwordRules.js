/** Password: 8–12 chars, upper, lower, digit, symbol. */

const HAS_LOWER = /[a-z]/
const HAS_UPPER = /[A-Z]/
const HAS_DIGIT = /[0-9]/
const HAS_SYMBOL = /[^A-Za-z0-9]/

export const PASSWORD_RULES_HINT =
  'Password must be 8–12 characters and include at least one uppercase letter, one lowercase letter, one number, and one symbol.'

export function validatePasswordRules(password) {
  const value = password ?? ''

  if (!value) return 'Password is required.'
  if (value.length < 8 || value.length > 12) {
    return 'Password must be between 8 and 12 characters.'
  }
  if (!HAS_LOWER.test(value)) {
    return 'Password must include at least one lowercase letter.'
  }
  if (!HAS_UPPER.test(value)) {
    return 'Password must include at least one uppercase letter.'
  }
  if (!HAS_DIGIT.test(value)) {
    return 'Password must include at least one number.'
  }
  if (!HAS_SYMBOL.test(value)) {
    return 'Password must include at least one symbol.'
  }
  return null
}

export function passwordsMatch(password, confirm) {
  if (!(confirm ?? '')) return 'Please confirm your password.'
  if (password !== confirm) return 'Password and confirm password must match.'
  return null
}
