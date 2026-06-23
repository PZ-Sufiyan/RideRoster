import React from 'react';
import LeaveRequestsPage from '../../../../components/LeaveRequestsPage';
import { useSubAdminPermissions } from '../../../../context/subAdminPermissionsContext';

const SubAdmin_Approvals = () => {
    const { hasAny } = useSubAdminPermissions();
    const canView = hasAny(['view_users', 'view_jobs']);

    if (!canView) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You do not have permission to view approvals.
            </div>
        );
    }

    return (
        <LeaveRequestsPage
            jobsBasePath="/team/jobs"
            title="Leave requests"
        />
    );
};

export default SubAdmin_Approvals;
