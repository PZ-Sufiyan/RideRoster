import { supabase } from '../lib/supabaseClient'

/* Passenger info CRUD */

export const getAllPassengers = async ({ companyId = null } = {}) => {
  let query = supabase.from('passenger_info').select(`
    *,
    passenger_info_documents(*)
  `).order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getPassengerById = async (passengerId) => {
  const { data, error } = await supabase
    .from('passenger_info')
    .select(`
      *,
      passenger_info_documents(*)
    `)
    .eq('id', passengerId)
    .single()

  if (error) throw error
  return data
}

export const createPassenger = async (passengerPayload) => {
  const { data, error } = await supabase
    .from('passenger_info')
    .insert(passengerPayload)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updatePassenger = async (passengerId, updates) => {
  const { data, error } = await supabase
    .from('passenger_info')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', passengerId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePassenger = async (passengerId) => {
  const { data, error } = await supabase
    .from('passenger_info')
    .delete()
    .eq('id', passengerId)
    .select()
    .single()

  if (error) throw error
  return data
}

/* Passenger documents CRUD */

export const getPassengerDocuments = async ({ passengerId = null, documentType = null } = {}) => {
  let query = supabase.from('passenger_info_documents').select('*').order('uploaded_at', { ascending: false })
  if (passengerId) query = query.eq('passenger_id', passengerId)
  if (documentType) query = query.eq('document_type', documentType)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getPassengerDocumentById = async (docId) => {
  const { data, error } = await supabase
    .from('passenger_info_documents')
    .select('*')
    .eq('id', docId)
    .single()

  if (error) throw error
  return data
}

export const createPassengerDocument = async (docPayload) => {
  const { data, error } = await supabase
    .from('passenger_info_documents')
    .insert(docPayload)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updatePassengerDocument = async (docId, updates) => {
  const { data, error } = await supabase
    .from('passenger_info_documents')
    .update({ ...updates, uploaded_at: new Date().toISOString() })
    .eq('id', docId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePassengerDocument = async (docId) => {
  const { data, error } = await supabase
    .from('passenger_info_documents')
    .delete()
    .eq('id', docId)
    .select()
    .single()

  if (error) throw error
  return data
}

/* Helper convenience functions */

// Get passengers for a company
export const getPassengersByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('passenger_info')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get a passenger's single document by passenger_id + document_type (useful for unique constraint)
export const getPassengerDocumentByPassengerAndType = async (passengerId, documentType) => {
  const { data, error } = await supabase
    .from('passenger_info_documents')
    .select('*')
    .match({ passenger_id: passengerId, document_type: documentType })
    .single()

  if (error) throw error
  return data
}

// Update / delete by passenger_id + document_type
export const updatePassengerDocumentByPassengerAndType = async (passengerId, documentType, updates) => {
  const { data, error } = await supabase
    .from('passenger_info_documents')
    .update({ ...updates, uploaded_at: new Date().toISOString() })
    .match({ passenger_id: passengerId, document_type: documentType })
    .select()

  if (error) throw error
  return data
}

export const deletePassengerDocumentByPassengerAndType = async (passengerId, documentType) => {
  const { data, error } = await supabase
    .from('passenger_info_documents')
    .delete()
    .match({ passenger_id: passengerId, document_type: documentType })
    .select()

  if (error) throw error
  return data
}