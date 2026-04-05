import { supabase } from '../lib/supabaseClient'

/** Matches `sub_admins` boolean columns and labels in `permissionsConstants.js`. */
const SUB_ADMIN_PERM_FIELDS = [
  { key: 'view_jobs', label: 'View Jobs' },
  { key: 'create_jobs', label: 'Create Jobs' },
  { key: 'edit_jobs', label: 'Edit Jobs' },
  { key: 'cancel_jobs', label: 'Cancel Jobs' },
  { key: 'view_users', label: 'View Users' },
  { key: 'add_users', label: 'Add Users' },
  { key: 'edit_profiles', label: 'Edit Profiles' },
  { key: 'deactivate_users', label: 'Deactivate Users' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'export_data', label: 'Export Data' },
]

export const SUB_ADMIN_PERMISSION_KEYS = SUB_ADMIN_PERM_FIELDS.map((f) => f.key)

/** Build UI permission toggles from a `sub_admins` row. */
export const subAdminRowToPermissionState = (row) => {
  const initial = {}
  for (const key of SUB_ADMIN_PERMISSION_KEYS) {
    initial[key] = !!row?.[key]
  }
  return initial
}

/** Map permission toggle state to columns for `updateSubAdmin`. */
export const permissionStateToSubAdminUpdates = (permissionState) => {
  const updates = {}
  for (const key of SUB_ADMIN_PERMISSION_KEYS) {
    updates[key] = !!permissionState?.[key]
  }
  return updates
}

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

/** Human-readable list of granted permissions (matches `sub_admins` columns). */
export const formatSubAdminPermissionsSummary = (row) => {
  if (!row) return '—'
  const parts = []
  for (const { key, label } of SUB_ADMIN_PERM_FIELDS) {
    if (row[key]) parts.push(label)
  }
  return parts.length ? parts.join(', ') : 'No permissions'
}

/** Normalized keys: pending (null/empty), or approve | reject | suspend | active stored in DB. */
export const normalizeSubAdminStatus = (raw) => {
  if (raw == null || raw === '') return 'pending'
  const s = String(raw).trim().toLowerCase()
  if (['approve', 'reject', 'suspend', 'active'].includes(s)) return s
  if (['pending'].includes(s)) return 'pending'
  // Legacy rows (before status values were standardized)
  if (s === 'approved') return 'approve'
  if (s === 'rejected') return 'reject'
  if (s === 'inactive') return 'reject'
  if (s === 'suspended') return 'suspend'
  const legacy = {
    active: 'active',
    pending: 'pending',
  }
  return legacy[s] || 'pending'
}

export const subAdminStatusLabel = (dbStatus) => {
  const s = normalizeSubAdminStatus(dbStatus)
  const labels = {
    pending: 'Pending',
    approve: 'Approved',
    reject: 'Rejected',
    suspend: 'Suspended',
    active: 'Active',
  }
  return labels[s] || 'Pending'
}

/** Map row action menu labels to `sub_admins.status` values. */
export const actionToSubAdminDbStatus = (action) => {
  const map = {
    Approve: 'approve',
    Reject: 'reject',
    Suspend: 'suspend',
    Active: 'active',
  }
  return map[action] ?? null
}
