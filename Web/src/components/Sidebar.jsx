import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { clearDriversListCache } from '../hooks/useDriversList';
import { clearVehiclesListCache } from '../hooks/useVehiclesList';
import { clearPAListCache } from '../hooks/usePAList';
import { clearPassengersListCache } from '../hooks/usePassengersList';
import { clearSubAdminsListCache } from '../hooks/useSubAdminsList';
import { clearLeaveRequestsListCache } from '../hooks/useLeaveRequestsList';
import { clearJobsListCache } from '../hooks/useJobsList';
import { useSubAdminPermissions } from '../context/subAdminPermissionsContext';
import { SIDEBAR_MENU_CONFIGS } from './sidebarMenuConfig';
import {
    MdLogout,
    MdExpandMore,
    MdExpandLess
} from 'react-icons/md';

const filterSubadminNavItems = (items, { can, hasAny, hasAll, loading }) => {
    if (loading) return items;
    return items.filter((item) => {
        const p = item.perm;
        if (!p) return true;
        if (p.allOf?.length) return hasAll(p.allOf);
        if (p.anyOf?.length) return hasAny(p.anyOf);
        if (p.permission) return can(p.permission);
        return true;
    });
};

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const { can, hasAny, hasAll, loading: permLoading } = useSubAdminPermissions();

    const toggleSubMenu = (name) => {
        setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const userType = location.pathname.startsWith('/portal')
        ? 'admin'
        : location.pathname.startsWith('/team')
          ? 'subadmin'
          : 'superadmin';

    const { menuItems, bottomItems } = useMemo(() => {
        const cfg = SIDEBAR_MENU_CONFIGS[userType] || SIDEBAR_MENU_CONFIGS.superadmin;
        const stripPerm = (items) =>
            items.map(({ perm, ...rest }) => rest);

        if (userType === 'subadmin') {
            const filtered = filterSubadminNavItems(cfg.items, {
                can,
                hasAny,
                hasAll,
                loading: permLoading,
            });
            return { menuItems: stripPerm(filtered), bottomItems: cfg.bottom };
        }
        return { menuItems: cfg.items, bottomItems: cfg.bottom };
    }, [userType, can, hasAny, hasAll, permLoading]);

    return (
        <>
            <div
                className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside
                className={`fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-50">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-xs">NST</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-gray-800 leading-tight">NOTTINGHAM</h1>
                        <span className="text-[10px] text-gray-500 font-medium tracking-wider">SPECIALIST TRANSPORT LTD</span>
                    </div>
                </div>

                <nav className="flex flex-col justify-between h-[calc(100vh-64px)] p-4">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <div key={item.name}>
                                {item.children ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => toggleSubMenu(item.name)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                openMenus[item.name] ||
                                                item.children.some((child) => location.pathname.startsWith(child.path))
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
                                        <div
                                            className={`ml-9 mt-1 space-y-1 overflow-hidden transition-all duration-300 ${
                                                openMenus[item.name] ||
                                                item.children.some((child) => location.pathname.startsWith(child.path))
                                                    ? 'max-h-48 opacity-100'
                                                    : 'max-h-0 opacity-0'
                                            }`}
                                        >
                                            {item.children.map((child) => (
                                                <NavLink
                                                    key={child.name}
                                                    to={child.path}
                                                    onClick={() => window.innerWidth < 1024 && onClose()}
                                                    className={({ isActive }) =>
                                                        `block px-3 py-2 rounded-md text-sm transition-colors ${
                                                            isActive
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
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                isActive
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
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                {item.icon}
                                {item.name}
                            </NavLink>
                        ))}
                        <button
                            type="button"
                            onClick={async () => {
                                clearDriversListCache();
                                clearVehiclesListCache();
                                clearPAListCache();
                                clearPassengersListCache();
                                clearSubAdminsListCache();
                                clearLeaveRequestsListCache();
                                clearJobsListCache();
                                await supabase.auth.signOut();
                                localStorage.clear();
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
