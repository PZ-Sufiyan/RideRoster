import cron from 'node-cron'
import { sendUserNotificationPush } from './fcm.js'
import { runJobReassignmentMaintenanceTick } from './jobReassignmentAlerts.js'

async function loadUserTokens(supabase, userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('device_push_tokens')
    .select('fcm_token, platform, updated_at')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

async function loadCompanyPortalUserIds(supabase, companyId) {
  if (!companyId) return []
  const [adminsRes, subsRes] = await Promise.all([
    supabase.from('company_admins').select('id').eq('company_id', companyId),
    supabase.from('sub_admins').select('id').eq('company_id', companyId),
  ])
  if (adminsRes.error) throw adminsRes.error
  if (subsRes.error) throw subsRes.error
  return [...new Set([
    ...(adminsRes.data || []).map((r) => r.id),
    ...(subsRes.data || []).map((r) => r.id),
  ].filter(Boolean))]
}

async function notifyPortalUsersPush(supabase, { companyId, title, body, type, notificationId, referenceId }) {
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
      console.warn('job reassignment portal push failed', {
        userId,
        error: err instanceof Error ? err.message : err,
      })
    }
  }
}

export function startJobReassignmentReminderScheduler(supabase) {
  const enabled = (process.env.JOB_REASSIGNMENT_REMINDER_ENABLED ?? 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.info('job reassignment reminder scheduler disabled (JOB_REASSIGNMENT_REMINDER_ENABLED=false)')
    return
  }

  const cronExpr = process.env.DOCUMENT_EXPIRY_CRON ?? '* * * * *'
  console.info(`job reassignment reminder scheduler enabled (cron="${cronExpr}")`)

  cron.schedule(cronExpr, async () => {
    try {
      await runJobReassignmentMaintenanceTick(supabase, notifyPortalUsersPush)
    } catch (error) {
      console.error(
        'job reassignment maintenance tick failed:',
        error instanceof Error ? error.message : error,
      )
    }
  })
}
