import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById, getCompanyById } from '../services/companyService'
import { getAdminMonthlyReport } from '../services/adminReportService'

/** @type {{
  key: string | null,
  companyId: string | null,
  companyName: string,
  data: object | null,
  roster: { totalDrivers: number | null, totalPas: number | null },
  error: string | null,
  isFetching: boolean,
}} */
let store = {
  key: null,
  companyId: null,
  companyName: '',
  data: null,
  roster: { totalDrivers: null, totalPas: null },
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

/** Month-only key — role is filtered in the UI from the full staff list. */
function reportKey({ year, month }) {
  return `${year}-${month}`
}

async function fetchAdminReport({ year, month, background = false } = {}) {
  const key = reportKey({ year, month })
  if (fetchPromise && fetchKey === key) return fetchPromise

  const samePeriod = store.key === key && store.data !== null

  store = {
    ...store,
    isFetching: true,
    // Keep roster across month changes; clear period payload until the new month arrives.
    data: samePeriod ? store.data : null,
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

      // Always load all roles; UI filters Driver / PA client-side.
      const [company, data] = await Promise.all([
        getCompanyById(companyId),
        getAdminMonthlyReport(companyId, { year, month, role: 'all' }),
      ])

      if (fetchKey !== runKey) return

      store = {
        key,
        companyId,
        companyName: company?.company_name || '',
        data,
        roster: {
          totalDrivers: data?.stats?.totalDrivers ?? null,
          totalPas: data?.stats?.totalPas ?? null,
        },
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
          companyId: store.companyId,
          companyName: store.companyName,
          data: null,
          roster: store.roster,
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
    roster: { totalDrivers: null, totalPas: null },
    error: null,
    isFetching: false,
  }
  fetchPromise = null
  fetchKey = null
  emit()
}

/**
 * Stale-while-revalidate monthly report for the admin portal.
 * Cached by month only; role filtering is done in the page.
 */
export function useAdminReport({ year, month }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const key = reportKey({ year, month })
  const cacheHit = snapshot.key === key && snapshot.data !== null

  useEffect(() => {
    fetchAdminReport({
      year,
      month,
      background: store.key === key && store.data !== null,
    })
  }, [year, month, key])

  const reload = useCallback(
    () => fetchAdminReport({ year, month, background: false }),
    [year, month],
  )

  return {
    companyId: cacheHit || snapshot.roster.totalDrivers != null ? snapshot.companyId : null,
    companyName: cacheHit ? snapshot.companyName : snapshot.companyName || '',
    data: cacheHit ? snapshot.data : null,
    roster: snapshot.roster,
    loading: !cacheHit && snapshot.error === null,
    refreshing: snapshot.isFetching && cacheHit,
    error: cacheHit || snapshot.key === key ? snapshot.error : null,
    reload,
  }
}
