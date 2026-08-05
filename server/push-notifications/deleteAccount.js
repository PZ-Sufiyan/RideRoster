import {
  createSupabaseAdminClient,
  createSupabaseAuthClient,
} from './supabaseClient.js'

const ALLOWED_ROLES = new Set(['driver', 'passenger_assistant'])

function extractRole(user) {
  return (
    user?.app_metadata?.role ??
    user?.user_metadata?.role ??
    null
  )
}

/**
 * Authenticated self-service account deletion for mobile driver / PA users.
 *
 * Requires Authorization: Bearer <access_token>.
 * Deletes role profile rows, then removes the Auth user (cascades tokens etc.).
 */
export async function deleteAuthenticatedAccount(authHeader) {
  if (!authHeader) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  const supabaseAuth = createSupabaseAuthClient(authHeader)
  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser()

  if (userError || !user) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  const role = String(extractRole(user) || '')
    .trim()
    .toLowerCase()
  if (!ALLOWED_ROLES.has(role)) {
    const err = new Error(
      'Only drivers and passenger assistants can delete their account here.',
    )
    err.status = 403
    throw err
  }

  const userId = user.id
  const supabaseAdmin = createSupabaseAdminClient()

  if (role === 'driver') {
    await deleteDriverProfile(supabaseAdmin, userId)
  } else {
    await deletePassengerAssistantProfile(supabaseAdmin, userId)
  }

  // Best-effort related rows (tables may vary by environment).
  await Promise.allSettled([
    supabaseAdmin.from('device_push_tokens').delete().eq('user_id', userId),
    supabaseAdmin.from('user_notifications').delete().eq('user_id', userId),
    supabaseAdmin
      .from('document_expiry_notifications')
      .delete()
      .eq('user_id', userId),
    supabaseAdmin.from('leave_requests').delete().eq('user_id', userId),
  ])

  const { error: deleteAuthError } =
    await supabaseAdmin.auth.admin.deleteUser(userId)
  if (deleteAuthError) {
    throw deleteAuthError
  }

  console.info('delete-account ok', { userId, role })
  return { ok: true, userId, role }
}

async function deleteDriverProfile(supabaseAdmin, userId) {
  // Vehicles do not cascade when the driver row is removed — delete them first.
  const { data: vehicles, error: vehiclesError } = await supabaseAdmin
    .from('vehicles')
    .select('id')
    .eq('driver_id', userId)

  if (vehiclesError) throw vehiclesError

  const vehicleIds = (vehicles ?? [])
    .map((row) => row.id)
    .filter(Boolean)

  if (vehicleIds.length > 0) {
    const { error: vehicleDocsError } = await supabaseAdmin
      .from('vehicle_documents')
      .delete()
      .in('vehicle_id', vehicleIds)
    if (vehicleDocsError) throw vehicleDocsError

    const { error: deleteVehiclesError } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .in('id', vehicleIds)
    if (deleteVehiclesError) throw deleteVehiclesError
  }

  // driver_documents cascade from drivers; deleting the row is enough.
  const { error: driverError } = await supabaseAdmin
    .from('drivers')
    .delete()
    .eq('id', userId)
  if (driverError) throw driverError
}

async function deletePassengerAssistantProfile(supabaseAdmin, userId) {
  // No FK from passenger_assistant → auth.users in all environments; delete explicitly.
  // Documents cascade from passenger_assistant.
  const { error: paError } = await supabaseAdmin
    .from('passenger_assistant')
    .delete()
    .eq('id', userId)
  if (paError) throw paError
}
