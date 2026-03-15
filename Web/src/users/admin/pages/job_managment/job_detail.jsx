import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowBack,
    MdBlock,
    MdEdit,
    MdCheck,
    MdLocationOn,
    MdEmojiPeople,
    MdDirectionsCar,
    MdPerson,
    MdWarning
} from 'react-icons/md';

const JobDetail = () => {
    const navigate = useNavigate();
    const [showCancelModal, setShowCancelModal] = useState(false);

    return (
        <div className="space-y-6">
            {/* ── Back Button ── */}
            <button
                onClick={() => navigate('/admin/jobs')}
                className="flex items-center text-[14px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
                <MdArrowBack size={18} className="mr-2" />
                Back to Jobs
            </button>

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-[24px] font-bold text-gray-900">Job ID: #JR-84361</h1>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[12px] font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            In Progress
                        </span>
                    </div>
                    <p className="text-[14px] text-gray-500 mt-1 font-medium">Scheduled for: Nov 18, 2025 at 08:30 AM</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowCancelModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg bg-white hover:bg-red-50 text-[13px] font-bold transition-all"
                    >
                        <MdBlock size={18} />
                        Cancel Job
                    </button>
                    <button 
                        onClick={() => navigate('/admin/jobs/JR-84361/edit')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg bg-white hover:bg-gray-50 text-[13px] font-bold transition-all"
                    >
                        <MdEdit size={18} />
                        Edit Job
                    </button>
                </div>
            </div>

            {/* ── Main Content Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Left Column: Timeline ── */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
                        <h2 className="text-[18px] font-bold text-gray-900 mb-8">Job Progress Timeline</h2>
                        
                        <div className="relative pl-1">
                            {/* Vertical line connecting timeline items */}
                            <div className="absolute left-[19px] top-2 bottom-8 w-[2px] bg-gray-100"></div>
                            
                            <div className="space-y-8">
                                {/* Step 1: Job Completed */}
                                <div className="flex items-start gap-4 relative">
                                    <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border-[3px] border-white ring-1 ring-gray-100 shadow-sm z-10 mt-0.5">
                                        <MdCheck size={18} />
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="text-[15px] font-bold text-gray-900 leading-none">Job Completed</h3>
                                        <p className="text-[12px] text-gray-400 font-medium mt-1.5">Nov 18, 2025, 09:45 AM</p>
                                        <p className="text-[13px] text-gray-500 mt-2 font-medium">Passenger dropped off successfully.</p>
                                    </div>
                                </div>
                                
                                {/* Step 2: Arrived at Drop-off */}
                                <div className="flex items-start gap-4 relative">
                                    <div className="w-9 h-9 rounded-full bg-[#004D6D] text-white flex items-center justify-center shrink-0 border-[3px] border-white ring-1 ring-gray-100 shadow-sm z-10 mt-0.5">
                                        <MdLocationOn size={18} />
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="text-[15px] font-bold text-gray-900 leading-none">Arrived at Drop-off</h3>
                                        <p className="text-[12px] text-gray-400 font-medium mt-1.5">Nov 18, 2025, 09:42 AM</p>
                                        <p className="text-[13px] text-gray-500 mt-2 font-medium">123 Main Street, Anytown, USA 12345</p>
                                    </div>
                                </div>
                                
                                {/* Step 3: Passenger Onboard */}
                                <div className="flex items-start gap-4 relative">
                                    <div className="w-9 h-9 rounded-full bg-[#F4F9FF] text-[#004D6D] flex items-center justify-center shrink-0 border-[3px] border-white ring-1 ring-gray-100 shadow-sm z-10 mt-0.5">
                                        <MdEmojiPeople size={18} />
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="text-[15px] font-bold text-gray-900 leading-none">Passenger Onboard</h3>
                                        <p className="text-[12px] text-gray-400 font-medium mt-1.5">Nov 18, 2025, 08:55 AM</p>
                                        <p className="text-[13px] text-gray-500 mt-2 font-medium">Jane Doe is now in the vehicle.</p>
                                    </div>
                                </div>
                                
                                {/* Step 4: Arrived at Pickup */}
                                <div className="flex items-start gap-4 relative">
                                    <div className="w-9 h-9 rounded-full bg-[#F4F9FF] text-[#004D6D] flex items-center justify-center shrink-0 border-[3px] border-white ring-1 ring-gray-100 shadow-sm z-10 mt-0.5">
                                        <MdLocationOn size={18} />
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="text-[15px] font-bold text-gray-900 leading-none">Arrived at Pickup</h3>
                                        <p className="text-[12px] text-gray-400 font-medium mt-1.5">Nov 18, 2025, 08:50 AM</p>
                                        <p className="text-[13px] text-gray-500 mt-2 font-medium">456 Oak Avenue, Anytown, USA 12345</p>
                                    </div>
                                </div>
                                
                                {/* Step 5: En Route to Pickup */}
                                <div className="flex items-start gap-4 relative">
                                    <div className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 border-[3px] border-white ring-1 ring-gray-100 shadow-sm z-10 mt-0.5">
                                        <MdDirectionsCar size={18} />
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="text-[15px] font-bold text-gray-500 leading-none">En Route to Pickup</h3>
                                        <p className="text-[12px] text-gray-400 font-medium mt-1.5">Nov 18, 2025, 08:35 AM</p>
                                    </div>
                                </div>
                                
                                {/* Step 6: Driver Assigned */}
                                <div className="flex items-start gap-4 relative">
                                    <div className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 border-[3px] border-white ring-1 ring-gray-100 shadow-sm z-10 mt-0.5">
                                        <MdPerson size={18} />
                                    </div>
                                    <div className="pt-1.5">
                                        <h3 className="text-[15px] font-bold text-gray-500 leading-none">Driver Assigned</h3>
                                        <p className="text-[12px] text-gray-400 font-medium mt-1.5">Nov 17, 2025, 04:30 PM</p>
                                        <p className="text-[13px] text-gray-500 mt-2 font-medium">Robert Fox assigned to this job.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Info Cards ── */}
                <div className="space-y-6">
                    {/* Map & Locations */}
                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
                        {/* Map Image Placeholder */}
                        <div className="h-48 bg-[#E5E7EB] relative overflow-hidden flex items-center justify-center">
                            {/* Abstract map elements to simulate the UI */}
                            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 400 200" preserveAspectRatio="none">
                                {/* Streets */}
                                <path d="M -50 150 L 150 120 L 250 80 L 450 20" stroke="white" strokeWidth="8" fill="none" />
                                <path d="M 50 -20 L 100 80 L 200 150 L 300 220" stroke="white" strokeWidth="6" fill="none" />
                                <path d="M 150 120 L 200 150" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" />
                                {/* Blue Route */}
                                <path d="M 120 150 C 150 150 180 130 200 110 C 230 80 280 90 310 50" stroke="#004D6D" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {/* Map Pins */}
                            <div className="absolute w-3 h-3 bg-[#004D6D] border-2 border-white rounded-full shadow-md" style={{ bottom: '45px', left: '115px' }}></div>
                            <MdLocationOn className="absolute text-orange-500 drop-shadow-md" style={{ bottom: '75px', left: '190px' }} size={24} />
                            <MdLocationOn className="absolute text-orange-500 drop-shadow-md" style={{ bottom: '95px', left: '265px' }} size={24} />
                            <MdLocationOn className="absolute text-orange-500 drop-shadow-md" style={{ top: '35px', left: '300px' }} size={24} />
                        </div>
                        
                        <div className="p-5 space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-4 h-4 rounded-full border-4 border-[#004D6D] bg-white mt-0.5 shrink-0 shadow-sm"></div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pickup</p>
                                    <p className="text-[13px] font-bold text-gray-900 mt-1">456 Oak Avenue, Anytown, USA</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MdLocationOn className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Drop-off</p>
                                    <p className="text-[13px] font-bold text-gray-900 mt-1">123 Main Street, Anytown, USA</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Driver */}
                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-5">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Assigned Driver</h2>
                        <div className="flex items-center gap-3">
                            <img src="https://i.pravatar.cc/150?img=11" className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="Robert Fox"/>
                            <div>
                                <p className="text-[14px] font-bold text-gray-900">Robert Fox</p>
                                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Ford Transit, ABC-123</p>
                            </div>
                        </div>
                    </div>

                    {/* Passenger Assistant */}
                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-5">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Passenger Assistant</h2>
                        <div className="flex items-center gap-3">
                            <img src="https://i.pravatar.cc/150?img=5" className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="Annette Black"/>
                            <div>
                                <p className="text-[14px] font-bold text-gray-900">Annette Black</p>
                                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Certified Assistant</p>
                            </div>
                        </div>
                    </div>

                    {/* Compensation */}
                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-5 border-t-4 border-t-green-500">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-5">Compensation</h2>
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <p className="text-[13px] text-gray-500 font-medium tracking-tight">Total Amount</p>
                                <p className="text-[14px] font-bold text-green-600">$45.50</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-[13px] text-gray-500 font-medium tracking-tight">Payment Status</p>
                                <p className="text-[13px] font-bold text-orange-500">Pending</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Cancel Job Modal ── */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}></div>
                    <div className="relative w-full max-w-[440px] bg-white rounded-[24px] shadow-2xl p-8 text-center overflow-hidden">
                        <div className="flex items-center justify-center mb-6">
                            <MdWarning className="text-red-500" size={28} />
                            <h2 className="text-[20px] font-bold text-gray-900 ml-2">Cancel Job Confirmation</h2>
                        </div>
                        <p className="text-[14px] text-gray-500 mb-6 font-medium">
                            Are you sure you want to cancel Job #JR-84361? This action cannot be undone.
                        </p>
                        <div className="text-left mb-8">
                            <label className="block text-[13px] font-bold text-gray-900 mb-2">Reason for Cancellation*</label>
                            <textarea
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] resize-none h-28"
                                placeholder="e.g., Client requested cancellation, vehicle maintenance..."
                            ></textarea>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-[14px] font-bold hover:bg-red-600 transition-colors shadow-sm"
                            >
                                Yes, Cancel Job
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors"
                            >
                                Keep Job
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetail;
