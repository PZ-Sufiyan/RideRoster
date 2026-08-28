import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
    fetchCompanyNotifications,
    NOTIFICATION_ROLES,
} from '../services/adminNotificationService';

function createEmptyStore() {
    return {
        notifications: null,
        userId: null,
        companyId: null,
        error: null,
        isFetching: false,
    };
}

/** @type {Record<string, ReturnType<typeof createEmptyStore>>} */
const stores = {
    [NOTIFICATION_ROLES.ADMIN]: createEmptyStore(),
    [NOTIFICATION_ROLES.SUBADMIN]: createEmptyStore(),
};

/** @type {Record<string, Promise<void> | null>} */
const fetchPromises = {
    [NOTIFICATION_ROLES.ADMIN]: null,
    [NOTIFICATION_ROLES.SUBADMIN]: null,
};

const listeners = new Set();

function emit() {
    listeners.forEach((l) => l());
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getStore(role) {
    return stores[role] || createEmptyStore();
}

async function fetchNotifications(role, { background = false } = {}) {
    if (fetchPromises[role]) return fetchPromises[role];

    const store = getStore(role);
    stores[role] = { ...store, isFetching: true, ...(background ? {} : { error: null }) };
    emit();

    fetchPromises[role] = (async () => {
        try {
            const result = await fetchCompanyNotifications(role);
            stores[role] = {
                notifications: result.notifications || [],
                userId: result.userId,
                companyId: result.companyId,
                error: null,
                isFetching: false,
            };
        } catch (e) {
            const msg = e?.message || 'Could not load notifications.';
            const current = getStore(role);
            if (current.notifications !== null && background) {
                stores[role] = { ...current, isFetching: false };
            } else if (current.notifications !== null && !background) {
                stores[role] = { ...current, error: msg, isFetching: false };
            } else {
                stores[role] = {
                    notifications: null,
                    userId: null,
                    companyId: null,
                    error: msg,
                    isFetching: false,
                };
            }
        } finally {
            fetchPromises[role] = null;
            emit();
        }
    })();

    return fetchPromises[role];
}

/** Clear cached notifications (e.g. on logout). */
export function clearNotificationsListCache() {
    stores[NOTIFICATION_ROLES.ADMIN] = createEmptyStore();
    stores[NOTIFICATION_ROLES.SUBADMIN] = createEmptyStore();
    fetchPromises[NOTIFICATION_ROLES.ADMIN] = null;
    fetchPromises[NOTIFICATION_ROLES.SUBADMIN] = null;
    emit();
}

/** Force the next visit to fetch fresh data. */
export function invalidateNotificationsListCache(role) {
    if (role && stores[role]) {
        stores[role] = { ...stores[role], notifications: null, error: null };
    } else {
        Object.keys(stores).forEach((key) => {
            stores[key] = { ...stores[key], notifications: null, error: null };
        });
    }
    emit();
}

function patchNotifications(role, updater) {
    const store = getStore(role);
    if (store.notifications === null) return;
    const next = typeof updater === 'function' ? updater(store.notifications) : updater;
    stores[role] = { ...store, notifications: next };
    emit();
}

/**
 * Stale-while-revalidate notifications list for admin / sub-admin dashboards.
 * Shows cached data immediately on revisit; refreshes from the DB in the background.
 */
export function useNotificationsList(role = NOTIFICATION_ROLES.ADMIN) {
    const snapshot = useSyncExternalStore(
        subscribe,
        () => getStore(role),
        () => getStore(role),
    );

    useEffect(() => {
        fetchNotifications(role, { background: getStore(role).notifications !== null });
    }, [role]);

    const reload = useCallback(() => fetchNotifications(role, { background: false }), [role]);

    const refresh = useCallback(() => fetchNotifications(role, { background: true }), [role]);

    const setNotifications = useCallback(
        (updater) => {
            patchNotifications(role, updater);
        },
        [role],
    );

    return {
        notifications: snapshot.notifications ?? [],
        userId: snapshot.userId,
        companyId: snapshot.companyId,
        loading: snapshot.notifications === null && snapshot.error === null,
        refreshing: snapshot.isFetching && snapshot.notifications !== null,
        error: snapshot.error,
        reload,
        refresh,
        setNotifications,
    };
}
