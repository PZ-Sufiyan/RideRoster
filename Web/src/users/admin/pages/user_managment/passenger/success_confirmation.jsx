import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCheckCircle,
    MdPerson,
    MdList,
    MdMap,
    MdCalendarToday,
    MdGetApp,
    MdSend
} from 'react-icons/md';
import { HiCheckCircle } from 'react-icons/hi';

const SuccessConfirmation = () => {
    const navigate = useNavigate();

    const assignedPassengers = [
        { name: 'Sarah Jenkins', type: 'Wheelchair Access Required', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150' },
        { name: 'Michael Chen', type: 'Standard Pickup', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' },
    ];

    return (
        <div className="max-w-[1000px] mx-auto py-8 space-y-8">
            {/* Main Success Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-[#F6FFF9] py-12 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-[#22C55E] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#22C55E]/20">
                        <MdCheckCircle className="text-white" size={48} />
                    </div>
                    <h1 className="text-[32px] font-bold text-gray-900 mb-2">Passenger Successfully Assigned</h1>
                    <p className="text-[18px] text-gray-500 font-medium">The Job schedule has been updated and notifications have been sent to all parties.</p>
                </div>

                {/* Details Section */}
                <div className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                        {/* Left: Assigned Passengers */}
                        <div>
                            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-6">Assigned Passengers</h3>
                            <div className="space-y-4">
                                {assignedPassengers.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                                        <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
                                        <div>
                                            <div className="text-[15px] font-bold text-gray-900">{p.name}</div>
                                            <div className="text-[12px] text-gray-400 font-medium">{p.type}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Job Assignment */}
                        <div>
                            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-6">Job Assignment</h3>
                            <div className="bg-[#F4F9FF] border border-[#DCE8F7] rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-[16px] font-bold text-[#00619E]">Job-104 North District</h4>
                                    <span className="text-[10px] font-bold text-[#00619E] uppercase tracking-wider">ACTIVE</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400 font-bold text-[14px]">?</div>
                                        <div className="flex-1 flex justify-between">
                                            <span className="text-[14px] text-gray-400 font-medium">Driver:</span>
                                            <span className="text-[14px] font-bold text-gray-800 tracking-tight">Robert Fox</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                                            <MdCalendarToday size={16} />
                                        </div>
                                        <div className="flex-1 flex justify-between">
                                            <span className="text-[14px] text-gray-400 font-medium">Pickup:</span>
                                            <span className="text-[14px] font-bold text-gray-800 tracking-tight">07:45 AM (Est.)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                                            <MdList size={16} />
                                        </div>
                                        <div className="flex-1 flex justify-between">
                                            <span className="text-[14px] text-gray-400 font-medium">Vehicle:</span>
                                            <span className="text-[14px] font-bold text-gray-800 tracking-tight">Ford Transit (Van-09)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Bar */}
                    <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-4 flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-50 flex items-center justify-center shadow-sm">
                                <MdSend className="text-[#004D6D] -rotate-12" size={20} />
                            </div>
                            <p className="text-[14px] text-gray-600 font-medium">Notifications sent to Driver and Passengers via RideRoster App.</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-500">
                            <span className="text-[11px] font-bold tracking-widest">DELIVERED</span>
                            <HiCheckCircle size={18} />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => navigate('/admin/users/passengers/1')}
                            className="flex items-center justify-center gap-2 w-full md:w-auto h-12 px-8 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-md active:scale-95"
                        >
                            <MdPerson size={20} />
                            View Passenger Profile
                        </button>
                        <button 
                            onClick={() => navigate('/admin/users/passengers')}
                            className="flex items-center justify-center gap-2 w-full md:w-auto h-12 px-8 bg-white border border-gray-200 text-gray-700 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                        >
                            <MdList size={20} />
                            Back to Passenger List
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'Live Tracking', desc: 'Monitor this route in real-time on the map.', icon: <MdMap size={24} />, color: 'text-blue-600' },
                    { title: 'Schedule View', desc: 'View the full weekly schedule for RT-104.', icon: <MdCalendarToday size={24} />, color: 'text-[#004D6D]' },
                    { title: 'Export Route', desc: 'Download the updated manifest for the driver.', icon: <MdGetApp size={24} />, color: 'text-[#004D6D]' },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
                        <div className={`mb-4 ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                            {item.icon}
                        </div>
                        <h4 className="text-[16px] font-bold text-gray-900 mb-2">{item.title}</h4>
                        <p className="text-[13px] text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuccessConfirmation;
