import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { getCompanyAdminById } from './companyService'
import {
  FLEET,
  isCompanyFleet,
  isDriverApproved,
  isPrivateFleet,
} from '../utils/fleet'
import { isVehicleOffRoad } from '../utils/vehicleStatus'
import { notifyVehicleAssigned, notifyVehicleUnassigned } from './vehicleNotificationService'

function isCancelledJobStatus(status) {
  const s = String(status || '').trim().toLowerCase()
  return s === 'cancelled' || s === 'canceled'
}

export async function getCurrentCompanyId() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid) {
    const err = new Error('Not authenticated')
    err.code = 'AUTH'
    throw err
  }
  const admin = await getCompanyAdminById(uid)
  if (!admin?.company_id) {
    const err = new Error('No company linked to your account')
    err.code = 'NO_COMPANY'
    throw err
  }
  return admin.company_id
}

export async function getBlockingJobsForDriver(companyId, driverId) {
  if (!companyId || !driverId) return []
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('id, job_name, status, internal_job_id')
    .eq('company_id', companyId)
    .eq('assigned_driver_id', driverId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).filter((j) => !isCancelledJobStatus(j.status))
}

function blockingJobMessage(jobs, actionLabel) {
  const name = jobs[0]?.job_name || 'a job'
  return `This driver is assigned to "${name}". Remove them from the job first before you ${actionLabel}.`
}

export async function getAssignableCompanyDrivers(companyId, { search = '' } = {}) {
  if (!companyId) return []
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .select('id, first_name, last_name, license_no, status, fleet, vehicle_assigned, profile_picture_url, phone')
    .eq('company_id', companyId)
    .eq('fleet', FLEET.COMPANY)
    .eq('status', 'approved')
    .eq('vehicle_assigned', false)
    .order('last_name', { ascending: true })

  if (error) throw error

  const q = String(search || '').trim().toLowerCase()
  const rows = data || []
  if (!q) return rows
  return rows.filter((d) => {
    const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase()
    const lic = String(d.license_no || '').toLowerCase()
    return name.includes(q) || lic.includes(q)
  })
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

async function loadDriverInCompany(driverId, companyId) {
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Driver not found.')
  return data
}

async function setDriverVehicleAssigned(driverId, assigned) {
  const { error } = await supabaseAdmin
    .from('drivers')
    .update({ vehicle_assigned: assigned, updated_at: new Date().toISOString() })
    .eq('id', driverId)
  if (error) throw error
}

/**
 * Assign a company driver to a company vehicle (1:1).
 * If the vehicle already has a driver, this is a change — blocked if that driver is on a job.
 */
export async function assignDriverToVehicle({ companyId, vehicleId, driverId }) {
  if (!companyId || !vehicleId || !driverId) {
    throw new Error('Company, vehicle, and driver are required.')
  }

  const vehicle = await loadVehicleInCompany(vehicleId, companyId)
  if (isPrivateFleet(vehicle.fleet)) {
    throw new Error('Private vehicles cannot be assigned from the portal.')
  }
  if (isVehicleOffRoad(vehicle.status)) {
    throw new Error('This vehicle is Off Road. Set it to Active before assigning a driver.')
  }

  const driver = await loadDriverInCompany(driverId, companyId)
  if (!isCompanyFleet(driver.fleet)) {
    throw new Error('Only company drivers can be assigned to company vehicles.')
  }
  if (!isDriverApproved(driver.status)) {
    throw new Error('Only approved drivers can be assigned to a vehicle.')
  }
  if (driver.vehicle_assigned === true && driver.id !== vehicle.driver_id) {
    throw new Error('This driver already has a vehicle. Unassign them first.')
  }

  if (vehicle.driver_id && vehicle.driver_id !== driverId) {
    const jobs = await getBlockingJobsForDriver(companyId, vehicle.driver_id)
    if (jobs.length) throw new Error(blockingJobMessage(jobs, 'change the assigned driver'))
  }

  const previousDriverId = vehicle.driver_id

  const { error: vehErr } = await supabaseAdmin
    .from('vehicles')
    .update({ driver_id: driverId, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .eq('company_id', companyId)
  if (vehErr) throw vehErr

  try {
    await setDriverVehicleAssigned(driverId, true)
    if (previousDriverId && previousDriverId !== driverId) {
      await setDriverVehicleAssigned(previousDriverId, false)
    }
  } catch (err) {
    await supabaseAdmin
      .from('vehicles')
      .update({ driver_id: previousDriverId || null, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
    throw err
  }

  if (previousDriverId && previousDriverId !== driverId) {
    await notifyVehicleUnassigned({ companyId, vehicle, driverId: previousDriverId })
  }
  await notifyVehicleAssigned({ companyId, vehicle, driverId })

  return { vehicleId, driverId, previousDriverId: previousDriverId || null }
}

export async function unassignDriverFromVehicle({ companyId, vehicleId }) {
  if (!companyId || !vehicleId) throw new Error('Company and vehicle are required.')

  const vehicle = await loadVehicleInCompany(vehicleId, companyId)
  if (isPrivateFleet(vehicle.fleet)) {
    throw new Error('Private vehicles cannot be unassigned from the portal.')
  }
  if (!vehicle.driver_id) {
    throw new Error('This vehicle has no driver assigned.')
  }

  const jobs = await getBlockingJobsForDriver(companyId, vehicle.driver_id)
  if (jobs.length) throw new Error(blockingJobMessage(jobs, 'unassign this driver'))

  const previousDriverId = vehicle.driver_id

  const { error: vehErr } = await supabaseAdmin
    .from('vehicles')
    .update({ driver_id: null, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .eq('company_id', companyId)
  if (vehErr) throw vehErr

  try {
    await setDriverVehicleAssigned(previousDriverId, false)
  } catch (err) {
    await supabaseAdmin
      .from('vehicles')
      .update({ driver_id: previousDriverId, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
    throw err
  }

  await notifyVehicleUnassigned({ companyId, vehicle, driverId: previousDriverId })

  return { vehicleId, previousDriverId }
}
