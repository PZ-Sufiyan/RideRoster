import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById, getCompanyById } from '../services/companyService'
import { getAdminPaReport } from '../services/adminPaReportService'

/** @type {{
  key: string | null,
  paId: string | null,
  pa: object | null,
  companyId: string | null,
  companyName: string,
  data: object | null,
  error: string | null,
  isFetching: boolean,
}} */
let store = {
  key: null,
  paId: null,
  pa: null,
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

function reportKey({ paId, year, month }) {
  return `${paId || 'none'}-${year}-${month}`
}

async function fetchPaReport({ paId, year, month, background = false } = {}) {
  const key = reportKey({ paId, year, month })
  if (!paId) {
    store = {
      key,
      paId: null,
      pa: null,
      companyId: null,
      companyName: '',
      data: null,
      error: 'Missing passenger assistant id.',
      isFetching: false,
    }
    emit()
    return
  }
  if (fetchPromise && fetchKey === key) return fetchPromise

  const samePa = store.paId === paId && Boolean(store.pa)
  const samePeriod = store.key === key && store.data !== null

  store = {
    ...store,
    isFetching: true,
    data: samePeriod ? store.data : null,
    pa: samePa ? store.pa : null,
    paId: samePa ? paId : null,
    companyId: samePa ? store.companyId : null,
    companyName: samePa ? store.companyName : '',
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
        getAdminPaReport(companyId, paId, { year, month }),
      ])

      if (fetchKey !== runKey) return

      store = {
        key,
        paId,
        pa: data?.pa || null,
        companyId,
        companyName: company?.company_name || '',
        data,
        error: null,
        isFetching: false,
      }
    } catch (e) {
      if (fetchKey !== runKey) return
      const msg = e?.message || 'Could not load PA report.'
      const hasCacheForKey = store.data !== null && store.key === key
      const keepPa = store.paId === paId ? store.pa : null
      if (hasCacheForKey && background) {
        store = { ...store, isFetching: false }
      } else if (hasCacheForKey && !background) {
        store = { ...store, error: msg, isFetching: false }
      } else {
        store = {
          key,
          paId: keepPa ? paId : null,
          pa: keepPa,
          companyId: keepPa ? store.companyId : null,
          companyName: keepPa ? store.companyName : '',
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

export function clearAdminPaReportCache() {
  store = {
    key: null,
    paId: null,
    pa: null,
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

export function useAdminPaReport({ paId, year, month }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const key = reportKey({ paId, year, month })
  const cacheHit = snapshot.key === key && snapshot.data !== null
  const profileReady = Boolean(paId && snapshot.paId === paId && snapshot.pa)

  useEffect(() => {
    const samePaCached = store.paId === paId && Boolean(store.pa)
    const samePeriodCached = store.key === key && store.data !== null
    fetchPaReport({
      paId,
      year,
      month,
      background: samePeriodCached || samePaCached,
    })
  }, [paId, year, month, key])

  const reload = useCallback(
    () => fetchPaReport({ paId, year, month, background: false }),
    [paId, year, month],
  )

  return {
    companyId: profileReady || cacheHit ? snapshot.companyId : null,
    companyName: profileReady || cacheHit ? snapshot.companyName : '',
    pa: profileReady ? snapshot.pa : null,
    data: cacheHit ? snapshot.data : null,
    profileLoading: Boolean(paId) && !profileReady && snapshot.error === null,
    loading: !cacheHit && snapshot.error === null,
    refreshing: snapshot.isFetching && cacheHit,
    error: cacheHit || snapshot.key === key || profileReady ? snapshot.error : null,
    reload,
  }
}
