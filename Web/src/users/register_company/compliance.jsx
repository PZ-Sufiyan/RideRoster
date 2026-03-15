import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdLockOutline,
    MdInfo,
    MdCheckCircle,
    MdVisibility,
    MdDeleteOutline,
    MdAccessTime,
    MdCloudUpload,
    MdCreditCard,
    MdAttachFile,
    MdAdd,
    MdDateRange
} from 'react-icons/md';

const ComplianceDocs = () => {
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
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent opacity-50">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">3</div>
                        <span className="text-[14px] font-bold text-gray-400">Admin & Scale</span>
                    </div>
                    {/* Step 4 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-[#3B82F6] bg-blue-50/30" style={{ borderColor: '#2f6b8f' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold mr-2.5 text-white" style={{ backgroundColor: '#2f6b8f' }}>4</div>
                        <span className="text-[14px] font-bold text-[#2f6b8f]">Compliance</span>
                    </div>
                    {/* Step 5 */}
                    <div className="flex-1 flex items-center justify-center h-full border-b-[3px] border-transparent">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">5</div>
                        <span className="text-[14px] font-bold text-gray-400">Review</span>
                    </div>
                </div>

                {/* ── Main Form Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-[22px] font-bold text-[#1e293b]">Compliance & Legal Documents</h2>
                        <p className="text-[15px] text-gray-500 mt-1">Upload and verify mandatory business documentation.</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#2f6b8f] text-[13px] font-bold">
                        <MdInfo size={16} />
                        3 of 5 Documents Uploaded
                    </div>
                </div>

                {/* ── Main Content Grid ── */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* ── Left Column: Required Documents ── */}
                    <div className="flex-1 space-y-6 min-w-0">

                        {/* 1. Company Registration Block */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2f6b8f] flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-bold text-[#1e293b]">Proof of Company Registration*</h3>
                                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">Certificate of Incorporation or equivalent</p>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[11px] font-bold tracking-wide uppercase">
                                    <MdCheckCircle size={14} />
                                    Verified
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Registration Number*</label>
                                    <input
                                        type="text"
                                        defaultValue="UK-99281720"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Issue Date*</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            defaultValue="05/15/2020"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                        />
                                        <MdDateRange className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-red-100 text-red-500 flex items-center justify-center font-bold text-[10px]">
                                        PDF
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-[#1e293b]">incorp_cert_2020.pdf</p>
                                        <p className="text-[12px] text-gray-500 font-medium">2.4 MB • Uploaded 12 Oct 2023</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <button className="p-1.5 hover:text-gray-700 transition-colors">
                                        <MdVisibility size={18} />
                                    </button>
                                    <button className="p-1.5 hover:text-red-500 transition-colors">
                                        <MdDeleteOutline size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Insurance Block */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center border-dashed">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-bold text-[#1e293b]">Commercial Insurance Certificate*</h3>
                                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">Public liability & motor fleet coverage</p>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-[11px] font-bold tracking-wide uppercase border border-yellow-100">
                                    <MdAccessTime size={14} />
                                    Pending Review
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Policy Number*</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. POL-882190"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Coverage Amount (£)*</label>
                                    <input
                                        type="text"
                                        defaultValue="£5,000,000+"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Expiry Date*</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="mm/dd/yyyy"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                        />
                                        <MdDateRange className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <MdCloudUpload size={24} />
                                </div>
                                <h4 className="text-[14px] font-bold text-[#1e293b]">Click to upload or drag and drop</h4>
                                <p className="text-[12px] text-gray-400 font-medium mt-1">PDF, JPG or PNG (max. 10MB)</p>
                            </div>
                        </div>

                        {/* 3. Operator Licence Block (Error state) */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2f6b8f] flex items-center justify-center">
                                        <MdCreditCard size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-bold text-[#1e293b]">Operator Licence Proof*</h3>
                                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">Currently Editing</p>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold tracking-wide uppercase">
                                    Incomplete
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Licence Number*</label>
                                    <input
                                        type="text"
                                        placeholder="Enter licence ID"
                                        className="w-full px-4 py-2.5 bg-red-50/10 border border-red-500 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    />
                                    <p className="text-[11px] font-bold text-red-500 mt-1">This field is required</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Issuing Authority*</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TfL / Local Council"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons Mobile Config (Or Desktop aligned appropriately) */}
                        <div className="flex items-center justify-between pt-4 pb-10">
                            <button 
                                onClick={() => navigate('/admin/register/review')}
                                className="px-6 py-3 bg-[#3B82F6] text-white rounded-xl text-[14px] font-bold hover:bg-blue-600 transition-all shadow-sm" 
                                style={{ backgroundColor: '#2f6b8f' }}
                            >
                                Submit to next Step
                            </button>
                        </div>
                    </div>

                    {/* ── Right Column: Optional Documents ── */}
                    <div className="w-full lg:w-[360px] shrink-0">
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
                            <div className="flex items-center gap-2 mb-6 text-[#1e293b]">
                                <MdAttachFile size={20} />
                                <h3 className="text-[15px] font-bold">Optional Documents</h3>
                            </div>

                            <div className="space-y-3">
                                {/* Optional block 1 */}
                                <div className="border border-gray-200 rounded-2xl p-4 flex items-start gap-4 hover:border-blue-300 transition-colors group cursor-pointer">
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Vat Certificate</h4>
                                        <p className="text-[13px] text-gray-400">Proof of HMRC registration for tax-exempt services.</p>
                                    </div>
                                    <button className="text-gray-400 group-hover:text-[#2f6b8f] transition-colors p-1">
                                        <MdAdd size={20} />
                                    </button>
                                </div>

                                {/* Optional block 2 */}
                                <div className="border border-gray-200 rounded-2xl p-4 flex items-start gap-4 hover:border-blue-300 transition-colors group cursor-pointer">
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Primary Admin ID</h4>
                                        <p className="text-[13px] text-gray-400">Passport or Driving Licence for primary account verification.</p>
                                    </div>
                                    <button className="text-gray-400 group-hover:text-[#2f6b8f] transition-colors p-1">
                                        <MdAdd size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceDocs;
