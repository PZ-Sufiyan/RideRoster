import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCheckCircle, MdInfo } from 'react-icons/md';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminAccess } from '../../../../services/companyAccessService';

const PendingApproval = () => {
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { company: next } = await getCompanyAdminAccess();
            if (!cancelled) setCompany(next);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const companyName = company?.company_name || 'your company';
    const notifyEmail = company?.company_email || 'your email';

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-gray-900">
            <div className="max-w-300 mx-auto">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight tracking-tight">
                            Application in review
                        </h1>
                        <p className="text-[15px] text-gray-500 mt-1 font-medium">
                            Your company registration is waiting for Super Admin approval.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            localStorage.clear();
                            navigate('/home');
                        }}
                        className="ml-8 mt-1 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold text-sm shadow-sm hover:bg-red-100 transition-colors"
                    >
                        Log out
                    </button>
                </div>

                <div className="max-w-xl mx-auto py-16 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto">
                        <MdCheckCircle size={40} className="text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-[24px] font-bold text-[#1e293b]">Registration Submitted!</h2>
                        <p className="text-[15px] text-gray-500 mt-2 leading-relaxed">
                            Your company registration for{' '}
                            <span className="font-bold text-[#1e293b]">{companyName}</span> has
                            been submitted for review. You will receive a notification at{' '}
                            <span className="font-bold text-[#1e293b]">{notifyEmail}</span>{' '}
                            when it is approved or rejected.
                        </p>
                        <p className="text-[15px] text-gray-500 mt-3 leading-relaxed">
                            Your application is still in review. You cannot open the dashboard until a Super Admin approves the company.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#2f6b8f] rounded-xl text-[13px] font-bold">
                        <MdInfo size={16} /> Typical review time: 24–48 hours
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
