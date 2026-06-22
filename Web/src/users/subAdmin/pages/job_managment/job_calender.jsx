import JobCalendarView from '../../../../components/JobCalendarView';
import { useSubAdminPermissions } from '../../../../context/subAdminPermissionsContext';

const JobCalendar = () => {
    const { can } = useSubAdminPermissions();

    return (
        <JobCalendarView
            createJobPath="/team/jobs/add-job"
            showCreateJob={can('create_jobs')}
        />
    );
};

export default JobCalendar;
