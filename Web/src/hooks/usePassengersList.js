import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getPassengersForCurrentAdmin } from '../services/passengerService';

function normalizePassengerStatus(raw) {
    if (raw == null || raw === '') return 'pending';
    return String(raw).trim().toLowerCase();
}

function formatTime12h(timeValue) {
    if (!timeValue) return '-';
    const [h, m] = String(timeValue).split(':');
    const hourNum = Number(h);
    if (Number.isNaN(hourNum)) return String(timeValue);
    const meridian = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${m ?? '00'} ${meridian}`;
}

function mapPassengerRow(row) {
    return {
        id: row.id,
        passengerId: row.id,
        name: `${row.first_name || ''} ${row.surname || ''}`.trim() || 'N/A',
        avatar: `https://i.pravatar.cc/150?u=${row.id}`,
        contact: row.contact_number_1 || '-',
        pickupPostcode: row.primary_pickup_postcode ?? row.pickup_postal_code ?? '-',
        pickupAddress: row.primary_pickup_address ?? row.pickup_address ?? '-',
        dropoffPostcode: row.educational_site_postcode ?? row.dropoff_postal_code ?? '-',
        dropoffAddress: row.educational_site_address ?? row.dropoff_address ?? '-',
        time: formatTime12h(row.primary_pickup_time ?? row.pickup_time),
        wheelchair: Boolean(row.wheelchair_required),
        statusDb: normalizePassengerStatus(row.status),
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

async function fetchPassengers({ background = false } = {}) {
    if (fetchPromise) return fetchPromise;

    store = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromise = (async () => {
        try {
            const rows = await getPassengersForCurrentAdmin();
            store = { data: (rows || []).map(mapPassengerRow), error: null, isFetching: false };
        } catch (e) {
            const msg = e?.message || 'Failed to load passengers.';
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

/** Clear cached passengers (e.g. on logout). */
export function clearPassengersListCache() {
    store = { data: null, error: null, isFetching: false };
    fetchPromise = null;
    emit();
}

/** Force the next visit to fetch fresh data. */
export function invalidatePassengersListCache() {
    store = { ...store, data: null, error: null };
    emit();
}

function patchPassengers(updater) {
    if (store.data === null) return;
    const next = typeof updater === 'function' ? updater(store.data) : updater;
    store = { ...store, data: next };
    emit();
}

/**
 * Stale-while-revalidate passenger list for admin / sub-admin dashboards.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function usePassengersList() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
        fetchPassengers({ background: store.data !== null });
    }, []);

    const reload = useCallback(() => fetchPassengers({ background: false }), []);

    const setPassengers = useCallback((updater) => {
        patchPassengers(updater);
    }, []);

    return {
        passengers: snapshot.data ?? [],
        loading: snapshot.data === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.data !== null,
        error: snapshot.error,
        reload,
        setPassengers,
    };
}
