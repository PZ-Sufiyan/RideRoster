import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdEventNote,
    MdAdd,
    MdFilterList,
    MdDirectionsCar,
    MdPerson,
    MdRefresh,
    MdViewList,
    MdViewModule,
    MdMoreVert,
    MdKeyboardArrowDown,
    MdPeopleAlt,
    MdChevronLeft,
    MdChevronRight,
    MdSearch,
    MdClose,
    MdCheck,
    MdPersonAddAlt1
} from 'react-icons/md';

const ActiveJobs = () => {
    const navigate = useNavigate();
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [showAssignPA, setShowAssignPA] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const jobs = [
        {
            id: '#J-789123',
            route: 'Northwood Elementary Run',
            startTime: '07:15 AM',
            endTime: '08:30 AM',
            duration: '1h 15m duration',
            driver: { name: 'Robert Fox', avatar: 'https://i.pravatar.cc/150?u=robert' },
            vehicle: 'BUS-101',
            passengers: '12 / 15',
            status: 'In Progress',
            statusColor: 'bg-green-50 text-green-600 border-green-100',
            dateTimeStr: 'Nov 19, 2025 at 07:15 AM'
        },
        {
            id: '#J-789124',
            route: 'Downtown Special Needs',
            startTime: '09:00 AM',
            endTime: '10:00 AM',
            duration: '1h duration',
            driver: { name: 'Esther Howard', avatar: 'https://i.pravatar.cc/150?u=esther' },
            vehicle: 'VAN-302',
            passengers: '4 / 6',
            status: 'Upcoming',
            statusColor: 'bg-blue-50 text-blue-600 border-blue-100',
            dateTimeStr: 'Nov 19, 2025 at 09:00 AM'
        },
        {
            id: '#J-789125',
            route: 'Afternoon High School',
            startTime: '02:45 PM',
            endTime: '04:00 PM',
            duration: '1h 15m duration',
            driver: null, // Unassigned
            vehicle: null,
            passengers: '22 / 25',
            status: 'Unassigned',
            statusColor: 'bg-orange-50 text-orange-600 border-orange-100',
            dateTimeStr: 'Nov 19, 2025 at 02:45 PM'
        },
        {
            id: '#J-789126',
            route: 'City Library Shuttle',
            startTime: '03:30 PM',
            endTime: '04:15 PM',
            duration: '45m duration',
            driver: { name: 'Cameron Williamson', avatar: 'https://i.pravatar.cc/150?u=cameron' },
            vehicle: 'SHUTTLE-04',
            passengers: '8 / 10',
            status: 'Upcoming',
            statusColor: 'bg-blue-50 text-blue-600 border-blue-100',
            dateTimeStr: 'Nov 19, 2025 at 03:30 PM'
        }
    ];

    const toggleRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(r => r !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleAssignDriver = (job) => {
        setSelectedJob(job);
        setShowAssignDriver(true);
        setActiveMenu(null);
    };

    const handleAssignPA = (job) => {
        setSelectedJob(job);
        setShowAssignPA(true);
        setActiveMenu(null);
    };

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">Active Jobs</h1>
                    <p className="text-[14px] text-gray-500 mt-0.5">Manage and monitor all ongoing jobs for today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/admin/jobs/calendar')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                    >
                        <MdEventNote size={18} />
                        View Calendar
                    </button>
                    <button 
                        onClick={() => navigate('/admin/jobs/create-step1')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                    >
                        <MdAdd size={20} />
                        Create New Job
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Dropdown */}
                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all">
                            <MdFilterList size={18} className="text-gray-400" />
                            All Statuses
                            <MdKeyboardArrowDown size={18} className="text-gray-400 ml-1" />
                        </button>
                    </div>

                    {/* Vehicles Dropdown */}
                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all">
                            <MdDirectionsCar size={18} className="text-gray-400" />
                            All Vehicles
                            <MdKeyboardArrowDown size={18} className="text-gray-400 ml-1" />
                        </button>
                    </div>

                    {/* Drivers Dropdown */}
                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all">
                            <MdPerson size={18} className="text-gray-400" />
                            All Drivers
                            <MdKeyboardArrowDown size={18} className="text-gray-400 ml-1" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-all">
                        <MdRefresh size={20} />
                    </button>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button className="p-2.5 bg-[#F4F9FF] text-[#004D6D] hover:bg-blue-50 transition-all border-r border-gray-200">
                            <MdViewList size={20} />
                        </button>
                        <button className="p-2.5 bg-white text-gray-400 hover:bg-gray-50 transition-all">
                            <MdViewModule size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Table Container ── */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#004D6D] focus:ring-[#004D6D] cursor-pointer" />
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Job ID / Route</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Schedule</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Driver & Vehicle</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Passengers</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {jobs.map((job, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-all">
                                    <td className="px-6 py-5">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(job.id)}
                                            onChange={() => toggleRow(job.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-[#004D6D] focus:ring-[#004D6D] cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div>
                                            <p className="text-[14px] font-bold text-gray-900">{job.id}</p>
                                            <p className="text-[12px] text-gray-400 mt-0.5 font-medium">{job.route}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-800">{job.startTime} - {job.endTime}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{job.duration}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {job.driver ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <img src={job.driver.avatar} className="w-9 h-9 rounded-full object-cover border border-gray-100" alt="" />
                                                <div className="text-left">
                                                    <p className="text-[13px] font-bold text-gray-800">{job.driver.name}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium uppercase tracking-wider">{job.vehicle}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleAssignDriver(job)}
                                                className="mx-auto px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[11px] font-bold border border-orange-100 hover:bg-orange-100 transition-all"
                                            >
                                                Assign Driver
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-gray-600">
                                            <MdPeopleAlt size={16} />
                                            <span className="text-[13px] font-bold">{job.passengers}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border ${job.statusColor}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-6 relative">
                                        <button 
                                            onClick={() => setActiveMenu(activeMenu === idx ? null : idx)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-all rounded-full hover:bg-gray-100"
                                        >
                                            <MdMoreVert size={20} />
                                        </button>

                                        {/* Action Dropdown */}
                                        {activeMenu === idx && (
                                            <div 
                                                ref={menuRef}
                                                className="absolute right-12 top-5 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden"
                                            >
                                                <div className="py-1">
                                                    <button 
                                                        onClick={() => navigate(`/admin/jobs/${job.id.replace('#', '')}`)}
                                                        className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium border-b border-gray-50"
                                                    >
                                                        View Details
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAssignDriver(job)}
                                                        className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium"
                                                    >
                                                        Add Driver
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAssignPA(job)}
                                                        className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium border-t border-gray-50"
                                                    >
                                                        Add PA
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Table Footer ── */}
                <div className="px-6 py-4 bg-[#F9FAFB] border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[13px] text-gray-500 font-medium tracking-tight">
                        Showing <span className="text-gray-900 font-bold">1-4</span> of <span className="text-gray-900 font-bold">16</span> jobs
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50">
                            <MdChevronLeft size={20} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F9FF] text-[#004D6D] border border-blue-100 text-[13px] font-bold">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 text-[13px] font-bold hover:bg-gray-50">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 text-[13px] font-bold hover:bg-gray-50">3</button>
                        <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50">
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Assign Driver Modal ── */}
            {showAssignDriver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignDriver(false)}></div>
                    <div className="relative w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign Driver to Job</h2>
                            <button 
                                onClick={() => setShowAssignDriver(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Job Info Card */}
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job ID: {selectedJob?.id}</p>
                                    <p className="text-[16px] font-bold text-gray-900 mt-1">{selectedJob?.route}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                                    <p className="text-[14px] font-bold text-gray-900 mt-1">{selectedJob?.dateTimeStr}</p>
                                </div>
                            </div>

                            {/* Search and Tabs */}
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <input 
                                        type="text" 
                                        placeholder="Search driver by name or vehicle..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                    />
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                                <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                                    <button className="px-4 py-2 text-[12px] font-bold text-[#004D6D] bg-white rounded-lg shadow-sm">Recommended</button>
                                    <button className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-700">Nearby</button>
                                    <button className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-700">Available</button>
                                </div>
                            </div>

                            {/* Driver List */}
                            <div className="space-y-3">
                                {[
                                    { name: 'Johnathan Smith', vehicle: 'Ford Transit - 12 Seater', label: 'Recommended', labelColor: 'text-green-600 bg-green-50', avatar: 'https://i.pravatar.cc/150?u=johnathan' },
                                    { name: 'Esther Howard', vehicle: 'Mercedes Sprinter - 15 Seater', label: '5 mi away', labelColor: 'text-orange-600 bg-orange-50', avatar: 'https://i.pravatar.cc/150?u=esther', selected: true },
                                    { name: 'Robert Fox', vehicle: 'Toyota Sienna - 7 Seater', label: 'Available', labelColor: 'text-gray-500 bg-gray-100', avatar: 'https://i.pravatar.cc/150?u=robert' },
                                    { name: 'Kristin Watson', vehicle: 'Ford Transit - 12 Seater', label: 'Available', labelColor: 'text-gray-500 bg-gray-100', avatar: 'https://i.pravatar.cc/150?u=kristin' },
                                ].map((driver, idx) => (
                                    <div key={idx} className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${driver.selected ? 'bg-[#F4F9FF] border-[#004D6D]/20' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                        <div className="flex items-center gap-4">
                                            <img src={driver.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                                            <div>
                                                <p className="text-[14px] font-bold text-gray-900">{driver.name}</p>
                                                <p className="text-[12px] text-gray-400 font-medium mt-0.5">{driver.vehicle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${driver.labelColor}`}>
                                                {driver.label}
                                            </span>
                                            {driver.selected ? (
                                                <button className="flex items-center gap-1.5 px-4 py-2 bg-[#004D6D] text-white rounded-xl text-[12px] font-bold shadow-sm">
                                                    <MdCheck size={16} />
                                                    Selected
                                                </button>
                                            ) : (
                                                <button className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-[12px] font-bold transition-all">
                                                    Assign
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                            <button 
                                onClick={() => setShowAssignDriver(false)}
                                className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/10">
                                <MdPersonAddAlt1 size={20} />
                                Invite Driver
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign PA Modal (Same structure) ── */}
            {showAssignPA && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignPA(false)}></div>
                    <div className="relative w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign PA to Job</h2>
                            <button 
                                onClick={() => setShowAssignPA(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Job Info Card */}
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job ID: {selectedJob?.id}</p>
                                    <p className="text-[16px] font-bold text-gray-900 mt-1">{selectedJob?.route}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                                    <p className="text-[14px] font-bold text-gray-900 mt-1">{selectedJob?.dateTimeStr}</p>
                                </div>
                            </div>

                            {/* Search and Tabs */}
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <input 
                                        type="text" 
                                        placeholder="Search PA by name..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                    />
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                                <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                                    <button className="px-4 py-2 text-[12px] font-bold text-[#004D6D] bg-white rounded-lg shadow-sm">Recommended</button>
                                    <button className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-700">Nearby</button>
                                    <button className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-700">Available</button>
                                </div>
                            </div>

                            {/* PA List */}
                            <div className="space-y-3">
                                {[
                                    { name: 'Sarah Wilson', label: 'Recommended', labelColor: 'text-green-600 bg-green-50', avatar: 'https://i.pravatar.cc/150?u=sarah' },
                                    { name: 'David Miller', label: 'Available', labelColor: 'text-gray-500 bg-gray-100', avatar: 'https://i.pravatar.cc/150?u=david' },
                                ].map((pa, idx) => (
                                    <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between transition-all hover:border-gray-200">
                                        <div className="flex items-center gap-4">
                                            <img src={pa.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                                            <div>
                                                <p className="text-[14px] font-bold text-gray-900">{pa.name}</p>
                                                <p className="text-[12px] text-gray-400 font-medium mt-0.5">Passenger Assistant</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${pa.labelColor}`}>
                                                {pa.label}
                                            </span>
                                            <button className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-[12px] font-bold transition-all">
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                            <button 
                                onClick={() => setShowAssignPA(false)}
                                className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/10">
                                <MdPersonAddAlt1 size={20} />
                                Invite PA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActiveJobs;
