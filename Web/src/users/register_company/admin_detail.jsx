import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdChevronRight,
    MdArrowBack,
    MdCloudUpload,
    MdSecurity,
    MdOutlineErrorOutline,
    MdClose,
    MdLockOutline
} from 'react-icons/md';

const AdminDetail = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-gray-900">
            <div className="max-w-[1200px] mx-auto space-y-8">

                {/* ── Breadcrumb & Page Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight tracking-tight">Register New Transport Company</h1>
                    </div>
                </div>

                {/* ── Stepper ── */}
                <div className="flex items-center border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden text-center h-16">
                    {/* Step 1 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent opacity-50">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">1</div>
                        <span className="text-[14px] font-bold text-gray-400">Basic Info</span>
                    </div>
                    {/* Step 2 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent opacity-50">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">2</div>
                        <span className="text-[14px] font-bold text-gray-400">Contact & Address</span>
                    </div>
                    {/* Step 3 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-[#3B82F6] bg-blue-50/30" style={{ borderColor: '#2f6b8f' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold mr-2.5 text-white" style={{ backgroundColor: '#2f6b8f' }}>3</div>
                        <span className="text-[14px] font-bold text-[#2f6b8f]">Admin & Scale</span>
                    </div>
                    {/* Step 4 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">4</div>
                        <span className="text-[14px] font-bold text-gray-400">Compliance Docs</span>
                    </div>
                    {/* Step 5 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">5</div>
                        <span className="text-[14px] font-bold text-gray-400">Review</span>
                    </div>
                </div>

                {/* ── Main Content Grid ── */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* ── Left Column: Forms ── */}
                    <div className="flex-1 space-y-6 min-w-0">

                        {/* Primary Admin & Company Scale Card */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                            <div className="mb-8">
                                <h2 className="text-[20px] font-bold text-[#1e293b]">Primary Admin & Company Scale</h2>
                                <p className="text-[13px] text-gray-500 mt-1">Identify the master administrator and the operational capacity of the fleet.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-10">

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-bold text-[#1e293b]">Primary Admin Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-bold text-[#1e293b]">Primary Admin Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        placeholder="admin@company.com"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                    />
                                    <p className="text-[12px] text-gray-400 font-medium italic">Login credentials will be sent to this address upon approval.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-bold text-[#1e293b]">Primary Admin Phone <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] font-bold text-[#1e293b]">Fleet Size / Driver Estimate <span className="text-red-500">*</span></label>
                                    <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all appearance-none cursor-pointer">
                                        <option value="">Select size</option>
                                    </select>
                                    <p className="text-[12px] text-gray-400 font-medium">Used for capacity & onboarding configuration.</p>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 mb-6"></div>

                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => navigate('/admin/register/contact')}
                                    className="flex items-center gap-2 text-[#2f6b8f] font-bold text-[14px] hover:text-[#1a3f55] transition-colors"
                                >
                                    <MdArrowBack size={18} />
                                    Previous Step
                                </button>
                                <button
                                    onClick={() => navigate('/admin/register/compliance-docs')}
                                    className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-xl text-[14px] font-bold hover:bg-blue-600 transition-all shadow-sm"
                                    style={{ backgroundColor: '#2f6b8f' }}
                                >
                                    Continue to Documents
                                </button>
                            </div>
                        </div>

                        {/* Compliance Documents Card */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mx-1 mb-6">
                                <div>
                                    <h2 className="text-[20px] font-bold text-[#1e293b]">Compliance Documents</h2>
                                    <p className="text-[13px] text-gray-500 mt-1">Upload verifiable business registration and insurance certificates.</p>
                                </div>
                                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-bold tracking-widest uppercase">Upcoming</span>
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

                        {/* Bottom Footer actions */}
                        <div className="flex items-center justify-between pt-4 pb-10">
                            <button
                                onClick={() => navigate('/admin/register/compliance-docs')}
                                className="px-6 py-3 bg-[#3B82F6] text-white rounded-xl text-[14px] font-bold hover:bg-blue-600 transition-all shadow-sm"
                                style={{ backgroundColor: '#2f6b8f' }}
                            >
                                Submit to next Step
                            </button>
                        </div>
                    </div>

                    {/* ── Right Column: Sidebar ── */}
                    <div className="w-full lg:w-[360px] shrink-0">
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
                            <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-6">Registration Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                    <span className="text-[13px] text-gray-400">Company Name</span>
                                    <span className="text-[13px] font-bold text-[#1e293b]">Swift Transit Solutions</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                    <span className="text-[13px] text-gray-400">Business Type</span>
                                    <span className="text-[13px] font-bold text-[#1e293b]">Private Fleet</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-gray-50">
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
            </div>
        </div>
    );
};

export default AdminDetail;
