import { sendUserNotificationPush } from './fcm.js'

async function loadUserTokens(supabase, userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('fcm_token, platform, updated_at')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function loadCompanyPortalUserIds(supabase, companyId) {
  if (!companyId) return []
  const [adminsRes, subsRes] = await Promise.all([
    supabase.from('company_admins').select('id').eq('company_id', companyId),
    supabase.from('sub_admins').select('id').eq('company_id', companyId),
  ])
  if (adminsRes.error) throw adminsRes.error
  if (subsRes.error) throw subsRes.error
  return [...new Set([
    ...(adminsRes.data || []).map((row) => row.id),
    ...(subsRes.data || []).map((row) => row.id),
  ].filter(Boolean))]
}

export async function notifyPortalUsersPush(supabase, {
  companyId,
  title,
  body,
  type,
  notificationId,
  referenceId,
}) {
  const userIds = await loadCompanyPortalUserIds(supabase, companyId)
  for (const userId of userIds) {
    try {
      const tokens = await loadUserTokens(supabase, userId)
      if (!tokens.length) continue
      await sendUserNotificationPush({
        userId,
        title,
        body,
        data: {
          type,
          notification_id: String(notificationId || ''),
          reference_id: String(referenceId || ''),
        },
        tokens,
        supabaseAdmin: supabase,
      })
    } catch (err) {
      console.warn('portal user push failed', {
        userId,
        type,
        error: err instanceof Error ? err.message : err,
      })
    }
  }
}
