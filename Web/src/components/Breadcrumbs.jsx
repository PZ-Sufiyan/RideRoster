import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MdChevronRight } from 'react-icons/md';

const SIDEBAR_PATHS = new Set([
    '/superadmin/dashboard',
    '/superadmin/companies/pending',
    '/superadmin/companies',
    '/superadmin/sos',
    '/superadmin/logs',
    '/superadmin/settings',
    '/admin/dashboard',
    '/admin/users/drivers',
    '/admin/users/pa',
    '/admin/users/subadmins',
    '/admin/users/passengers',
    '/admin/jobs',
    '/admin/notifications',
    '/admin/reports',
    '/admin/reports/driver-performance',
    '/admin/reports/pa-attendance',
    '/admin/sos',
    '/admin/settings',
    '/subadmin/dashboard',
    '/subadmin/approvals',
    '/subadmin/users/drivers',
    '/subadmin/users/pa',
    '/subadmin/users/passengers',
    '/subadmin/jobs',
    '/subadmin/notifications',
    '/subadmin/sos',
    '/subadmin/settings',
]);

const STEP_LABELS = {
    '1': 'Route Info',
    '2': 'Pickups & Drop-offs',
    '3': 'Schedule & Pay',
};

const ROUTE_CRUMB_MAP = [
    // ─── SUPERADMIN ───────────────────────────────────────────────
    {
        match: /^\/superadmin\/companies\/review\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Pending Companies', to: '/superadmin/companies/pending' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/superadmin\/companies\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Companies', to: '/superadmin/companies' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/superadmin\/logs\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'System Logs', to: '/superadmin/logs' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/superadmin\/sos\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'SOS Monitoring', to: '/superadmin/sos' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/superadmin\/add-admin$/,
        crumbs: () => [
            { label: 'Add Admin' },
        ],
    },

    // ─── ADMIN ────────────────────────────────────────────────────
    {
        match: /^\/admin\/users\/drivers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/admin/users/drivers' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/admin\/users\/pa\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/admin/users/pa' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/admin\/users\/subadmins\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Subadmins', to: '/admin/users/subadmins' },
            { label: action === 'add' ? 'Add Sub-Admin' : 'Sub-Admin Profile' },
        ],
    },
    {
        match: /^\/admin\/users\/passengers\/assign\/review$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/admin/users/passengers' },
            { label: 'Job Assignment', to: '/admin/users/passengers/assign' },
            { label: 'Assignment Review' },
        ],
    },
    {
        match: /^\/admin\/users\/passengers\/assign\/success$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/admin/users/passengers' },
            { label: 'Job Assignment', to: '/admin/users/passengers/assign' },
            { label: 'Assignment Confirmed' },
        ],
    },
    {
        match: /^\/admin\/users\/passengers\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/admin/users/passengers' },
            { label: decodeURIComponent(id), to: `/admin/users/passengers/${id}` },
            { label: 'Edit Passenger' },
        ],
    },
    {
        match: /^\/admin\/users\/passengers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/admin/users/passengers' },
            { label: action === 'assign' ? 'Job Assignment' :
                     action === 'review' ? 'Assignment Review' :
                     action === 'success' ? 'Assignment Confirmed' :
                     decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        ],
    },
    // New consolidated add-job route — step label comes from ?step query param
    {
        match: /^\/admin\/jobs\/add-job$/,
        crumbs: (_, __, searchParams) => {
            const step = searchParams?.get('step') || '1';
            const stepLabel = STEP_LABELS[step] || 'Create New Job';
            return [
                { label: 'Job Management', to: '/admin/jobs' },
                { label: 'Create New Job', to: '/admin/jobs/add-job?step=1' },
                ...(step !== '1' ? [{ label: stepLabel }] : []),
            ];
        },
    },
    {
        match: /^\/admin\/jobs\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/admin/jobs' },
            { label: decodeURIComponent(id), to: `/admin/jobs/${id}` },
            { label: 'Edit Job' },
        ],
    },
    {
        match: /^\/admin\/jobs\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/admin/jobs' },
            { label: id === 'calendar' ? 'Job Calendar' : decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/admin\/reports\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Reports', to: '/admin/reports' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/admin\/notifications\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Notifications', to: '/admin/notifications' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/admin\/sos\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'SOS Monitoring', to: '/admin/sos' },
            { label: decodeURIComponent(id) },
        ],
    },

    // ─── SUBADMIN (mirrors admin paths under /subadmin) ───────────
    {
        match: /^\/subadmin\/users\/drivers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/subadmin/users/drivers' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/subadmin\/users\/pa\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/subadmin/users/pa' },
            { label: decodeURIComponent(action).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
        ],
    },
    {
        match: /^\/subadmin\/users\/passengers\/assign\/review$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/subadmin/users/passengers' },
            { label: 'Job Assignment', to: '/subadmin/users/passengers/assign' },
            { label: 'Assignment Review' },
        ],
    },
    {
        match: /^\/subadmin\/users\/passengers\/assign\/success$/,
        crumbs: () => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/subadmin/users/passengers' },
            { label: 'Job Assignment', to: '/subadmin/users/passengers/assign' },
            { label: 'Assignment Confirmed' },
        ],
    },
    {
        match: /^\/subadmin\/users\/passengers\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/subadmin/users/passengers' },
            { label: decodeURIComponent(id), to: `/subadmin/users/passengers/${id}` },
            { label: 'Edit Passenger' },
        ],
    },
    {
        match: /^\/subadmin\/users\/passengers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/subadmin/users/passengers' },
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
        match: /^\/subadmin\/jobs\/add-job$/,
        crumbs: (_, __, searchParams) => {
            const step = searchParams?.get('step') || '1';
            const stepLabel = STEP_LABELS[step] || 'Create New Job';
            return [
                { label: 'Job Management', to: '/subadmin/jobs' },
                { label: 'Create New Job', to: '/subadmin/jobs/add-job?step=1' },
                ...(step !== '1' ? [{ label: stepLabel }] : []),
            ];
        },
    },
    {
        match: /^\/subadmin\/jobs\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/subadmin/jobs' },
            { label: decodeURIComponent(id), to: `/subadmin/jobs/${id}` },
            { label: 'Edit Job' },
        ],
    },
    {
        match: /^\/subadmin\/jobs\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Job Management', to: '/subadmin/jobs' },
            { label: id === 'calendar' ? 'Job Calendar' : decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/subadmin\/notifications\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Notifications', to: '/subadmin/notifications' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/subadmin\/sos\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'SOS Monitoring', to: '/subadmin/sos' },
            { label: decodeURIComponent(id) },
        ],
    },
    {
        match: /^\/subadmin\/approvals\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Approvals', to: '/subadmin/approvals' },
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