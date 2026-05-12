import React from 'react';
import {
    MdDashboard,
    MdBusiness,
    MdSos,
    MdSettings,
    MdHistory,
    MdPeople,
    MdWork,
    MdNotifications,
    MdAssessment,
    MdCheckCircle,
    MdPersonAdd,
} from 'react-icons/md';

/** Static sidebar definitions (used by Sidebar). */
export const SIDEBAR_MENU_CONFIGS = {
    superadmin: {
        items: [
            { name: 'Dashboard', path: '/platform/dashboard', icon: <MdDashboard size={20} /> },
            { name: 'Companies', path: '/platform/companies/pending', icon: <MdBusiness size={20} /> },
            { name: 'Add Admin', path: '/platform/add-admin', icon: <MdPersonAdd size={20} /> },
            { name: 'SOS Monitoring', path: '/platform/sos', icon: <MdSos size={20} /> },
            { name: 'System Logs', path: '/platform/logs', icon: <MdHistory size={20} /> },
        ],
        bottom: [{ name: 'Settings', path: '/platform/settings', icon: <MdSettings size={20} /> }],
    },
    admin: {
        items: [
            { name: 'Dashboard', path: '/portal/dashboard', icon: <MdDashboard size={20} /> },
            {
                name: 'User Management',
                icon: <MdPeople size={20} />,
                children: [
                    { name: 'Drivers', path: '/portal/users/drivers' },
                    { name: 'PA', path: '/portal/users/pa' },
                    { name: 'Subadmins', path: '/portal/users/subadmins' },
                    { name: 'Passengers', path: '/portal/users/passengers' },
                    { name: 'Off day requests', path: '/portal/users/off-day-requests' },
                ],
            },
            { name: 'Job Management', path: '/portal/jobs', icon: <MdWork size={20} /> },
            { name: 'Notifications', path: '/portal/notifications', icon: <MdNotifications size={20} /> },
            { name: 'Reports', path: '/portal/reports', icon: <MdAssessment size={20} /> },
            { name: 'SOS Monitoring', path: '/portal/sos', icon: <MdSos size={20} /> },
        ],
        bottom: [{ name: 'Settings', path: '/portal/settings', icon: <MdSettings size={20} /> }],
    },
    subadmin: {
        items: [
            { name: 'Dashboard', path: '/team/dashboard', icon: <MdDashboard size={20} /> },
            {
                name: 'Approval',
                path: '/team/approvals',
                icon: <MdCheckCircle size={20} />,
                perm: { anyOf: ['view_users', 'view_jobs'] },
            },
            {
                name: 'User Management',
                icon: <MdPeople size={20} />,
                perm: { allOf: ['view_users'] },
                children: [
                    { name: 'Drivers', path: '/team/users/drivers' },
                    { name: 'PA', path: '/team/users/pa' },
                    { name: 'Passengers', path: '/team/users/passengers' },
                ],
            },
            {
                name: 'Job Management',
                path: '/team/jobs',
                icon: <MdWork size={20} />,
                perm: { allOf: ['view_jobs'] },
            },
            { name: 'Notifications', path: '/team/notifications', icon: <MdNotifications size={20} /> },
            {
                name: 'SOS Monitoring',
                path: '/team/sos',
                icon: <MdSos size={20} />,
                perm: { anyOf: ['view_jobs', 'view_users'] },
            },
        ],
        bottom: [{ name: 'Settings', path: '/team/settings', icon: <MdSettings size={20} /> }],
    },
};
