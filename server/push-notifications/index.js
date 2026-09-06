import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import ws from 'ws'
import { sendJobAssignmentPush, sendUserNotificationPush } from './fcm.js'
import { startDocumentExpiryScheduler } from './documentExpiryScheduler.js'
import { startVehicleDocumentExpiryOffRoadScheduler } from './vehicleDocumentExpiryOffRoadScheduler.js'
import { startPrivateVehicleDocumentExpiryScheduler } from './privateVehicleDocumentExpiryScheduler.js'
import { startDriverDocumentExpirySuspendScheduler } from './driverDocumentExpirySuspendScheduler.js'
import { startPaDocumentExpirySuspendScheduler } from './paDocumentExpirySuspendScheduler.js'
import { startJobReassignmentReminderScheduler } from './jobReassignmentReminderScheduler.js'
import { startJobScheduler } from './jobScheduler.js'
import {
  createSupabaseAdminClient,
  createSupabaseAuthClient,
} from './supabaseClient.js'
import { createUnconfirmedMobileUser } from './emailConfirmation.js'
import { deleteAuthenticatedAccount } from './deleteAccount.js'

// Node 20 has no global WebSocket; supabase-js Realtime requires one.
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws
}

const app = express()
const port = Number(process.env.PORT || 3100)

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  console.error(
    'Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.',
  )
  process.exit(1)
}

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      console.warn(`CORS blocked request from origin: ${origin}`)
      callback(new Error(`Not allowed by CORS: ${origin}`))
    },
  }),
)
app.use(express.json())

function isAdminRole(role) {
  return role === 'admin' || role === 'subadmin'
}

async function requireAdmin(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  const supabaseAuth = createSupabaseAuthClient(authHeader)

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser()

  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  const role = user.app_metadata?.role ?? user.user_metadata?.role
  if (!isAdminRole(role)) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }

  return user
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'rideroster-push-notifications' })
})

/**
 * Mobile self-registration Auth step (same policy as web Admin / Add Driver):
 * create Auth user with email_confirm: false and send confirmation email.
 *
 * Body: {
 *   email, password,
 *   role: 'driver' | 'passenger_assistant',
 *   userMetadata?: object,
 *   emailRedirectTo?: string
 * }
 */
app.post('/auth/create-unconfirmed-mobile-user', async (req, res) => {
  try {
    const email = req.body?.email
    const password = req.body?.password
    const role = String(req.body?.role || '').trim().toLowerCase()
    const userMetadata =
      req.body?.userMetadata && typeof req.body.userMetadata === 'object'
        ? req.body.userMetadata
        : {}
    const emailRedirectTo = req.body?.emailRedirectTo
      ? String(req.body.emailRedirectTo).trim()
      : undefined

    const result = await createUnconfirmedMobileUser({
      email,
      password,
      role,
      userMetadata,
      emailRedirectTo,
    })

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('create-unconfirmed-mobile-user failed:', message)
    const status =
      message.includes('already exists') ||
      message.includes('required') ||
      message.includes('Only driver') ||
      message.includes('at least 6')
        ? 400
        : 500
    res.status(status).json({ error: message })
  }
})

/**
 * Mobile self-service account deletion.
 * Requires Authorization: Bearer <access_token> for a driver or PA.
 */
app.post('/auth/delete-account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const result = await deleteAuthenticatedAccount(authHeader)
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = Number(error?.status) || 500
    console.error('delete-account failed:', message)
    res.status(status).json({ error: message })
  }
})

app.post('/notify/job-assignment', async (req, res) => {
  try {
    const user = await requireAdmin(req, res)
    if (!user) return

    const jobId = req.body?.job_id
    if (!jobId) {
      res.status(400).json({ error: 'job_id is required' })
      return
    }

    const supabaseAdmin = createSupabaseAdminClient()

    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(
        'id, job_name, client_school_name, driver_pay, assigned_driver_id, driver_approval_status',
      )
      .eq('id', jobId)
      .maybeSingle()

    if (jobError) throw jobError
    if (!job) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('device_push_tokens')
      .select('fcm_token, platform, updated_at')
      .eq('user_id', job.assigned_driver_id)

    if (tokenError) throw tokenError

    const result = await sendJobAssignmentPush({
      job,
      tokens,
      supabaseAdmin,
    })

    console.info('job-assignment push', {
      jobId,
      driverId: job.assigned_driver_id,
      tokens: (tokens ?? []).map((t) => ({
        platform: t.platform,
        tokenPrefix: String(t.fcm_token || '').slice(0, 12),
      })),
      result,
    })

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('job-assignment notification failed:', message)
    res.status(500).json({ error: message })
  }
})

app.post('/notify/user-notification', async (req, res) => {
  try {
    const user = await requireAdmin(req, res)
    if (!user) return

    const userId = req.body?.user_id
    const title = String(req.body?.title || '').trim()
    const body = String(req.body?.body || '').trim()
    const data = req.body?.data ?? {}

    if (!userId) {
      res.status(400).json({ error: 'user_id is required' })
      return
    }
    if (!title || !body) {
      res.status(400).json({ error: 'title and body are required' })
      return
    }

    const supabaseAdmin = createSupabaseAdminClient()

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('device_push_tokens')
      .select('fcm_token, platform, updated_at')
      .eq('user_id', userId)

    if (tokenError) throw tokenError

    const result = await sendUserNotificationPush({
      userId,
      title,
      body,
      data,
      tokens,
      supabaseAdmin,
    })

    console.info('user-notification push', {
      userId,
      tokenCount: tokens?.length ?? 0,
      result,
    })

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('user-notification push failed:', message)
    res.status(500).json({ error: message })
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Push notification server listening on 0.0.0.0:${port}`)
  const supabaseAdmin = createSupabaseAdminClient()
  startJobScheduler(supabaseAdmin)
  startDocumentExpiryScheduler(supabaseAdmin)
  startVehicleDocumentExpiryOffRoadScheduler(supabaseAdmin)
  startPrivateVehicleDocumentExpiryScheduler(supabaseAdmin)
  startDriverDocumentExpirySuspendScheduler(supabaseAdmin)
  startPaDocumentExpirySuspendScheduler(supabaseAdmin)
  startJobReassignmentReminderScheduler(supabaseAdmin)
})
