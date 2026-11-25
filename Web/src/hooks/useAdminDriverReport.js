import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById, getCompanyById } from '../services/companyService'
import { getAdminDriverReport } from '../services/adminDriverReportService'

/** @type {{
  key: string | null,
  driverId: string | null,
  driver: object | null,
  companyId: string | null,
  companyName: string,
  data: object | null,
  error: string | null,
  isFetching: boolean,
}} */
let store = {
  key: null,
  driverId: null,
  driver: null,
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

function reportKey({ driverId, year, month }) {
  return `${driverId || 'none'}-${year}-${month}`
}

async function fetchDriverReport({ driverId, year, month, background = false } = {}) {
  const key = reportKey({ driverId, year, month })
  if (!driverId) {
    store = {
      key,
      driverId: null,
      driver: null,
      companyId: null,
      companyName: '',
      data: null,
      error: 'Missing driver id.',
      isFetching: false,
    }
    emit()
    return
  }
  if (fetchPromise && fetchKey === key) return fetchPromise

  const sameDriver = store.driverId === driverId && Boolean(store.driver)
  const samePeriod = store.key === key && store.data !== null

  store = {
    ...store,
    isFetching: true,
    // Keep profile across month changes; only drop period payload until the new month arrives.
    data: samePeriod ? store.data : null,
    driver: sameDriver ? store.driver : null,
    driverId: sameDriver ? driverId : null,
    companyId: sameDriver ? store.companyId : null,
    companyName: sameDriver ? store.companyName : '',
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
      if (!uid) throw Object.assign(new Error('Not authenticated.'), { code: 'AUTH' })

      const admin = await getCompanyAdminById(uid)
      const companyId = admin?.company_id
      if (!companyId) throw Object.assign(new Error('No company linked to your account.'), { code: 'NO_COMPANY' })

      const [company, data] = await Promise.all([
        getCompanyById(companyId),
        getAdminDriverReport(companyId, driverId, { year, month }),
      ])

      if (fetchKey !== runKey) return

      store = {
        key,
        driverId,
        driver: data?.driver || null,
        companyId,
        companyName: company?.company_name || '',
        data,
        error: null,
        isFetching: false,
      }
    } catch (e) {
      if (fetchKey !== runKey) return
      const msg = e?.message || 'Could not load driver report.'
      const hasCacheForKey = store.data !== null && store.key === key
      const keepDriver = store.driverId === driverId ? store.driver : null
      if (hasCacheForKey && background) {
        store = { ...store, isFetching: false }
      } else if (hasCacheForKey && !background) {
        store = { ...store, error: msg, isFetching: false }
      } else {
        store = {
          key,
          driverId: keepDriver ? driverId : null,
          driver: keepDriver,
          companyId: keepDriver ? store.companyId : null,
          companyName: keepDriver ? store.companyName : '',
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

export function clearAdminDriverReportCache() {
  store = {
    key: null,
    driverId: null,
    driver: null,
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

export function useAdminDriverReport({ driverId, year, month }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const key = reportKey({ driverId, year, month })
  const cacheHit = snapshot.key === key && snapshot.data !== null
  const profileReady = Boolean(driverId && snapshot.driverId === driverId && snapshot.driver)

  useEffect(() => {
    const sameDriverCached = store.driverId === driverId && Boolean(store.driver)
    const samePeriodCached = store.key === key && store.data !== null
    fetchDriverReport({
      driverId,
      year,
      month,
      background: samePeriodCached || sameDriverCached,
    })
  }, [driverId, year, month, key])

  const reload = useCallback(
    () => fetchDriverReport({ driverId, year, month, background: false }),
    [driverId, year, month],
  )

  return {
    companyId: profileReady || cacheHit ? snapshot.companyId : null,
    companyName: profileReady || cacheHit ? snapshot.companyName : '',
    driver: profileReady ? snapshot.driver : null,
    data: cacheHit ? snapshot.data : null,
    profileLoading: Boolean(driverId) && !profileReady && snapshot.error === null,
    loading: !cacheHit && snapshot.error === null,
    refreshing: snapshot.isFetching && cacheHit,
    error: cacheHit || snapshot.key === key || profileReady ? snapshot.error : null,
    reload,
  }
}
