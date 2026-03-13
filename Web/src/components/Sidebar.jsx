import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    MdDashboard,
    MdBusiness,
    MdSos,
    MdSettings,
    MdLogout,
    MdHistory,
    MdPeople,
    MdWork,
    MdNotifications,
    MdAssessment,
    MdCheckCircle,
    MdPeopleOutline,
    MdExpandMore,
    MdExpandLess
} from 'react-icons/md';


const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});

    const toggleSubMenu = (name) => {
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    // Determine user type from path or default to superadmin
    const userType = location.pathname.startsWith('/admin') ? 'admin' :
        location.pathname.startsWith('/subadmin') ? 'subadmin' : 'superadmin';

    const menuConfigs = {
        superadmin: {
            items: [
                { name: 'Dashboard', path: '/superadmin/dashboard', icon: <MdDashboard size={20} /> },
                { name: 'Companies', path: '/superadmin/companies/pending', icon: <MdBusiness size={20} /> },
                { name: 'SOS Monitoring', path: '/superadmin/sos', icon: <MdSos size={20} /> },
                { name: 'System Logs', path: '/superadmin/logs', icon: <MdHistory size={20} /> },
            ],
            bottom: [
                { name: 'Settings', path: '/superadmin/settings', icon: <MdSettings size={20} /> },
            ]
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
                    ]
                },
                { name: 'Job Management', path: '/admin/jobs', icon: <MdWork size={20} /> },
                { name: 'Notifications', path: '/admin/notifications', icon: <MdNotifications size={20} /> },
                { name: 'Reports', path: '/admin/reports', icon: <MdAssessment size={20} /> },
                { name: 'SOS Monitoring', path: '/admin/sos', icon: <MdSos size={20} /> },
            ],
            bottom: [
                { name: 'Settings', path: '/admin/settings', icon: <MdSettings size={20} /> },
            ]
        },
        subadmin: {
            items: [
                { name: 'Dashboard', path: '/subadmin/dashboard', icon: <MdDashboard size={20} /> },
                { name: 'Approval', path: '/subadmin/approvals', icon: <MdCheckCircle size={20} /> },
                { name: 'Drivers', path: '/subadmin/drivers', icon: <MdPeopleOutline size={20} /> },
                { name: 'Job Notification', path: '/subadmin/job-notifications', icon: <MdNotifications size={20} /> },
            ],
            bottom: [
                { name: 'Settings', path: '/subadmin/settings', icon: <MdSettings size={20} /> },
            ]
        }
    };

    const currentConfig = menuConfigs[userType] || menuConfigs.superadmin;
    const menuItems = currentConfig.items;
    const bottomItems = currentConfig.bottom;

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Logo Section */}
                <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-50">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                        {/* Simple Logo Placeholder */}
                        <span className="text-white font-bold text-xs">NST</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-gray-800 leading-tight">NOTTINGHAM</h1>
                        <span className="text-[10px] text-gray-500 font-medium tracking-wider">SPECIALIST TRANSPORT LTD</span>
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex flex-col justify-between h-[calc(100vh-64px)] p-4">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <div key={item.name}>
                                {item.children ? (
                                    <>
                                        <button
                                            onClick={() => toggleSubMenu(item.name)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${openMenus[item.name] || item.children.some(child => location.pathname.startsWith(child.path))
                                                ? 'bg-gray-50 text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.icon}
                                                {item.name}
                                            </div>
                                            {openMenus[item.name] ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                                        </button>
                                        <div className={`ml-9 mt-1 space-y-1 overflow-hidden transition-all duration-300 ${openMenus[item.name] || item.children.some(child => location.pathname.startsWith(child.path)) ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            {item.children.map((child) => (
                                                <NavLink
                                                    key={child.name}
                                                    to={child.path}
                                                    onClick={() => window.innerWidth < 1024 && onClose()}
                                                    className={({ isActive }) =>
                                                        `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                                            ? 'text-blue-700 font-semibold'
                                                            : 'text-gray-500 hover:text-gray-900'
                                                        }`
                                                    }
                                                >
                                                    {child.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <NavLink
                                        to={item.path}
                                        onClick={() => window.innerWidth < 1024 && onClose()}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        {item.icon}
                                        {item.name}
                                    </NavLink>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1 pt-4 border-t border-gray-50">
                        {bottomItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700' // Using blue for settings/active state consistency
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                {item.icon}
                                {item.name}
                            </NavLink>
                        ))}
                        <button
                            onClick={() => {
                                localStorage.removeItem('userRole');
                                localStorage.removeItem('isAuthenticated');
                                navigate('/home');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
                        >
                            <MdLogout size={20} />
                            Logout
                        </button>
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
