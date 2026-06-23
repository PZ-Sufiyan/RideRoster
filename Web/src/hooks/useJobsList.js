import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { fetchJobsListPageDataForCurrentAdmin } from '../services/jobService';

/** @type {{
  companyId: string | null,
  jobs: object[] | null,
  jobsMinimal: object[] | null,
  drivers: object[] | null,
  passengerAssistants: object[] | null,
  error: string | null,
  isFetching: boolean,
}} */
let store = {
    companyId: null,
    jobs: null,
    jobsMinimal: null,
    drivers: null,
    passengerAssistants: null,
    error: null,
    isFetching: false,
};
let fetchPromise = null;
const listeners = new Set();

function emit() {
    listeners.forEach((l) => l());
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return store;
}

async function fetchJobsList({ background = false } = {}) {
    if (fetchPromise) return fetchPromise;

    store = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromise = (async () => {
        try {
            const data = await fetchJobsListPageDataForCurrentAdmin();
            store = {
                companyId: data.companyId,
                jobs: data.jobs || [],
                jobsMinimal: data.jobsMinimal || [],
                drivers: data.drivers || [],
                passengerAssistants: data.passengerAssistants || [],
                error: null,
                isFetching: false,
            };
        } catch (e) {
            const msg = e?.message || 'Could not load jobs.';
            if (store.jobs !== null && background) {
                store = { ...store, isFetching: false };
            } else if (store.jobs !== null && !background) {
                store = { ...store, error: msg, isFetching: false };
            } else {
                store = {
                    companyId: null,
                    jobs: null,
                    jobsMinimal: null,
                    drivers: null,
                    passengerAssistants: null,
                    error: msg,
                    isFetching: false,
                };
            }
        } finally {
            fetchPromise = null;
            emit();
        }
    })();

    return fetchPromise;
}

/** Clear cached jobs list (e.g. on logout). */
export function clearJobsListCache() {
    store = {
        companyId: null,
        jobs: null,
        jobsMinimal: null,
        drivers: null,
        passengerAssistants: null,
        error: null,
        isFetching: false,
    };
    fetchPromise = null;
    emit();
}

/** Force the next visit to fetch fresh data. */
export function invalidateJobsListCache() {
    store = {
        ...store,
        jobs: null,
        jobsMinimal: null,
        drivers: null,
        passengerAssistants: null,
        error: null,
    };
    emit();
}

function patchJobs(updater) {
    if (store.jobs === null) return;
    const next = typeof updater === 'function' ? updater(store.jobs) : updater;
    store = { ...store, jobs: next };
    emit();
}

function patchJobsMinimal(updater) {
    if (store.jobsMinimal === null) return;
    const next = typeof updater === 'function' ? updater(store.jobsMinimal) : updater;
    store = { ...store, jobsMinimal: next };
    emit();
}

function patchDrivers(updater) {
    if (store.drivers === null) return;
    const next = typeof updater === 'function' ? updater(store.drivers) : updater;
    store = { ...store, drivers: next };
    emit();
}

function patchPassengerAssistants(updater) {
    if (store.passengerAssistants === null) return;
    const next = typeof updater === 'function' ? updater(store.passengerAssistants) : updater;
    store = { ...store, passengerAssistants: next };
    emit();
}

/**
 * Stale-while-revalidate jobs list for admin / sub-admin dashboards.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function useJobsList() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
        fetchJobsList({ background: store.jobs !== null });
    }, []);

    const reload = useCallback(() => fetchJobsList({ background: false }), []);

    const setJobs = useCallback((updater) => {
        patchJobs(updater);
    }, []);

    const setJobsMinimal = useCallback((updater) => {
        patchJobsMinimal(updater);
    }, []);

    const setDriversCatalog = useCallback((updater) => {
        patchDrivers(updater);
    }, []);

    const setPasCatalog = useCallback((updater) => {
        patchPassengerAssistants(updater);
    }, []);

    return {
        companyId: snapshot.companyId,
        jobs: snapshot.jobs ?? [],
        jobsMinimal: snapshot.jobsMinimal ?? [],
        driversCatalog: snapshot.drivers ?? [],
        pasCatalog: snapshot.passengerAssistants ?? [],
        loading: snapshot.jobs === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.jobs !== null,
        error: snapshot.error,
        reload,
        setJobs,
        setJobsMinimal,
        setDriversCatalog,
        setPasCatalog,
    };
}
