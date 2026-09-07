export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  OFF_ROAD: 'off_road',
  INACTIVE: 'inactive',
}

export function normalizeVehicleStatus(value) {
  const s = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (s === VEHICLE_STATUS.OFF_ROAD) return VEHICLE_STATUS.OFF_ROAD
  if (s === VEHICLE_STATUS.INACTIVE) return VEHICLE_STATUS.INACTIVE
  return VEHICLE_STATUS.ACTIVE
}

export function formatVehicleStatusLabel(value) {
  const status = normalizeVehicleStatus(value)
  if (status === VEHICLE_STATUS.OFF_ROAD) return 'Off Road'
  if (status === VEHICLE_STATUS.INACTIVE) return 'Inactive'
  return 'Active'
}

export function isVehicleOffRoad(value) {
  return normalizeVehicleStatus(value) === VEHICLE_STATUS.OFF_ROAD
}

export function isVehicleActive(value) {
  return normalizeVehicleStatus(value) === VEHICLE_STATUS.ACTIVE
}

export function isVehicleInactive(value) {
  return normalizeVehicleStatus(value) === VEHICLE_STATUS.INACTIVE
}

export function vehicleStatusFromAction(action) {
  const map = {
    'Set Active': VEHICLE_STATUS.ACTIVE,
    'Set Off Road': VEHICLE_STATUS.OFF_ROAD,
    'Mark as Active': VEHICLE_STATUS.ACTIVE,
    'Mark as Off Road': VEHICLE_STATUS.OFF_ROAD,
    Active: VEHICLE_STATUS.ACTIVE,
    'Off Road': VEHICLE_STATUS.OFF_ROAD,
  }
  return map[action] ?? null
}
