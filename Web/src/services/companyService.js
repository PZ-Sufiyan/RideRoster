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