import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getDriversForCurrentAdmin } from '../services/driverVehicleService';

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

async function fetchDrivers({ background = false } = {}) {
    if (fetchPromise) return fetchPromise;

    store = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromise = (async () => {
        try {
            const rows = await getDriversForCurrentAdmin();
            store = { data: rows || [], error: null, isFetching: false };
        } catch (e) {
            const msg = e?.message || 'Could not load drivers.';
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

/** Clear cached drivers (e.g. on logout). */
export function clearDriversListCache() {
    store = { data: null, error: null, isFetching: false };
    fetchPromise = null;
    emit();
}

/** Force the next visit to fetch fresh data. */
export function invalidateDriversListCache() {
    store = { ...store, data: null, error: null };
    emit();
}

function patchDrivers(updater) {
    if (store.data === null) return;
    const next = typeof updater === 'function' ? updater(store.data) : updater;
    store = { ...store, data: next };
    emit();
}

/**
 * Stale-while-revalidate drivers list for admin / sub-admin dashboards.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function useDriversList() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
        fetchDrivers({ background: store.data !== null });
    }, []);

    const reload = useCallback(() => fetchDrivers({ background: false }), []);

    const setDrivers = useCallback((updater) => {
        patchDrivers(updater);
    }, []);

    return {
        drivers: snapshot.data ?? [],
        loading: snapshot.data === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.data !== null,
        error: snapshot.error,
        reload,
        setDrivers,
    };
}
