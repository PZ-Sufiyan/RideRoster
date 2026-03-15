import React from 'react';
import {
    MdLocationOn,
    MdSearch,
    MdContactPage,
    MdPhone,
    MdEmail,
    MdLanguage,
    MdArrowBack,
    MdArrowForward,
} from 'react-icons/md';

const Admin_Register_Contact = ({ onNext, onPrev }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 shadow-sm max-w-4xl mx-auto">

            {/* Header */}
            <div className="mb-10">
                <h2 className="text-[22px] font-bold text-[#1e293b]">Contact & Address Details</h2>
                <p className="text-[15px] text-gray-500 mt-1">
                    Please provide the registered office and operational contact points for the company.
                </p>
            </div>

            {/* Section 1: Registered Office Address */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-[#2f6b8f]">
                    <MdLocationOn size={22} />
                    <h3 className="text-[18px] font-bold text-[#1e293b]">Registered Office Address</h3>
                </div>

                <div className="space-y-2">
                    <label className="block text-[14px] font-bold text-[#1e293b]">
                        Registered Office Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <textarea
                            className="w-full px-4 pt-4 pb-12 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all resize-none h-28"
                        />
                        <button className="absolute right-3 top-3 flex items-center gap-1.5 text-[13px] font-bold text-[#2f6b8f] hover:text-[#1a3f55] transition-colors p-2 bg-white rounded-lg">
                            <MdSearch size={18} />
                            Postcode Lookup
                        </button>
                    </div>
                </div>

                {/* Same-address toggle */}
                <div className="flex items-center gap-3 pt-2">
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#E2E8F0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2f6b8f] focus:ring-offset-2">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform translate-x-1" />
                    </button>
                    <span className="text-[14px] text-gray-500 font-medium">
                        Operating address is the same as registered office
                    </span>
                </div>

                <div className="space-y-2 pt-2">
                    <label className="block text-[14px] font-bold text-[#1e293b]">
                        Operating Address / Depot Location <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all resize-none h-24"
                    />
                </div>
            </div>

            <div className="h-px bg-gray-100 my-10" />

            {/* Section 2: Communication Channels */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-[#2f6b8f]">
                    <MdContactPage size={22} />
                    <h3 className="text-[18px] font-bold text-[#1e293b]">Communication Channels</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="space-y-2">
                        <label className="block text-[14px] font-bold text-[#1e293b]">
                            Main Contact Phone <span className="text-red-500">*</span>
                        </label>
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
                        <label className="block text-[14px] font-bold text-[#1e293b]">
                            Main Contact Email <span className="text-red-500">*</span>
                        </label>
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
                        <p className="text-[12px] text-gray-400 font-medium pt-1">
                            Used for all system notifications and approval updates.
                        </p>
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

            {/* Navigation */}
            <div className="mt-12 flex items-center justify-end  overflow-hidden h-14 bg-white">
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-5 h-full text-[14px] font-bold text-white transition-colors rounded-xl"
                    style={{ backgroundColor: '#2f6b8f' }}
                >
                    Next: Admin & Scale
                    <MdArrowForward size={18} />
                </button>
            </div>
        </div>
    );
};

export default Admin_Register_Contact;