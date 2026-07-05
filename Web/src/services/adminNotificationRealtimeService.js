import { supabase } from '../lib/supabaseClient'
import {
  NOTIFICATION_ROLES,
  getCompanyContextForRole as resolveCompanyNotificationContext,
} from './adminNotificationService'

const POLL_MS = 12000

/** @typedef {'sos' | 'leave' | 'job' | 'job_session' | 'job_session_passenger' | 'document_expiry' | 'poll' | 'system'} AdminNotificationRealtimeSource */

/** @typedef {Object} AdminNotificationRealtimeEvent
 * @property {AdminNotificationRealtimeSource} source
 * @property {import('@supabase/supabase-js').RealtimePostgresChangesPayload} [payload]
 * @property {{ type: string }} [meta]
 */

/** @type {Map<string, Set<(event: AdminNotificationRealtimeEvent) => void>>} */
const listenersByCompany = new Map()

/** @type {Map<string, import('@supabase/supabase-js').RealtimeChannel>} */
const channelsByCompany = new Map()

/** @type {Map<string, ReturnType<typeof setInterval>>} */
const pollTimersByCompany = new Map()

export async function getCompanyNotificationContext(role = NOTIFICATION_ROLES.ADMIN) {
  const { userId, companyId } = await resolveCompanyNotificationContext(role)
  return { userId, companyId, role }
}

/** @deprecated use getCompanyNotificationContext('admin') */
export async function getAdminCompanyContext() {
  return getCompanyNotificationContext(NOTIFICATION_ROLES.ADMIN)
}

function emit(companyId, event) {
  const callbacks = listenersByCompany.get(companyId)
  if (!callbacks?.size) return
  callbacks.forEach((callback) => {
    try {
      callback(event)
    } catch {
      // listener errors must not break the channel
    }
  })
}

function teardownChannel(companyId) {
  const channel = channelsByCompany.get(companyId)
  if (channel) {
    supabase.removeChannel(channel)
    channelsByCompany.delete(companyId)
  }

  const timer = pollTimersByCompany.get(companyId)
  if (timer) {
    clearInterval(timer)
    pollTimersByCompany.delete(companyId)
  }
}

function ensureChannel(companyId) {
  if (channelsByCompany.has(companyId)) return

  const channel = supabase.channel(`admin-notifications-rt-${companyId}`)

  const forward =
    (source) =>
    (payload) => {
      emit(companyId, { source, payload })
    }

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'sos',
      filter: `company_id=eq.${companyId}`,
    },
    forward('sos'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'sos',
      filter: `company_id=eq.${companyId}`,
    },
    forward('sos'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'leave_requests',
    },
    forward('leave'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'leave_requests',
    },
    forward('leave'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'jobs',
      filter: `company_id=eq.${companyId}`,
    },
    forward('job'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'jobs',
      filter: `company_id=eq.${companyId}`,
    },
    forward('job'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'job_sessions',
    },
    forward('job_session'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'job_sessions',
    },
    forward('job_session'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'job_session_passengers',
    },
    forward('job_session_passenger'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'job_session_passengers',
    },
    forward('job_session_passenger'),
  )

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'document_expiry_notifications_sent',
      filter: `company_id=eq.${companyId}`,
    },
    forward('document_expiry'),
  )

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      emit(companyId, { source: 'system', meta: { type: 'SUBSCRIBED' } })
    }
  })

  channelsByCompany.set(companyId, channel)

  const pollTimer = setInterval(() => {
    emit(companyId, { source: 'poll', meta: { type: 'POLL' } })
  }, POLL_MS)
  pollTimersByCompany.set(companyId, pollTimer)
}

/**
 * Subscribe to admin notification realtime events for a company.
 * Uses one shared Supabase channel + polling fallback per company.
 *
 * @param {string} companyId
 * @param {(event: AdminNotificationRealtimeEvent) => void} onEvent
 * @returns {() => void}
 */
export function subscribeAdminNotificationRealtime(companyId, onEvent) {
  if (!companyId || typeof onEvent !== 'function') {
    return () => {}
  }

  if (!listenersByCompany.has(companyId)) {
    listenersByCompany.set(companyId, new Set())
  }
  listenersByCompany.get(companyId).add(onEvent)
  ensureChannel(companyId)

  return () => {
    const callbacks = listenersByCompany.get(companyId)
    if (!callbacks) return
    callbacks.delete(onEvent)
    if (callbacks.size === 0) {
      listenersByCompany.delete(companyId)
      teardownChannel(companyId)
    }
  }
}
