import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdKeyboardArrowDown,
    MdArrowForward,
    MdPerson,
    MdPeople,
    MdSupport,
    MdHelpOutline
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
        <div className="max-w-4xl mx-auto py-4">
            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 md:p-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
                    <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Assign Passengers to Job-ID</h1>
                    <span className="text-[11px] font-bold text-[#004D6D] bg-[#E6F3F7] px-3 py-1.5 rounded-full tracking-widest uppercase">
                        STEP 1 OF 2
                    </span>
                </div>

                {/* Selected Passengers Section */}
                <div className="mb-12">
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-5">Selected Passengers (2)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {passengers.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/30 hover:bg-white hover:shadow-md transition-all duration-300">
                                <div className="relative">
                                    <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                </div>
                                <div>
                                    <div className="text-[16px] font-bold text-gray-900">{p.name}</div>
                                    <div className="text-[12px] text-gray-400 font-medium">{p.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Select Job Dropdown */}
                <div className="mb-10">
                    <label className="block text-[14px] font-bold text-gray-900 mb-3 ml-1">
                        Select Active Job *
                    </label>
                    <div className="relative group">
                        <select
                            value={selectedJob}
                            onChange={(e) => setSelectedJob(e.target.value)}
                            className="w-full h-14 pl-6 pr-14 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium text-gray-700 appearance-none focus:outline-none focus:border-[#004D6D] focus:ring-4 focus:ring-[#004D6D]/5 transition-all cursor-pointer shadow-sm"
                        >
                            <option>North District - Morning Shuttle (RT-104)</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#004D6D] transition-colors">
                            <MdKeyboardArrowDown size={28} />
                        </div>
                    </div>
                </div>

                {/* Job Details Card */}
                <div className="bg-[#F4F9FF] border border-[#DCE8F7] rounded-[24px] p-8 mb-12 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h2 className="text-[20px] font-bold text-[#00619E] mb-1.5 flex items-center gap-2">
                                Job RT-104 Details
                            </h2>
                            <p className="text-[14px] text-gray-500 font-medium flex items-center gap-1.5">
                                Morning Shift <span className="text-gray-300">•</span> 07:30 AM - 09:00 AM
                            </p>
                        </div>
                        <span className="bg-[#FFF9E6] text-[#A67F00] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                            Low Capacity
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        <div className="flex items-center gap-4 group">
                            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 border-dashed group-hover:border-solid transition-all">
                                <MdSupport className="text-gray-400" size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Driver</p>
                                <p className="text-[15px] font-bold text-gray-800">Robert Fox</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 border-dashed group-hover:border-solid transition-all">
                                <MdPerson className="text-[#004D6D]" size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Assistant</p>
                                <p className="text-[15px] font-bold text-gray-800">Elena Rodriguez</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 border-dashed group-hover:border-solid transition-all">
                                <MdPeople className="text-[#004D6D]" size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Capacity</p>
                                <p className="text-[15px] font-bold text-gray-800">10 / 12 Seats</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={() => navigate('/admin/users/passengers/assign/review')}
                    className="group relative flex items-center justify-center gap-3 w-full md:w-auto h-14 px-10 bg-[#004D6D] text-white rounded-2xl text-[16px] font-bold hover:bg-[#003c55] transition-all shadow-[0_10px_25px_rgba(0,77,109,0.3)] active:scale-[0.98]"
                >
                    Proceed to Confirm
                    <MdArrowForward size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default AssignRoute;
