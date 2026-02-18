import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/dashboard/dashboard';
import PendingCompanies from './pages/companies/pendingcompanies';
import Companies from './pages/companies/companies';
import CompanyReview from './pages/companies/companyReview';
import SOSPage from './pages/sos/sos';
import SystemLogs from './pages/systemlogs/systemlogs';
import Settings from './pages/settings/settings';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Dashboard Layout wraps any child routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies/pending" element={<PendingCompanies />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/review/:id" element={<CompanyReview />} />
          <Route path="sos" element={<SOSPage />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
