import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
    getSubAdminsForCurrentAdmin,
    formatSubAdminPermissionsSummary,
    normalizeSubAdminStatus,
} from '../services/subAdminService';

function mapSubAdminRow(row) {
    return {
        id: row.id,
        name: row.name?.trim() || '—',
        email: row.email != null && String(row.email).trim() !== '' ? String(row.email).trim() : '',
        phone: row.phone != null && String(row.phone).trim() !== '' ? String(row.phone).trim() : '',
        avatar: `https://i.pravatar.cc/64?u=${row.id}`,
        permissions: formatSubAdminPermissionsSummary(row),
        statusDb: normalizeSubAdminStatus(row.status),
        updatedAt: row.updated_at,
    };
}

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

async function fetchSubAdmins({ background = false } = {}) {
    if (fetchPromise) return fetchPromise;

    store = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromise = (async () => {
        try {
            const rows = await getSubAdminsForCurrentAdmin();
            store = { data: (rows || []).map(mapSubAdminRow), error: null, isFetching: false };
        } catch (e) {
            const msg = e?.message || 'Failed to load sub-admins.';
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

/** Clear cached sub-admins (e.g. on logout). */
export function clearSubAdminsListCache() {
    store = { data: null, error: null, isFetching: false };
    fetchPromise = null;
    emit();
}

/** Force the next visit to fetch fresh data. */
export function invalidateSubAdminsListCache() {
    store = { ...store, data: null, error: null };
    emit();
}

function patchSubAdmins(updater) {
    if (store.data === null) return;
    const next = typeof updater === 'function' ? updater(store.data) : updater;
    store = { ...store, data: next };
    emit();
}

/**
 * Stale-while-revalidate sub-admin list for the admin dashboard.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function useSubAdminsList() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
        fetchSubAdmins({ background: store.data !== null });
    }, []);

    const reload = useCallback(() => fetchSubAdmins({ background: false }), []);

    const setSubAdmins = useCallback((updater) => {
        patchSubAdmins(updater);
    }, []);

    return {
        subAdmins: snapshot.data ?? [],
        loading: snapshot.data === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.data !== null,
        error: snapshot.error,
        reload,
        setSubAdmins,
    };
}
