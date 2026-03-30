import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowForward,
    MdPerson,
    MdPeople,
    MdSupport,
} from 'react-icons/md';

const AssignRoute = () => {
    const navigate = useNavigate();
    const [selectedJob, setSelectedJob] = useState('North District - Morning Shuttle (RT-104)');

    const passengers = [
        { 
            name: 'Sarah Jenkins', 
            type: 'Wheelchair Access Required', 
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150' 
        },
        { 
            name: 'Michael Chen', 
            type: 'Standard Pickup', 
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' 
        },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-2.5 mb-6">
                    <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">Assign Passengers to Job-ID</h1>
                    <span className="text-[10px] font-bold text-[#004D6D] bg-[#E6F3F7] px-2.5 py-1 rounded-full tracking-widest uppercase">
                        STEP 1 OF 2
                    </span>
                </div>

                {/* Selected Passengers Section */}
                <div className="mb-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selected Passengers (2)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {passengers.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/30 hover:bg-white hover:shadow-sm transition-all duration-300">
                                <div className="relative">
                                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                </div>
                                <div>
                                    <div className="text-[14px] font-semibold text-gray-900">{p.name}</div>
                                    <div className="text-[11px] text-gray-400 font-medium">{p.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Select Job Dropdown */}
                <div className="mb-6">
                    <label className="block text-[13px] font-semibold text-gray-900 mb-2">
                        Select Active Job *
                    </label>
                    <div className="relative group">
                        <select
                            value={selectedJob}
                            onChange={(e) => setSelectedJob(e.target.value)}
                            className="w-full h-11 px-3.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 appearance-none focus:outline-none focus:border-[#004D6D] focus:ring-2 focus:ring-[#004D6D]/10 transition-all cursor-pointer shadow-sm"
                        >
                            <option>North District - Morning Shuttle (RT-104)</option>
                        </select>
                    </div>
                </div>

                {/* Job Details Card */}
                <div className="bg-[#F4F9FF] border border-[#DCE8F7] rounded-lg p-5 mb-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-5 relative z-10">
                        <div>
                            <h2 className="text-[16px] font-bold text-[#00619E] mb-1 flex items-center gap-1.5">
                                Job RT-104 Details
                            </h2>
                            <p className="text-[12px] text-gray-500 font-medium flex items-center gap-1">
                                Morning Shift <span className="text-gray-300">•</span> 07:30 AM - 09:00 AM
                            </p>
                        </div>
                        <span className="bg-[#FFF9E6] text-[#A67F00] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Low Capacity
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <div className="flex items-center gap-3 group">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 border-dashed group-hover:border-solid transition-all">
                                <MdSupport className="text-gray-400" size={17} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Driver</p>
                                <p className="text-[13px] font-semibold text-gray-800">Robert Fox</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 group">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 border-dashed group-hover:border-solid transition-all">
                                <MdPerson className="text-[#004D6D]" size={17} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Assistant</p>
                                <p className="text-[13px] font-semibold text-gray-800">Elena Rodriguez</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 group">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 border-dashed group-hover:border-solid transition-all">
                                <MdPeople className="text-[#004D6D]" size={17} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Capacity</p>
                                <p className="text-[13px] font-semibold text-gray-800">10 / 12 Seats</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={() => navigate('/admin/users/passengers/assign/review')}
                    className="group relative flex items-center justify-center gap-2 w-full md:w-auto h-10 px-6 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm active:scale-[0.98]"
                >
                    Proceed to Confirm
                    <MdArrowForward size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default AssignRoute;
