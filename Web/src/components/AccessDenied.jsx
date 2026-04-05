import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLock, MdArrowBack } from 'react-icons/md';

/**
 * Shown when a sub-admin lacks permission for a route or action.
 */
const AccessDenied = ({ title = 'Access Denied', message }) => {
    const navigate = useNavigate();
    const defaultMessage =
        message ||
        'You do not have the necessary permissions to view this page or perform this action. If you believe this is an error, please contact your Company Administrator to request access.';

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white p-10 rounded-xl shadow-md border border-gray-100 text-center">
                <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600">
                        <MdLock size={28} aria-hidden />
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-4 text-[15px] leading-relaxed">{defaultMessage}</p>
                <button
                    type="button"
                    onClick={() => navigate('/subadmin/dashboard')}
                    className="inline-flex items-center justify-center gap-2 mt-8 px-6 py-2.5 rounded-lg bg-[#1a5f7a] text-white text-sm font-semibold hover:bg-[#154a5f] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5f7a]/40"
                >
                    <MdArrowBack size={18} aria-hidden />
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
};

export default AccessDenied;
