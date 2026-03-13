import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, 
    MdCheck, 
    MdEvent, 
    MdAccessTime, 
    MdOutlineToggleOff, 
    MdOutlineToggleOn
} from 'react-icons/md';

const AddNewJobStep3 = () => {
    const navigate = useNavigate();
    const [isRecurring, setIsRecurring] = useState(false);

    const handleBack = () => {
        navigate('/admin/jobs/create-step2');
    };

    const handleFinish = () => {
        // Final submission logic would go here
        navigate('/admin/jobs');
    };

    return (
        <div className="max-w-[1280px] mx-auto pb-32">
            {/* --- Header Section --- */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <MdArrowBack size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Create a New Job</h1>
                </div>
            </div>

            {/* --- Stepper Section --- */}
            <div className="relative mb-12 px-10">
                <div className="flex items-center justify-between relative z-10">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#004D6D] flex items-center justify-center text-white ring-4 ring-[#004D6D]/10">
                            <MdCheck size={20} />
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Route Info</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#004D6D] flex items-center justify-center text-white ring-4 ring-[#004D6D]/10">
                            <MdCheck size={20} />
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Pickups & Drop-offs</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">
                            3
                        </div>
                        <div className="text-center">
                            <span className="block text-[13px] font-bold text-[#004D6D]">Timings & Compensation</span>
                            <span className="block text-[11px] text-gray-400 font-medium">Set schedule and pay rates</span>
                        </div>
                    </div>
                </div>

                {/* Connecting Lines */}
                <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 -z-0">
                    <div className="h-full bg-[#004D6D] w-full"></div>
                </div>
            </div>

            {/* --- Main Content Card --- */}
            <div className="max-w-[900px] mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                
                {/* Job Timings Section */}
                <div className="p-8 border-b border-gray-50">
                    <div className="mb-8">
                        <h2 className="text-[18px] font-bold text-gray-900">Job Timings</h2>
                        <p className="text-[14px] text-gray-500 mt-1">Specify the date and time for this job.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Job Date */}
                        <div className="md:col-span-1 space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Job Date*</label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    defaultValue="2025-12-05"
                                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                                <MdEvent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Pickup Time */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Pickup Time*</label>
                            <div className="relative">
                                <input 
                                    type="time" 
                                    defaultValue="08:30"
                                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                            </div>
                        </div>

                        {/* Est. Drop-off */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Est. Drop-off</label>
                            <div className="relative">
                                <input 
                                    type="time" 
                                    defaultValue="09:15"
                                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                                <MdAccessTime className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recurring Job Section */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-gray-900">Recurring Job</h2>
                        <p className="text-[14px] text-gray-500 mt-1">Set this job to repeat on a schedule.</p>
                    </div>
                    <button 
                        onClick={() => setIsRecurring(!isRecurring)}
                        className="transition-all active:scale-95"
                    >
                        {isRecurring ? (
                            <MdOutlineToggleOn size={48} className="text-[#004D6D]" />
                        ) : (
                            <MdOutlineToggleOff size={48} className="text-gray-300" />
                        )}
                    </button>
                </div>

                {/* Compensation Section */}
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-[18px] font-bold text-gray-900">Compensation</h2>
                        <p className="text-[14px] text-gray-500 mt-1">Enter the payment details for the staff.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Driver Pay */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Driver Pay (Flat Rate)*</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                <input 
                                    type="text" 
                                    placeholder="e.g., 50.00"
                                    className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                            </div>
                        </div>

                        {/* Passenger Assistant Pay */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Passenger Assistant Pay (Flat Rate)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                <input 
                                    type="text" 
                                    placeholder="e.g., 40.00"
                                    className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-50">
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <MdArrowBack size={20} />
                        Back
                    </button>
                    <button 
                        onClick={handleFinish}
                        className="px-10 py-3 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg active:scale-95"
                    >
                        Finish & Create Job
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddNewJobStep3;
