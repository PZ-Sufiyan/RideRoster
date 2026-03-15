import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdChevronRight,
    MdLockOutline,
    MdCheckCircle,
    MdCancel,
    MdInfo,
    MdOutlineSave,
    MdUploadFile,
    MdClose,
    MdCheck
} from 'react-icons/md';

const ReviewPage = () => {
    const navigate = useNavigate();

    // Reusable vertical stepper component
    const VerticalStepper = ({ currentStep }) => (
        <div className="w-full lg:w-[280px] shrink-0 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
            <div className="relative pl-6 space-y-6">
                {/* Connecting Line */}
                <div className="absolute top-2 bottom-6 left-[11px] w-0.5 bg-gray-100 z-0"></div>

                {/* Step 1 */}
                <div className="relative z-10 flex items-start gap-4 bg-white">
                    <div className="absolute -left-6 top-0 bg-white text-green-500 rounded-full">
                        {currentStep > 1 ? (
                            <MdCheckCircle size={22} className="bg-white rounded-full" />
                        ) : currentStep === 1 ? (
                            <div className="w-[22px] h-[22px] rounded-full text-[#2f6b8f] border-2 border-[#2f6b8f] flex items-center justify-center text-[10px] bg-blue-50">1</div>
                        ) : (
                            <div className="w-[22px] h-[22px] rounded-full text-gray-300 border-2 border-gray-200 flex items-center justify-center text-[10px] bg-white">1</div>
                        )}
                    </div>
                    <div className="pl-1">
                        <h4 className={`text-[13px] font-bold mb-0.5 ${currentStep > 1 ? 'text-green-500' : currentStep === 1 ? 'text-[#2f6b8f]' : 'text-gray-400'}`}>Basic Info</h4>
                        <p className={`text-[11px] font-medium tracking-wide ${currentStep === 1 ? 'text-[#2f6b8f]/70' : 'text-gray-400'}`}>Company Details</p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex items-start gap-4 bg-white">
                    <div className="absolute -left-6 top-0 bg-white text-green-500 rounded-full">
                        {currentStep > 2 ? (
                            <MdCheckCircle size={22} className="bg-white rounded-full" />
                        ) : currentStep === 2 ? (
                            <div className="w-[22px] h-[22px] rounded-full text-[#2f6b8f] border-2 border-[#2f6b8f] flex items-center justify-center text-[10px] bg-blue-50">2</div>
                        ) : (
                            <div className="w-[22px] h-[22px] rounded-full text-gray-300 border-2 border-gray-200 flex items-center justify-center text-[10px] bg-white">2</div>
                        )}
                    </div>
                    <div className="pl-1">
                        <h4 className={`text-[13px] font-bold mb-0.5 ${currentStep > 2 ? 'text-green-500' : currentStep === 2 ? 'text-[#2f6b8f]' : 'text-gray-400'}`}>Compliance</h4>
                        <p className={`text-[11px] font-medium tracking-wide ${currentStep === 2 ? 'text-[#2f6b8f]/70' : 'text-gray-400'}`}>Documents & Verification</p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex items-start gap-4 bg-white">
                    <div className="absolute -left-6 top-0 bg-white text-green-500 rounded-full">
                        {currentStep > 3 ? (
                            <MdCheckCircle size={22} className="bg-white rounded-full" />
                        ) : currentStep === 3 ? (
                            <div className="w-[22px] h-[22px] rounded-full text-[#2f6b8f] border-2 border-[#2f6b8f] flex items-center justify-center text-[10px] bg-blue-50">3</div>
                        ) : (
                            <div className="w-[22px] h-[22px] rounded-full text-gray-300 border-2 border-gray-200 flex items-center justify-center text-[10px] bg-white">3</div>
                        )}
                    </div>
                    <div className="pl-1">
                        <h4 className={`text-[13px] font-bold mb-0.5 ${currentStep > 3 ? 'text-green-500' : currentStep === 3 ? 'text-[#2f6b8f]' : 'text-gray-400'}`}>Additional Info</h4>
                        <p className={`text-[11px] font-medium tracking-wide ${currentStep === 3 ? 'text-[#2f6b8f]/70' : 'text-gray-400'}`}>Specialist Services</p>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="relative z-10 flex items-start gap-4 bg-white">
                    <div className="absolute -left-6 top-0 bg-white rounded-full">
                        {currentStep === 4 ? (
                            <div className="w-[22px] h-[22px] rounded-full text-[#2f6b8f] border-2 border-[#2f6b8f] flex items-center justify-center text-[10px] bg-blue-50">4</div>
                        ) : (
                            <div className="w-[22px] h-[22px] rounded-full text-gray-300 border-2 border-gray-200 flex items-center justify-center text-[10px] bg-white">4</div>
                        )}
                    </div>
                    <div className="pl-1">
                        <h4 className={`text-[13px] font-bold mb-0.5 ${currentStep === 4 ? 'text-[#2f6b8f]' : 'text-gray-400'}`}>Review & Submit</h4>
                        <p className={`text-[11px] font-medium tracking-wide ${currentStep === 4 ? 'text-[#2f6b8f]/70' : 'text-gray-400'}`}>Final Confirmation</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-gray-900">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight tracking-tight">New Tenant Registration</h1>
                        <p className="text-[15px] text-gray-500 mt-1 font-medium">Onboard a new transport company to the RideRoster ecosystem.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-6 py-2.5 bg-[#45818e] text-white rounded-xl text-[14px] font-bold hover:bg-[#34626c] transition-all shadow-sm">
                            Submit for Review
                        </button>
                    </div>
                </div>

                {/* ── Horizontal Stepper ── */}
                <div className="flex items-center border border-gray-200 rounded-full bg-white shadow-sm overflow-hidden text-center h-14">
                    <div className="flex-1 flex items-center justify-center h-full gap-2 opacity-60">
                        <div className="w-5 h-5 rounded-full bg-[#45818e] flex items-center justify-center text-[11px] font-bold text-white">1</div>
                        <span className="text-[13px] font-bold text-gray-500">Basic Info</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center h-full gap-2 opacity-60">
                        <div className="w-5 h-5 rounded-full bg-[#45818e] flex items-center justify-center text-[11px] font-bold text-white">2</div>
                        <span className="text-[13px] font-bold text-gray-500">Contact & Address</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center h-full gap-2 opacity-60">
                        <div className="w-5 h-5 rounded-full bg-[#45818e] flex items-center justify-center text-[11px] font-bold text-white">3</div>
                        <span className="text-[13px] font-bold text-gray-500">Admin & Scale</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center h-full gap-2 opacity-60">
                        <div className="w-5 h-5 rounded-full bg-[#45818e] flex items-center justify-center text-[11px] font-bold text-white">4</div>
                        <span className="text-[13px] font-bold text-gray-500">Compliance</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center h-full gap-2 border-b-2 border-[#45818e]">
                        <div className="w-5 h-5 rounded-full bg-[#45818e] flex items-center justify-center text-[11px] font-bold text-white">5</div>
                        <span className="text-[13px] font-bold text-[#45818e]">Review</span>
                    </div>
                </div>

                {/* ── Sub Header ── */}
                <div className="mt-8 mb-4">
                    <h2 className="text-[20px] font-bold text-[#1e293b] tracking-tight">Company Registration Request</h2>
                </div>

                {/* ======================= STACKED FORMS (Review Presentation) ======================= */}
                <div className="space-y-12">

                    {/* --- STEP 1: Company Details --- */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <VerticalStepper currentStep={1} />
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#1e293b] flex items-center gap-2 mb-6">
                                <span className="w-4 h-4 bg-[#2f6b8f]/10 text-[#2f6b8f] rounded flex items-center justify-center"><MdLockOutline size={12} /></span>
                                Basic Business Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#1e293b]">Registered Company Name *</label>
                                    <input type="text" defaultValue="e.g. Swift Logistics Ltd" readOnly className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#1e293b]">Trading Name (if different)</label>
                                    <input type="text" defaultValue="e.g. Swift Transport" readOnly className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#1e293b]">Company Registration Number *</label>
                                    <input type="text" defaultValue="8-digit CRN" readOnly className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#1e293b]">VAT Number</label>
                                    <input type="text" defaultValue="GB 123 4567 89" readOnly className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-500" />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 mb-6"></div>

                            <h3 className="text-[15px] font-bold text-[#1e293b] flex items-center gap-2 mb-6">
                                <span className="w-4 h-4 bg-[#2f6b8f]/10 text-[#2f6b8f] rounded flex items-center justify-center"><MdLockOutline size={12} /></span>
                                Primary Admin Contact
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#1e293b]">Full Name *</label>
                                    <input type="text" defaultValue="John Doe" readOnly className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-bold text-[#1e293b]">Work Email Address *</label>
                                    <input type="text" defaultValue="john.doe@company.com" readOnly className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-500" />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* --- STEP 2: Compliance --- */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <VerticalStepper currentStep={2} />
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#1e293b] mb-1">Compliance Documents</h3>
                            <p className="text-[12px] text-gray-500 mb-6">Upload required legal documents for verification. All files must be in PDF, JPG, or PNG format.</p>

                            <div className="space-y-4">
                                {/* Operator License (Pending) */}
                                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                                            <MdUploadFile size={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-[#1e293b]">Operator License <span className="text-red-500">*</span></h4>
                                            <p className="text-[11px] text-gray-400">Valid transport operator licence</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-amber-500 text-[11px] font-bold leading-tight text-right">
                                            Pending<br />Upload
                                        </div>
                                        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-bold">
                                            Upload
                                        </button>
                                    </div>
                                </div>

                                {/* Public Liability Insurance (Uploaded) */}
                                <div className="border border-green-200 bg-green-50/50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm">
                                            <MdLockOutline size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-[#1e293b]">Public Liability Insurance <span className="text-red-500">*</span></h4>
                                            <p className="text-[11px] text-gray-500">insurance_2024.pdf (2.4 MB)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-green-500 text-[12px] font-bold flex items-center gap-1">
                                            <MdCheckCircle size={14} /> Uploaded
                                        </span>
                                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                                            <MdClose size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- STEP 3: Additional Info --- */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <VerticalStepper currentStep={3} />
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#1e293b] mb-6">Specialist Services Offered</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 flex items-start gap-3">
                                    <div className="mt-0.5 w-4 h-4 rounded bg-[#2f6b8f] text-white flex items-center justify-center text-[10px]">
                                        <MdCheck />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-bold text-[#1e293b]">Wheelchair Accessible (WAV)</h4>
                                        <p className="text-[11px] text-gray-500">Vehicles equipped for disabled access</p>
                                    </div>
                                </div>
                                <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 flex items-start gap-3">
                                    <div className="mt-0.5 w-4 h-4 rounded bg-[#2f6b8f] text-white flex items-center justify-center text-[10px]">
                                        <MdCheck />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-bold text-[#1e293b]">SEND Transport</h4>
                                        <p className="text-[11px] text-gray-500">Special Educational Needs & Escortry</p>
                                    </div>
                                </div>
                                <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 flex items-start gap-3">
                                    <div className="mt-0.5 w-4 h-4 rounded bg-[#2f6b8f] text-white flex items-center justify-center text-[10px]">
                                        <MdCheck />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-bold text-[#1e293b]">School Contracts</h4>
                                        <p className="text-[11px] text-gray-500">Regular home-to-school transport</p>
                                    </div>
                                </div>
                                <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 flex items-start gap-3">
                                    <div className="mt-0.5 w-4 h-4 rounded bg-[#2f6b8f] text-white flex items-center justify-center text-[10px]">
                                        <MdCheck />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-bold text-[#1e293b]">General Private Hire</h4>
                                        <p className="text-[11px] text-gray-500">Standard A-to-B bookings</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 space-y-2">
                                <label className="block text-[13px] font-bold text-[#1e293b]">Council Areas Served</label>
                                <div className="flex gap-2 mb-2">
                                    <span className="px-3 py-1 bg-blue-100/50 text-blue-700 text-[12px] font-bold rounded flex items-center gap-1 border border-blue-200"><MdClose size={12} /> Derby</span>
                                    <span className="px-3 py-1 bg-blue-100/50 text-blue-700 text-[12px] font-bold rounded flex items-center gap-1 border border-blue-200"><MdClose size={12} /> Nottingham</span>
                                    <span className="px-3 py-1 bg-blue-100/50 text-blue-700 text-[12px] font-bold rounded flex items-center gap-1 border border-blue-200"><MdClose size={12} /> Leicester</span>
                                </div>
                                <input type="text" placeholder="Type council name and press Enter..." className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px]" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[13px] font-bold text-[#1e293b]">Additional Notes</label>
                                <textarea className="w-full h-24 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] resize-none"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* --- STEP 4: Review & Submit --- */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <VerticalStepper currentStep={4} />
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">

                            <h2 className="text-[16px] font-bold text-[#1e293b] mb-6">Review Registration Request</h2>

                            <div className="w-full">
                                {/* Row 1: Company Info */}
                                <div className="flex flex-col md:flex-row py-5 border-t border-gray-100 gap-4">
                                    <div className="w-[140px] shrink-0">
                                        <h3 className="text-[12px] font-bold text-gray-500">Company Info</h3>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-y-6 gap-x-4">
                                        <div>
                                            <p className="text-[11px] text-gray-400 font-bold mb-1">Company Name</p>
                                            <p className="text-[13px] font-bold text-[#1e293b]">Swift Logistics Ltd</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400 font-bold mb-1">Registration No</p>
                                            <p className="text-[13px] font-bold text-[#1e293b]">12345678</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400 font-bold mb-1">Primary Admin</p>
                                            <p className="text-[13px] font-bold text-[#1e293b]">John Doe</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400 font-bold mb-1">Email</p>
                                            <p className="text-[13px] font-bold text-[#1e293b]">john.doe@company.com</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Compliance Status */}
                                <div className="flex flex-col md:flex-row py-5 border-t border-gray-100 gap-4">
                                    <div className="w-[140px] shrink-0">
                                        <h3 className="text-[12px] font-bold text-gray-500">Compliance Status</h3>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MdCheckCircle className="text-green-500" size={16} />
                                                <span className="text-[13px] font-bold text-[#1e293b]">Public Liability Insurance</span>
                                            </div>
                                            <span className="text-[11px] text-gray-400">Uploaded</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MdCancel className="text-red-500" size={16} />
                                                <span className="text-[13px] font-bold text-[#1e293b]">Operator License</span>
                                            </div>
                                            <span className="text-[11px] text-red-500 font-bold">Missing</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Blue Info Alert */}
                            <div className="mt-4 p-4 bg-blue-50/60 rounded-xl flex items-start gap-2 border border-blue-100">
                                <MdInfo size={16} className="text-[#45818e] shrink-0 mt-0.5" />
                                <p className="text-[12px] text-[#45818e] font-bold leading-relaxed">
                                    Important: All required documents must be uploaded before submission. Once submitted, the Admin will review your request within 24-48 hours.
                                </p>
                            </div>

                            {/* Footer Buttons Outlined Grid (From Screenshot) */}
                            <div className="flex justify-end items-center mt-8 pt-4 border-t border-gray-100">
                                <button
                                    className="px-5 py-2 text-white rounded-lg text-[13px] font-bold hover:brightness-110 transition-all shadow-sm"
                                    style={{ backgroundColor: '#45818e' }}
                                >
                                    Submit to Approval
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReviewPage;
