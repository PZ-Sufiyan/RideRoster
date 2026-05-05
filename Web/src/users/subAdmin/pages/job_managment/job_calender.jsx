import React, { useState } from 'react';
import {
    MdChevronLeft,
    MdChevronRight,
    MdAdd,
    MdSearch,
    MdAccessTime,
} from 'react-icons/md';

const JobCalendar = () => {
    const [view, setView] = useState('month'); // 'month', 'week', 'day'

    // ─── MONTH VIEW DATA ─────────────────────────────────────────
    const monthDays = [
        { day: 26, isPrev: true }, { day: 27, isPrev: true }, { day: 28, isPrev: true }, { day: 29, isPrev: true }, { day: 30, isPrev: true }, { day: 31, isPrev: true }, { day: 1 },
        { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 },
        { day: 9 }, { day: 10, jobs: [{ time: '08:00 AM', title: 'Northwood High', color: 'green' }] },
        { day: 11, jobs: [{ time: '09:30 AM', title: 'Special Needs Pickup', color: 'orange' }] },
        { day: 12, jobs: [{ time: '07:45 AM', title: 'City Center Route', color: 'blue' }, { time: '03:15 PM', title: 'Northwood High', color: 'green' }] },
        { day: 13 }, { day: 14 }, { day: 15 },
        { day: 16 }, { day: 17 },
        { day: 18, isToday: true, jobs: [{ time: '07:45 AM', title: 'City Center Route', color: 'blue' }, { time: '09:30 AM', title: 'Special Needs Pickup', color: 'orange' }], more: 2 },
        { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 },
        { day: 23 }, { day: 24 }, { day: 25 }, { day: 26 }, { day: 27, event: 'Thanksgiving' }, { day: 28 }, { day: 29 },
    ];

    // ─── WEEK VIEW DATA ──────────────────────────────────────────
    const weekDays = [
        { name: 'Mon', date: 17 },
        { name: 'Tue', date: 18, isToday: true },
        { name: 'Wed', date: 19 },
        { name: 'Thu', date: 20 },
        { name: 'Fri', date: 21 },
        { name: 'Sat', date: 22 },
        { name: 'Sun', date: 23 },
    ];

    const weekJobs = [
        { day: 17, code: 'J-1023', title: 'Oakwood School AM', time: '07:00 - 08:30', driver: 'J. Doe', avatar: 'https://i.pravatar.cc/150?u=1', seats: '5(3)seat', color: 'orange' },
        { day: 18, code: 'J-1024', title: 'City Library Shuttle', time: '09:00 - 11:00', driver: 'M. Smith', avatar: 'https://i.pravatar.cc/150?u=2', seats: '5(3)seat', color: 'blue' },
        { day: 18, code: 'J-1025', title: 'Pine Ridge PM', time: '15:30 - 17:00', driver: 'S. Lee', avatar: 'https://i.pravatar.cc/150?u=3', seats: '5(3)seat', color: 'green' },
        { day: 19, code: 'J-1023', title: 'Oakwood School AM', time: '07:00 - 08:30', driver: 'J. Doe', avatar: 'https://i.pravatar.cc/150?u=1', seats: '5(3)seat', color: 'orange' },
        { day: 20, code: 'J-1024', title: 'City Library Shuttle', time: '09:00 - 11:00', driver: 'M. Smith', avatar: 'https://i.pravatar.cc/150?u=2', seats: '5(3)seat', color: 'blue' },
        { day: 21, code: 'J-1023', title: 'Oakwood School AM', time: '07:00 - 08:30', driver: 'J. Doe', avatar: 'https://i.pravatar.cc/150?u=1', seats: '5(3)seat', color: 'orange' },
        { day: 21, code: 'J-1025', title: 'Pine Ridge PM', time: '15:30 - 17:00', driver: 'S. Lee', avatar: 'https://i.pravatar.cc/150?u=3', seats: '5(3)seat', color: 'green' },
    ];

    // ─── DAY VIEW DATA ───────────────────────────────────────────
    const dayCols = [
        { title: 'J-1024: City Library', capacity: 'Capacity: 5', color: 'red' },
        { title: 'J 102 - MB Sprinter', capacity: 'Capacity: 6' },
        { title: 'J 103 - Ford Transit', capacity: 'Capacity: 5' },
        { title: 'J 104 - Unassigned', capacity: 'Capacity: 7' },
    ];

    const timeSlots = [
        '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ];

    const dayJobs = [
        { col: 0, title: 'Morning Route - Westside', time: '07:30 AM - 08:30 AM', avatar: 'https://i.pravatar.cc/150?u=4', top: '15%', height: '15%', color: 'blue' },
        { col: 1, title: 'Oakwood School Pickup', time: '08:00 AM - 09:30 AM', avatar1: 'https://i.pravatar.cc/150?u=5', avatar2: 'https://i.pravatar.cc/150?u=6', top: '22%', height: '22%', color: 'green' },
        { col: 2, title: 'City Center Shuttle', time: '07:45 AM - 08:45 AM', avatar: 'https://i.pravatar.cc/150?u=7', top: '18%', height: '15%', color: 'blue' },
        { col: 3, title: 'North Suburbs Route', time: '08:30 AM - 09:30 AM', unassigned: true, top: '30%', height: '18%' },
    ];

    // ─── RENDER HELPERS ──────────────────────────────────────────
    const getJobColor = (color) => {
        switch (color) {
            case 'green': return 'bg-green-50 text-green-700 border-green-200';
            case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'blue': return 'bg-blue-50 text-[#004D6D] border-blue-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">Job Calendar</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[14px] font-medium hover:bg-[#003c55] transition-all">
                    <MdAdd size={20} />
                    Create Job
                </button>
            </div>

            {/* Navigation & View Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <button className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-50"><MdChevronLeft size={20} className="text-gray-400" /></button>
                        <button className="p-2 hover:bg-gray-50 transition-colors"><MdChevronRight size={20} className="text-gray-400" /></button>
                    </div>
                    <h2 className="text-[18px] font-bold text-gray-800">
                        {view === 'month' ? 'November 2025' : view === 'week' ? 'November 18 - 24, 2025' : 'November 18, 2025'}
                    </h2>
                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[13px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Today</button>
                </div>

                <div className="flex items-center gap-4">
                    {view === 'day' && (
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search jobs, drivers, or passengers..."
                                className="pl-10 pr-4 py-2 w-64 border border-gray-100 rounded-lg text-[13px] bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                            />
                        </div>
                    )}
                    <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                        {['month', 'week', 'day'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-1.5 rounded-md text-[13px] font-semibold capitalize transition-all ${view === v ? 'bg-white text-[#004D6D] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── CALENDAR VIEWS ─── */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden min-h-[700px]">

                {/* ── MONTH VIEW ── */}
                {view === 'month' && (
                    <div className="grid grid-cols-7 h-[800px]">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-3 text-center text-[12px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                {d}
                            </div>
                        ))}
                        {monthDays.map((item, i) => (
                            <div key={i} className={`p-3 border-r border-b border-gray-50 relative ${item.isPrev ? 'bg-gray-50/20' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <span className={`text-[13px] font-bold ${item.isPrev ? 'text-gray-300' : 'text-gray-400'} ${item.isToday ? 'w-6 h-6 flex items-center justify-center bg-[#004D6D] text-white rounded-lg -mt-1 shadow-sm' : ''}`}>
                                        {item.day}
                                    </span>
                                </div>
                                <div className="mt-2 space-y-1.5 px-0.5">
                                    {item.jobs?.map((j, idx) => (
                                        <div key={idx} className={`p-1.5 rounded-md border-l-4 text-[10px] font-bold truncate cursor-pointer hover:shadow-sm transition-all ${getJobColor(j.color)}`}>
                                            <span className="opacity-80 block mb-0.5">{j.time}</span>
                                            <span className="block truncate">{j.title}</span>
                                        </div>
                                    ))}
                                    {item.more && (
                                        <button className="text-[10px] font-bold text-[#004D6D] hover:underline mt-1">+ {item.more} more</button>
                                    )}
                                    {item.event && (
                                        <div className="absolute bottom-3 left-0 right-0 text-center">
                                            <span className="text-[11px] text-gray-300 font-medium">{item.event}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── WEEK VIEW ── */}
                {view === 'week' && (
                    <div className="grid grid-cols-7 h-[700px]">
                        {weekDays.map(d => (
                            <div key={d.date} className={`border-r border-gray-100 flex flex-col items-center py-4 bg-white ${d.isToday ? 'bg-blue-50/10' : ''}`}>
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">{d.name}</span>
                                <span className={`text-[16px] font-bold ${d.isToday ? 'w-9 h-9 flex items-center justify-center bg-[#004D6D] text-white rounded-full shadow-md translate-y-1' : 'text-gray-800'}`}>
                                    {d.date}
                                </span>
                            </div>
                        ))}
                        {/* Day Columns */}
                        {weekDays.map(d => (
                            <div key={d.date} className={`border-r border-t border-gray-100 p-3 space-y-3 min-h-[600px] ${d.isToday ? 'bg-blue-50/10' : ''}`}>
                                {weekJobs.filter(j => j.day === d.date).map((j, idx) => (
                                    <div key={idx} className={`p-3 rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${getJobColor(j.color)}`}>
                                        <p className="text-[10px] font-bold mb-1">{j.code}: {j.title}</p>
                                        <p className="text-[11px] font-medium opacity-80 mb-3">{j.time}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <img src={j.avatar} className="w-5 h-5 rounded-full border border-white" alt="" />
                                                <span className="text-[10px] font-bold">{j.driver}</span>
                                            </div>
                                            <span className="text-[10px] font-bold opacity-80">{j.seats}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── DAY VIEW ── */}
                {view === 'day' && (
                    <div className="relative">
                        {/* Column Headers */}
                        <div className="grid grid-cols-[80px_repreat(4,1fr)] grid-flow-col border-b border-gray-100 bg-white sticky top-0 z-10">
                            <div className="w-[80px]"></div> {/* empty space for time labels */}
                            {dayCols.map((c, idx) => (
                                <div key={idx} className="flex-1 py-4 px-6 border-r border-gray-50 last:border-0">
                                    <h4 className={`text-[13px] font-bold ${c.color === 'red' ? 'text-red-500' : 'text-gray-800'}`}>{c.title}</h4>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{c.capacity}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex h-[800px] overflow-y-auto">
                            {/* Time Labels */}
                            <div className="w-[80px] shrink-0 border-r border-gray-100 bg-[#F9FAFB]/50">
                                {timeSlots.map(t => (
                                    <div key={t} className="h-[100px] flex items-start justify-center pt-2 text-[11px] font-bold text-gray-400">
                                        {t}
                                    </div>
                                ))}
                            </div>

                            {/* Job Grid */}
                            <div className="flex-1 relative">
                                {/* Grid lines */}
                                {timeSlots.map(t => (
                                    <div key={t} className="h-[100px] border-b border-gray-50 flex">
                                        {[0, 1, 2, 3].map(i => <div key={i} className="flex-1 border-r border-gray-50/50 last:border-0"></div>)}
                                    </div>
                                ))}

                                {/* Job Blocks */}
                                {dayJobs.map((j, idx) => (
                                    <div
                                        key={idx}
                                        className={`absolute rounded-xl border-l-[3px] p-3 shadow-lg cursor-pointer transition-all hover:scale-[1.02] hover:z-20
                                            ${j.col === 0 ? 'left-[0.5%]' : j.col === 1 ? 'left-[25.5%]' : j.col === 2 ? 'left-[50.5%]' : 'left-[75.5%]'}
                                            w-[24%] border-gray-200
                                            ${j.unassigned ? 'bg-white border-[#D1D5DB] shadow-md border shadow-gray-200/50' : getJobColor(j.color)}`}
                                        style={{ top: j.top, height: j.height }}
                                    >
                                        <h5 className="text-[13px] font-bold leading-tight mb-1">{j.title}</h5>
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-70 mb-3">
                                            <MdAccessTime size={14} />
                                            {j.time}
                                        </div>
                                        {j.unassigned ? (
                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Unassigned</span>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-auto">
                                                <img src={j.avatar || j.avatar1} className="w-6 h-6 rounded-full border border-white shrink-0" alt="" />
                                                {j.avatar2 && <img src={j.avatar2} className="w-6 h-6 rounded-full border border-white -ml-4 shrink-0" alt="" />}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobCalendar;
