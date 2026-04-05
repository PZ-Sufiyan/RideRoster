import React from 'react';
import { useSubAdminPermissions } from '../context/subAdminPermissionsContext';
import AccessDenied from './AccessDenied';

/**
 * Guards a sub-admin page by `sub_admins` boolean flags.
 * Use `permission` for one key, or `anyOf` / `allOf` for combinations.
 */
const SubAdminProtectedPage = ({ permission, anyOf, allOf, children }) => {
    const { can, loading, hasAny, hasAll } = useSubAdminPermissions();

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500 text-sm">
                Loading permissions…
            </div>
        );
    }

    let allowed = true;
    if (allOf?.length) {
        allowed = hasAll(allOf);
    } else if (anyOf?.length) {
        allowed = hasAny(anyOf);
    } else if (permission) {
        allowed = can(permission);
    }

    if (!allowed) {
        return <AccessDenied />;
    }

    return children;
};

export default SubAdminProtectedPage;
