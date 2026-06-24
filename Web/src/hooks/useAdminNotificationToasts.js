import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  buildNotificationFromJobRow,
  buildNotificationFromLeaveRow,
  buildNotificationFromSessionPassengerRow,
  buildNotificationFromSessionRow,
  buildNotificationFromSosRow,
  detectSessionPassengerEventType,
  enrichSessionContext,
  enrichSessionPassengerContext,
  fetchCompanyNotifications,
  isNewPendingLeaveRequest,
  isSessionStartEvent,
  NOTIFICATION_ROLES,
  resolveLeaveRequestProfile,
  setNotificationRole,
} from '../services/adminNotificationService'
import {
  getCompanyNotificationContext,
  subscribeAdminNotificationRealtime,
} from '../services/adminNotificationRealtimeService'

const JOB_RESPONSE_STATUSES = new Set(['accepted', 'rejected', 'counter request', 'counter requested'])

function toastMessage(notification) {
  if (!notification) return ''
  return notification.content || `${notification.title}`.trim()
}

function notificationEventKey(notification) {
  if (!notification?.key) return null
  return `${notification.key}:${notification.createdAt || ''}`
}

export function useAdminNotificationToasts(enabled, role = NOTIFICATION_ROLES.ADMIN) {
  const [toasts, setToasts] = useState([])
  const seenEventKeysRef = useRef(new Set())
  const companyUserIdsRef = useRef(new Set())
  const companyIdRef = useRef(null)
  const readyRef = useRef(false)

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback((notification) => {
    setToasts((prev) => [
      ...prev,
      {
        id: `${notification.key}-${Date.now()}-${Math.random()}`,
        type: notification.toastType || 'info',
        title: notification.toastTitle || notification.title,
        message: toastMessage(notification),
        autoClose: true,
        duration: 7000,
      },
    ])
  }, [])

  const maybeToast = useCallback(
    (notification) => {
      if (!readyRef.current || !notification) return
      const eventKey = notificationEventKey(notification)
      if (!eventKey || seenEventKeysRef.current.has(eventKey)) return
      seenEventKeysRef.current.add(eventKey)
      pushToast(notification)
    },
    [pushToast],
  )

  const seedSeenKeys = useCallback((notifications) => {
    for (const notification of notifications || []) {
      const eventKey = notificationEventKey(notification)
      if (eventKey) seenEventKeysRef.current.add(eventKey)
    }
  }, [])

  const toastNewFromFetch = useCallback(
    (notifications) => {
      if (!readyRef.current) return
      for (const notification of notifications || []) {
        maybeToast(notification)
      }
    },
    [maybeToast],
  )

  const enrichAndToastSos = useCallback(
    async (row) => {
      if (!row?.id || row.company_id !== companyIdRef.current) return

      let plate = null
      let driverLabel = null

      if (row.vehicle_id) {
        const { data } = await supabaseLookupVehicle(row.vehicle_id)
        plate = data?.taxi_license_plate_number ?? null
      }

      if (row.driver_id) {
        const { data } = await supabaseLookupDriver(row.driver_id)
        if (data) {
          driverLabel = [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || null
        }
      }

      maybeToast(buildNotificationFromSosRow(row, { plate, driverLabel }))
    },
    [maybeToast],
  )

  const enrichAndToastLeave = useCallback(
    async (row, eventType) => {
      if (!row?.user_id || !isNewPendingLeaveRequest(eventType, row)) return

      const profile = await resolveLeaveRequestProfile(row, companyIdRef.current)
      if (!profile) return

      maybeToast(buildNotificationFromLeaveRow(row, profile))
    },
    [maybeToast],
  )

  const enrichAndToastJob = useCallback(
    async (row, previousStatus) => {
      if (!row?.id || row.company_id !== companyIdRef.current) return

      const status = String(row.driver_approval_status || '').trim().toLowerCase()
      if (!JOB_RESPONSE_STATUSES.has(status)) return
      if (previousStatus && String(previousStatus).trim().toLowerCase() === status) return

      let driver = null
      if (row.assigned_driver_id) {
        const { data } = await supabaseLookupDriver(row.assigned_driver_id)
        driver = data
      }

      const notification = buildNotificationFromJobRow(row, driver)
      if (notification) maybeToast(notification)
    },
    [maybeToast],
  )

  const enrichAndToastSession = useCallback(
    async (newRow, oldRow) => {
      if (!newRow?.id || !isSessionStartEvent(oldRow, newRow)) return

      const enrich = await enrichSessionContext(newRow, companyIdRef.current)
      if (!enrich) return

      const notification = buildNotificationFromSessionRow(newRow, enrich)
      if (notification) maybeToast(notification)
    },
    [maybeToast],
  )

  const enrichAndToastSessionPassenger = useCallback(
    async (newRow, oldRow) => {
      if (!newRow?.id) return

      const eventType = detectSessionPassengerEventType(oldRow, newRow)
      if (!eventType) return

      const enrich = await enrichSessionPassengerContext(newRow, companyIdRef.current)
      if (!enrich) return

      const notification = buildNotificationFromSessionPassengerRow(newRow, eventType, enrich)
      if (notification) maybeToast(notification)
    },
    [maybeToast],
  )

  const handleRealtimeEvent = useCallback(
    async (event) => {
      setNotificationRole(role)

      if (event.source === 'poll') {
        try {
          const { notifications } = await fetchCompanyNotifications(role)
          toastNewFromFetch(notifications)
        } catch {
          // ignore poll errors
        }
        return
      }

      const payload = event.payload
      if (!payload) return

      if (event.source === 'sos' && payload.new) {
        await enrichAndToastSos(payload.new)
        return
      }

      if (event.source === 'leave' && payload.new) {
        await enrichAndToastLeave(payload.new, payload.eventType)
        return
      }

      if (event.source === 'job' && payload.new) {
        await enrichAndToastJob(payload.new, payload.old?.driver_approval_status)
        return
      }

      if (event.source === 'job_session' && payload.new) {
        await enrichAndToastSession(payload.new, payload.old ?? null)
        return
      }

      if (event.source === 'job_session_passenger' && payload.new) {
        await enrichAndToastSessionPassenger(payload.new, payload.old ?? null)
      }
    },
    [
      enrichAndToastJob,
      enrichAndToastLeave,
      enrichAndToastSession,
      enrichAndToastSessionPassenger,
      enrichAndToastSos,
      toastNewFromFetch,
      role,
    ],
  )

  useEffect(() => {
    if (!enabled) {
      seenEventKeysRef.current = new Set()
      companyUserIdsRef.current = new Set()
      companyIdRef.current = null
      readyRef.current = false
      return undefined
    }

    let cancelled = false
    let unsubscribe = () => {}

    const init = async () => {
      try {
        setNotificationRole(role)
        const { companyId } = await getCompanyNotificationContext(role)
        if (cancelled) return

        companyIdRef.current = companyId

        try {
          const fetched = await fetchCompanyNotifications(role)
          if (!cancelled) {
            companyUserIdsRef.current = new Set(fetched.companyUserIds)
            seedSeenKeys(fetched.notifications)
          }
        } catch {
          // still subscribe even if the initial fetch fails
        }

        readyRef.current = true
        unsubscribe = subscribeAdminNotificationRealtime(companyId, (event) => {
          handleRealtimeEvent(event).catch(() => {})
        })
      } catch {
        if (!cancelled) readyRef.current = true
      }
    }

    init()

    return () => {
      cancelled = true
      readyRef.current = false
      unsubscribe()
    }
  }, [enabled, role, handleRealtimeEvent, seedSeenKeys])

  return { toasts, dismissToast }
}

async function supabaseLookupVehicle(vehicleId) {
  return supabase
    .from('vehicles')
    .select('taxi_license_plate_number')
    .eq('id', vehicleId)
    .maybeSingle()
}

async function supabaseLookupDriver(driverId) {
  return supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('id', driverId)
    .maybeSingle()
}

async function supabaseLookupPa(paId) {
  return supabase
    .from('passenger_assistant')
    .select('first_name, surname')
    .eq('id', paId)
    .maybeSingle()
}
