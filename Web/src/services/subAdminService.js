import { supabase } from '../lib/supabaseClient'

/* Sub Admins CRUD */

// Get all sub_admins, optional filter by companyId
export const getAllSubAdmins = async ({ companyId = null } = {}) => {
  let query = supabase.from('sub_admins').select('*').order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Get single sub_admin by id
export const getSubAdminById = async (subAdminId) => {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('*')
    .eq('id', subAdminId)
    .single()
  if (error) throw error
  return data
}

// Get single sub_admin by email (useful for login/lookup)
export const getSubAdminByEmail = async (email) => {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('*')
    .eq('email', email)
    .single()
  if (error) throw error
  return data
}

// Create a new sub_admin
export const createSubAdmin = async (payload) => {
  const { data, error } = await supabase
    .from('sub_admins')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

// Update sub_admin by id
export const updateSubAdmin = async (subAdminId, updates) => {
  const { data, error } = await supabase
    .from('sub_admins')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', subAdminId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Delete sub_admin by id
export const deleteSubAdmin = async (subAdminId) => {
  const { data, error } = await supabase
    .from('sub_admins')
    .delete()
    .eq('id', subAdminId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Bulk helpers (optional): get by company and email uniqueness check
export const getSubAdminsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('sub_admins')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const isSubAdminEmailTaken = async (email) => {
  const {
    data: { length },
  } = await supabase
    .from('sub_admins')
    .select('id')
    .eq('email', email)
  return length > 0
}
