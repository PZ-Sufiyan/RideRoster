import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Node.js 20 needs explicit WebSocket transport for @supabase/supabase-js. */
const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
}

export function createSupabaseAuthClient(authHeader) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...clientOptions,
    global: { headers: { Authorization: authHeader } },
  })
}

export function createSupabaseAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, clientOptions)
}
