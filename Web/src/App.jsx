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
import Admin_EditDriver from './users/admin/pages/user_managment/driver/edit_driver';
import Admin_PAList from './users/admin/pages/user_managment/PA/pa_list';
import Admin_PADetail from './users/admin/pages/user_managment/PA/pa_detail';
import Admin_AddPA from './users/admin/pages/user_managment/PA/add_new_pa';
import Admin_EditPA from './users/admin/pages/user_managment/PA/edit_pa';
import SubAdminList from './users/admin/pages/user_managment/subadmin/sub_admin';
import Admin_AddSubAdmin from './users/admin/pages/user_managment/subadmin/add_sub_admin';
import Admin_SubAdminDetail from './users/admin/pages/user_managment/subadmin/sub_admin_detail';
import Admin_JobsList from './users/admin/pages/job_managment/jobs_list';
import Admin_JobDetail from './users/admin/pages/job_managment/job_detail';
import Admin_EditJob from './users/admin/pages/job_managment/edit_job';
import Admin_CounterOffer from './users/admin/pages/job_managment/counter_offer';
import Admin_JobCalendar from './users/admin/pages/job_managment/job_calender';
import Admin_AddJob from './users/admin/pages/job_managment/add_job';
import Admin_Passengers from './users/admin/pages/user_managment/passenger/passengers';
import Admin_AddPassenger from './users/admin/pages/user_managment/passenger/add_new_passenger';
import Admin_EditPassenger from './users/admin/pages/user_managment/passenger/edit_passenger';
import Admin_PassengerDetail from './users/admin/pages/user_managment/passenger/passenger_detail';
import Admin_OffDayRequests from './users/admin/pages/user_managment/off_day_requests/off_day_requests';
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
import SubAdmin_Drivers from './users/subAdmin/pages/user_managment/driver/drivers';
import SubAdmin_AddDriver from './users/subAdmin/pages/user_managment/driver/add_new_driver';
import SubAdmin_DriverDetail from './users/subAdmin/pages/user_managment/driver/driver_detail';
import SubAdmin_EditDriver from './users/subAdmin/pages/user_managment/driver/edit_driver';
import SubAdmin_PAList from './users/subAdmin/pages/user_managment/PA/pa_list';
import SubAdmin_AddPA from './users/subAdmin/pages/user_managment/PA/add_new_pa';
import SubAdmin_PADetail from './users/subAdmin/pages/user_managment/PA/pa_detail';
import SubAdmin_EditPA from './users/subAdmin/pages/user_managment/PA/edit_pa';
import SubAdmin_Passengers from './users/subAdmin/pages/user_managment/passenger/passengers';
import SubAdmin_AddPassenger from './users/subAdmin/pages/user_managment/passenger/add_new_passenger';
import SubAdmin_EditPassenger from './users/subAdmin/pages/user_managment/passenger/edit_passenger';
import SubAdmin_PassengerDetail from './users/subAdmin/pages/user_managment/passenger/passenger_detail';
import SubAdmin_AssignRoute from './users/subAdmin/pages/user_managment/passenger/assign_route';
import SubAdmin_RouteReview from './users/subAdmin/pages/user_managment/passenger/route_review';
import SubAdmin_SuccessConfirmation from './users/subAdmin/pages/user_managment/passenger/success_confirmation';
import SubAdmin_JobsList from './users/subAdmin/pages/job_managment/jobs_list';
import SubAdmin_JobDetail from './users/subAdmin/pages/job_managment/job_detail';
import SubAdmin_EditJob from './users/subAdmin/pages/job_managment/edit_job';
import SubAdmin_CounterOffer from './users/subAdmin/pages/job_managment/counter_offer';
import SubAdmin_JobCalendar from './users/subAdmin/pages/job_managment/job_calender';
import SubAdmin_AddJob from './users/subAdmin/pages/job_managment/add_job';
import SubAdmin_SOSPage from './users/subAdmin/pages/sos/sos';
import SubAdmin_SOSDetail from './users/subAdmin/pages/sos/sos_detail';
import SubAdmin_Notifications from './users/subAdmin/pages/notifications/notification';
import SubAdmin_Settings from './users/subAdmin/pages/settings/settings';
import Home from './home';
import AuthConfirmed from './pages/auth/AuthConfirmed';
import SubAdminProtectedPage from './components/SubAdminProtectedPage';
import './App.css';

const ROLE_URL_PREFIX = { superadmin: 'platform', admin: 'portal', subadmin: 'team' };

// Component for route protection
const ProtectedRoute = ({ allowedRoles }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const prefix = ROLE_URL_PREFIX[role] || role;
    return <Navigate to={`/${prefix}/dashboard`} replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth/confirmed" element={<AuthConfirmed />} />

        {/* Auth Pages */}
        <Route path="/platform/login" element={<SuperAdmin_Login />} />
        <Route path="/portal/login" element={<Admin_Login />} />
        <Route path="/team/login" element={<SubAdmin_Login />} />

        {/* Dashboard Pages - Protected */}
        <Route element={<ProtectedRoute />}>
          {/* Admin: company registration (auth + admin role only; no dashboard chrome) */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/portal/register" element={<RedirectIfCompanyLinked />}>
              <Route index element={<RegistrationFlow />} />
            </Route>
          </Route>

          <Route element={<DashboardLayout />}>

            {/* Superadmin Group */}
            <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
              <Route path="/platform/dashboard" element={<SuperAdmin_Dashboard />} />
              <Route path="/platform/companies/pending" element={<SuperAdmin_PendingCompanies />} />
              <Route path="/platform/companies" element={<SuperAdmin_Companies />} />
              <Route path="/platform/companies/review/:id" element={<SuperAdmin_CompanyReview />} />
              <Route path="/platform/add-admin" element={<SuperAdmin_AddAdmin />} />
              <Route path="/platform/sos" element={<SuperAdmin_SOSPage />} />
              <Route path="/platform/logs" element={<SuperAdmin_SystemLogs />} />
              <Route path="/platform/settings" element={<SuperAdmin_Settings />} />
            </Route>

            {/* Admin Group — requires linked company (company_admins.company_id) */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<RequireCompanyLinkedAdmin />}>
                <Route path="/portal/dashboard" element={<Admin_Dashboard />} />
                <Route path="/portal/users/drivers" element={<Admin_Drivers />} />
                <Route path="/portal/users/drivers/add" element={<Admin_AddDriver />} />
                <Route path="/portal/users/drivers/:driverId/edit" element={<Admin_EditDriver />} />
                <Route path="/portal/users/drivers/:id" element={<Admin_DriverDetail />} />
                <Route path="/portal/users/pa" element={<Admin_PAList />} />
                <Route path="/portal/users/pa/add" element={<Admin_AddPA />} />
                <Route path="/portal/users/pa/:id/edit" element={<Admin_EditPA />} />
                <Route path="/portal/users/pa/:id" element={<Admin_PADetail />} />
                <Route path="/portal/users/subadmins" element={<SubAdminList />} />
                <Route path="/portal/users/subadmins/add" element={<Admin_AddSubAdmin />} />
                <Route path="/portal/users/subadmins/:id" element={<Admin_SubAdminDetail />} />
                <Route path="/portal/users/passengers" element={<Admin_Passengers />} />
                <Route path="/portal/users/passengers/add" element={<Admin_AddPassenger />} />
                <Route path="/portal/users/passengers/:id/edit" element={<Admin_EditPassenger />} />
                <Route path="/portal/users/passengers/assign" element={<Admin_AssignRoute />} />
                <Route path="/portal/users/passengers/assign/review" element={<Admin_RouteReview />} />
                <Route path="/portal/users/passengers/assign/success" element={<Admin_SuccessConfirmation />} />
                <Route path="/portal/users/passengers/:id" element={<Admin_PassengerDetail />} />
                <Route path="/portal/users/off-day-requests" element={<Admin_OffDayRequests />} />
                <Route path="/portal/jobs" element={<Admin_JobsList />} />
                <Route path="/portal/jobs/calendar" element={<Admin_JobCalendar />} />
                <Route path="/portal/jobs/add-job" element={<Admin_AddJob />} />
                <Route path="/portal/jobs/:id/edit" element={<Admin_EditJob />} />
                <Route path="/portal/jobs/:id/counter-offer" element={<Admin_CounterOffer />} />
                <Route path="/portal/jobs/:id" element={<Admin_JobDetail />} />
                <Route path="/portal/notifications" element={<Admin_Notifications />} />
                <Route path="/portal/reports" element={<Admin_Report />} />
                <Route path="/portal/reports/driver-performance" element={<Admin_DriverReport />} />
                <Route path="/portal/reports/pa-attendance" element={<Admin_PAReport />} />
                <Route path="/portal/sos" element={<Admin_SOSPage />} />
                <Route path="/portal/sos/:id" element={<Admin_SOSDetail />} />
                <Route path="/portal/settings" element={<Admin_Settings />} />
              </Route>
            </Route>

            {/* Subadmin Group — mirrors admin routes; pages gated by sub_admins permissions */}
            <Route element={<ProtectedRoute allowedRoles={['subadmin']} />}>
              <Route path="/team/dashboard" element={<SubAdmin_Dashboard />} />
              <Route
                path="/team/approvals"
                element={
                  <SubAdminProtectedPage anyOf={['view_users', 'view_jobs']}>
                    <SubAdmin_Approvals />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/drivers"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_Drivers />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/drivers/add"
                element={
                  <SubAdminProtectedPage permission="add_users">
                    <SubAdmin_AddDriver />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/drivers/:id"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_DriverDetail />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/drivers/:driverId/edit"
                element={
                  <SubAdminProtectedPage permission="edit_profiles">
                    <SubAdmin_EditDriver />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/pa"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_PAList />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/pa/add"
                element={
                  <SubAdminProtectedPage permission="add_users">
                    <SubAdmin_AddPA />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/pa/:id"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_PADetail />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/pa/:id/edit"
                element={
                  <SubAdminProtectedPage permission="edit_profiles">
                    <SubAdmin_EditPA />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/passengers"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_Passengers />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/passengers/add"
                element={
                  <SubAdminProtectedPage permission="add_users">
                    <SubAdmin_AddPassenger />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/passengers/:id/edit"
                element={
                  <SubAdminProtectedPage permission="edit_profiles">
                    <SubAdmin_EditPassenger />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/passengers/assign"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_AssignRoute />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/passengers/assign/review"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_RouteReview />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/passengers/assign/success"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_SuccessConfirmation />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/users/passengers/:id"
                element={
                  <SubAdminProtectedPage permission="view_users">
                    <SubAdmin_PassengerDetail />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/jobs"
                element={
                  <SubAdminProtectedPage permission="view_jobs">
                    <SubAdmin_JobsList />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/jobs/calendar"
                element={
                  <SubAdminProtectedPage permission="view_jobs">
                    <SubAdmin_JobCalendar />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/jobs/add-job"
                element={
                  <SubAdminProtectedPage permission="create_jobs">
                    <SubAdmin_AddJob />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/jobs/:id/edit"
                element={
                  <SubAdminProtectedPage permission="edit_jobs">
                    <SubAdmin_EditJob />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/jobs/:id/counter-offer"
                element={
                  <SubAdminProtectedPage permission="view_jobs">
                    <SubAdmin_CounterOffer />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/jobs/:id"
                element={
                  <SubAdminProtectedPage permission="view_jobs">
                    <SubAdmin_JobDetail />
                  </SubAdminProtectedPage>
                }
              />
              <Route path="/team/notifications" element={<SubAdmin_Notifications />} />
              <Route
                path="/team/sos"
                element={
                  <SubAdminProtectedPage anyOf={['view_jobs', 'view_users']}>
                    <SubAdmin_SOSPage />
                  </SubAdminProtectedPage>
                }
              />
              <Route
                path="/team/sos/:id"
                element={
                  <SubAdminProtectedPage anyOf={['view_jobs', 'view_users']}>
                    <SubAdmin_SOSDetail />
                  </SubAdminProtectedPage>
                }
              />
              <Route path="/team/settings" element={<SubAdmin_Settings />} />
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
