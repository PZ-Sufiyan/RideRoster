import { JWT } from 'google-auth-library'

function formatPay(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `£${n.toFixed(2)}`
}

function runLabel(direction) {
  return direction === 'outbound' ? 'Morning run' : 'Evening run'
}

function formatTimeLabel(rawTime) {
  if (rawTime == null || rawTime === '') return '--:--'
  const parts = String(rawTime).trim().split(':')
  if (parts.length < 2) return '--:--'
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
}

async function getFcmAccessToken() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Missing Firebase service account environment variables.')
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')
  const client = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })

  const { access_token: accessToken } = await client.authorize()
  if (!accessToken) throw new Error('Failed to obtain FCM access token.')
  return accessToken
}

function stringifyData(data) {
  const out = {}
  for (const [key, value] of Object.entries(data ?? {})) {
    out[key] = value == null ? '' : String(value)
  }
  return out
}

/** Keep one token per platform (latest updated_at) to avoid duplicate pushes. */
function resolveDeliveryTokens(tokens) {
  const rows = (tokens ?? [])
    .map((token) => {
      if (typeof token === 'string') {
        return { fcm_token: token.trim(), platform: null, updated_at: null }
      }
      return {
        fcm_token: String(token?.fcm_token ?? '').trim(),
        platform: token?.platform ?? null,
        updated_at: token?.updated_at ?? null,
      }
    })
    .filter((row) => row.fcm_token.length > 0)

  if (!rows.length) return []

  const latestByPlatform = new Map()
  for (const row of rows) {
    const key = row.platform || '_unknown'
    const existing = latestByPlatform.get(key)
    if (!existing) {
      latestByPlatform.set(key, row)
      continue
    }
    const existingTime = Date.parse(existing.updated_at ?? '') || 0
    const rowTime = Date.parse(row.updated_at ?? '') || 0
    if (rowTime >= existingTime) {
      latestByPlatform.set(key, row)
    }
  }

  return Array.from(latestByPlatform.values()).map((row) => row.fcm_token)
}

async function sendFcmMessage({ token, title, body, data }) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const accessToken = await getFcmAccessToken()
  const payloadData = stringifyData(data)
  const notificationTag = [
    data?.type ?? 'push',
    data?.job_id ?? 'general',
    data?.direction ?? '',
    Date.now(),
  ].join('_')

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: payloadData,
          android: {
            priority: 'HIGH',
            notification: {
              channel_id: 'ride_roster_channel',
              color: '#4A90D9',
              default_sound: true,
              notification_priority: 'PRIORITY_HIGH',
              tag: notificationTag,
            },
          },
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      }),
    },
  )

  const responseText = await res.text()
  if (!res.ok) {
    throw new Error(`FCM send failed (${res.status}): ${responseText}`)
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return { raw: responseText }
  }
}

async function sendToTokens({ tokens, title, body, data, driverId, supabaseAdmin }) {
  const fcmTokens = resolveDeliveryTokens(tokens)

  if (!fcmTokens.length) {
    return { ok: true, skipped: 'no_device_tokens', sent: 0, failed: 0, total: 0 }
  }

  const results = await Promise.allSettled(
    fcmTokens.map((token) => sendFcmMessage({ token, title, body, data })),
  )

  const sent = results.filter((result) => result.status === 'fulfilled').length
  const failed = results.filter((result) => result.status === 'rejected').length

  const staleTokens = []
  const errors = []
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'rejected') {
      const message = String(result.reason ?? '')
      errors.push(message.slice(0, 300))
      if (
        message.includes('NOT_FOUND')
        || message.includes('UNREGISTERED')
        || message.includes('InvalidRegistration')
        || message.includes('INVALID_ARGUMENT')
      ) {
        staleTokens.push(fcmTokens[i])
      }
    }
  }

  if (errors.length > 0) {
    console.warn('FCM send errors', {
      driverId,
      errors,
      hint: errors.some((e) => /APNS|THIRD_PARTY_AUTH|InvalidApnsCredential/i.test(e))
        ? 'Upload APNs .p8 key in Firebase Console → Project settings → Cloud Messaging'
        : undefined,
    })
  }

  if (staleTokens.length > 0 && driverId && supabaseAdmin) {
    await supabaseAdmin
      .from('device_push_tokens')
      .delete()
      .eq('user_id', driverId)
      .in('fcm_token', staleTokens)
  }

  return { ok: true, sent, failed, total: fcmTokens.length, errors }
}

export async function sendUserNotificationPush({
  userId,
  title,
  body,
  data,
  tokens,
  supabaseAdmin,
}) {
  return sendToTokens({
    tokens,
    title,
    body,
    data: {
      type: data?.type ?? 'user_notification',
      notification_id: String(data?.notification_id ?? ''),
      reference_id: String(data?.reference_id ?? ''),
    },
    driverId: userId,
    supabaseAdmin,
  })
}

export async function sendJobAssignmentPush({ job, tokens, supabaseAdmin }) {
  if (!job?.assigned_driver_id) {
    return { ok: true, skipped: 'no_assigned_driver' }
  }

  if (job.driver_approval_status !== 'pending') {
    return { ok: true, skipped: 'not_pending_approval' }
  }

  const payLabel = formatPay(job.driver_pay)
  const title = 'New Job Assignment'
  const body = `${job.job_name} at ${job.client_school_name} — ${payLabel}/week. Tap to review and accept.`

  return sendToTokens({
    tokens,
    title,
    body,
    data: {
      type: 'job_assignment',
      job_id: String(job.id),
      job_name: String(job.job_name ?? ''),
      client_school_name: String(job.client_school_name ?? ''),
      driver_pay: String(job.driver_pay ?? ''),
    },
    driverId: job.assigned_driver_id,
    supabaseAdmin,
  })
}

export async function sendJobReminderPush({
  job,
  direction,
  startTime,
  tokens,
  supabase,
}) {
  const timeLabel = formatTimeLabel(startTime)
  const title = 'Job Starting Soon'
  const body = `${runLabel(direction)} for ${job.job_name} starts at ${timeLabel} (30 min reminder).`

  return sendToTokens({
    tokens,
    title,
    body,
    data: {
      type: 'job_reminder',
      job_id: String(job.id),
      direction: String(direction),
      start_time: timeLabel,
    },
    driverId: job.assigned_driver_id,
    supabaseAdmin: supabase,
  })
}

export async function sendJobStartPush({
  job,
  direction,
  startTime,
  tokens,
  supabase,
}) {
  const timeLabel = formatTimeLabel(startTime)
  const title = 'Job Starting Now'
  const body = `${runLabel(direction)} for ${job.job_name} at ${job.client_school_name} starts now (${timeLabel}).`

  return sendToTokens({
    tokens,
    title,
    body,
    data: {
      type: 'job_start',
      job_id: String(job.id),
      direction: String(direction),
      start_time: timeLabel,
    },
    driverId: job.assigned_driver_id,
    supabaseAdmin: supabase,
  })
}
