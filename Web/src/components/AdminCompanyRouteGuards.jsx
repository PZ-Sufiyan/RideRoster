import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Prefer session from storage (immediate after sign-in). getUser() validates with the server
 * and can briefly fail right after navigation, which caused dashboard ↔ register redirect loops.
 */
async function getAuthUser() {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
        return session.user;
    }
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
}

async function fetchCompanyAdminLinkStatus() {
    const user = await getAuthUser();
    if (!user) {
        return 'no-company';
    }

    const { data: row, error } = await supabase
        .from('company_admins')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

    if (error || !row) {
        return 'no-company';
    }

    return row.company_id ? 'linked' : 'no-company';
}

function useCompanyAdminLinkStatus() {
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        let latestRun = 0;

        const run = async () => {
            const id = ++latestRun;
            const next = await fetchCompanyAdminLinkStatus();
            if (cancelled || id !== latestRun) return;
            setStatus(next);
        };

        run();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (cancelled) return;
            // Re-check when auth hydrates or signs in (not TOKEN_REFRESHED — avoids races and spam).
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
        };
    }, []);

    return status;
}

/**
 * Allows dashboard routes only when company_admins.company_id is set for the logged-in admin.
 */
export function RequireCompanyLinkedAdmin() {
    const status = useCompanyAdminLinkStatus();

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm">
                Loading…
            </div>
        );
    }

    if (status === 'no-company') {
        return <Navigate to="/portal/register" replace />;
    }

    return <Outlet />;
}

/**
 * Company registration: only for admins without a linked company; otherwise send to dashboard.
 */
export function RedirectIfCompanyLinked() {
    const status = useCompanyAdminLinkStatus();

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm">
                Loading…
            </div>
        );
    }

    if (status === 'linked') {
        return <Navigate to="/portal/dashboard" replace />;
    }

    return <Outlet />;
}
