import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MdChevronRight } from 'react-icons/md';

const SIDEBAR_PATHS = new Set([
    '/platform/dashboard',
    '/platform/companies/pending',
    '/platform/companies',
    '/platform/sos',
    '/platform/logs',
    '/platform/settings',
    '/portal/dashboard',
    '/portal/users/drivers',
    '/portal/users/pa',
    '/portal/users/subadmins',
    '/portal/users/passengers',
    '/portal/users/off-day-requests',
    '/portal/jobs',
    '/portal/notifications',
    '/portal/reports',
    '/portal/reports/driver-performance',
    '/portal/reports/pa-attendance',
    '/portal/sos',
    '/portal/settings',
    '/team/dashboard',
    '/team/approvals',
    '/team/users/drivers',
    '/team/users/pa',
    '/team/users/passengers',
    '/team/jobs',
    '/team/notifications',
    '/team/sos',
    '/team/settings',
]);

const STEP_LABELS = {
    '1': 'Route Info',
    '2': 'Pickups & Drop-offs',
    '3': 'Schedule & Pay',
};

const ROUTE_CRUMB_MAP = [
    // ─── SUPERADMIN ───────────────────────────────────────────────
    {
        match: /^\/platform\/companies\/review\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Pending Companies', to: '/platform/companies/pending' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/platform\/companies\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Companies', to: '/platform/companies' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/platform\/logs\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'System Logs', to: '/platform/logs' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/platform\/sos\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'SOS Monitoring', to: '/platform/sos' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/platform\/add-admin$/,
        crumbs: () => [
            { label: 'Add Admin' },
        ],
    },

    // ─── ADMIN ────────────────────────────────────────────────────
    {
        match: /^\/portal\/users\/drivers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/portal/users/drivers' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/portal\/users\/pa\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/portal/users/pa' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/portal\/users\/subadmins\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Subadmins', to: '/portal/users/subadmins' },
            { label: action === 'add' ? 'Add Sub-Admin' : 'Sub-Admin Profile' },
        ],
    },
    {
        match: /^\/portal\/users\/passengers\/assign\/review$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/portal/users/passengers' },
            { label: 'Job Assignment', to: '/portal/users/passengers/assign' },
            { label: 'Assignment Review' },
        ],
    },
    {
        match: /^\/portal\/users\/passengers\/assign\/success$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/portal/users/passengers' },
            { label: 'Job Assignment', to: '/portal/users/passengers/assign' },
            { label: 'Assignment Confirmed' },
        ],
    },
    {
        match: /^\/portal\/users\/passengers\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/portal/users/passengers' },
            { label: decodeURIComponent(id), to: `/portal/users/passengers/${id}` },
            { label: 'Edit Passenger' },
        ],
    },
    {
        match: /^\/portal\/users\/passengers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/portal/users/passengers' },
            { label: action === 'assign' ? 'Job Assignment' :
                     action === 'review' ? 'Assignment Review' :
                     action === 'success' ? 'Assignment Confirmed' :
                     decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        ],
    },
    // New consolidated add-job route — step label comes from ?step query param
    {
        match: /^\/portal\/jobs\/add-job$/,
        crumbs: (_, __, searchParams) => {
            const step = searchParams?.get('step') || '1';
            const stepLabel = STEP_LABELS[step] || 'Create New Job';
            return [
                { label: 'Job Management', to: '/portal/jobs' },
                { label: 'Create New Job', to: '/portal/jobs/add-job?step=1' },
                ...(step !== '1' ? [{ label: stepLabel }] : []),
            ];
        },
    },
    {
        match: /^\/portal\/jobs\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/portal/jobs' },
            { label: decodeURIComponent(id), to: `/portal/jobs/${id}` },
            { label: 'Edit Job' },
        ],
    },
    {
        match: /^\/portal\/jobs\/([^/]+)\/counter-offer$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/portal/jobs' },
            { label: decodeURIComponent(id), to: `/portal/jobs/${id}` },
            { label: 'Counter-Offer Review' },
        ],
    },
    {
        match: /^\/portal\/jobs\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/portal/jobs' },
            { label: id === 'calendar' ? 'Job Calendar' : decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/portal\/reports\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Reports', to: '/portal/reports' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/portal\/notifications\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Notifications', to: '/portal/notifications' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/portal\/sos\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'SOS Monitoring', to: '/portal/sos' },
            { label: decodeURIComponent(id) },
        ],
    },

    // ─── SUBADMIN (mirrors admin paths under /subadmin) ───────────
    {
        match: /^\/team\/users\/drivers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/team/users/drivers' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/team\/users\/pa\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/team/users/pa' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/team\/users\/passengers\/assign\/review$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/team/users/passengers' },
            { label: 'Job Assignment', to: '/team/users/passengers/assign' },
            { label: 'Assignment Review' },
        ],
    },
    {
        match: /^\/team\/users\/passengers\/assign\/success$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/team/users/passengers' },
            { label: 'Job Assignment', to: '/team/users/passengers/assign' },
            { label: 'Assignment Confirmed' },
        ],
    },
    {
        match: /^\/team\/users\/passengers\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/team/users/passengers' },
            { label: decodeURIComponent(id), to: `/team/users/passengers/${id}` },
            { label: 'Edit Passenger' },
        ],
    },
    {
        match: /^\/team\/users\/passengers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/team/users/passengers' },
            {
                label:
                    action === 'assign'
                        ? 'Job Assignment'
                        : action === 'review'
                          ? 'Assignment Review'
                          : action === 'success'
                            ? 'Assignment Confirmed'
                            : decodeURIComponent(action)
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, (c) => c.toUpperCase()),
            },
        ],
    },
    {
        match: /^\/team\/jobs\/add-job$/,
        crumbs: (_, __, searchParams) => {
            const step = searchParams?.get('step') || '1';
            const stepLabel = STEP_LABELS[step] || 'Create New Job';
            return [
                { label: 'Job Management', to: '/team/jobs' },
                { label: 'Create New Job', to: '/team/jobs/add-job?step=1' },
                ...(step !== '1' ? [{ label: stepLabel }] : []),
            ];
        },
    },
    {
        match: /^\/team\/jobs\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/team/jobs' },
            { label: decodeURIComponent(id), to: `/team/jobs/${id}` },
            { label: 'Edit Job' },
        ],
    },
    {
        match: /^\/team\/jobs\/([^/]+)\/counter-offer$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/team/jobs' },
            { label: decodeURIComponent(id), to: `/team/jobs/${id}` },
            { label: 'Counter-Offer Review' },
        ],
    },
    {
        match: /^\/team\/jobs\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/team/jobs' },
            { label: id === 'calendar' ? 'Job Calendar' : decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/team\/notifications\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Notifications', to: '/team/notifications' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/team\/sos\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'SOS Monitoring', to: '/team/sos' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/team\/approvals\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Approvals', to: '/team/approvals' },
            { label: decodeURIComponent(id) },
        ],
    },
];

const Breadcrumbs = () => {
    const { pathname, search } = useLocation();
    const searchParams = new URLSearchParams(search);

    if (SIDEBAR_PATHS.has(pathname)) return null;

    let crumbs = null;
    for (const route of ROUTE_CRUMB_MAP) {
        const matches = pathname.match(route.match);
        if (matches) {
            crumbs = route.crumbs(matches[0], matches.slice(1), searchParams);
            break;
        }
    }

    if (!crumbs) return null;

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center flex-wrap gap-y-1">
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <li key={i} className="flex items-center">
                            {i > 0 && (
                                <MdChevronRight className="w-4 h-4 mx-1 text-gray-400 shrink-0" />
                            )}
                            {crumb.to && !isLast ? (
                                <NavLink
                                    to={crumb.to}
                                    className="hover:text-blue-600 transition-colors capitalize"
                                >
                                    {crumb.label}
                                </NavLink>
                            ) : (
                                <span className={`capitalize ${isLast ? 'font-medium text-gray-800' : ''}`}>
                                    {crumb.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;