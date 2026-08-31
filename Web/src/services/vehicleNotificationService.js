import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import {
  createUserNotification,
  NOTIFICATION_TYPE_VEHICLE_ASSIGNED,
  NOTIFICATION_TYPE_VEHICLE_UNASSIGNED,
  NOTIFICATION_TYPE_VEHICLE_OFF_ROAD,
} from './userNotificationService'

export const PORTAL_VEHICLE_EVENT = {
  ASSIGNED: 'vehicle_assigned',
  UNASSIGNED: 'vehicle_unassigned',
  SET_ACTIVE: 'vehicle_set_active',
  OFF_ROAD: 'vehicle_off_road',
}

export function formatVehicleLabel(vehicle) {
  const name = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ').trim()
  const plate = vehicle?.taxi_license_plate_number || vehicle?.registration_number
  if (name && plate) return `${name} (${plate})`
  return name || plate || 'Vehicle'
}

export function formatDriverName(driver) {
  return [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim() || 'Driver'
}

async function getActorId() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id || null
}

async function loadDriver(driverId) {
  if (!driverId) return null
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function notifyDriver({
  driverId,
  companyId,
  notificationType,
  title,
  body,
  vehicleId,
  payload = {},
}) {
  if (!driverId) return null
  return createUserNotification({
    userId: driverId,
    companyId,
    notificationType,
    title,
    body,
    referenceId: vehicleId || null,
    payload: {
      vehicle_id: vehicleId || null,
      ...payload,
    },
  })
}

async function insertPortalEvent({
  companyId,
  vehicleId,
  driverId = null,
  eventType,
  title,
  body,
  payload = {},
}) {
  if (!companyId || !vehicleId) return null
  const actorId = await getActorId()
  const { data, error } = await supabaseAdmin
    .from('vehicle_event_notifications')
    .insert({
      company_id: companyId,
      vehicle_id: vehicleId,
      driver_id: driverId || null,
      actor_id: actorId,
      event_type: eventType,
      title,
      body,
      payload,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

function warn(label, err) {
  console.warn(`${label}:`, err?.message || err)
}

/**
 * Driver push + in-app, plus portal in-app for company admins / sub-admins.
 */
export async function notifyVehicleAssigned({ companyId, vehicle, driverId, driver = null }) {
  try {
    const driverRow = driver?.id ? driver : await loadDriver(driverId)
    if (!driverRow?.id || !vehicle?.id) return

    const label = formatVehicleLabel(vehicle)
    const driverName = formatDriverName(driverRow)
    const payload = {
      event: PORTAL_VEHICLE_EVENT.ASSIGNED,
      vehicle_label: label,
      driver_name: driverName,
      taxi_license_plate_number: vehicle.taxi_license_plate_number || null,
    }

    await notifyDriver({
      driverId: driverRow.id,
      companyId,
      notificationType: NOTIFICATION_TYPE_VEHICLE_ASSIGNED,
      title: 'Vehicle Assigned',
      body: `You have been assigned to ${label}.`,
      vehicleId: vehicle.id,
      payload,
    })

    await insertPortalEvent({
      companyId,
      vehicleId: vehicle.id,
      driverId: driverRow.id,
      eventType: PORTAL_VEHICLE_EVENT.ASSIGNED,
      title: 'Vehicle Assigned:',
      body: `${driverName} was assigned to ${label}.`,
      payload,
    })
  } catch (err) {
    warn('Vehicle assigned notification failed', err)
  }
}

/**
 * Full unassign flow: driver push + in-app, portal in-app for admins / sub-admins.
 */
export async function notifyVehicleUnassigned({
  companyId,
  vehicle,
  driverId,
  driver = null,
  driverBody = null,
}) {
  try {
    const driverRow = driver?.id ? driver : await loadDriver(driverId)
    if (!driverRow?.id || !vehicle?.id) return

    const label = formatVehicleLabel(vehicle)
    const driverName = formatDriverName(driverRow)
    const payload = {
      event: PORTAL_VEHICLE_EVENT.UNASSIGNED,
      vehicle_label: label,
      driver_name: driverName,
      taxi_license_plate_number: vehicle.taxi_license_plate_number || null,
    }

    await notifyDriver({
      driverId: driverRow.id,
      companyId,
      notificationType: NOTIFICATION_TYPE_VEHICLE_UNASSIGNED,
      title: 'Vehicle Unassigned',
      body: driverBody || `You have been unassigned from ${label}.`,
      vehicleId: vehicle.id,
      payload,
    })

    await insertPortalEvent({
      companyId,
      vehicleId: vehicle.id,
      driverId: driverRow.id,
      eventType: PORTAL_VEHICLE_EVENT.UNASSIGNED,
      title: 'Driver Unassigned:',
      body: `${driverName} was unassigned from ${label}.`,
      payload,
    })
  } catch (err) {
    warn('Vehicle unassigned notification failed', err)
  }
}

/**
 * Driver unassign notification when vehicle is set Off Road (company fleet).
 */
export async function notifyVehicleOffRoadThenUnassign({ companyId, vehicle, driverId, driver = null }) {
  await notifyVehicleUnassigned({
    companyId,
    vehicle,
    driverId,
    driver,
    driverBody: 'You have been unassigned from this vehicle.',
  })
}

/**
 * Portal in-app for admins / sub-admins when a vehicle is set Off Road.
 */
export async function notifyVehicleOffRoadForAdmins({ companyId, vehicle }) {
  try {
    if (!vehicle?.id || !companyId) return
    const label = formatVehicleLabel(vehicle)
    await insertPortalEvent({
      companyId,
      vehicleId: vehicle.id,
      driverId: vehicle.driver_id || null,
      eventType: PORTAL_VEHICLE_EVENT.OFF_ROAD,
      title: 'Vehicle Set to Off Road:',
      body: `${label} has been set to Off Road.`,
      payload: {
        event: PORTAL_VEHICLE_EVENT.OFF_ROAD,
        vehicle_label: label,
        taxi_license_plate_number: vehicle.taxi_license_plate_number || null,
      },
    })
  } catch (err) {
    warn('Vehicle off-road admin notification failed', err)
  }
}

/**
 * Driver notified once when swapped from one vehicle to another; admins get assign/unassign events.
 */
export async function notifyVehicleSwapped({ companyId, fromVehicle, toVehicle, driverId, driver = null }) {
  try {
    const driverRow = driver?.id ? driver : await loadDriver(driverId)
    if (!driverRow?.id || !fromVehicle?.id || !toVehicle?.id) return

    const fromLabel = formatVehicleLabel(fromVehicle)
    const toLabel = formatVehicleLabel(toVehicle)
    const driverName = formatDriverName(driverRow)

    await notifyDriver({
      driverId: driverRow.id,
      companyId,
      notificationType: NOTIFICATION_TYPE_VEHICLE_ASSIGNED,
      title: 'Vehicle Changed',
      body: `You have been removed from ${fromLabel} and assigned to ${toLabel}.`,
      vehicleId: toVehicle.id,
      payload: {
        event: PORTAL_VEHICLE_EVENT.ASSIGNED,
        from_vehicle_id: fromVehicle.id,
        from_vehicle_label: fromLabel,
        vehicle_label: toLabel,
        driver_name: driverName,
      },
    })

    await insertPortalEvent({
      companyId,
      vehicleId: fromVehicle.id,
      driverId: driverRow.id,
      eventType: PORTAL_VEHICLE_EVENT.UNASSIGNED,
      title: 'Driver Unassigned:',
      body: `${driverName} was unassigned from ${fromLabel}.`,
      payload: {
        event: PORTAL_VEHICLE_EVENT.UNASSIGNED,
        vehicle_label: fromLabel,
        driver_name: driverName,
      },
    })

    await insertPortalEvent({
      companyId,
      vehicleId: toVehicle.id,
      driverId: driverRow.id,
      eventType: PORTAL_VEHICLE_EVENT.ASSIGNED,
      title: 'Vehicle Assigned:',
      body: `${driverName} was assigned to ${toLabel}.`,
      payload: {
        event: PORTAL_VEHICLE_EVENT.ASSIGNED,
        vehicle_label: toLabel,
        driver_name: driverName,
      },
    })
  } catch (err) {
    warn('Vehicle swap notification failed', err)
  }
}

/**
 * Portal in-app only. Drivers are not notified. Does not assign a driver.
 */
export async function notifyVehicleSetActive({ companyId, vehicle }) {
  try {
    if (!vehicle?.id || !companyId) return
    const label = formatVehicleLabel(vehicle)
    await insertPortalEvent({
      companyId,
      vehicleId: vehicle.id,
      driverId: null,
      eventType: PORTAL_VEHICLE_EVENT.SET_ACTIVE,
      title: 'Vehicle Set to Active:',
      body: `${label} has been set to Active.`,
      payload: {
        event: PORTAL_VEHICLE_EVENT.SET_ACTIVE,
        vehicle_label: label,
        taxi_license_plate_number: vehicle.taxi_license_plate_number || null,
      },
    })
  } catch (err) {
    warn('Vehicle set-active notification failed', err)
  }
}
