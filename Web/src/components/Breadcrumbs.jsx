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
    '/platform/add-admin',
    '/portal/dashboard',
    '/portal/users/drivers',
    '/portal/users/drivers/add',
    '/portal/users/vehicles',
    '/portal/users/vehicles/add',
    '/portal/users/pa',
    '/portal/users/pa/add',
    '/portal/users/subadmins',
    '/portal/users/subadmins/add',
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
    '/team/users/drivers/add',
    '/team/users/vehicles',
    '/team/users/vehicles/add',
    '/team/users/pa',
    '/team/users/pa/add',
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

/** Returns the first segment of a UUID (text before the first dash). */
const shortenUuid = (value) => {
    if (value == null) return '—';
    const s = String(value).trim();
    if (!s) return '—';
    const first = s.split('-')[0];
    return first || s;
};

const driverCrumbLabel = (segment) => {
    const action = decodeURIComponent(segment || '').trim().toLowerCase();
    if (action === 'add') return 'Add Driver';
    return 'Driver Detail';
};

const paCrumbLabel = (segment) => {
    const action = decodeURIComponent(segment || '').trim().toLowerCase();
    if (action === 'add') return 'Add PA';
    return 'PA Detail';
};

const passengerCrumbLabel = (segment) => {
    const action = decodeURIComponent(segment || '').trim().toLowerCase();
    if (action === 'assign') return 'Job Assignment';
    if (action === 'review') return 'Assignment Review';
    if (action === 'success') return 'Assignment Confirmed';
    return 'Passenger Detail';
};

const jobDetailCrumbLabel = (id) => {
    if (id === 'calendar') return 'Job Calendar';
    return 'Job Detail';
};

const formatJobCrumbId = (id) => `J#${shortenUuid(decodeURIComponent(id))}`;

const vehicleCrumbLabel = (segment) => {
    const action = decodeURIComponent(segment || '').trim().toLowerCase();
    if (action === 'add') return 'Add Vehicle';
    return 'Vehicle Detail';
};

const HIDDEN_BREADCRUMB_PATTERNS = [
    /^\/portal\/users\/passengers\/add$/,
    /^\/team\/users\/passengers\/add$/,
];

const ROUTE_CRUMB_MAP = [
    // ─── SUPERADMIN ───────────────────────────────────────────────
    {
        match: /^\/platform\/companies\/review\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Pending Companies', to: '/platform/companies/pending' },
            { label: `C#${shortenUuid(decodeURIComponent(id))}` },
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

    // ─── ADMIN ────────────────────────────────────────────────────
    {
        match: /^\/portal\/users\/drivers\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/portal/users/drivers' },
            { label: 'Driver Detail', to: `/portal/users/drivers/${id}` },
            { label: 'Edit Driver' },
        ],
    },
    {
        match: /^\/portal\/users\/drivers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/portal/users/drivers' },
            { label: driverCrumbLabel(action) },
        ],
    },
    {
        match: /^\/portal\/users\/vehicles\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Vehicles', to: '/portal/users/vehicles' },
            { label: 'Vehicle Detail', to: `/portal/users/vehicles/${id}` },
            { label: 'Edit Vehicle' },
        ],
    },
    {
        match: /^\/portal\/users\/vehicles\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Vehicles', to: '/portal/users/vehicles' },
            { label: vehicleCrumbLabel(action) },
        ],
    },
    {
        match: /^\/portal\/users\/pa\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/portal/users/pa' },
            { label: 'PA Detail', to: `/portal/users/pa/${id}` },
            { label: 'Edit PA' },
        ],
    },
    {
        match: /^\/portal\/users\/pa\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/portal/users/pa' },
            { label: paCrumbLabel(action) },
        ],
    },
    {
        match: /^\/portal\/users\/subadmins\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Subadmins', to: '/portal/users/subadmins' },
            { label: 'Sub-Admin Profile', to: `/portal/users/subadmins/${id}` },
            { label: 'Edit Sub-Admin' },
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
            { label: 'Passenger Detail', to: `/portal/users/passengers/${id}` },
            { label: 'Edit Passenger' },
        ],
    },
    {
        match: /^\/portal\/users\/passengers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/portal/users/passengers' },
            { label: passengerCrumbLabel(action) },
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
            { label: formatJobCrumbId(id), to: `/portal/jobs/${id}` },
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
            { label: jobDetailCrumbLabel(id) },
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
        crumbs: () => [
            { label: 'SOS Monitoring', to: '/portal/sos' },
            { label: 'SOS Detail' },
        ],
    },

    // ─── SUBADMIN (mirrors admin paths under /subadmin) ───────────
    {
        match: /^\/team\/users\/drivers\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/team/users/drivers' },
            { label: 'Driver Detail', to: `/team/users/drivers/${id}` },
            { label: 'Edit Driver' },
        ],
    },
    {
        match: /^\/team\/users\/drivers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Drivers', to: '/team/users/drivers' },
            { label: driverCrumbLabel(action) },
        ],
    },
    {
        match: /^\/team\/users\/vehicles\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'Vehicles', to: '/team/users/vehicles' },
            { label: 'Vehicle Detail', to: `/team/users/vehicles/${id}` },
            { label: 'Edit Vehicle' },
        ],
    },
    {
        match: /^\/team\/users\/vehicles\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Vehicles', to: '/team/users/vehicles' },
            { label: vehicleCrumbLabel(action) },
        ],
    },
    {
        match: /^\/team\/users\/pa\/([^/]+)\/edit$/,
        crumbs: (_, [id]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/team/users/pa' },
            { label: 'PA Detail', to: `/team/users/pa/${id}` },
            { label: 'Edit PA' },
        ],
    },
    {
        match: /^\/team\/users\/pa\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'PA', to: '/team/users/pa' },
            { label: paCrumbLabel(action) },
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
            { label: 'Passenger Detail', to: `/team/users/passengers/${id}` },
            { label: 'Edit Passenger' },
        ],
    },
    {
        match: /^\/team\/users\/passengers\/([^/]+)$/,
        crumbs: (_, [action]) => [
            { label: 'User Management' },
            { label: 'Passengers', to: '/team/users/passengers' },
            { label: passengerCrumbLabel(action) },
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
            { label: formatJobCrumbId(id), to: `/team/jobs/${id}` },
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
            { label: jobDetailCrumbLabel(id) },
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
        crumbs: () => [
            { label: 'SOS Monitoring', to: '/team/sos' },
            { label: 'SOS Detail' },
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
    if (HIDDEN_BREADCRUMB_PATTERNS.some((pattern) => pattern.test(pathname))) return null;

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
                                <span className="capitalize text-gray-500">
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