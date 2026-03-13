import React, { useState } from 'react';
import {
    HiOutlineDownload,
    HiOutlinePrinter,
    HiOutlineFilter,
    HiOutlineCalendar,
    HiDotsVertical,
    HiChevronRight,
    HiSearch,
    HiFilter,
    HiCheckCircle,
    HiChevronLeft,
    HiOutlineChartBar
} from 'react-icons/hi';
import {
    MdFileDownload,
    MdGridOn,
    MdAssignment,
    MdPeople,
    MdRoute,
    MdAnalytics
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Report = () => {
    const [statusFilter, setStatusFilter] = useState(true);
    const navigate = useNavigate();

    const getReportPath = (role) =>
        role === 'Driver'
            ? '/admin/reports/driver-performance'
            : '/admin/reports/pa-attendance';

    const stats = [
        {
            title: "Total Jobs Completed",
            value: "1,847",
            change: "↑ 12% vs last month",
            icon: <HiOutlineChartBar className="text-blue-600" size={20} />,
            bgColor: "bg-blue-50",
            textColor: "text-green-500"
        },
        {
            title: "Total Drivers Active",
            value: "42",
            change: "for Feb 2026",
            icon: <MdAssignment className="text-blue-600" size={20} />,
            bgColor: "bg-blue-50",
            textColor: "text-gray-400"
        },
        {
            title: "Total PAs Active",
            value: "38",
            change: "for Feb 2026",
            icon: <MdPeople className="text-green-600" size={20} />,
            bgColor: "bg-green-50",
            textColor: "text-gray-400"
        },
        {
            title: "Avg Jobs per Staff",
            value: "23.1",
            change: "↑ 5% improvement",
            icon: <HiOutlineChartBar className="text-orange-600" size={20} />,
            bgColor: "bg-orange-50",
            textColor: "text-green-500"
        }
    ];

    const staffData = [
        { id: "DR-1042", name: "Michael Stevens", role: "Driver", routes: "Route A, Route C", jobs: 58, morning: 28, return: 28, active: "28/28", attendance: "100%", status: "Active" },
        { id: "PA-2015", name: "Sarah Mitchell", role: "PA", routes: "Route A, Route B", jobs: 52, morning: 26, return: 26, active: "26/28", attendance: "92.9%", status: "Active" },
        { id: "DR-1038", name: "David Rodriguez", role: "Driver", routes: "Route B, Route D", jobs: 48, morning: 24, return: 24, active: "24/28", attendance: "85.7%", status: "Active" },
        { id: "PA-2021", name: "Emily Thompson", role: "PA", routes: "Route C", jobs: 54, morning: 27, return: 27, active: "27/28", attendance: "96.4%", status: "Active" },
        { id: "DR-1051", name: "James Wilson", role: "Driver", routes: "Route D", jobs: 50, morning: 25, return: 25, active: "25/28", attendance: "89.3%", status: "Active" },
        { id: "PA-2018", name: "Jessica Parker", role: "PA", routes: "Route A, Route D", jobs: 46, morning: 23, return: 23, active: "23/28", attendance: "82.1%", status: "Active" },
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Monthly Performance Report</h1>
                    <p className="text-gray-400 text-[13px] font-medium mt-0.5">Driver & Passenger Assistant job summary</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-[10px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 bg-white shadow-sm transition-all active:scale-95">
                        <HiOutlineDownload className="text-red-500" size={18} />
                        Export PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-[10px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 bg-white shadow-sm transition-all active:scale-95">
                        <HiOutlineDownload className="text-green-500" size={18} />
                        Export Excel
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-[10px] text-[13px] font-bold hover:bg-[#003c55] shadow-sm transition-all active:scale-95">
                        <MdAnalytics size={18} />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Report Filters Card */}
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-50 p-6">
                <div className="flex items-center gap-2.5 mb-6">
                    <HiOutlineFilter className="text-[#004D6D]" size={20} />
                    <h2 className="text-[17px] font-bold text-gray-900">Report Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1">Month & Year <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                value="February 2026"
                                readOnly
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10 cursor-default"
                            />
                            <HiOutlineCalendar className="absolute right-3.5 top-3 text-gray-400" size={18} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-700">Role Filter</label>
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white appearance-none cursor-pointer">
                            <option>All Roles</option>
                            <option>Driver</option>
                            <option>PA</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-700">Route Filter</label>
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white appearance-none cursor-pointer">
                            <option>All Routes</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-700">Status Filter</label>
                        <div className="flex items-center h-[46px] px-4 border border-gray-200 rounded-xl bg-gray-50/50">
                            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setStatusFilter(!statusFilter)}>
                                <div className={`w-4.5 h-4.5 rounded-[4px] flex items-center justify-center transition-all ${statusFilter ? 'bg-blue-600 border-blue-600' : 'border border-gray-300 bg-white'}`}>
                                    {statusFilter && <HiCheckCircle className="text-white" size={12} />}
                                </div>
                                <span className="text-[13px] font-medium text-gray-600">Completed jobs only</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex flex-col justify-between min-h-[140px]">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-[14px] ${stat.bgColor} flex items-center justify-center`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="text-[28px] font-bold text-gray-900 leading-none">{stat.value}</div>
                            <h3 className="text-gray-500 text-[13px] font-medium mt-1">{stat.title}</h3>
                        </div>
                        <div className={`text-[12px] font-semibold mt-4 ${stat.textColor}`}>
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* Staff Performance Breakdown Section */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <MdGridOn className="text-blue-600" size={20} />
                            <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">Staff Performance Breakdown</h2>
                        </div>
                        <p className="text-gray-400 text-[13px] font-medium mt-0.5 ml-7">Detailed job completion metrics for February 2026</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search staff..."
                                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-[12px] text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-72"
                            />
                            <HiSearch className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                        </div>
                        <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-[12px] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                            <HiFilter size={18} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto mt-4 px-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-4 py-4 w-10">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </th>
                                <th className="px-4 py-4">Staff Name</th>
                                <th className="px-4 py-4">Role</th>
                                <th className="px-4 py-4">Assigned Routes</th>
                                <th className="px-4 py-4 text-center">Total Jobs</th>
                                <th className="px-4 py-4 text-center">Morning Trips</th>
                                <th className="px-4 py-4 text-center">Return Trips</th>
                                <th className="px-4 py-4 text-center">Days Active</th>
                                <th className="px-4 py-4 text-center">Attendance</th>
                                <th className="px-4 py-4 text-center">Status</th>
                                <th className="px-4 py-4 text-center w-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {staffData.map((staff, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/40 transition-colors group">
                                    <td className="px-4 py-5">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    </td>
                                    <td className="px-4 py-5">
                                        <button
                                            onClick={() => navigate(getReportPath(staff.role))}
                                            className="flex items-center gap-3 text-left group/name hover:opacity-80 transition-opacity"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shrink-0">
                                                <img src={`https://i.pravatar.cc/150?u=${staff.id}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-bold text-[#004D6D] leading-none group-hover/name:underline underline-offset-2">{staff.name}</div>
                                                <div className="text-[10px] text-gray-400 mt-1 font-semibold tracking-wide">ID: {staff.id}</div>
                                            </div>
                                        </button>
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[10px] font-bold ${staff.role === 'Driver' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {staff.role === 'Driver' ? <MdRoute size={12} /> : <MdPeople size={12} />}
                                            {staff.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-[11px] text-gray-500 font-semibold tracking-wide">{staff.routes}</td>
                                    <td className="px-4 py-5 text-[13px] font-bold text-gray-900 text-center">{staff.jobs}</td>
                                    <td className="px-4 py-5 text-[13px] font-medium text-gray-500 text-center">{staff.morning}</td>
                                    <td className="px-4 py-5 text-[13px] font-medium text-gray-500 text-center">{staff.return}</td>
                                    <td className="px-4 py-5 text-[13px] font-medium text-gray-500 text-center">{staff.active}</td>
                                    <td className="px-4 py-5 text-center">
                                        <div className="text-[13px] font-bold text-green-500">{staff.attendance}</div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <span className="inline-flex px-3 py-1 rounded-[10px] bg-green-50 text-green-600 text-[10px] font-bold tracking-wide">
                                            {staff.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-all">
                                            <HiDotsVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-5 bg-gray-50/20 flex items-center justify-between border-t border-gray-50">
                    <span className="text-[12px] font-bold text-gray-400">Showing 1-6 of 80 staff members</span>
                    <div className="flex items-center gap-1.5">
                        <button className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white text-gray-400 transition-colors"><HiChevronLeft size={18} /></button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-blue-600 text-white text-[13px] font-bold shadow-sm">1</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white text-gray-500 text-[13px] font-bold transition-colors">2</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white text-gray-500 text-[13px] font-bold transition-colors">3</button>
                        <span className="px-1 text-gray-300 font-bold">...</span>
                        <button className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white text-gray-500 text-[13px] font-bold transition-colors">14</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white text-gray-400 transition-colors"><HiChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Jobs Completed per Staff */}
                <div className="lg:col-span-7 bg-white p-7 rounded-[24px] shadow-sm border border-gray-50">
                    <div className="flex items-center gap-2.5 mb-1">
                        <HiOutlineChartBar size={20} className="text-blue-600" />
                        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Jobs Completed per Staff</h3>
                    </div>
                    <p className="text-gray-400 text-[12px] font-medium mb-10 ml-7">Top 10 performers in February 2026</p>

                    <div className="h-72 flex items-end justify-between gap-4 px-4 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 top-0 bottom-14 flex flex-col justify-between pointer-events-none px-4">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="border-b border-gray-50 w-full h-0"></div>
                            ))}
                        </div>

                        {[
                            { name: 'Michael S.', value: 58, color: 'bg-[#004D6D]' },
                            { name: 'Emily T.', value: 54, color: 'bg-[#006E9A]' },
                            { name: 'Sarah M.', value: 52, color: 'bg-[#008BBF]' },
                            { name: 'James W.', value: 50, color: 'bg-[#00A9E7]' },
                            { name: 'David R.', value: 48, color: 'bg-[#004D6D]' },
                            { name: 'Jessica P.', value: 46, color: 'bg-[#006E9A]' },
                            { name: 'Robert F.', value: 44, color: 'bg-[#008BBF]' },
                            { name: 'Linda M.', value: 42, color: 'bg-[#00A9E7]' },
                            { name: 'Chris B.', value: 40, color: 'bg-[#004D6D]' },
                            { name: 'Anne W.', value: 38, color: 'bg-[#10B981]' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 relative z-10">
                                <div className="text-[10px] font-bold text-gray-400 mb-0.5">{item.value}</div>
                                <div className={`w-full max-w-[28px] rounded-t-[4px] ${item.color} transition-all hover:brightness-110 shadow-sm`} style={{ height: `${(item.value / 65) * 100}%` }}></div>
                                <div className="text-[9px] font-bold text-gray-400 truncate w-full text-center rotate-[-35deg] origin-top mt-1">{item.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Morning vs Return Trips */}
                <div className="lg:col-span-5 bg-white p-7 rounded-[24px] shadow-sm border border-gray-50">
                    <div className="flex items-center gap-2.5 mb-1">
                        <MdAssignment size={20} className="text-green-600" />
                        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Morning vs Return Trips</h3>
                    </div>
                    <p className="text-gray-400 text-[12px] font-medium mb-8 ml-7">Job distribution by trip type</p>

                    <div className="flex items-center justify-center gap-8 mb-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-500 shadow-sm"></div>
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Morning Trips</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-[3px] bg-orange-500 shadow-sm"></div>
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Return Trips</span>
                        </div>
                    </div>

                    <div className="h-56 flex items-end justify-around gap-2 px-8 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 px-8 bottom-12 flex flex-col justify-between pointer-events-none">
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} className="border-b border-gray-50 w-full h-0"></div>
                            ))}
                        </div>

                        {/* Y-axis labels */}
                        <div className="absolute -left-2 top-0 bottom-12 flex flex-col justify-between text-[11px] font-bold text-gray-300">
                            <span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
                        </div>

                        {[1, 2, 3, 4].map(week => (
                            <div key={week} className="flex flex-col items-center gap-4 flex-1 relative z-10">
                                <div className="flex items-end gap-1.5 h-full w-full justify-center">
                                    <div className="w-10 bg-blue-500 rounded-t-[4px] shadow-sm transition-all hover:brightness-110" style={{ height: '90%' }}></div>
                                    <div className="w-10 bg-orange-500 rounded-t-[4px] shadow-sm transition-all hover:brightness-110" style={{ height: '90%' }}></div>
                                </div>
                                <div className="text-[11px] font-bold text-gray-400 tracking-wide uppercase">Week {week}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Job Summary Accordion */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-7">
                    <div className="flex items-center gap-2.5 mb-1">
                        <MdAssignment className="text-blue-600" size={20} />
                        <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">Detailed Job Summary</h2>
                    </div>
                    <p className="text-gray-400 text-[13px] font-medium mt-0.5 ml-7">Expandable rows showing daily job details</p>
                </div>
                <div className="divide-y divide-gray-50 border-t border-gray-50">
                    {[
                        { name: "Michael Stevens - February 1-7, 2026", details: "14 jobs completed across 3 routes", passengers: 168, status: "All Completed" },
                        { name: "Sarah Mitchell - February 1-7, 2026", details: "13 jobs completed across 2 routes", passengers: 156, status: "All Completed" },
                        { name: "David Rodriguez - February 1-7, 2026", details: "12 jobs completed across 2 routes", passengers: 144, status: "All Completed" },
                    ].map((item, idx) => (
                        <div key={idx} className="px-8 py-6 flex items-center justify-between hover:bg-gray-50/20 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-5">
                                <HiChevronRight className="text-gray-300 group-hover:text-blue-600 transition-colors" size={20} />
                                <div>
                                    <div className="text-[15px] font-bold text-gray-900">{item.name}</div>
                                    <div className="text-[12px] text-gray-400 mt-1 font-medium tracking-wide">{item.details}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <div className="text-right">
                                    <div className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Total Passengers</div>
                                    <div className="text-[18px] font-bold text-gray-900 leading-none mt-1">{item.passengers}</div>
                                </div>
                                <span className="inline-flex px-4 py-2 rounded-full bg-green-50 text-green-600 text-[11px] font-bold tracking-wider italic">
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky/Bottom Footer Bar */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 ml-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#004D6D] ring-4 ring-blue-50/50">
                        <span className="text-[16px] font-bold italic">S</span>
                    </div>
                    <div>
                        <div className="text-[15px] font-bold text-gray-900 tracking-tight">Report Generated Successfully</div>
                        <div className="text-[12px] text-gray-400 font-medium tracking-wide">
                            80 staff members <span className="mx-1.5 opacity-30">•</span> 1,847 total jobs <span className="mx-1.5 opacity-30">•</span> February 2026
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2.5 px-6 py-2.5 border border-gray-100 rounded-[12px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <HiOutlinePrinter size={18} className="text-gray-400" />
                        Print Report
                    </button>
                    <button className="flex items-center gap-2.5 px-6 py-2.5 border border-gray-100 rounded-[12px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <HiOutlineDownload size={18} className="text-green-500" />
                        Export Excel
                    </button>
                    <button className="flex items-center gap-2.5 px-6 py-2.5 bg-red-500 text-white rounded-[12px] text-[13px] font-bold hover:bg-red-600 shadow-sm transition-all active:scale-95">
                        <HiOutlineDownload size={18} />
                        Export PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Report;
