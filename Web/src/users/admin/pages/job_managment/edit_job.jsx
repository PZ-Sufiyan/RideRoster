import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCheck,
    MdAdd,
    MdDeleteOutline,
    MdLocationOn,
    MdKeyboardArrowDown,
    MdWarning
} from 'react-icons/md';

const EditJob = () => {
    const navigate = useNavigate();
    const [showCancelModal, setShowCancelModal] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                   <h1 className="text-[24px] font-bold text-gray-900">Edit Job #J12345</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-bold transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-sm">
                        <MdCheck size={20} />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Left Column: Form Sections ── */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Route Information */}
                    <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
                        <h2 className="text-[18px] font-bold text-gray-900 pb-4 border-b border-gray-100 mb-6">Route Information</h2>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Job Title</label>
                                <input
                                    type="text"
                                    defaultValue="Morning Route - Northwood Elementary"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-900 mb-2">Primary Pickup Address</label>
                                    <input
                                        type="text"
                                        defaultValue="123 Main Street, Anytown, USA"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-900 mb-2">Primary Drop-off Address</label>
                                    <input
                                        type="text"
                                        defaultValue="456 Oak Avenue, Anytown, USA"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Internal Notes (Optional)</label>
                                <textarea
                                    defaultValue="Route may have delays due to construction on Elm St."
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stops & Passengers */}
                    <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                            <h2 className="text-[18px] font-bold text-gray-900">Stops & Passengers</h2>
                            <button className="flex items-center gap-1.5 px-4 py-2 border border-blue-100 text-[#004D6D] bg-[#F4F9FF] rounded-lg text-[13px] font-bold hover:bg-blue-50 transition-all">
                                <MdAdd size={18} />
                                Add Stop
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {/* Stop 1 */}
                            <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MdLocationOn className="text-[#004D6D]" size={20} />
                                    <span className="text-[14px] font-bold text-gray-900">Stop 1: 789 Pine Lane</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[13px] font-medium text-gray-500">2 Passengers</span>
                                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                                        <MdDeleteOutline size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Stop 2 */}
                            <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MdLocationOn className="text-[#004D6D]" size={20} />
                                    <span className="text-[14px] font-bold text-gray-900">Stop 2: 101 Maple Drive</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[13px] font-medium text-gray-500">1 Passenger</span>
                                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                                        <MdDeleteOutline size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timing & Compensation */}
                    <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
                        <h2 className="text-[18px] font-bold text-gray-900 pb-4 border-b border-gray-100 mb-6">Timing & Compensation</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Job Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        defaultValue="2025-11-20"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Job Type</label>
                                <div className="relative">
                                    <select
                                        defaultValue="Recurring"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all appearance-none"
                                    >
                                        <option>One-time</option>
                                        <option>Recurring</option>
                                    </select>
                                    <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Scheduled Start Time</label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        defaultValue="07:30"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Scheduled End Time</label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        defaultValue="09:00"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">Driver Compensation ($)</label>
                                <input
                                    type="number"
                                    defaultValue="75.00"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-2">PA Compensation ($)</label>
                                <input
                                    type="number"
                                    defaultValue="50.00"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Assignments ── */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-6">
                        <h2 className="text-[18px] font-bold text-gray-900 pb-4 border-b border-gray-100 mb-6">Assignments</h2>
                        
                        <div className="space-y-6">
                            {/* Assigned Driver */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-3">Assigned Driver</label>
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <img src="https://i.pravatar.cc/150?u=james" className="w-[38px] h-[38px] rounded-full object-cover border border-gray-100" alt="James Rodriguez"/>
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900 leading-tight">James Rodriguez</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">On Time: 98%</p>
                                        </div>
                                    </div>
                                    <button className="text-[12px] font-bold text-[#004D6D] hover:underline px-2">Change</button>
                                </div>
                            </div>

                            {/* Assigned PA */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-3">Assigned Passenger Assistant</label>
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <img src="https://i.pravatar.cc/150?u=maria" className="w-[38px] h-[38px] rounded-full object-cover border border-gray-100" alt="Maria Garcia"/>
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900 leading-tight">Maria Garcia</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Rating: 4.9/5</p>
                                        </div>
                                    </div>
                                    <button className="text-[12px] font-bold text-[#004D6D] hover:underline px-2">Change</button>
                                </div>
                            </div>

                            {/* Assigned Vehicle */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-3">Assigned Vehicle</label>
                                <div className="relative">
                                    <select
                                        defaultValue="Bus #101"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all appearance-none"
                                    >
                                        <option value="Bus #101">Bus #101 - Ford Transit</option>
                                        <option value="Van #202">Van #202 - Mercedes Sprinter</option>
                                    </select>
                                    <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                                </div>
                            </div>
                            
                            <hr className="border-gray-100" />

                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl text-[14px] font-bold hover:bg-red-100 transition-colors border border-red-100"
                            >
                                <MdDeleteOutline size={18} />
                                Cancel Job
                            </button>
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
                            Are you sure you want to cancel Job #J-58291? This action cannot be undone.
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

export default EditJob;
