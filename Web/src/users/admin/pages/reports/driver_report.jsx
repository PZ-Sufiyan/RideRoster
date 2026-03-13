import React, { useState } from 'react';
import {
    HiDotsVertical,
    HiSearch,
    HiFilter,
    HiChevronLeft,
    HiChevronRight,
    HiOutlinePrinter,
    HiOutlineDownload,
} from 'react-icons/hi';
import { MdFileDownload } from 'react-icons/md';

/* ─────────────────────────────────────────────
   Tiny inline SVG charts (no external lib)
───────────────────────────────────────────── */

/** Daily Job Completion Trend – line chart */
const LineChart = () => {
    // X positions: Jan1, Jan5, Jan10, Jan15, Jan20, Jan25, Jan31
    const points = [
        [0, 10],
        [60, 12],
        [130, 11],
        [200, 17],
        [270, 14],
        [340, 18],
        [400, 13],
    ];
    const w = 400;
    const h = 100;
    const xLabels = ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 31'];
    const yMax = 20;
    const toSvg = ([x, y]) => `${x},${h - (y / yMax) * h}`;
    const pathD = `M ${points.map(toSvg).join(' L ')}`;
    const areaD = `M ${toSvg(points[0])} ${points.map(toSvg).join(' L ')} L ${points[points.length - 1][0]},${h} L ${points[0][0]},${h} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" style={{ height: 120 }}>
            <defs>
                <linearGradient id="drLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004D6D" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#004D6D" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* horizontal grid lines */}
            {[5, 10, 15, 20].map(v => (
                <line
                    key={v}
                    x1={0} y1={h - (v / yMax) * h}
                    x2={w} y2={h - (v / yMax) * h}
                    stroke="#e5e7eb" strokeWidth="1"
                />
            ))}
            {/* y labels */}
            {[5, 10, 15, 20].map(v => (
                <text key={v} x={-6} y={h - (v / yMax) * h + 4} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>
            ))}
            {/* x labels */}
            {xLabels.map((label, i) => (
                <text key={i} x={points[i][0]} y={h + 14} textAnchor="middle" fontSize="7" fill="#9ca3af">{label}</text>
            ))}
            {/* area */}
            <path d={areaD} fill="url(#drLineGrad)" />
            {/* line */}
            <path d={pathD} fill="none" stroke="#004D6D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* dots */}
            {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={h - (y / yMax) * h} r="3" fill="#fff" stroke="#004D6D" strokeWidth="1.5" />
            ))}
        </svg>
    );
};

/** Route-wise Job Distribution – bar chart */
const BarChart = () => {
    const data = [
        { label: 'Route A', value: 165, color: '#004D6D' },
        { label: 'Route B', value: 160, color: '#5b9bbf' },
        { label: 'Route D', color: '#93c5d8', value: 130 },
    ];
    const max = 175;
    const w = 280;
    const h = 110;
    const barW = 56;
    const gap = 28;
    const startX = 28;

    return (
        <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full" style={{ height: 140 }}>
            {/* grid lines */}
            {[50, 100, 150].map(v => (
                <line key={v} x1={startX} y1={h - (v / max) * h} x2={w - 10} y2={h - (v / max) * h} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            {/* y labels */}
            {[50, 100, 150].map(v => (
                <text key={v} x={startX - 4} y={h - (v / max) * h + 4} textAnchor="end" fontSize="7" fill="#9ca3af">{v}</text>
            ))}
            {/* bars */}
            {data.map((d, i) => {
                const bh = (d.value / max) * h;
                const x = startX + i * (barW + gap);
                return (
                    <g key={i}>
                        <rect x={x} y={h - bh} width={barW} height={bh} fill={d.color} rx="3" />
                        <text x={x + barW / 2} y={h + 14} textAnchor="middle" fontSize="8" fill="#6b7280">{d.label}</text>
                    </g>
                );
            })}
            {/* baseline */}
            <line x1={startX} y1={h} x2={w - 10} y2={h} stroke="#e5e7eb" strokeWidth="1" />
        </svg>
    );
};

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const DriverReport = () => {
    const [searchJobs, setSearchJobs] = useState('');

    const jobHistory = [
        { date: 'Jan 31, 2024', route: 'Route A – Downtown Express', passengers: 18, pickup: '07:15 AM', dropoff: '08:45 AM', status: 'Completed', remarks: 'On time' },
        { date: 'Jan 31, 2024', route: 'Route A – Downtown Express', passengers: 16, pickup: '04:30 PM', dropoff: '06:00 PM', status: 'Completed', remarks: '5 min delay' },
        { date: 'Jan 30, 2024', route: 'Route E – Suburban Line',    passengers: 22, pickup: '07:00 AM', dropoff: '08:30 AM', status: 'Completed', remarks: 'On time' },
        { date: 'Jan 30, 2024', route: 'Route B – Suburban Line',    passengers: 20, pickup: '04:15 PM', dropoff: '05:45 PM', status: 'Completed', remarks: 'On time' },
        { date: 'Jan 29, 2024', route: 'Route D – University Campus', passengers: 25, pickup: '08:45 AM', dropoff: '–',        status: 'Cancelled', remarks: 'Vehicle breakdown' },
        { date: 'Jan 29, 2024', route: 'Route A – Downtown Express', passengers: 19, pickup: '07:00 AM', dropoff: '08:35 AM', status: 'Completed', remarks: '10 min delay' },
        { date: 'Jan 29, 2024', route: 'Route A – Downtown Express', passengers: 17, pickup: '04:25 PM', dropoff: '05:50 PM', status: 'Completed', remarks: 'On time' },
        { date: 'Jan 28, 2024', route: 'Route B – Suburban Line',    passengers: 21, pickup: '07:05 AM', dropoff: '08:35 AM', status: 'Completed', remarks: 'On time' },
    ];

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Driver Performance Report</h1>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        <MdFileDownload size={15} className="text-gray-500" />
                        Export Excel
                    </button>
                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#004D6D] hover:bg-[#003c55] transition-all">
                        <HiOutlineDownload size={15} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* ── Report Filters ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-[14px] font-bold text-gray-900 mb-4">Report Filters</h2>

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Select Driver */}
                    <div className="md:col-span-1 space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">
                            Select Driver <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D] bg-white pr-8">
                                <option>Michael Rodriguez – DR-2847</option>
                            </select>
                            <HiChevronRight className="absolute right-2.5 top-2.5 text-gray-400 rotate-90" size={14} />
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">Start Date</label>
                        <input
                            type="date"
                            defaultValue="2024-01-01"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                        />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">End Date</label>
                        <input
                            type="date"
                            defaultValue="2024-01-31"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                        />
                    </div>

                    {/* Generate Report */}
                    <div className="flex items-end">
                        <button className="w-full py-2 bg-[#004D6D] text-white text-[12px] font-bold rounded-lg hover:bg-[#003c55] transition-all">
                            Generate Report
                        </button>
                    </div>
                </div>

                {/* Row 2 – Filter by Route */}
                <div className="mt-4 space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Filter by Route (Optional)</label>
                    <div className="relative">
                        <select className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#004D6D] bg-white pr-8">
                            <option>All Routes</option>
                            <option>Route A</option>
                            <option>Route B</option>
                            <option>Route D</option>
                        </select>
                        <HiChevronRight className="absolute right-2.5 top-2.5 text-gray-400 rotate-90" size={14} />
                    </div>
                </div>
            </div>

            {/* ── Driver Profile Card ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <img
                                src="https://i.pravatar.cc/150?u=DR-2847"
                                alt="Michael Rodriguez"
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                            />
                            {/* green online dot */}
                            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <div className="text-[16px] font-bold text-gray-900">Michael Rodriguez</div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                    {/* ID card icon */}
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                                        <rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="7" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M11 8h4M11 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    Driver ID: DR-2847
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                    {/* route icon */}
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                                        <path d="M4 4h12M4 10h12M4 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    Routes: A, B, D
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: summary stats */}
                    <div className="flex items-center gap-8 md:gap-12">
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-gray-900 leading-none">487</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Total Jobs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-gray-900 leading-none">31</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Active Days</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-gray-900 leading-none">15.7</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Avg Jobs/Day</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-green-500 leading-none">96.8%</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Attendance</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 4 Metric Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Morning Trips */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                            {/* gear icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-green-500">+12.5%</span>
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none">243</div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Morning Trips Completed</div>
                </div>

                {/* Return Trips */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                            {/* moon icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-green-500">+3.3%</span>
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none">244</div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Return Trips Completed</div>
                </div>

                {/* Missed / Cancelled */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                            {/* x-circle icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-red-500">-3.2%</span>
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none">7</div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Missed / Cancelled Jobs</div>
                </div>

                {/* On-Time Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                            {/* clock icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-green-500">+5.1%</span>
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none">94.2%</div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">On-Time Performance</div>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Daily Job Completion Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-4">Daily Job Completion Trend</h3>
                    <LineChart />
                </div>

                {/* Route-wise Job Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-4">Route-wise Job Distribution</h3>
                    <BarChart />
                </div>
            </div>

            {/* ── Job History Table ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Table header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-[14px] font-bold text-gray-900">Job History</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <HiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={searchJobs}
                                onChange={e => setSearchJobs(e.target.value)}
                                className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D] w-44"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 transition-all">
                            <HiFilter size={13} />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="border-b border-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wide">
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Route Name</th>
                                <th className="px-5 py-3 text-center">Passengers</th>
                                <th className="px-5 py-3">Pickup Time</th>
                                <th className="px-5 py-3">Drop-off Time</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Remarks</th>
                                <th className="px-5 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {jobHistory.map((job, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{job.date}</td>
                                    <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">{job.route}</td>
                                    <td className="px-5 py-3.5 text-gray-600 text-center">{job.passengers}</td>
                                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{job.pickup}</td>
                                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{job.dropoff}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${job.status === 'Completed' ? 'text-green-600' : 'text-red-500'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500">{job.remarks}</td>
                                    <td className="px-5 py-3.5 text-center">
                                        <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all mx-auto">
                                            <HiDotsVertical size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Showing 1 to 8 of 487 entries</span>
                    <div className="flex items-center gap-1">
                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors">
                            <HiChevronLeft size={15} />
                        </button>
                        {[1, 2, 3].map(n => (
                            <button
                                key={n}
                                className={`w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold transition-colors ${n === 1 ? 'bg-[#004D6D] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                {n}
                            </button>
                        ))}
                        <span className="px-1 text-gray-300 text-[11px] font-bold">...</span>
                        <button className="w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold text-gray-500 hover:bg-gray-100 transition-colors">61</button>
                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors">
                            <HiChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Attendance & Availability Summary ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-[14px] font-bold text-gray-900 mb-4">Attendance &amp; Availability Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Working Days */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            {/* calendar icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[20px] font-bold text-gray-900 leading-none">31</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">Working Days</div>
                            <div className="text-[10px] text-green-500 font-bold mt-0.5">100% Present</div>
                        </div>
                    </div>

                    {/* Leaves Taken */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                            {/* umbrella / beach icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
                                <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[20px] font-bold text-gray-900 leading-none">0</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">Leaves Taken</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">0 days off</div>
                        </div>
                    </div>

                    {/* Late Starts */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                            {/* refresh / late icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8">
                                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.54" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[20px] font-bold text-gray-900 leading-none">2</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">Late Starts</div>
                            <div className="text-[10px] text-orange-400 font-bold mt-0.5">Avg 8 min late</div>
                        </div>
                    </div>

                    {/* Early Finishes */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                            {/* fast-forward icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8">
                                <polygon points="13 19 22 12 13 5 13 19" /><polygon points="2 19 11 12 2 5 2 19" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-[20px] font-bold text-gray-900 leading-none">1</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">Early Finishes</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">15 min early</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Export & Actions ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-[13px] font-bold text-gray-900">Export &amp; Actions</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Download this report in various formats or print for records.</div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        <HiOutlinePrinter size={14} className="text-gray-500" />
                        Print Report
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        <MdFileDownload size={15} className="text-green-500" />
                        Export Excel
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#004D6D] hover:bg-[#003c55] transition-all">
                        <HiOutlineDownload size={14} />
                        Export PDF
                    </button>
                </div>
            </div>

        </div>
    );
};

export default DriverReport;
