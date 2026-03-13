import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, 
    MdCheck, 
    MdDeleteOutline, 
    MdAdd, 
    MdLocationOn, 
    MdDirectionsBus,
    MdTrendingFlat,
    MdOutlinePinDrop,
    MdKeyboardArrowDown
} from 'react-icons/md';

const AddNewJobStep2 = () => {
    const navigate = useNavigate();

    // State for Pickups and Drop-offs
    const [pickups, setPickups] = useState([{ id: 1 }]);
    const [dropoffs, setDropoffs] = useState([{ id: 1 }]);

    const addPickup = () => setPickups([...pickups, { id: Date.now() }]);
    const addDropoff = () => setDropoffs([...dropoffs, { id: Date.now() }]);

    const removePickup = (id) => setPickups(pickups.filter(p => p.id !== id));
    const removeDropoff = (id) => setDropoffs(dropoffs.filter(d => d.id !== id));

    const handleNext = () => {
        navigate('/admin/jobs/create-step3');
    };

    const handleBack = () => {
        navigate('/admin/jobs/create-step1');
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
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">
                            2
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Pickups & Drop-offs</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-400 font-bold">
                            3
                        </div>
                        <div className="text-center">
                            <span className="block text-[13px] font-bold text-gray-400">Timings & Compensation</span>
                            <span className="block text-[11px] text-gray-400 font-medium">Set schedule and pay rates</span>
                        </div>
                    </div>
                </div>

                {/* Connecting Lines */}
                <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 z-0">
                    <div className="h-full bg-[#004D6D] w-1/2"></div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="space-y-8 max-w-[900px] mx-auto">
                
                {/* --- PICKUP LOCATIONS --- */}
                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold text-gray-900">Pickup Locations</h2>
                    
                    {pickups.map((pickup, index) => (
                        <div key={pickup.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-[14px] font-bold text-gray-800">Pickup Location {index + 1}</h3>
                                {pickups.length > 1 && (
                                    <button 
                                        onClick={() => removePickup(pickup.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <MdDeleteOutline size={20} />
                                    </button>
                                )}
                                {pickups.length === 1 && (
                                     <MdDeleteOutline size={20} className="text-gray-300" />
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Address Field */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text"
                                                    placeholder="Post Code"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                                />
                                                <MdOutlinePinDrop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text"
                                                    placeholder="GPS type coordinate"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                                />
                                                <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Passengers Field */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Passengers <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all cursor-pointer">
                                                <option>John Doe</option>
                                                <option>Jane Smith</option>
                                                <option>Michael Brown</option>
                                            </select>
                                            <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes for Driver */}
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">Notes for Driver</label>
                                    <textarea 
                                        placeholder="e.g., Please ring the bell upon arrival."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button 
                        onClick={addPickup}
                        className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-[14px] font-bold text-[#004D6D] hover:bg-blue-50/50 hover:border-[#004D6D]/30 transition-all flex items-center justify-center gap-2"
                    >
                        <MdAdd size={20} />
                        Add Another Pickup
                    </button>
                </div>

                {/* --- DROP-OFF LOCATIONS --- */}
                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold text-gray-900">Drop-off Locations</h2>
                    
                    {dropoffs.map((dropoff, index) => (
                        <div key={dropoff.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-[14px] font-bold text-gray-800">Drop-off Location {index + 1}</h3>
                                {dropoffs.length > 1 && (
                                    <button 
                                        onClick={() => removeDropoff(dropoff.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <MdDeleteOutline size={20} />
                                    </button>
                                )}
                                {dropoffs.length === 1 && (
                                     <MdDeleteOutline size={20} className="text-gray-300" />
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Address Field */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text"
                                                    placeholder="Post Code"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                                />
                                                <MdOutlinePinDrop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text"
                                                    placeholder="GPS type coordinate"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                                />
                                                <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Passengers Field */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Passengers <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all cursor-pointer">
                                                <option>John Doe</option>
                                                <option>Jane Smith</option>
                                                <option>Michael Brown</option>
                                            </select>
                                            <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes for Driver */}
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">Notes for Driver</label>
                                    <textarea 
                                        placeholder="e.g., Drop off at the main entrance."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button 
                        onClick={addDropoff}
                        className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-[14px] font-bold text-[#004D6D] hover:bg-blue-50/50 hover:border-[#004D6D]/30 transition-all flex items-center justify-center gap-2"
                    >
                        <MdAdd size={20} />
                        Add Another Drop-off
                    </button>
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
                        onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95"
                    >
                        Next: Timings & Compensation
                        <MdTrendingFlat size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewJobStep2;
