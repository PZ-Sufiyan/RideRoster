import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, 
    MdCheck, 
    MdKeyboardArrowDown, 
    MdAdd, 
    MdRemove, 
    MdGpsFixed,
    MdTrendingFlat
} from 'react-icons/md';

const AddNewJobStep1 = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        jobName: '',
        jobType: 'Regular Contract',
        clientName: '',
        internalId: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        navigate('/admin/jobs/create-step2');
    };

    const handleCancel = () => {
        navigate('/admin/jobs');
    };

    return (
        <div className="max-w-[1280px] mx-auto pb-20">
            {/* --- Header Section --- */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={handleCancel}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <MdArrowBack size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Create a New Job</h1>
                    <p className="text-[14px] text-gray-500">Step 1 of 3: Route Information</p>
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
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-white flex items-center justify-center text-[#004D6D] font-bold">
                            2
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Pickups & Drop-offs</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-400 font-bold">
                            3
                        </div>
                        <span className="text-[13px] font-medium text-gray-400">Schedule & Pay</span>
                    </div>
                </div>

                {/* Connecting Lines */}
                <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 -z-0">
                    <div className="h-full bg-[#004D6D] w-1/2"></div>
                </div>
            </div>

            {/* --- Main Content Layout --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* --- Left Column: Route Details Card --- */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 h-full">
                    <div className="mb-8">
                        <h2 className="text-[18px] font-bold text-gray-900">Route Details</h2>
                        <p className="text-[14px] text-gray-500 mt-1">Start by defining the basic information for this job.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Job Name */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Job Name / Route Title <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                name="jobName"
                                value={formData.jobName}
                                onChange={handleChange}
                                placeholder="e.g., Morning School Run - Route A"
                                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/20 focus:border-[#004D6D] transition-all"
                            />
                        </div>

                        {/* Job Type */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Job Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select 
                                    name="jobType"
                                    value={formData.jobType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/20 focus:border-[#004D6D] transition-all cursor-pointer"
                                >
                                    <option>Regular Contract</option>
                                    <option>One-off Trip</option>
                                    <option>Emergency Shuttle</option>
                                </select>
                                <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Client / School Name */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Client / School Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                placeholder="e.g., Northwood High School"
                                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/20 focus:border-[#004D6D] transition-all"
                            />
                        </div>

                        {/* Internal Job ID */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Internal Job ID (Optional)
                            </label>
                            <input 
                                type="text"
                                name="internalId"
                                value={formData.internalId}
                                onChange={handleChange}
                                placeholder="e.g., NHS-MORN-001"
                                className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/20 focus:border-[#004D6D] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Map Preview --- */}
                <div className="relative rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[500px] lg:h-full min-h-[500px]">
                    {/* Placeholder for Map - Using a styled div to mimic map appearance */}
                    <div 
                        className="absolute inset-0 bg-[#E5E7EB]"
                        style={{
                            backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,1,0/1280x1280?access_token=pk.eyJ1IjoibGFicmFkb3I5OSIsImEiOiJjbGlxa3R3Y2UwMDNjM2RwYmFqbXZ3ZTh1In0.dGstfI9h-mRj-v_T6YjTaw')`, // Static map placeholder
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {/* Map Overlay Pins */}
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]">
                            {/* Mimicking the pins from screenshot */}
                            {[
                                { top: '30%', left: '45%' },
                                { top: '35%', left: '48%' },
                                { top: '40%', left: '42%' },
                                { top: '45%', left: '55%' },
                                { top: '50%', left: '40%' },
                                { top: '55%', left: '50%' },
                                { top: '60%', left: '45%' },
                                { top: '38%', left: '52%' },
                                { top: '32%', left: '38%' },
                                { top: '42%', left: '40%' },
                                { top: '28%', left: '58%' },
                                { top: '52%', left: '62%' },
                                { top: '48%', left: '35%' },
                            ].map((pin, i) => (
                                <div 
                                    key={i} 
                                    className="absolute transform -translate-x-1/2 -translate-y-full"
                                    style={{ top: pin.top, left: pin.left }}
                                >
                                    <div className="relative group cursor-pointer transition-transform hover:scale-110">
                                        <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Controls */}
                    <div className="absolute right-4 bottom-4 flex flex-col gap-2">
                        <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600 transition-all active:scale-95">
                            <MdAdd size={20} />
                        </button>
                        <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600 transition-all active:scale-95">
                            <MdGpsFixed size={20} />
                        </button>
                        <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-600 transition-all active:scale-95">
                            <MdRemove size={20} />
                        </button>
                    </div>
                </div>

            </div>

            {/* --- Sticky Bottom Action Bar --- */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button 
                    onClick={handleCancel}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    Cancel
                </button>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-2.5 border border-[#004D6D] text-[#004D6D] rounded-xl text-[14px] font-bold hover:bg-blue-50 transition-all active:scale-95">
                        Save as Draft
                    </button>
                    <button 
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95 px-8"
                    >
                        Next: Pickups & Drop-offs
                        <MdTrendingFlat size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewJobStep1;
