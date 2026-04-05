import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSubAdminById, SUB_ADMIN_PERMISSION_KEYS } from '../services/subAdminService';

const SubAdminPermissionsContext = createContext(null);

/**
 * Provider: loads `sub_admins` row for the logged-in user (subadmin only).
 * Wrap subadmin dashboard layout so Sidebar and pages can read permissions.
 */
export function SubAdminPermissionsProvider({ children }) {
    const [loading, setLoading] = useState(true);
    const [row, setRow] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const uid = session?.user?.id;
                if (!uid) {
                    if (!cancelled) {
                        setRow(null);
                        setLoading(false);
                    }
                    return;
                }
                const data = await getSubAdminById(uid);
                if (!cancelled) {
                    setRow(data);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e);
                    setRow(null);
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const can = useCallback(
        (key) => {
            if (!key || !row) return false;
            return !!row[key];
        },
        [row]
    );

    const hasAny = useCallback((keys) => (keys || []).some((k) => can(k)), [can]);

    const hasAll = useCallback((keys) => (keys || []).every((k) => can(k)), [can]);

    const value = useMemo(
        () => ({
            loading,
            row,
            error,
            can,
            hasAny,
            hasAll,
            permissionKeys: SUB_ADMIN_PERMISSION_KEYS,
        }),
        [loading, row, error, can, hasAny, hasAll]
    );

    return <SubAdminPermissionsContext.Provider value={value}>{children}</SubAdminPermissionsContext.Provider>;
}

/**
 * When not under SubAdminPermissionsProvider, all checks pass (admin/superadmin).
 * Under provider, uses loaded `sub_admins` row.
 */
export function useSubAdminPermissions() {
    const ctx = useContext(SubAdminPermissionsContext);
    if (!ctx) {
        return {
            loading: false,
            row: null,
            error: null,
            can: () => true,
            hasAny: () => true,
            hasAll: () => true,
            permissionKeys: SUB_ADMIN_PERMISSION_KEYS,
        };
    }
    return ctx;
}
