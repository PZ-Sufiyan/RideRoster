import { supabase } from '../lib/supabaseClient'
import { toUtcIso } from '../utils/dateTime'

/**
 * Fetch system logs with optional filters, pagination and sorting.
 * Options:
 *  - userId, userName (matches user_name), status ('Success'|'Failure')
 *  - actionType (prefix match on action), search (matches action)
 *  - from, to (ISO dates)
 *  - limit, offset, orderBy ('created_at'), order ('desc'|'asc')
 */
export const getSystemLogs = async ({
  userId = null,
  userName = null,
  status = null,
  actionType = null,
  search = null,
  from = null,
  to = null,
  limit = 100,
  offset = 0,
  orderBy = 'created_at',
  order = 'desc'
} = {}) => {
  let query = supabase.from('system_logs').select('*')

  if (userId) query = query.eq('user_id', userId)
  if (userName) query = query.ilike('user_name', `%${userName}%`)
  if (status) query = query.eq('status', status)
  if (actionType) query = query.ilike('action', `${actionType}%`)
  if (search) query = query.ilike('action', `%${search}%`)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  query = query.order(orderBy, { ascending: order.toLowerCase() === 'asc' })
    .range(offset, Math.max(0, offset + (limit - 1)))

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Fetch system logs with total count (for server-side pagination).
 * Returns: { data, count }
 */
export const getSystemLogsPage = async ({
  userId = null,
  userName = null,
  status = null,
  actionType = null,
  search = null,
  from = null,
  to = null,
  limit = 25,
  offset = 0,
  orderBy = 'created_at',
  order = 'desc'
} = {}) => {
  let query = supabase.from('system_logs').select('*', { count: 'exact' })

  if (userId) query = query.eq('user_id', userId)
  if (userName) query = query.ilike('user_name', `%${userName}%`)
  if (status) query = query.eq('status', status)
  if (actionType) query = query.ilike('action', `${actionType}%`)
  if (search) query = query.ilike('action', `%${search}%`)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  query = query.order(orderBy, { ascending: order.toLowerCase() === 'asc' })
    .range(offset, Math.max(0, offset + (limit - 1)))

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

/** Get single log entry by id */
export const getSystemLogById = async (id) => {
  const { data, error } = await supabase
    .from('system_logs')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

/**
 * Create a system log entry.
 * payload: { user_id?, user_name?, action, status: 'Success'|'Failure', ip_address? }
 */
export const createSystemLog = async (payload) => {
  const { data, error } = await supabase
    .from('system_logs')
    .insert({
      timestamp: payload.timestamp || toUtcIso(),
      user_id: payload.user_id || null,
      user_name: payload.user_name || null,
      action: payload.action,
      status: payload.status,
      ip_address: payload.ip_address || null
    })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Delete a log entry by id */
export const deleteSystemLog = async (id) => {
  const { data, error } = await supabase
    .from('system_logs')
    .delete()
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Optional: purge logs older than given ISO date (returns deleted rows) */
export const deleteSystemLogsOlderThan = async (isoDate) => {
  const { data, error } = await supabase
    .from('system_logs')
    .delete()
    .lt('timestamp', isoDate)
    .select()
  if (error) throw error
  return data
}