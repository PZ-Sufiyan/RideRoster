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
            { name: 'Dashboard', path: '/superadmin/dashboard', icon: <MdDashboard size={20} /> },
            { name: 'Companies', path: '/superadmin/companies/pending', icon: <MdBusiness size={20} /> },
            { name: 'Add Admin', path: '/superadmin/add-admin', icon: <MdPersonAdd size={20} /> },
            { name: 'SOS Monitoring', path: '/superadmin/sos', icon: <MdSos size={20} /> },
            { name: 'System Logs', path: '/superadmin/logs', icon: <MdHistory size={20} /> },
        ],
        bottom: [{ name: 'Settings', path: '/superadmin/settings', icon: <MdSettings size={20} /> }],
    },
    admin: {
        items: [
            { name: 'Dashboard', path: '/admin/dashboard', icon: <MdDashboard size={20} /> },
            {
                name: 'User Management',
                icon: <MdPeople size={20} />,
                children: [
                    { name: 'Drivers', path: '/admin/users/drivers' },
                    { name: 'PA', path: '/admin/users/pa' },
                    { name: 'Subadmins', path: '/admin/users/subadmins' },
                    { name: 'Passengers', path: '/admin/users/passengers' },
                ],
            },
            { name: 'Job Management', path: '/admin/jobs', icon: <MdWork size={20} /> },
            { name: 'Notifications', path: '/admin/notifications', icon: <MdNotifications size={20} /> },
            { name: 'Reports', path: '/admin/reports', icon: <MdAssessment size={20} /> },
            { name: 'SOS Monitoring', path: '/admin/sos', icon: <MdSos size={20} /> },
        ],
        bottom: [{ name: 'Settings', path: '/admin/settings', icon: <MdSettings size={20} /> }],
    },
    subadmin: {
        items: [
            { name: 'Dashboard', path: '/subadmin/dashboard', icon: <MdDashboard size={20} /> },
            {
                name: 'Approval',
                path: '/subadmin/approvals',
                icon: <MdCheckCircle size={20} />,
                perm: { anyOf: ['view_users', 'view_jobs'] },
            },
            {
                name: 'User Management',
                icon: <MdPeople size={20} />,
                perm: { allOf: ['view_users'] },
                children: [
                    { name: 'Drivers', path: '/subadmin/users/drivers' },
                    { name: 'PA', path: '/subadmin/users/pa' },
                    { name: 'Passengers', path: '/subadmin/users/passengers' },
                ],
            },
            {
                name: 'Job Management',
                path: '/subadmin/jobs',
                icon: <MdWork size={20} />,
                perm: { allOf: ['view_jobs'] },
            },
            { name: 'Notifications', path: '/subadmin/notifications', icon: <MdNotifications size={20} /> },
            {
                name: 'SOS Monitoring',
                path: '/subadmin/sos',
                icon: <MdSos size={20} />,
                perm: { anyOf: ['view_jobs', 'view_users'] },
            },
        ],
        bottom: [{ name: 'Settings', path: '/subadmin/settings', icon: <MdSettings size={20} /> }],
    },
};
