import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/image-002.png';

const NAV_LINKS = [
    { to: '/home', label: 'Home' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/contact-us', label: 'Contact Us' },
    { to: '/account-deletion', label: 'Delete Account' },
];

const PublicLayout = ({ children }) => {
    const { pathname } = useLocation();

    return (
        <div className="min-h-screen bg-[#f3f4f6] font-sans flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
                    <Link to="/home" className="flex items-center gap-3 shrink-0">
                        <img
                            src={logo}
                            alt="NST"
                            className="h-10 w-auto object-contain"
                        />
                        <div className="hidden sm:block leading-tight">
                            <p className="text-[13px] font-semibold text-[#004D6D] tracking-wide">
                                NST
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Nottingham Specialist Transport
                            </p>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-1 sm:gap-2">
                        {NAV_LINKS.map(({ to, label }) => {
                            const active = pathname === to;
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                                        active
                                            ? 'text-[#004D6D] bg-[#004D6D]/10'
                                            : 'text-gray-600 hover:text-[#004D6D] hover:bg-gray-50'
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <main className="flex-1 w-full">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                        <div>
                            <p className="text-[13px] font-semibold text-[#004D6D]">
                                NOTTINGHAM SPECIALIST TRANSPORT LTD
                            </p>
                            <p className="mt-2 text-[12px] text-gray-500 leading-relaxed max-w-xs">
                                C/O Sbe Accountants<br />
                                Quadrant Court, 49 Calthorpe Road, Edgbaston<br />
                                Birmingham B15 1TH, United Kingdom
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 text-[13px]">
                            <Link to="/privacy-policy" className="text-gray-600 hover:text-[#004D6D] transition-colors">
                                Privacy Policy
                            </Link>
                            <Link to="/contact-us" className="text-gray-600 hover:text-[#004D6D] transition-colors">
                                Contact Us
                            </Link>
                            <Link to="/account-deletion" className="text-gray-600 hover:text-[#004D6D] transition-colors">
                                Delete Account
                            </Link>
                            <a
                                href="https://nst-sch.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-[#004D6D] transition-colors"
                            >
                                nst-sch.com
                            </a>
                        </div>
                    </div>
                    <p className="mt-6 pt-5 border-t border-gray-100 text-[12px] text-gray-400">
                        © {new Date().getFullYear()} Nottingham Specialist Transport Ltd. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
