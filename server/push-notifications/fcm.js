import { JWT } from 'google-auth-library'

function formatPay(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `£${n.toFixed(2)}`
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

async function sendFcmMessage({ token, title, body, data }) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const accessToken = await getFcmAccessToken()

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
          data,
          android: {
            priority: 'HIGH',
            notification: {
              channel_id: 'ride_roster_channel',
              color: '#4A90D9',
              default_sound: true,
              notification_priority: 'PRIORITY_HIGH',
            },
          },
          apns: {
            payload: {
              aps: {
                alert: { title, body },
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`FCM send failed: ${err}`)
  }
}

export async function sendJobAssignmentPush({ job, tokens, supabaseAdmin }) {
  if (!job?.assigned_driver_id) {
    return { ok: true, skipped: 'no_assigned_driver' }
  }

  if (job.driver_approval_status !== 'pending') {
    return { ok: true, skipped: 'not_pending_approval' }
  }

  const fcmTokens = (tokens ?? [])
    .map((row) => row.fcm_token)
    .filter((token) => typeof token === 'string' && token.trim().length > 0)

  if (fcmTokens.length === 0) {
    return { ok: true, skipped: 'no_device_tokens' }
  }

  const payLabel = formatPay(job.driver_pay)
  const title = 'New Job Assignment'
  const body = `${job.job_name} at ${job.client_school_name} — ${payLabel}/week. Tap to review and accept.`

  const data = {
    type: 'job_assignment',
    job_id: String(job.id),
    job_name: String(job.job_name ?? ''),
    client_school_name: String(job.client_school_name ?? ''),
    driver_pay: String(job.driver_pay ?? ''),
  }

  const results = await Promise.allSettled(
    fcmTokens.map((token) => sendFcmMessage({ token, title, body, data })),
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  const staleTokens = []
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'rejected') {
      const message = String(result.reason ?? '')
      if (
        message.includes('NOT_FOUND') ||
        message.includes('UNREGISTERED') ||
        message.includes('InvalidRegistration')
      ) {
        staleTokens.push(fcmTokens[i])
      }
    }
  }

  if (staleTokens.length > 0) {
    await supabaseAdmin
      .from('device_push_tokens')
      .delete()
      .eq('user_id', job.assigned_driver_id)
      .in('fcm_token', staleTokens)
  }

  return { ok: true, sent, failed, total: fcmTokens.length }
}
