import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getLeaveRequestsEnrichedForCurrentAdmin } from '../services/driverOffDayRequestService';

/** @type {{ data: object[] | null, error: string | null, isFetching: boolean }} */
let store = { data: null, error: null, isFetching: false };
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

async function fetchLeaveRequests({ background = false } = {}) {
    if (fetchPromise) return fetchPromise;

    store = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromise = (async () => {
        try {
            const data = await getLeaveRequestsEnrichedForCurrentAdmin();
            store = { data: data || [], error: null, isFetching: false };
        } catch (e) {
            const msg = e?.message || 'Could not load leave requests.';
            if (store.data !== null && background) {
                store = { ...store, isFetching: false };
            } else if (store.data !== null && !background) {
                store = { ...store, error: msg, isFetching: false };
            } else {
                store = { data: null, error: msg, isFetching: false };
            }
        } finally {
            fetchPromise = null;
            emit();
        }
    })();

    return fetchPromise;
}

/** Clear cached leave requests (e.g. on logout). */
export function clearLeaveRequestsListCache() {
    store = { data: null, error: null, isFetching: false };
    fetchPromise = null;
    emit();
}

/** Force the next visit to fetch fresh data. */
export function invalidateLeaveRequestsListCache() {
    store = { ...store, data: null, error: null };
    emit();
}

function patchLeaveRequests(updater) {
    if (store.data === null) return;
    const next = typeof updater === 'function' ? updater(store.data) : updater;
    store = { ...store, data: next };
    emit();
}

/**
 * Stale-while-revalidate leave / off-day requests for admin / sub-admin dashboards.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function useLeaveRequestsList() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
        fetchLeaveRequests({ background: store.data !== null });
    }, []);

    const reload = useCallback(() => fetchLeaveRequests({ background: false }), []);

    const setLeaveRequests = useCallback((updater) => {
        patchLeaveRequests(updater);
    }, []);

    return {
        rows: snapshot.data ?? [],
        loading: snapshot.data === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.data !== null,
        error: snapshot.error,
        reload,
        setLeaveRequests,
    };
}
