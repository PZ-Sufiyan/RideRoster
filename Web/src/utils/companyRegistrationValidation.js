import { getCountries } from 'libphonenumber-js'
import { isPossiblePhoneNumber, parsePhoneNumber } from 'react-phone-number-input'

export const PERSON_NAME_MAX = 25
export const COMPANY_NAME_MAX = 30
export const ADDRESS_MAX = 50
export const IDENTIFIER_MIN = 4
export const IDENTIFIER_MAX = 20
export const AUTHORITY_MAX = 50
export const LANGUAGE_MAX = 30
export const WEBSITE_MAX = 200
export const EMAIL_MAX = 254

const PERSON_NAME_PATTERN = /^[\p{L}]+(?: [\p{L}]+)*$/u
const COMPANY_NAME_PATTERN =
  /^(?=.*[a-zA-Z0-9\p{L}].*[a-zA-Z0-9\p{L}])[ a-zA-Z0-9\p{L}&.,+()!@#$*'\-]+$/u
const ADDRESS_PATTERN =
  /^(?=.*(?:[a-zA-Z0-9\p{L}].*?){5})[ \-'a-zA-Z0-9\p{L}&.,+#/()!]+$/u
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9\-/]{4,20}$/
const AUTHORITY_PATTERN =
  /^(?=.*[\p{L}].*[\p{L}])[\p{L}0-9][ \p{L}0-9&.,/'()-]*$/u
const LANGUAGE_PATTERN = /^(?=.*[\p{L}])[\p{L}][ \p{L}()'/-]*$/u
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COVERAGE_WITH_COMMAS = /^£?\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/
const COVERAGE_PLAIN = /^£?\d{1,12}(?:\.\d{1,2})?$/

const COMPANY_TYPES = new Set(['small', 'medium', 'large'])
const ACTIVITIES = new Set([
  'General Private Hire',
  'School / SEND Transport',
  'Wheelchair Accessible (WAV)',
  'Corporate / Contract Services',
])
const FLEET_SIZES = new Set([1, 6, 16, 51, 100])

let cachedCountryNames = null

export function getCountryNameOptions() {
  if (cachedCountryNames) return cachedCountryNames
  const display = new Intl.DisplayNames(['en'], { type: 'region' })
  cachedCountryNames = getCountries()
    .map((code) => display.of(code))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
  return cachedCountryNames
}

function countryNameSet() {
  return new Set(getCountryNameOptions())
}

export function todayIsoDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function trimmed(value) {
  return String(value ?? '').trim()
}

export function validatePersonName(value, { required = true, label = 'Name' } = {}) {
  const v = trimmed(value)
  if (!v) return required ? `${label} is required.` : null
  if (v.length > PERSON_NAME_MAX) {
    return `${label} must be ${PERSON_NAME_MAX} characters or fewer.`
  }
  if (!PERSON_NAME_PATTERN.test(v)) {
    return `${label} can only include letters, with a single space between words.`
  }
  return null
}

export function validateCompanyName(value, { required = true } = {}) {
  const v = trimmed(value)
  if (!v) return required ? 'Company name is required.' : null
  if (v.length > COMPANY_NAME_MAX) {
    return `Company name must be ${COMPANY_NAME_MAX} characters or fewer.`
  }
  if (!COMPANY_NAME_PATTERN.test(v)) {
    return 'Enter a valid company name with at least 2 letters or numbers.'
  }
  return null
}

export function validateAddress(value, { required = true, label = 'Address' } = {}) {
  const v = trimmed(value).replace(/[\r\n]+/g, ' ')
  if (!v) return required ? `${label} is required.` : null
  if (v.length > ADDRESS_MAX) {
    return `${label} must be ${ADDRESS_MAX} characters or fewer.`
  }
  if (!ADDRESS_PATTERN.test(v)) {
    return `Enter a valid ${label.toLowerCase()} with at least 5 letters or numbers.`
  }
  return null
}

export function validateIdentifier(value, { required = true, label = 'Number' } = {}) {
  const v = trimmed(value)
  if (!v) return required ? `${label} is required.` : null
  if (!IDENTIFIER_PATTERN.test(v)) {
    return `${label} must be 4–20 letters, numbers, hyphens or slashes (no spaces).`
  }
  return null
}

export function validateAuthorityName(value, { required = false, label = 'Issuing authority' } = {}) {
  const v = trimmed(value)
  if (!v) return required ? `${label} is required.` : null
  if (v.length > AUTHORITY_MAX) {
    return `${label} must be ${AUTHORITY_MAX} characters or fewer.`
  }
  if (/\s{2}/.test(v) || !AUTHORITY_PATTERN.test(v)) {
    return `Enter a valid ${label.toLowerCase()}.`
  }
  return null
}

export function validatePreferredLanguage(value, { required = false } = {}) {
  const v = trimmed(value)
  if (!v) return required ? 'Preferred language is required.' : null
  if (v.length > LANGUAGE_MAX) {
    return `Preferred language must be ${LANGUAGE_MAX} characters or fewer.`
  }
  if (/\s{2}/.test(v) || !LANGUAGE_PATTERN.test(v)) {
    return 'Enter a valid language (e.g. English (UK)).'
  }
  return null
}

export function validateEmail(value, { required = true, label = 'Email address' } = {}) {
  const v = trimmed(value)
  if (!v) return required ? `${label} is required.` : null
  if (v.length > EMAIL_MAX) {
    return `${label} must be ${EMAIL_MAX} characters or fewer.`
  }
  if (!EMAIL_PATTERN.test(v)) {
    return `Enter a valid ${label.toLowerCase()}.`
  }
  return null
}

export function validateWebsite(value, { required = false } = {}) {
  const v = trimmed(value)
  if (!v) return required ? 'Website is required.' : null
  if (v.length > WEBSITE_MAX) {
    return `Website must be ${WEBSITE_MAX} characters or fewer.`
  }
  try {
    const url = new URL(v)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'Enter a valid URL (e.g. https://example.com).'
    }
    return null
  } catch {
    return 'Enter a valid URL (e.g. https://example.com).'
  }
}

export function validateCountry(value, { required = true } = {}) {
  const v = trimmed(value)
  if (!v) return required ? 'Country is required.' : null
  if (!countryNameSet().has(v)) {
    return 'Select a valid country from the list.'
  }
  return null
}

export function validateCoverageAmount(value, { required = false } = {}) {
  const v = trimmed(value).replace(/\s/g, '')
  if (!v) return required ? 'Coverage amount is required.' : null
  if (!COVERAGE_WITH_COMMAS.test(v) && !COVERAGE_PLAIN.test(v)) {
    return 'Enter a valid coverage amount (e.g. £5000000 or £5,000,000).'
  }
  return null
}

export function validateIssueDate(value, { required = true, label = 'Issue date' } = {}) {
  const v = trimmed(value)
  if (!v) return required ? `${label} is required.` : null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return `Enter a valid ${label.toLowerCase()}.`
  }
  if (v < '1900-01-01') {
    return `Enter a valid ${label.toLowerCase()}.`
  }
  if (v > todayIsoDate()) {
    return `${label} cannot be in the future.`
  }
  return null
}

function isAcceptablePhoneNumber(value, defaultCountry = 'GB') {
  const phone = trimmed(value)
  if (!phone) return false
  if (isPossiblePhoneNumber(phone)) return true
  try {
    const parsed = parsePhoneNumber(phone, defaultCountry)
    return Boolean(parsed?.isPossible?.())
  } catch {
    return false
  }
}

export function validatePhone(value, { required = true, label = 'Phone number' } = {}) {
  const phone = trimmed(value)
  if (!phone) return required ? `${label} is required.` : null
  if (!isAcceptablePhoneNumber(phone)) {
    return `Enter a valid ${label.toLowerCase()} for the selected country.`
  }
  return null
}

export function validateExpiryDate(value, { required = false, label = 'Expiry date' } = {}) {
  const v = trimmed(value)
  if (!v) return required ? `${label} is required.` : null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return `Enter a valid ${label.toLowerCase()}.`
  }
  if (v < todayIsoDate()) {
    return `${label} cannot be in the past.`
  }
  return null
}

function setError(errors, key, message) {
  if (message) errors[key] = message
}

export function getCompanyRegistrationErrors({ company = {}, admin = {}, documents = {} } = {}) {
  const errors = {}

  setError(errors, 'company_name', validateCompanyName(company.company_name))
  setError(
    errors,
    'company_registration_number',
    validateIdentifier(company.company_registration_number, { label: 'Registration number' }),
  )
  if (!trimmed(company.company_type)) {
    errors.company_type = 'Company type is required.'
  } else if (!COMPANY_TYPES.has(company.company_type)) {
    errors.company_type = 'Select a valid company type.'
  }
  setError(
    errors,
    'vat_number',
    validateIdentifier(company.vat_number, { required: false, label: 'VAT number' }),
  )
  if (!trimmed(company.primary_business_activity)) {
    errors.primary_business_activity = 'Primary business activity is required.'
  } else if (!ACTIVITIES.has(company.primary_business_activity)) {
    errors.primary_business_activity = 'Select a valid business activity.'
  }

  setError(
    errors,
    'company_address',
    validateAddress(company.company_address, { label: 'Registered office address' }),
  )
  setError(
    errors,
    'company_operating_address',
    validateAddress(company.company_operating_address, { label: 'Operating address' }),
  )
  setError(errors, 'company_country', validateCountry(company.company_country))
  setError(errors, 'company_phone', validatePhone(company.company_phone, { label: 'Phone number' }))
  setError(errors, 'company_email', validateEmail(company.company_email))
  setError(errors, 'company_website', validateWebsite(company.company_website))
  setError(
    errors,
    'company_preferred_language',
    validatePreferredLanguage(company.company_preferred_language),
  )

  setError(errors, 'full_name', validatePersonName(admin.full_name, { label: 'Admin name' }))
  setError(errors, 'email', validateEmail(admin.email, { label: 'Admin email' }))
  setError(errors, 'phone', validatePhone(admin.phone, { label: 'Admin phone' }))

  const fleet = Number(company.driver_estimate)
  if (
    company.driver_estimate === null
    || company.driver_estimate === undefined
    || company.driver_estimate === ''
    || !Number.isFinite(fleet)
  ) {
    errors.driver_estimate = 'Fleet size is required.'
  } else if (!FLEET_SIZES.has(fleet)) {
    errors.driver_estimate = 'Select a valid fleet size.'
  }

  setError(
    errors,
    'coioe_registration_number',
    validateIdentifier(company.coioe_registration_number, { label: 'Registration number' }),
  )
  setError(errors, 'coioe_issue_date', validateIssueDate(company.coioe_issue_date))
  if (!documents.certificate_of_incorporation) {
    errors.certificate_of_incorporation = 'Certificate of Incorporation is required.'
  }

  setError(
    errors,
    'cic_policy_number',
    validateIdentifier(company.cic_policy_number, { required: false, label: 'Policy number' }),
  )
  setError(
    errors,
    'cic_coverage_amount',
    validateCoverageAmount(company.cic_coverage_amount),
  )
  setError(
    errors,
    'cic_expiry_date',
    validateExpiryDate(company.cic_expiry_date, { label: 'Insurance expiry date' }),
  )
  setError(
    errors,
    'operator_licence_number',
    validateIdentifier(company.operator_licence_number, { required: false, label: 'Licence number' }),
  )
  setError(
    errors,
    'operator_licence_issuing_authority',
    validateAuthorityName(company.operator_licence_issuing_authority),
  )

  return errors
}

export function assertCompanyRegistrationValid(registrationData) {
  const errors = getCompanyRegistrationErrors(registrationData)
  const first = Object.values(errors)[0]
  if (first) throw new Error(first)
}
