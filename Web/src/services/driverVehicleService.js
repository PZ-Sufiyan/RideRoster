import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from './companyService'

/** Canonical `drivers.status` values stored in the database */
export const DRIVER_DB_STATUS = {
  ACTIVE: 'active',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
}

/**
 * Maps admin row action labels to `drivers.status` text for Supabase updates.
 */
export const driverStatusFromAction = (action) => {
  const map = {
    Approve: DRIVER_DB_STATUS.APPROVED,
    Reject: DRIVER_DB_STATUS.REJECTED,
    Suspend: DRIVER_DB_STATUS.SUSPENDED,
    Active: DRIVER_DB_STATUS.ACTIVE,
  }
  return map[action] ?? null
}

/* Drivers CRUD */

/**
 * Drivers for the logged-in company admin (company_admins.company_id).
 */
export const getDriversForCurrentAdmin = async () => {
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
  return getAllDrivers({ companyId: admin.company_id })
}

export const getAllDrivers = async ({ companyId = null } = {}) => {
  let query = supabase.from('drivers').select('*').order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getDriverById = async (driverId) => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single()
  if (error) throw error
  return data
}

/** Returns null if no row (useful for detail pages). */
export const getDriverByIdMaybe = async (driverId) => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Jobs where this driver is assigned (`jobs.assigned_driver_id`).
 */
export const getJobsByAssignedDriver = async (companyId, driverId) => {
  if (!companyId || !driverId) return []
  const { data, error } = await supabase
    .from('jobs')
    .select('id, internal_job_id, job_name, semester_start, created_at, status, company_id, assigned_driver_id')
    .eq('company_id', companyId)
    .eq('assigned_driver_id', driverId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createDriver = async (driverPayload) => {
  const { data, error } = await supabase
    .from('drivers')
    .insert(driverPayload)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateDriver = async (driverId, updates) => {
  const { data, error } = await supabase
    .from('drivers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', driverId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteDriver = async (driverId) => {
  const { data, error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', driverId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getDriversByCompany = async (companyId) => {
  return getAllDrivers({ companyId })
}

/* Driver Documents CRUD */

export const getDriverDocuments = async ({ companyId = null, driverId = null, documentType = null } = {}) => {
  let query = supabase.from('driver_documents').select('*').order('uploaded_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  if (driverId) query = query.eq('driver_id', driverId)
  if (documentType) query = query.eq('document_type', documentType)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getDriverDocumentById = async (docId) => {
  const { data, error } = await supabase
    .from('driver_documents')
    .select('*')
    .eq('id', docId)
    .single()
  if (error) throw error
  return data
}

export const createDriverDocument = async (docPayload) => {
  const { data, error } = await supabase
    .from('driver_documents')
    .insert(docPayload)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateDriverDocument = async (docId, updates) => {
  const { data, error } = await supabase
    .from('driver_documents')
    .update({ ...updates, uploaded_at: new Date().toISOString() })
    .eq('id', docId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteDriverDocument = async (docId) => {
  const { data, error } = await supabase
    .from('driver_documents')
    .delete()
    .eq('id', docId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getDriverDocumentsByDriver = async (driverId) => {
  return getDriverDocuments({ driverId })
}

/* Vehicles CRUD */

export const getAllVehicles = async ({ companyId = null, driverId = null } = {}) => {
  let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  if (driverId) query = query.eq('driver_id', driverId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getVehicleById = async (vehicleId) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single()
  if (error) throw error
  return data
}

export const createVehicle = async (vehiclePayload) => {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehiclePayload)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateVehicle = async (vehicleId, updates) => {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteVehicle = async (vehicleId) => {
  const { data, error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getVehiclesByCompany = async (companyId) => {
  return getAllVehicles({ companyId })
}

export const getVehiclesByDriver = async (driverId) => {
  return getAllVehicles({ driverId })
}

/* Vehicle Documents CRUD */

export const getVehicleDocuments = async ({ companyId = null, vehicleId = null, documentType = null } = {}) => {
  let query = supabase.from('vehicle_documents').select('*').order('uploaded_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  if (vehicleId) query = query.eq('vehicle_id', vehicleId)
  if (documentType) query = query.eq('document_type', documentType)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getVehicleDocumentById = async (docId) => {
  const { data, error } = await supabase
    .from('vehicle_documents')
    .select('*')
    .eq('id', docId)
    .single()
  if (error) throw error
  return data
}

export const createVehicleDocument = async (docPayload) => {
  const { data, error } = await supabase
    .from('vehicle_documents')
    .insert(docPayload)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateVehicleDocument = async (docId, updates) => {
  const { data, error } = await supabase
    .from('vehicle_documents')
    .update({ ...updates, uploaded_at: new Date().toISOString() })
    .eq('id', docId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteVehicleDocument = async (docId) => {
  const { data, error } = await supabase
    .from('vehicle_documents')
    .delete()
    .eq('id', docId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getVehicleDocumentsByVehicle = async (vehicleId) => {
  return getVehicleDocuments({ vehicleId })
}

export const getVehicleDocumentsByCompany = async (companyId) => {
  return getVehicleDocuments({ companyId })
}