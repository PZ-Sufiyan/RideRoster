import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById, getCompanyById } from '../services/companyService'
import { getAdminMonthlyReport } from '../services/adminReportService'

/** @type {{
  key: string | null,
  companyId: string | null,
  companyName: string,
  data: object | null,
  error: string | null,
  isFetching: boolean,
}} */
let store = {
  key: null,
  companyId: null,
  companyName: '',
  data: null,
  error: null,
  isFetching: false,
}
let fetchPromise = null
let fetchKey = null
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

function reportKey({ year, month, role }) {
  return `${year}-${month}-${role || 'all'}`
}

async function fetchAdminReport({ year, month, role = 'all', background = false } = {}) {
  const key = reportKey({ year, month, role })
  if (fetchPromise && fetchKey === key) return fetchPromise

  store = {
    ...store,
    isFetching: true,
    ...(background ? {} : { error: null }),
  }
  emit()

  fetchKey = key
  const runKey = key
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

      const [company, data] = await Promise.all([
        getCompanyById(companyId),
        getAdminMonthlyReport(companyId, { year, month, role }),
      ])

      if (fetchKey !== runKey) return

      store = {
        key,
        companyId,
        companyName: company?.company_name || '',
        data,
        error: null,
        isFetching: false,
      }
    } catch (e) {
      if (fetchKey !== runKey) return
      const msg = e?.message || 'Could not load report.'
      const hasCacheForKey = store.data !== null && store.key === key
      if (hasCacheForKey && background) {
        store = { ...store, isFetching: false }
      } else if (hasCacheForKey && !background) {
        store = { ...store, error: msg, isFetching: false }
      } else {
        store = {
          key,
          companyId: null,
          companyName: '',
          data: null,
          error: msg,
          isFetching: false,
        }
      }
    } finally {
      if (fetchKey === runKey) {
        fetchPromise = null
        fetchKey = null
      }
      emit()
    }
  })()

  return fetchPromise
}

/** Clear cached admin report (e.g. on logout). */
export function clearAdminReportCache() {
  store = {
    key: null,
    companyId: null,
    companyName: '',
    data: null,
    error: null,
    isFetching: false,
  }
  fetchPromise = null
  fetchKey = null
  emit()
}

/**
 * Stale-while-revalidate monthly report for the admin portal.
 * Reuses cache when the same month/role is opened again.
 */
export function useAdminReport({ year, month, role = 'all' }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const key = reportKey({ year, month, role })
  const cacheHit = snapshot.key === key && snapshot.data !== null

  useEffect(() => {
    fetchAdminReport({
      year,
      month,
      role,
      background: store.key === key && store.data !== null,
    })
  }, [year, month, role, key])

  const reload = useCallback(
    () => fetchAdminReport({ year, month, role, background: false }),
    [year, month, role],
  )

  return {
    companyId: cacheHit ? snapshot.companyId : null,
    companyName: cacheHit ? snapshot.companyName : '',
    data: cacheHit ? snapshot.data : null,
    loading: !cacheHit && snapshot.error === null,
    refreshing: snapshot.isFetching && cacheHit,
    error: cacheHit || snapshot.key === key ? snapshot.error : null,
    reload,
  }
}
