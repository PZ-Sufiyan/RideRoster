const DRAFT_STORAGE_KEY = 'rideRoster:companyRegistrationDraft:v1'

function safeParseJson(v) {
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createTempCompanyId() {
  return `registration-temp-${randomId()}`
}

export function loadCompanyRegistrationDraft() {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) return null
  const parsed = safeParseJson(raw)
  if (!parsed || typeof parsed !== 'object') return null
  return parsed
}

export function saveCompanyRegistrationDraft(draft) {
  if (!isBrowser()) return
  window.localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({
      ...draft,
      savedAt: Date.now(),
    })
  )
}

export function clearCompanyRegistrationDraft() {
  if (!isBrowser()) return
  window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

