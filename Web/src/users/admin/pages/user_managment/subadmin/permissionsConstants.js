/** Shared sub-admin permission categories (add + detail pages). */
export const PERMISSIONS_CATEGORIES = [
    {
        name: 'Job Management',
        keys: ['view_jobs', 'create_jobs', 'edit_jobs', 'cancel_jobs'],
        labels: ['View Jobs', 'Create Jobs', 'Edit Jobs', 'Cancel Jobs'],
    },
    {
        name: 'User Management',
        keys: ['view_users', 'add_users', 'edit_profiles', 'deactivate_users'],
        labels: ['View Users', 'Add Users', 'Edit Profiles', 'Deactivate Users'],
    },
    {
        name: 'Reporting',
        keys: ['view_reports', 'export_data'],
        labels: ['View Reports', 'Export Data'],
    },
];

export const allPermKeys = PERMISSIONS_CATEGORIES.flatMap((c) => c.keys);
