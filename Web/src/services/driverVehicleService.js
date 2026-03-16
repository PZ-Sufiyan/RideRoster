import { supabase } from '../lib/supabaseClient'

/* Drivers CRUD */

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