import React from 'react';
import { MdMenu, MdNotificationsNone } from 'react-icons/md';

const Header = ({ onMenuClick }) => {
    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm sm:px-6 lg:px-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="sr-only">View notifications</span>
                    <MdNotificationsNone className="w-6 h-6" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 border-2 border-white"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                    <img
                        className="h-9 w-9 rounded-full object-cover border border-gray-200"
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                        alt="Eleanor Pena"
                    />
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold text-gray-700 leading-none">Eleanor Pena</p>
                        <p className="text-xs text-gray-500 mt-1">Super Admin</p>
                    </div>
                    {/* Dropdown chevron could go here */}
                </div>
            </div>
        </header>
    );
};

export default Header;
