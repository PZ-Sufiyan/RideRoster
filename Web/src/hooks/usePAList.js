import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getPassengerAssistantsForCurrentAdmin } from '../services/passengerAsssistantService';

const PA_STATUS_DB = {
    PENDING: 'pending',
    APPROVE: 'approve',
    REJECT: 'reject',
    SUSPEND: 'suspend',
};

function normalizePaStatus(raw) {
    if (raw == null || raw === '') return PA_STATUS_DB.PENDING;
    const s = String(raw).trim().toLowerCase();
    if (['pending', 'approve', 'reject', 'suspend'].includes(s)) return s;
    if (s === 'approved') return PA_STATUS_DB.APPROVE;
    if (s === 'rejected') return PA_STATUS_DB.REJECT;
    if (s === 'suspended') return PA_STATUS_DB.SUSPEND;
    return s;
}

function mapPassengerAssistantRow(row) {
    return {
        id: row.id,
        paId: row.id,
        name: `${row.first_name || ''} ${row.surname || ''}`.trim() || 'N/A',
        avatar: row.profile_picture_url || `https://i.pravatar.cc/64?u=${row.id}`,
        email: row.email || '-',
        phone: row.phone || '-',
        assignedJobs: 0,
        statusDb: normalizePaStatus(row.status),
        fleet: String(row.fleet || 'company').trim().toLowerCase() === 'private' ? 'private' : 'company',
        dateAdded: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '-',
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

async function fetchPas({ background = false } = {}) {
    if (fetchPromise) return fetchPromise;

    store = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromise = (async () => {
        try {
            const rows = await getPassengerAssistantsForCurrentAdmin();
            store = { data: (rows || []).map(mapPassengerAssistantRow), error: null, isFetching: false };
        } catch (e) {
            const msg = e?.message || 'Failed to load passenger assistants.';
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

/** Clear cached PAs (e.g. on logout). */
export function clearPAListCache() {
    store = { data: null, error: null, isFetching: false };
    fetchPromise = null;
    emit();
}

/** Force the next visit to fetch fresh data. */
export function invalidatePAListCache() {
    store = { ...store, data: null, error: null };
    emit();
}

function patchPas(updater) {
    if (store.data === null) return;
    const next = typeof updater === 'function' ? updater(store.data) : updater;
    store = { ...store, data: next };
    emit();
}

/**
 * Stale-while-revalidate PA list for admin / sub-admin dashboards.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function usePAList() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
        fetchPas({ background: store.data !== null });
    }, []);

    const reload = useCallback(() => fetchPas({ background: false }), []);

    const setPas = useCallback((updater) => {
        patchPas(updater);
    }, []);

    return {
        pas: snapshot.data ?? [],
        loading: snapshot.data === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.data !== null,
        error: snapshot.error,
        reload,
        setPas,
    };
}
