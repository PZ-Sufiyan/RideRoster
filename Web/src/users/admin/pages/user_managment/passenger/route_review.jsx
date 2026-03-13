import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdChevronLeft,
    MdAccessible,
    MdCheckBoxOutlineBlank,
    MdCheckBox,
} from 'react-icons/md';

const RouteReview = () => {
    const navigate = useNavigate();
    const [isConfirmed, setIsConfirmed] = useState(false);

    const passengers = [
        { name: 'Sarah Jenkins', time: '07:45 AM', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150' },
        { name: 'Michael Chen', time: '08:05 AM', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' },
    ];

    return (
        <div className="max-w-[1400px] mx-auto py-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main Content Area */}
                <div className="lg:col-span-8 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Confirm Assignment Details</h1>
                        <span className="text-[11px] font-bold text-[#004D6D] uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">
                            Review Stage
                        </span>
                    </div>

                    {/* Accessibility Alert */}
                    <div className="bg-[#FFF9E6] border border-[#FFE7A3] rounded-2xl p-6 mb-10 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#FFB800]/10 flex items-center justify-center shrink-0">
                            <MdAccessible className="text-[#FFB800]" size={22} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[15px] font-bold text-[#A67F00]">Accessibility Match Alert</h3>
                            <p className="text-[14px] text-[#A67F00]/80 leading-relaxed font-medium">
                                Job -104 (Ford Transit) has 1 wheelchair spot. Sarah Jenkins requires wheelchair access. Capacity is at limit for specialized equipment.
                            </p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* Passengers list */}
                        <div className="bg-gray-50/30 border border-gray-100 rounded-2xl p-6">
                            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-6">Passengers to Assign</h3>
                            <div className="space-y-5">
                                {passengers.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                        <div>
                                            <div className="text-[15px] font-bold text-gray-900">{p.name}</div>
                                            <div className="text-[12px] text-gray-400 font-medium">Pickup: {p.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Route side */}
                        <div className="bg-gray-50/30 border border-gray-100 rounded-2xl p-6">
                            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-6">Route Assignment</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-gray-500 font-medium">Route Name:</span>
                                    <span className="text-[14px] font-bold text-gray-900 tracking-tight">North District (RT-104)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-gray-500 font-medium">Driver:</span>
                                    <span className="text-[14px] font-bold text-gray-900 tracking-tight">Robert Fox</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-gray-500 font-medium">PA:</span>
                                    <span className="text-[14px] font-bold text-gray-900 tracking-tight">Elena Rodriguez</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-[14px] text-gray-500 font-medium">Total Stops:</span>
                                    <span className="text-[14px] font-bold text-gray-900 tracking-tight">6 Stops Total</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="bg-blue-50/30 border border-blue-50 rounded-2xl p-6 mb-12 flex items-start gap-4">
                        <div 
                            className="text-[#004D6D] mt-1 cursor-pointer transition-transform active:scale-95"
                            onClick={() => setIsConfirmed(!isConfirmed)}
                        >
                            {isConfirmed ? <MdCheckBox size={24} /> : <MdCheckBoxOutlineBlank className="text-gray-300" size={24} />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[15px] font-bold text-gray-900">I confirm job details are correct.</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will update schedules for the driver, passenger assistant, and send notifications to the passengers.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-8">
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[15px] font-bold text-gray-500 hover:text-gray-900 transition-colors px-2 py-1"
                        >
                            <MdChevronLeft size={24} />
                            Back to Edit
                        </button>
                        <button 
                            onClick={() => navigate('/admin/users/passengers/assign/success')}
                            disabled={!isConfirmed}
                            className={`px-10 py-3.5 rounded-xl text-[16px] font-bold transition-all shadow-lg
                                ${isConfirmed 
                                    ? 'bg-[#004D6D] text-white hover:bg-[#003c55] shadow-[#004D6D]/20' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                }`}
                        >
                            Confirm Assignment
                        </button>
                    </div>
                </div>

                {/* Sidebar area */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Validation Status */}
                    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                        <h3 className="text-[16px] font-bold text-gray-900 mb-6 tracking-tight">Validation Status</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-gray-500 font-medium">Route Capacity</span>
                                <span className="text-[11px] font-bold text-green-500 tracking-wider">PASSED</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-gray-500 font-medium">Driver Availability</span>
                                <span className="text-[11px] font-bold text-green-500 tracking-wider">PASSED</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-gray-500 font-medium">Accessibility Match</span>
                                <span className="text-[11px] font-bold text-[#FFB800] tracking-wider">WARNING</span>
                            </div>
                        </div>
                    </div>

                    {/* Resource Utilization */}
                    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                        <h3 className="text-[16px] font-bold text-gray-900 mb-6 tracking-tight">Resource Utilization</h3>
                        <div className="space-y-8">
                            {/* Seats */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[13px] text-gray-500 font-bold uppercase tracking-wider">Vehicle Seats</span>
                                    <span className="text-[13px] font-bold text-gray-900">5 / 7</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-[#004D6D] rounded-full" style={{ width: '71%' }}></div>
                                </div>
                            </div>
                            {/* Wheelchair */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[13px] text-gray-500 font-bold uppercase tracking-wider">Wheelchair Lifts</span>
                                    <span className="text-[13px] font-bold text-gray-900">1 / 1</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-[#FFB800] rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RouteReview;
