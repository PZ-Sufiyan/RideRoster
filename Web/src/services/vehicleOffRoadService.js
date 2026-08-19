import { supabaseAdmin } from '../lib/supabaseAdmin'
import { FLEET, isCompanyFleet, isPrivateFleet } from '../utils/fleet'
import { VEHICLE_STATUS, isVehicleActive } from '../utils/vehicleStatus'
import {
  getBlockingJobsForDriver,
  getCurrentCompanyId,
} from './vehicleAssignmentService'
import {
  cancelJobById,
  updateJobAssignedDriver,
  validateDriverAssignment,
} from './jobService'

function nowIso() {
  return new Date().toISOString()
}

function vehicleLabel(v) {
  const name = [v?.make, v?.model].filter(Boolean).join(' ').trim()
  return name || v?.taxi_license_plate_number || v?.registration_number || 'Vehicle'
}

export function summarizeBlockingJobs(jobs) {
  if (!jobs?.length) return 'a job'
  if (jobs.length === 1) return `"${jobs[0].job_name || 'a job'}"`
  const listed = jobs.slice(0, 2).map((j) => `"${j.job_name || 'a job'}"`).join(', ')
  if (jobs.length === 2) return listed
  return `${listed} and ${jobs.length - 2} more`
}

async function loadVehicleInCompany(vehicleId, companyId) {
  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Vehicle not found.')
  return data
}

async function setDriverVehicleAssigned(driverId, assigned) {
  const { error } = await supabaseAdmin
    .from('drivers')
    .update({ vehicle_assigned: assigned, updated_at: nowIso() })
    .eq('id', driverId)
  if (error) throw error
}

async function applyOffRoad({ vehicle, unassignDriver }) {
  const previousDriverId = vehicle.driver_id
  const shouldUnassign = Boolean(unassignDriver && previousDriverId && isCompanyFleet(vehicle.fleet))

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .update({
      status: VEHICLE_STATUS.OFF_ROAD,
      driver_id: shouldUnassign ? null : previousDriverId,
      updated_at: nowIso(),
    })
    .eq('id', vehicle.id)
    .eq('company_id', vehicle.company_id)
    .select()
    .single()
  if (error) throw error

  if (shouldUnassign) {
    try {
      await setDriverVehicleAssigned(previousDriverId, false)
    } catch (err) {
      await supabaseAdmin
        .from('vehicles')
        .update({
          driver_id: previousDriverId,
          status: vehicle.status || VEHICLE_STATUS.ACTIVE,
          updated_at: nowIso(),
        })
        .eq('id', vehicle.id)
      throw err
    }
  }

  return {
    vehicle: data,
    unassignedDriverId: shouldUnassign ? previousDriverId : null,
  }
}

/**
 * If the assigned driver is on a job, returns { blocked: true, jobs }.
 * Otherwise marks the vehicle Off Road and unassigns a company driver.
 */
export async function requestVehicleOffRoad({ companyId, vehicleId }) {
  if (!companyId || !vehicleId) throw new Error('Company and vehicle are required.')
  const vehicle = await loadVehicleInCompany(vehicleId, companyId)

  if (!vehicle.driver_id) {
    const result = await applyOffRoad({ vehicle, unassignDriver: false })
    return { blocked: false, action: 'marked', ...result }
  }

  const jobs = await getBlockingJobsForDriver(companyId, vehicle.driver_id)
  if (jobs.length) {
    return { blocked: true, jobs, vehicle }
  }

  const result = await applyOffRoad({ vehicle, unassignDriver: true })
  return { blocked: false, action: 'marked', ...result }
}

export async function getReplacementVehicles({ companyId, excludeVehicleId }) {
  if (!companyId) return []
  let query = supabaseAdmin
    .from('vehicles')
    .select('id, make, model, taxi_license_plate_number, registration_number, vehicle_photo_url, seating_capacity, wheelchair_accessible, status, fleet, driver_id')
    .eq('company_id', companyId)
    .eq('fleet', FLEET.COMPANY)
    .eq('status', VEHICLE_STATUS.ACTIVE)
    .is('driver_id', null)
    .order('created_at', { ascending: false })

  if (excludeVehicleId) query = query.neq('id', excludeVehicleId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getReplacementDrivers({ companyId, excludeDriverId }) {
  if (!companyId) return []

  const [driversRes, vehiclesRes, jobsRes] = await Promise.all([
    supabaseAdmin
      .from('drivers')
      .select('id, first_name, last_name, license_no, status, fleet, vehicle_assigned, profile_picture_url, phone')
      .eq('company_id', companyId)
      .eq('fleet', FLEET.COMPANY)
      .eq('status', 'approved')
      .eq('vehicle_assigned', true)
      .order('last_name', { ascending: true }),
    supabaseAdmin
      .from('vehicles')
      .select('id, driver_id, status, taxi_license_plate_number, make, model, seating_capacity, wheelchair_accessible')
      .eq('company_id', companyId),
    supabaseAdmin
      .from('jobs')
      .select('assigned_driver_id, status')
      .eq('company_id', companyId)
      .not('assigned_driver_id', 'is', null),
  ])

  if (driversRes.error) throw driversRes.error
  if (vehiclesRes.error) throw vehiclesRes.error
  if (jobsRes.error) throw jobsRes.error

  const activeByDriver = new Map()
  for (const v of vehiclesRes.data || []) {
    if (!v.driver_id) continue
    if (!isVehicleActive(v.status)) continue
    activeByDriver.set(v.driver_id, v)
  }

  const busy = new Set(
    (jobsRes.data || [])
      .filter((j) => String(j.status || '').trim().toLowerCase() !== 'cancelled' && String(j.status || '').trim().toLowerCase() !== 'canceled')
      .map((j) => j.assigned_driver_id)
      .filter(Boolean)
  )

  return (driversRes.data || [])
    .filter((d) => d.id !== excludeDriverId && activeByDriver.has(d.id) && !busy.has(d.id))
    .map((d) => ({ ...d, vehicle: activeByDriver.get(d.id) }))
}

export async function swapReplacementAndMarkOffRoad({ companyId, brokenVehicleId, replacementVehicleId }) {
  if (!companyId || !brokenVehicleId || !replacementVehicleId) {
    throw new Error('Company, broken vehicle, and replacement vehicle are required.')
  }
  if (brokenVehicleId === replacementVehicleId) {
    throw new Error('Choose a different vehicle.')
  }

  const broken = await loadVehicleInCompany(brokenVehicleId, companyId)
  const replacement = await loadVehicleInCompany(replacementVehicleId, companyId)

  if (isPrivateFleet(broken.fleet)) {
    throw new Error('Private vehicles cannot be swapped from the portal.')
  }
  if (!isCompanyFleet(replacement.fleet)) {
    throw new Error('Replacement must be a company vehicle.')
  }
  if (!isVehicleActive(replacement.status)) {
    throw new Error('Replacement vehicle must be Active.')
  }
  if (replacement.driver_id) {
    throw new Error('That vehicle already has a driver.')
  }
  if (!broken.driver_id) {
    throw new Error('This vehicle has no driver to swap.')
  }

  const driverId = broken.driver_id

  const { error: freeErr } = await supabaseAdmin
    .from('vehicles')
    .update({
      driver_id: null,
      status: VEHICLE_STATUS.OFF_ROAD,
      updated_at: nowIso(),
    })
    .eq('id', brokenVehicleId)
    .eq('company_id', companyId)
  if (freeErr) throw freeErr

  try {
    const { error: linkErr } = await supabaseAdmin
      .from('vehicles')
      .update({ driver_id: driverId, updated_at: nowIso() })
      .eq('id', replacementVehicleId)
      .eq('company_id', companyId)
    if (linkErr) throw linkErr
    await setDriverVehicleAssigned(driverId, true)
  } catch (err) {
    await supabaseAdmin
      .from('vehicles')
      .update({
        driver_id: driverId,
        status: broken.status || VEHICLE_STATUS.ACTIVE,
        updated_at: nowIso(),
      })
      .eq('id', brokenVehicleId)
    throw err
  }

  const { data: updated } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('id', brokenVehicleId)
    .maybeSingle()

  return {
    action: 'swapped',
    vehicle: updated || { ...broken, driver_id: null, status: VEHICLE_STATUS.OFF_ROAD },
    replacementVehicleId,
    driverId,
    unassignedDriverId: null,
  }
}

export async function reassignJobsAndMarkOffRoad({ companyId, vehicleId, newDriverId }) {
  if (!companyId || !vehicleId || !newDriverId) {
    throw new Error('Company, vehicle, and replacement driver are required.')
  }

  const vehicle = await loadVehicleInCompany(vehicleId, companyId)
  if (!vehicle.driver_id) throw new Error('This vehicle has no driver on a job.')
  if (vehicle.driver_id === newDriverId) throw new Error('Choose a different driver.')

  const jobs = await getBlockingJobsForDriver(companyId, vehicle.driver_id)
  if (!jobs.length) throw new Error('This driver is not assigned to a job.')

  const jobIds = jobs.map((j) => j.id)
  for (const job of jobs) {
    await validateDriverAssignment(job.id, newDriverId, companyId, { ignoreJobIds: jobIds })
  }
  for (const job of jobs) {
    await updateJobAssignedDriver(job.id, newDriverId)
  }

  const result = await applyOffRoad({ vehicle, unassignDriver: true })
  return { action: 'reassigned', jobs, ...result }
}

export async function cancelJobsAndMarkOffRoad({ companyId, vehicleId }) {
  if (!companyId || !vehicleId) throw new Error('Company and vehicle are required.')

  const vehicle = await loadVehicleInCompany(vehicleId, companyId)
  if (vehicle.driver_id) {
    const jobs = await getBlockingJobsForDriver(companyId, vehicle.driver_id)
    for (const job of jobs) {
      await cancelJobById(job.id, companyId)
    }
  }

  const result = await applyOffRoad({ vehicle, unassignDriver: true })
  return { action: 'cancelled', ...result }
}

export { getCurrentCompanyId, vehicleLabel }
