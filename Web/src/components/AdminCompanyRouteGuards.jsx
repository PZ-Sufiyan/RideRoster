import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
    adminPortalPathForAccess,
    getCompanyAdminAccess,
} from '../services/companyAccessService';

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm">
            Loading…
        </div>
    );
}

function useCompanyAdminAccess() {
    const [access, setAccess] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        let latestRun = 0;

        const run = async () => {
            const id = ++latestRun;
            const next = await getCompanyAdminAccess();
            if (cancelled || id !== latestRun) return;
            setAccess(next.access);
        };

        run();

        const onVisible = () => {
            if (document.visibilityState === 'visible') run();
        };
        window.addEventListener('focus', run);
        document.addEventListener('visibilitychange', onVisible);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (cancelled) return;
            if (
                (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') &&
                session?.user
            ) {
                run();
            }
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
            window.removeEventListener('focus', run);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    return access;
}

/**
 * Dashboard routes: only when the linked company is approved.
 * Pending companies stay on the in-review screen (rejected is blocked from the dashboard too).
 */
export function RequireCompanyLinkedAdmin() {
    const access = useCompanyAdminAccess();

    if (access === 'loading') return <LoadingScreen />;
    if (access === 'approved') return <Outlet />;
    return <Navigate to={adminPortalPathForAccess(access)} replace />;
}

/**
 * Registration form: only for admins who have not submitted a company yet.
 */
export function RedirectIfCompanyLinked() {
    const access = useCompanyAdminAccess();

    if (access === 'loading') return <LoadingScreen />;
    if (access === 'no-company') return <Outlet />;
    return <Navigate to={adminPortalPathForAccess(access)} replace />;
}

/**
 * In-review holding page: pending applications only.
 */
export function RequirePendingCompany() {
    const access = useCompanyAdminAccess();

    if (access === 'loading') return <LoadingScreen />;
    if (access === 'pending') return <Outlet />;
    return <Navigate to={adminPortalPathForAccess(access)} replace />;
}

/**
 * Rejected application: one-page edit + resubmit.
 */
export function RequireRejectedCompany() {
    const access = useCompanyAdminAccess();

    if (access === 'loading') return <LoadingScreen />;
    if (access === 'rejected') return <Outlet />;
    return <Navigate to={adminPortalPathForAccess(access)} replace />;
}
