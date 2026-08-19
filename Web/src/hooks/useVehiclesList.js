import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getVehiclesForCurrentAdmin } from '../services/driverVehicleService';

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

async function fetchVehicles({ background = false } = {}) {
    if (fetchPromise) return fetchPromise;

    store = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromise = (async () => {
        try {
            const rows = await getVehiclesForCurrentAdmin();
            store = { data: rows || [], error: null, isFetching: false };
        } catch (e) {
            const msg = e?.message || 'Could not load vehicles.';
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

export function clearVehiclesListCache() {
    store = { data: null, error: null, isFetching: false };
    fetchPromise = null;
    emit();
}

export function invalidateVehiclesListCache() {
    store = { ...store, data: null, error: null };
    emit();
}

export function refreshVehiclesListInBackground() {
    return fetchVehicles({ background: store.data !== null });
}

function patchVehicles(updater) {
    if (store.data === null) return;
    const next = typeof updater === 'function' ? updater(store.data) : updater;
    store = { ...store, data: next };
    emit();
}

export function useVehiclesList() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
        fetchVehicles({ background: store.data !== null });
    }, []);

    const reload = useCallback(() => fetchVehicles({ background: false }), []);

    const setVehicles = useCallback((updater) => {
        patchVehicles(updater);
    }, []);

    return {
        vehicles: snapshot.data ?? [],
        loading: snapshot.data === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.data !== null,
        error: snapshot.error,
        reload,
        setVehicles,
    };
}
