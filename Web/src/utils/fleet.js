export const FLEET = {
  COMPANY: 'company',
  PRIVATE: 'private',
}

export function normalizeFleet(value) {
  const s = String(value || '').trim().toLowerCase()
  return s === FLEET.PRIVATE ? FLEET.PRIVATE : FLEET.COMPANY
}

export function formatFleetLabel(value) {
  return normalizeFleet(value) === FLEET.PRIVATE ? 'Private' : 'Company'
}

export function isPrivateFleet(value) {
  return normalizeFleet(value) === FLEET.PRIVATE
}

export function isCompanyFleet(value) {
  return normalizeFleet(value) === FLEET.COMPANY
}

export function isDriverApproved(status) {
  return String(status || '').trim().toLowerCase() === 'approved'
}

/** PA DB status is `approve` (UI: Approved). Accept the driver-style synonym too. */
export function isPaApproved(status) {
  const s = String(status || '').trim().toLowerCase()
  return s === 'approve' || s === 'approved'
}

export function formatPaTypeLabel(value) {
  return normalizeFleet(value) === FLEET.PRIVATE ? 'Private PA' : 'Company PA'
}

export function isVehicleAssignedFlag(value) {
  return value === true
}
