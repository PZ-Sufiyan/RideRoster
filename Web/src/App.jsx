import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';

import SuperAdmin_Dashboard from './users/superAdmin/pages/dashboard/dashboard';
import SuperAdmin_PendingCompanies from './users/superAdmin/pages/companies/pendingcompanies';
import SuperAdmin_Companies from './users/superAdmin/pages/companies/companies';
import SuperAdmin_CompanyReview from './users/superAdmin/pages/companies/companyReview';
import SuperAdmin_SOSPage from './users/superAdmin/pages/sos/sos';
import SuperAdmin_SystemLogs from './users/superAdmin/pages/systemlogs/systemlogs';
import SuperAdmin_Settings from './users/superAdmin/pages/settings/settings';
import SuperAdmin_Login from './users/superAdmin/pages/auth/login';
import SuperAdmin_AddAdmin from './users/superAdmin/pages/add_admin/add_admin';

import Admin_Login from './users/admin/pages/auth/login';
import Admin_Dashboard from './users/admin/pages/dashboard/dashboard';
import Admin_Drivers from './users/admin/pages/user_managment/driver/drivers';
import Admin_DriverDetail from './users/admin/pages/user_managment/driver/driver_detail';
import Admin_AddDriver from './users/admin/pages/user_managment/driver/add_new_driver';
import Admin_PAList from './users/admin/pages/user_managment/PA/pa_list';
import Admin_PADetail from './users/admin/pages/user_managment/PA/pa_detail';
import Admin_AddPA from './users/admin/pages/user_managment/PA/add_new_pa';
import SubAdminList from './users/admin/pages/user_managment/subadmin/sub_admin';
import Admin_AddSubAdmin from './users/admin/pages/user_managment/subadmin/add_sub_admin';
import Admin_SubAdminDetail from './users/admin/pages/user_managment/subadmin/sub_admin_detail';
import Admin_JobsList from './users/admin/pages/job_managment/jobs_list';
import Admin_JobDetail from './users/admin/pages/job_managment/job_detail';
import Admin_EditJob from './users/admin/pages/job_managment/edit_job';
import Admin_JobCalendar from './users/admin/pages/job_managment/job_calender';
import Admin_AddJobStep1 from './users/admin/pages/job_managment/add_new_job_step1';
import Admin_AddJobStep2 from './users/admin/pages/job_managment/add_new_job_step2';
import Admin_AddJobStep3 from './users/admin/pages/job_managment/add_new_job_step3';
import Admin_Passengers from './users/admin/pages/user_managment/passenger/passengers';
import Admin_AddPassenger from './users/admin/pages/user_managment/passenger/add_new_passenger';
import Admin_EditPassenger from './users/admin/pages/user_managment/passenger/edit_passenger';
import Admin_PassengerDetail from './users/admin/pages/user_managment/passenger/passenger_detail';
import Admin_AssignRoute from './users/admin/pages/user_managment/passenger/assign_route';
import Admin_RouteReview from './users/admin/pages/user_managment/passenger/route_review';
import Admin_SuccessConfirmation from './users/admin/pages/user_managment/passenger/success_confirmation';
import Admin_Notifications from './users/admin/pages/notification/notification';
import Admin_SOSPage from './users/admin/pages/sos/sos';
import Admin_SOSDetail from './users/admin/pages/sos/sos_detail';
import Admin_Settings from './users/admin/pages/settings/setting';
import Admin_Report from './users/admin/pages/reports/report';
import Admin_DriverReport from './users/admin/pages/reports/driver_report';
import Admin_PAReport from './users/admin/pages/reports/pa_report';

import RegistrationFlow from './users/admin/pages/register_company/registration_flow';
import { RequireCompanyLinkedAdmin, RedirectIfCompanyLinked } from './components/AdminCompanyRouteGuards';

import SubAdmin_Login from './users/subAdmin/pages/auth/login';
import SubAdmin_Dashboard from './users/subAdmin/pages/dashboard/dashboard';
import SubAdmin_Approvals from './users/subAdmin/pages/approvals/approvals';
import SubAdmin_Drivers from './users/subAdmin/pages/drivers/drivers';
import SubAdmin_NewDriver from './users/subAdmin/pages/drivers/new_driver';
import SubAdmin_DriverProfile from './users/subAdmin/pages/drivers/driver-profile';
import SubAdmin_Jobs from './users/subAdmin/pages/jobs/jobs';
import SubAdmin_NewJob from './users/subAdmin/pages/jobs/new-job';
import SubAdmin_JobDetail from './users/subAdmin/pages/jobs/job_detail';
import SubAdmin_EditJob from './users/subAdmin/pages/jobs/edit_job';
import SubAdmin_Notifications from './users/subAdmin/pages/notifications/notification';
import SubAdmin_Settings from './users/subAdmin/pages/settings/settings';
import Home from './home';
import './App.css';

// Component for route protection
const ProtectedRoute = ({ allowedRoles }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If logged in but role doesn't match, send back to their respective dashboard
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />

        {/* Auth Pages */}
        <Route path="/superadmin/login" element={<SuperAdmin_Login />} />
        <Route path="/admin/login" element={<Admin_Login />} />
        <Route path="/subadmin/login" element={<SubAdmin_Login />} />

        {/* Dashboard Pages - Protected */}
        <Route element={<ProtectedRoute />}>
          {/* Admin: company registration (auth + admin role only; no dashboard chrome) */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/register" element={<RedirectIfCompanyLinked />}>
              <Route index element={<RegistrationFlow />} />
            </Route>
          </Route>

          <Route element={<DashboardLayout />}>

            {/* Superadmin Group */}
            <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
              <Route path="/superadmin/dashboard" element={<SuperAdmin_Dashboard />} />
              <Route path="/superadmin/companies/pending" element={<SuperAdmin_PendingCompanies />} />
              <Route path="/superadmin/companies" element={<SuperAdmin_Companies />} />
              <Route path="/superadmin/companies/review/:id" element={<SuperAdmin_CompanyReview />} />
              <Route path="/superadmin/add-admin" element={<SuperAdmin_AddAdmin />} />
              <Route path="/superadmin/sos" element={<SuperAdmin_SOSPage />} />
              <Route path="/superadmin/logs" element={<SuperAdmin_SystemLogs />} />
              <Route path="/superadmin/settings" element={<SuperAdmin_Settings />} />
            </Route>

            {/* Admin Group — requires linked company (company_admins.company_id) */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<RequireCompanyLinkedAdmin />}>
                <Route path="/admin/dashboard" element={<Admin_Dashboard />} />
                <Route path="/admin/users/drivers" element={<Admin_Drivers />} />
                <Route path="/admin/users/drivers/add" element={<Admin_AddDriver />} />
                <Route path="/admin/users/drivers/:id" element={<Admin_DriverDetail />} />
                <Route path="/admin/users/pa" element={<Admin_PAList />} />
                <Route path="/admin/users/pa/add" element={<Admin_AddPA />} />
                <Route path="/admin/users/pa/:id" element={<Admin_PADetail />} />
                <Route path="/admin/users/subadmins" element={<SubAdminList />} />
                <Route path="/admin/users/subadmins/add" element={<Admin_AddSubAdmin />} />
                <Route path="/admin/users/subadmins/:id" element={<Admin_SubAdminDetail />} />
                <Route path="/admin/users/passengers" element={<Admin_Passengers />} />
                <Route path="/admin/users/passengers/add" element={<Admin_AddPassenger />} />
                <Route path="/admin/users/passengers/:id/edit" element={<Admin_EditPassenger />} />
                <Route path="/admin/users/passengers/assign" element={<Admin_AssignRoute />} />
                <Route path="/admin/users/passengers/assign/review" element={<Admin_RouteReview />} />
                <Route path="/admin/users/passengers/assign/success" element={<Admin_SuccessConfirmation />} />
                <Route path="/admin/users/passengers/:id" element={<Admin_PassengerDetail />} />
                <Route path="/admin/jobs" element={<Admin_JobsList />} />
                <Route path="/admin/jobs/calendar" element={<Admin_JobCalendar />} />
                <Route path="/admin/jobs/create-step1" element={<Admin_AddJobStep1 />} />
                <Route path="/admin/jobs/create-step2" element={<Admin_AddJobStep2 />} />
                <Route path="/admin/jobs/create-step3" element={<Admin_AddJobStep3 />} />
                <Route path="/admin/jobs/:id/edit" element={<Admin_EditJob />} />
                <Route path="/admin/jobs/:id" element={<Admin_JobDetail />} />
                <Route path="/admin/notifications" element={<Admin_Notifications />} />
                <Route path="/admin/reports" element={<Admin_Report />} />
                <Route path="/admin/reports/driver-performance" element={<Admin_DriverReport />} />
                <Route path="/admin/reports/pa-attendance" element={<Admin_PAReport />} />
                <Route path="/admin/sos" element={<Admin_SOSPage />} />
                <Route path="/admin/sos/:id" element={<Admin_SOSDetail />} />
                <Route path="/admin/settings" element={<Admin_Settings />} />
              </Route>
            </Route>

            {/* Subadmin Group */}
            <Route element={<ProtectedRoute allowedRoles={['subadmin']} />}>
              <Route path="/subadmin/dashboard" element={<SubAdmin_Dashboard />} />
              <Route path="/subadmin/approvals" element={<SubAdmin_Approvals />} />
              <Route path="/subadmin/drivers" element={<SubAdmin_Drivers />} />
              <Route path="/subadmin/drivers/add" element={<SubAdmin_NewDriver />} />
              <Route path="/subadmin/drivers/:id" element={<SubAdmin_DriverProfile />} />
              <Route path="/subadmin/jobs" element={<SubAdmin_Jobs />} />
              <Route path="/subadmin/jobs/create" element={<SubAdmin_NewJob />} />
              <Route path="/subadmin/jobs/:id" element={<SubAdmin_JobDetail />} />
              <Route path="/subadmin/jobs/:id/edit" element={<SubAdmin_EditJob />} />
              <Route path="/subadmin/notifications" element={<SubAdmin_Notifications />} />
              <Route path="/subadmin/settings" element={<SubAdmin_Settings />} />
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
