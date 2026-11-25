import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from '../services/companyService'
import { getAdminCompanyDashboard } from '../services/dashboardService'

/** @type {{
  companyId: string | null,
  data: object | null,
  error: string | null,
  isFetching: boolean,
}} */
let store = {
  companyId: null,
  data: null,
  error: null,
  isFetching: false,
}
let fetchPromise = null
const listeners = new Set()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return store
}

async function fetchAdminDashboard({ background = false } = {}) {
  if (fetchPromise) return fetchPromise

  store = { ...store, isFetching: true, ...(background ? {} : { error: null }) }
  emit()

  fetchPromise = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) {
        throw Object.assign(new Error('Not authenticated.'), { code: 'AUTH' })
      }

      const admin = await getCompanyAdminById(uid)
      const companyId = admin?.company_id
      if (!companyId) {
        throw Object.assign(new Error('No company linked to your account.'), { code: 'NO_COMPANY' })
      }

      const dash = await getAdminCompanyDashboard(companyId)
      store = {
        companyId,
        data: dash,
        error: null,
        isFetching: false,
      }
    } catch (e) {
      const msg = e?.message || 'Could not load dashboard.'
      if (store.data !== null && background) {
        store = { ...store, isFetching: false }
      } else if (store.data !== null && !background) {
        store = { ...store, error: msg, isFetching: false }
      } else {
        store = {
          companyId: null,
          data: null,
          error: msg,
          isFetching: false,
        }
      }
    } finally {
      fetchPromise = null
      emit()
    }
  })()

  return fetchPromise
}

/** Clear cached admin dashboard (e.g. on logout). */
export function clearAdminDashboardCache() {
  store = {
    companyId: null,
    data: null,
    error: null,
    isFetching: false,
  }
  fetchPromise = null
  emit()
}

/** Force the next visit to fetch fresh data. */
export function invalidateAdminDashboardCache() {
  store = { ...store, data: null, error: null }
  emit()
}

/**
 * Stale-while-revalidate admin company dashboard.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function useAdminDashboard() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    fetchAdminDashboard({ background: store.data !== null })
  }, [])

  const reload = useCallback(() => fetchAdminDashboard({ background: false }), [])

  return {
    companyId: snapshot.companyId,
    data: snapshot.data,
    loading: snapshot.data === null && snapshot.error === null,
    refreshing: snapshot.isFetching && snapshot.data !== null,
    error: snapshot.error,
    reload,
  }
}
