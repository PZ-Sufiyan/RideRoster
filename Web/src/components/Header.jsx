import { useEffect, useState } from 'react';
import { MdMenu } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Header = ({ onMenuClick }) => {
    const location = useLocation();

    const isAdmin = location.pathname.startsWith('/portal');
    const isSubAdmin = location.pathname.startsWith('/team');
    const isSuperAdmin = !isAdmin && !isSubAdmin;

    const roleLabel = isAdmin ? 'Admin' : isSubAdmin ? 'Sub Admin' : 'Super Admin';

    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchName = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || cancelled) return;

                if (isSuperAdmin) {
                    const { data } = await supabase
                        .from('super_admin')
                        .select('full_name')
                        .eq('id', user.id)
                        .single();
                    if (!cancelled) setDisplayName(data?.full_name || '');
                } else if (isAdmin) {
                    const { data } = await supabase
                        .from('company_admins')
                        .select('full_name')
                        .eq('id', user.id)
                        .single();
                    if (!cancelled) setDisplayName(data?.full_name || '');
                } else {
                    const { data } = await supabase
                        .from('sub_admins')
                        .select('name')
                        .eq('id', user.id)
                        .single();
                    if (!cancelled) setDisplayName(data?.name || '');
                }
            } catch {
                // silently fail — name stays empty
            }
        };

        fetchName();
        return () => { cancelled = true; };
    }, [isAdmin, isSubAdmin, isSuperAdmin]);

    const img = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm sm:px-6 lg:px-8 border-b border-gray-100">
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="p-1 -ml-1 text-gray-500 rounded-md lg:hidden hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    onClick={onMenuClick}
                    aria-label="Open sidebar"
                >
                    <MdMenu className="w-6 h-6" />
                </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-6">

                {/* Profile Dropdown */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-100 cursor-pointer">
                    <img
                        className="h-9 w-9 rounded-full object-cover border border-gray-200"
                        src={img}
                        alt={displayName || roleLabel}
                    />
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold text-gray-700 leading-none">{displayName || roleLabel}</p>
                        <p className="text-xs text-gray-500 mt-1">{roleLabel}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
