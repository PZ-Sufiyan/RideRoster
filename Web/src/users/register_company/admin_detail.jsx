import React from 'react';
import {
    MdArrowBack,
    MdCloudUpload,
    MdSecurity,
    MdOutlineErrorOutline,
    MdClose,
} from 'react-icons/md';

const Admin_Register_AdminScale = ({ onNext, onPrev }) => {
    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left Column: Forms ── */}
            <div className="flex-1 space-y-6 min-w-0">

                {/* Primary Admin & Company Scale */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-[20px] font-bold text-[#1e293b]">Primary Admin & Company Scale</h2>
                        <p className="text-[13px] text-gray-500 mt-1">
                            Identify the master administrator and the operational capacity of the fleet.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Admin Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. John Doe"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Admin Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                placeholder="admin@company.com"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                            />
                            <p className="text-[12px] text-gray-400 font-medium italic">
                                Login credentials will be sent to this address upon approval.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Admin Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Fleet Size / Driver Estimate <span className="text-red-500">*</span>
                            </label>
                            <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all appearance-none cursor-pointer">
                                <option value="">Select size</option>
                            </select>
                            <p className="text-[12px] text-gray-400 font-medium">
                                Used for capacity & onboarding configuration.
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 mt-8 mb-6" />

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onPrev}
                            className="flex items-center gap-2 text-[#2f6b8f] font-bold text-[14px] hover:text-[#1a3f55] transition-colors"
                        >
                            <MdArrowBack size={18} />
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            className="px-6 py-2.5 text-white rounded-xl text-[14px] font-bold hover:opacity-90 transition-all shadow-sm"
                            style={{ backgroundColor: '#2f6b8f' }}
                        >
                            Continue to Documents
                        </button>
                    </div>
                </div>

                {/* Compliance Documents — preview / upcoming */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-[20px] font-bold text-[#1e293b]">Compliance Documents</h2>
                            <p className="text-[13px] text-gray-500 mt-1">
                                Upload verifiable business registration and insurance certificates.
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-bold tracking-widest uppercase">
                            Upcoming
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-dashed border-gray-200 bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-80">
                            <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center mb-3">
                                <MdCloudUpload size={20} />
                            </div>
                            <h3 className="text-[14px] font-bold text-[#1e293b]">Business License</h3>
                            <p className="text-[11px] text-gray-400 mt-1">PDF, JPG up to 10MB</p>
                        </div>
                        <div className="border border-dashed border-gray-200 bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-80">
                            <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center mb-3">
                                <MdSecurity size={20} />
                            </div>
                            <h3 className="text-[14px] font-bold text-[#1e293b]">Insurance Liability</h3>
                            <p className="text-[11px] text-gray-400 mt-1">Must be valid for current year</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Column: Sidebar ── */}
            <div className="w-full lg:w-[360px] shrink-0">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
                    <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-6">
                        Registration Summary
                    </h3>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                            <span className="text-[13px] text-gray-400">Company Name</span>
                            <span className="text-[13px] font-bold text-[#1e293b]">Swift Transit Solutions</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                            <span className="text-[13px] text-gray-400">Business Type</span>
                            <span className="text-[13px] font-bold text-[#1e293b]">Private Fleet</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                            <span className="text-[13px] text-gray-400">Location</span>
                            <span className="text-[13px] font-bold text-[#1e293b]">Austin, TX</span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 mb-3 text-amber-500 mt-4">
                            <MdOutlineErrorOutline size={16} />
                            <span className="text-[11px] font-bold uppercase tracking-wide">Missing Requirements</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-500">
                                <MdClose size={16} />
                                <span className="text-[13px] font-medium text-gray-500">Tax ID Verification</span>
                            </div>
                            <div className="flex items-center gap-2 text-red-500">
                                <MdClose size={16} />
                                <span className="text-[13px] font-medium text-gray-500">2/2 Compliance Docs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Register_AdminScale;