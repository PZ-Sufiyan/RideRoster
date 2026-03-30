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
import { ToastStack } from '../../../../utils/Toast';

const AddNewJobStep3 = () => {
    const navigate = useNavigate();
    const [isRecurring, setIsRecurring] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [formData, setFormData] = useState({
        jobDate: '2025-12-05',
        pickupTime: '08:30',
        estDropoff: '09:15',
        driverPay: '',
        passengerAssistantPay: '',
    });

    const handleBack = () => {
        navigate('/admin/jobs/create-step2');
    };

    const handleFinish = () => {
        setSubmitAttempted(true);
        if (!formData.jobDate || !formData.pickupTime || !formData.driverPay.trim()) {
            setToasts((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: 'warning',
                    message: 'Please fill in all required fields before creating the job.',
                    autoClose: true,
                    duration: 3500,
                },
            ]);
            return;
        }
        navigate('/admin/jobs');
    };

    return (
        <div className="max-w-[1280px] mx-auto pb-32">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />
            {/* --- Header Section --- */}
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 3 of 3: Schedule & Pay</h1>
                </div>
            </div>

         {/* --- Stepper Section --- */}
         <div className="relative mb-12 px-10">
            {/* Connecting Lines */}
            <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 z-0">
                    <div className="h-full bg-[#004D6D] w-full"></div>
                </div>
                <div className="flex items-center justify-between relative ">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#004D6D] flex items-center justify-center text-white ring-4 ring-[#004D6D]/10">
                            <MdCheck size={20} />
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Route Info</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">
                        <MdCheck size={20} />
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Pickups & Drop-offs</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">
                            3
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Schedule & Pay</span>
                    </div>
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
                            <label className="text-[13px] font-bold text-gray-700">Job Date <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.jobDate}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, jobDate: e.target.value }))}
                                    className={`w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 ${
                                        submitAttempted && !formData.jobDate
                                            ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                    }`}
                                />
                            </div>
                            {submitAttempted && !formData.jobDate && <p className="text-[12px] font-semibold text-red-600">Job Date is required.</p>}
                        </div>

                        {/* Pickup Time */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Pickup Time <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="time" 
                                    value={formData.pickupTime}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, pickupTime: e.target.value }))}
                                    className={`w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 ${
                                        submitAttempted && !formData.pickupTime
                                            ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                    }`}
                                />
                            </div>
                            {submitAttempted && !formData.pickupTime && <p className="text-[12px] font-semibold text-red-600">Pickup Time is required.</p>}
                        </div>

                        {/* Est. Drop-off */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Est. Drop-off <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="time" 
                                    value={formData.estDropoff}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, estDropoff: e.target.value }))}
                                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
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
                            <label className="text-[13px] font-bold text-gray-700">Driver Pay (Flat Rate) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                <input 
                                    type="text" 
                                    placeholder="e.g., 50.00"
                                    value={formData.driverPay}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, driverPay: e.target.value }))}
                                    className={`w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                        submitAttempted && !formData.driverPay.trim()
                                            ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                    }`}
                                />
                            </div>
                            {submitAttempted && !formData.driverPay.trim() && <p className="text-[12px] font-semibold text-red-600">Driver Pay is required.</p>}
                        </div>

                        {/* Passenger Assistant Pay */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Passenger Assistant Pay (Flat Rate) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                <input 
                                    type="text" 
                                    placeholder="e.g., 40.00"
                                    value={formData.passengerAssistantPay}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, passengerAssistantPay: e.target.value }))}
                                    className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- Sticky Bottom Action Bar --- */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button 
                    onClick={handleBack}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    Back
                </button>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleFinish}
                        className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95"
                    >
                        Finish & Create Job
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewJobStep3;
