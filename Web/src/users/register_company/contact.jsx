import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdLockOutline,
    MdLocationOn,
    MdSearch,
    MdContactPage,
    MdPhone,
    MdEmail,
    MdLanguage,
    MdArrowBack,
    MdArrowForward
} from 'react-icons/md';

const ContactAndAddress = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-gray-900">
            <div className="max-w-[1200px] mx-auto space-y-8">

                {/* ── Page Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight tracking-tight">New Tenant Registration</h1>
                        <p className="text-[15px] text-gray-500 mt-1 font-medium">Onboard a new transport company to the RideRoster ecosystem.</p>
                    </div>
                </div>

                {/* ── Stepper ── */}
                <div className="flex items-center border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden text-center h-16">
                    {/* Step 1 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-500">1</div>
                        <span className="text-[14px] font-bold text-gray-500">Basic Info</span>
                    </div>
                    {/* Step 2 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-[#3B82F6] bg-blue-50/30" style={{ borderColor: '#2f6b8f' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold mr-2.5 text-white" style={{ backgroundColor: '#2f6b8f' }}>2</div>
                        <span className="text-[14px] font-bold text-[#2f6b8f]">Contact & Address</span>
                    </div>
                    {/* Step 3 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">3</div>
                        <span className="text-[14px] font-bold text-gray-400">Admin & Scale</span>
                    </div>
                    {/* Step 4 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">4</div>
                        <span className="text-[14px] font-bold text-gray-400">Compliance</span>
                    </div>
                    {/* Step 5 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">5</div>
                        <span className="text-[14px] font-bold text-gray-400">Review</span>
                    </div>
                </div>

                {/* ── Main Form Content ── */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 shadow-sm max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="mb-10">
                        <h2 className="text-[22px] font-bold text-[#1e293b]">Contact & Address Details</h2>
                        <p className="text-[15px] text-gray-500 mt-1">Please provide the registered office and operational contact points for the company.</p>
                    </div>

                    {/* Section 1: Registered Office Address */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[#2f6b8f]">
                            <MdLocationOn size={22} />
                            <h3 className="text-[18px] font-bold text-[#1e293b]">Registered Office Address</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">Registered Office Address <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <textarea
                                    className="w-full px-4 pt-4 pb-12 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all resize-none h-28"
                                ></textarea>
                                <button className="absolute right-3 top-3 flex items-center gap-1.5 text-[13px] font-bold text-[#2f6b8f] hover:text-[#1a3f55] transition-colors p-2 bg-white rounded-lg">
                                    <MdSearch size={18} />
                                    Postcode Lookup
                                </button>
                            </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-3 pt-2">
                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#E2E8F0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2f6b8f] focus:ring-offset-2">
                                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform translate-x-1" />
                            </button>
                            <span className="text-[14px] text-gray-500 font-medium">Operating address is the same as registered office</span>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">Operating Address / Depot Location <span className="text-red-500">*</span></label>
                            <textarea
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all resize-none h-24"
                            ></textarea>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-10"></div>

                    {/* Section 2: Communication Channels */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[#2f6b8f]">
                            <MdContactPage size={22} />
                            <h3 className="text-[18px] font-bold text-[#1e293b]">Communication Channels</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">

                            <div className="space-y-2">
                                <label className="block text-[14px] font-bold text-[#1e293b]">Main Contact Phone <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <MdPhone size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        defaultValue="+44 20 7946 0000"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[14px] font-bold text-[#1e293b]">Main Contact Email <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <MdEmail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        defaultValue="admin@company.com"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all font-medium"
                                    />
                                </div>
                                <p className="text-[12px] text-gray-400 font-medium pt-1">Used for all system notifications and approval updates.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[14px] font-bold text-[#1e293b]">Website (Optional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <MdLanguage size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        defaultValue="https://www.company.com"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[14px] font-bold text-[#1e293b]">Preferred Language</label>
                                <input
                                    type="text"
                                    defaultValue="English (UK)"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="mt-12 flex items-center justify-between border border-gray-200 rounded-xl overflow-hidden shadow-sm h-14 bg-white">
                        <button
                            onClick={() => navigate('/admin/register/admin-scale')}
                            className="flex items-center justify-center gap-2 px-6 h-full text-[14px] font-bold text-white bg-[#2f6b8f] hover:bg-[#1a3f55] flex-1 transition-colors"
                        >
                            Next: Admin & Scale
                            <MdArrowForward size={18} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContactAndAddress;
