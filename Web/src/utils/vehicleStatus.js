export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  OFF_ROAD: 'off_road',
}

export function normalizeVehicleStatus(value) {
  const s = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  return s === VEHICLE_STATUS.OFF_ROAD ? VEHICLE_STATUS.OFF_ROAD : VEHICLE_STATUS.ACTIVE
}

export function formatVehicleStatusLabel(value) {
  return normalizeVehicleStatus(value) === VEHICLE_STATUS.OFF_ROAD ? 'Off Road' : 'Active'
}

export function isVehicleOffRoad(value) {
  return normalizeVehicleStatus(value) === VEHICLE_STATUS.OFF_ROAD
}

export function isVehicleActive(value) {
  return normalizeVehicleStatus(value) === VEHICLE_STATUS.ACTIVE
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
