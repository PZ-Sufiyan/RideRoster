import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    MdDashboard,
    MdBusiness,
    MdSos,
    MdSettings,
    MdLogout,
    MdHistory
} from 'react-icons/md';

const Sidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard size={20} /> },
        { name: 'Companies', path: '/companies/pending', icon: <MdBusiness size={20} /> },
        { name: 'SOS Monitoring', path: '/sos', icon: <MdSos size={20} /> },
        { name: 'System Logs', path: '/logs', icon: <MdHistory size={20} /> },
    ];

    const bottomItems = [
        { name: 'Settings', path: '/settings', icon: <MdSettings size={20} /> },
    ];

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
                            <NavLink
                                key={item.name}
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
