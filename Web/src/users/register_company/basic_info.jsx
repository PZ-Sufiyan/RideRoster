import React from 'react';
import {
    MdInfoOutline,
    MdFileUpload,
    MdCheck,
    MdVisibility,
    MdDeleteOutline,
    MdKeyboardArrowDown,
} from 'react-icons/md';

const Admin_Register_BasicInfo = ({ onNext }) => {
    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left Column: Forms ── */}
            <div className="flex-1 space-y-6 min-w-0">

                {/* Basic Company Information */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[20px] font-bold text-[#1e293b]">Basic Company Information</h2>
                        <span className="px-3 py-1 bg-blue-50 text-[#2f6b8f] rounded-lg text-[12px] font-bold">
                            Step 1 of 5
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Legal trading name"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                            />
                            <p className="text-[12px] text-gray-400 font-medium">
                                Official name as registered with regulatory bodies.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Company Registration Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 12345678"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                            />
                            <p className="text-[12px] text-gray-400 font-medium">
                                UK Companies House number or equivalent.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Company Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all appearance-none cursor-pointer">
                                    <option value="">Select Type</option>
                                </select>
                                <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">VAT Number (Optional)</label>
                            <input
                                type="text"
                                placeholder="GB 123 4567 89"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Business Activity <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all appearance-none cursor-pointer">
                                    <option value="">Select Activity</option>
                                </select>
                                <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="mt-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#2f6b8f] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <MdInfoOutline size={14} />
                        </div>
                        <p className="text-[13px] text-[#2f6b8f] font-medium leading-relaxed">
                            Selecting "School / SEND Transport" will trigger mandatory enhanced DBS and
                            safeguarding document requirements in Step 4.
                        </p>
                    </div>
                </div>

                {/* Initial Document Verification */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-[20px] font-bold text-[#1e293b] mb-6">Initial Document Verification</h2>

                    <div className="space-y-4">
                        {/* Upload box */}
                        <div className="border border-dashed border-gray-300 rounded-2xl p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white border border-gray-100">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-bold text-[#1e293b]">Operator License</h3>
                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">Upload valid O-License copy (PDF, JPG)</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#2f6b8f] bg-blue-50/50">
                                <MdFileUpload size={20} />
                            </div>
                        </div>

                        {/* Uploaded item */}
                        <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-500 flex items-center justify-center border border-green-100">
                                    <MdCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-bold text-[#1e293b]">Public Liability Insurance</h3>
                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">insurance_2024.pdf (2.4 MB)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <button className="hover:text-gray-600 transition-colors p-1">
                                    <MdVisibility size={20} />
                                </button>
                                <button className="hover:text-red-500 transition-colors p-1">
                                    <MdDeleteOutline size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-end pt-4 pb-10">
                    <button
                        onClick={onNext}
                        className="px-6 py-3 text-white rounded-xl text-[14px] font-bold hover:opacity-90 transition-all shadow-sm"
                        style={{ backgroundColor: '#2f6b8f' }}
                    >
                        Next: Contact & Address →
                    </button>
                </div>
            </div>

            {/* ── Right Column: Sidebar ── */}
            <div className="w-full lg:w-[320px] shrink-0">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                        Onboarding Progress
                    </h3>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[13px] text-gray-500 font-medium">Profile Completion</span>
                            <span className="text-[13px] font-bold text-[#1e293b]">20%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-[#2f6b8f] h-2 rounded-full" style={{ width: '20%' }} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                                <MdCheck size={12} />
                            </div>
                            <span className="text-[13px] font-bold text-[#22c55e]">Basic Info Started</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
                            <span className="text-[13px] font-medium text-gray-400">Contact Details Pending</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
                            <span className="text-[13px] font-medium text-gray-400">Compliance Documents</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Register_BasicInfo;