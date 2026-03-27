import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Allows dashboard routes only when company_admins.company_id is set for the logged-in admin.
 */
export function RequireCompanyLinkedAdmin() {
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || cancelled) {
                setStatus('no-company');
                return;
            }

            const { data: row, error } = await supabase
                .from('company_admins')
                .select('company_id')
                .eq('id', user.id)
                .maybeSingle();

            if (cancelled) return;

            if (error || !row) {
                setStatus('no-company');
                return;
            }

            setStatus(row.company_id ? 'ok' : 'no-company');
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm">
                Loading…
            </div>
        );
    }

    if (status === 'no-company') {
        return <Navigate to="/admin/register" replace />;
    }

    return <Outlet />;
}

/**
 * Company registration: only for admins without a linked company; otherwise send to dashboard.
 */
export function RedirectIfCompanyLinked() {
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || cancelled) {
                setStatus('no-company');
                return;
            }

            const { data: row, error } = await supabase
                .from('company_admins')
                .select('company_id')
                .eq('id', user.id)
                .maybeSingle();

            if (cancelled) return;

            if (error || !row) {
                setStatus('no-company');
                return;
            }

            setStatus(row.company_id ? 'has-company' : 'no-company');
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm">
                Loading…
            </div>
        );
    }

    if (status === 'has-company') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <Outlet />;
}
