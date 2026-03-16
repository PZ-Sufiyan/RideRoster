import { supabase } from '../lib/supabaseClient'

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

export const getCompanyAdminById = async (adminId) => {
  const { data, error } = await supabase
    .from('company_admins')
    .select('*')
    .eq('id', adminId)
    .single()

  if (error) throw error
  return data
}

export const createCompanyAdmin = async (adminPayload) => {
  const { data, error } = await supabase
    .from('company_admins')
    .insert(adminPayload)
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