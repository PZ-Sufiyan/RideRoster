import { supabase } from '../lib/supabaseClient'
import { getSubAdminById } from './subAdminService'

export const getAllCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_admins(*),
      company_documents(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export const getCompanyById = async (companyId) => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_admins(*),
      company_documents(*)
    `)
    .eq('id', companyId)
    .single()

  if (error) {
    throw error
  }

  return data
}

// Companies - create / update / delete
export const createCompany = async (companyPayload) => {
  const { data, error } = await supabase
    .from('companies')
    .insert(companyPayload)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCompany = async (companyId, updates) => {
  const { data, error } = await supabase
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Company Admins - get / create / update / delete
export const getCompanyAdmins = async (companyId = null) => {
  let query = supabase.from('company_admins').select('*').order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Resolves the logged-in user's company scope (row includes `company_id`).
 * - Role `admin`: `company_admins` row (id = auth user id).
 * - Role `subadmin`: `sub_admins` row (id = auth user id) — not in `company_admins`, so callers must not query `company_admins` for subadmins (avoids PostgREST 406 on `.single()` with zero rows).
 */
export const getCompanyAdminById = async (adminId) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
  if (role === 'subadmin') {
    return getSubAdminById(adminId)
  }

  const { data, error } = await supabase
    .from('company_admins')
    .select('*')
    .eq('id', adminId)
    .single()

  if (error) throw error
  return data
}

/** Alias for clarity in new code — same behavior as {@link getCompanyAdminById}. */
export const getCompanyScopeForUser = getCompanyAdminById

export const createCompanyAdmin = async (adminPayload) => {
  const { data, error } = await supabase
    .from('company_admins')
    .insert(adminPayload)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Insert or replace by primary key `id` (auth user id). Use when the row may already exist (e.g. signup stub). */
export const upsertCompanyAdmin = async (adminPayload) => {
  const { data, error } = await supabase
    .from('company_admins')
    .upsert(adminPayload, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCompanyAdmin = async (adminId, updates) => {
  const { data, error } = await supabase
    .from('company_admins')
    .update(updates)
    .eq('id', adminId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCompanyAdmin = async (adminId) => {
  const { data, error } = await supabase
    .from('company_admins')
    .delete()
    .eq('id', adminId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Company Documents - get / create / update / delete
export const getCompanyDocuments = async (companyId = null) => {
  let query = supabase.from('company_documents').select('*').order('uploaded_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  const { data, error } = await query

  if (error) throw error
  return data
}

export const getCompanyDocumentById = async (docId) => {
  const { data, error } = await supabase
    .from('company_documents')
    .select('*')
    .eq('id', docId)
    .single()

  if (error) throw error
  return data
}

export const createCompanyDocument = async (docPayload) => {
  const { data, error } = await supabase
    .from('company_documents')
    .insert(docPayload)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCompanyDocument = async (docId, updates) => {
  const { data, error } = await supabase
    .from('company_documents')
    .update(updates)
    .eq('id', docId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCompanyDocument = async (docId) => {
  const { data, error } = await supabase
    .from('company_documents')
    .delete()
    .eq('id', docId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get companies filtered by status.
 * Returns companies and their related company_admins (only full_name) and company_documents.
 */
export const getCompaniesByStatus = async (status = '') => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_admins(full_name),
      company_documents(*)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Return array of admin full_name values for a given company_id.
 * If companyId is null/undefined returns an empty array.
 */
export const getCompanyAdminNamesByCompanyId = async (companyId) => {
  if (!companyId) return []
  const { data, error } = await supabase
    .from('company_admins')
    .select('full_name')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(a => a.full_name)
}

/**
 * Get all pending companies and include admin full names for each company.
 * Returns companies with nested company_admins array (each item has full_name).
 * Also returns a flattened admin_full_names array on each company for convenience.
 */
export const getPendingCompaniesWithAdminNames = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_admins(full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Add a convenience array of admin full names per company
  return (data || []).map(c => ({
    ...c,
    admin_full_names: (c.company_admins || []).map(a => a.full_name)
  }))
}

/**
 * Update status for one or many companies by id.
 * @param {string|string[]} companyIds company id or ids
 * @param {string} status next status value (e.g. approved/rejected)
 */
export const updateCompaniesStatusByIds = async (companyIds, status) => {
  const ids = Array.isArray(companyIds) ? companyIds : [companyIds]

  if (!ids.length) return []

  const { data, error } = await supabase
    .from('companies')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids)
    .select('id, status')

  if (error) throw error
  return data || []
}