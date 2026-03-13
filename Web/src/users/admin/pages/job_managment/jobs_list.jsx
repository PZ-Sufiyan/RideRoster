import React, { useState } from 'react';
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
    MdChevronRight
} from 'react-icons/md';

const ActiveJobs = () => {
    const navigate = useNavigate();
    const [selectedRows, setSelectedRows] = useState([]);

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
            statusColor: 'bg-green-50 text-green-600 border-green-100'
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
            statusColor: 'bg-blue-50 text-blue-600 border-blue-100'
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
            statusColor: 'bg-orange-50 text-orange-600 border-orange-100'
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
            statusColor: 'bg-blue-50 text-blue-600 border-blue-100'
        }
    ];

    const toggleRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(r => r !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003c55] transition-all shadow-sm">
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
                                            <button className="mx-auto px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[11px] font-bold border border-orange-100 hover:bg-orange-100 transition-all">
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
                                    <td className="px-6 py-5 text-right pr-6">
                                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-all">
                                            <MdMoreVert size={20} />
                                        </button>
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
        </div>
    );
};

export default ActiveJobs;
