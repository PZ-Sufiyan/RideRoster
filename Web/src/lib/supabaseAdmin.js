import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

/**
 * Admin Supabase client — uses the service role key.
 * Has full DB access and can write to app_metadata (server-controlled role claims).
 *
 * IMPORTANT: Only import this client from trusted admin flows (e.g. super-admin “Add Admin”,
 * company-admin “Add Driver” registration). Never use it in passenger/driver-facing pages.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: 'sb-admin-service-token',
    },
})
