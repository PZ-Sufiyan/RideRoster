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
    '/subadmin/drivers',
    '/subadmin/job-notifications',
    '/subadmin/settings',
]);

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
    {
        match: /^\/admin\/jobs\/([^/]+)(?:\/edit)?$/,
        crumbs: (_, [id, editAction]) => {
            const pathSegments = _.split('/');
            const isEditing = pathSegments[pathSegments.length - 1] === 'edit';
            return [
                { label: 'Job Management', to: '/admin/jobs' },
                { 
                    label: id === 'calendar' ? 'Job Calendar' : 
                         id === 'create-step1' ? 'Create New Job' :
                         id === 'create-step2' ? 'Pickups & Drop-offs' :
                         id === 'create-step3' ? 'Timings & Compensation' :
                         decodeURIComponent(id),
                    to: isEditing && id && !id.startsWith('create') && id !== 'calendar' ? `/admin/jobs/${id}` : undefined
                },
                ...(isEditing ? [{ label: 'Edit Job' }] : [])
            ];
        },
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

    // ─── SUBADMIN ─────────────────────────────────────────────────
    {
        match: /^\/subadmin\/drivers\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Drivers', to: '/subadmin/drivers' },
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
    {
        match: /^\/subadmin\/job-notifications\/([^/]+)$/,
        crumbs: (_, [id]) => [
            { label: 'Job Notifications', to: '/subadmin/job-notifications' },
            { label: decodeURIComponent(id) },
        ],
    },
];

const Breadcrumbs = () => {
    const { pathname } = useLocation();

    if (SIDEBAR_PATHS.has(pathname)) return null;

    let crumbs = null;
    for (const route of ROUTE_CRUMB_MAP) {
        const matches = pathname.match(route.match);
        if (matches) {
            crumbs = route.crumbs(matches[0], matches.slice(1));
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