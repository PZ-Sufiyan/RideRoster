import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import { SubAdminPermissionsProvider } from '../context/subAdminPermissionsContext';

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const isSubAdmin = location.pathname.startsWith('/team');

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const shell = (
        <>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 pb-10">
                    <Breadcrumbs />
                    <Outlet />
                </main>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {isSubAdmin ? <SubAdminPermissionsProvider>{shell}</SubAdminPermissionsProvider> : shell}
        </div>
    );
};

export default DashboardLayout;
