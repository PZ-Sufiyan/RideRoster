import React, { useState } from 'react';
import {
    HiSearch,
    HiFilter,
    HiDotsVertical,
    HiChevronLeft,
    HiChevronRight,
    HiOutlinePrinter,
    HiOutlineDownload,
} from 'react-icons/hi';
import { MdFileDownload } from 'react-icons/md';

/* ─────────────────────────────────────────────
   Attendance Trend Line Chart (Last 6 Months)
───────────────────────────────────────────── */
const AttendanceTrendChart = () => {
    // ~6 months: Aug-Dec, Jan — values represent attendance %
    const months = ['Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023', 'Jan 2024'];
    const values = [44, 48, 43, 47, 45, 49]; // approx from screenshot
    const W = 340, H = 90;
    const yMin = 40, yMax = 52;
    const toX = i => (i / (months.length - 1)) * W;
    const toY = v => H - ((v - yMin) / (yMax - yMin)) * H;
    const pts = values.map((v, i) => [toX(i), toY(v)]);
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const areaPath = `M ${pts[0][0]} ${pts[0][1]} ${pts.map(p => `L ${p[0]} ${p[1]}`).join(' ')} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" style={{ height: 120 }}>
            <defs>
                <linearGradient id="paTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004D6D" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#004D6D" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* grid lines */}
            {[42, 44, 46, 48, 50].map(v => (
                <line key={v} x1={0} y1={toY(v)} x2={W} y2={toY(v)} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            {/* y labels */}
            {[42, 44, 46, 48, 50].map(v => (
                <text key={v} x={-4} y={toY(v) + 3} textAnchor="end" fontSize="7" fill="#9ca3af">{v}</text>
            ))}
            {/* area */}
            <path d={areaPath} fill="url(#paTrendGrad)" />
            {/* line */}
            <path d={linePath} fill="none" stroke="#004D6D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* dots */}
            {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#004D6D" strokeWidth="1.5" />
            ))}
            {/* x labels */}
            {months.map((m, i) => (
                <text key={i} x={toX(i)} y={H + 14} textAnchor="middle" fontSize="7" fill="#9ca3af">{m}</text>
            ))}
        </svg>
    );
};

/* ─────────────────────────────────────────────
   Monthly Availability Comparison Bar Chart
───────────────────────────────────────────── */
const AvailabilityBarChart = () => {
    const data = [
        { label: 'Aug', value: 88, color: '#5b9bbf' },
        { label: 'Sep', value: 92, color: '#5b9bbf' },
        { label: 'Oct', value: 85, color: '#5b9bbf' },
        { label: 'Nov', value: 90, color: '#5b9bbf' },
        { label: 'Dec', value: 95, color: '#10b981' },
        { label: 'Jan', value: 91, color: '#004D6D' },
    ];
    const W = 300, H = 90, barW = 30, gap = 18, startX = 18, yMax = 100;

    return (
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" style={{ height: 120 }}>
            {/* grid lines */}
            {[40, 60, 80, 100].map(v => (
                <line key={v} x1={startX} y1={H - (v / yMax) * H} x2={W - 4} y2={H - (v / yMax) * H} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            {/* y labels */}
            {[40, 60, 80, 100].map(v => (
                <text key={v} x={startX - 4} y={H - (v / yMax) * H + 3} textAnchor="end" fontSize="7" fill="#9ca3af">{v}</text>
            ))}
            {/* bars */}
            {data.map((d, i) => {
                const bh = (d.value / yMax) * H;
                const x = startX + i * (barW + gap);
                return (
                    <g key={i}>
                        <rect x={x} y={H - bh} width={barW} height={bh} fill={d.color} rx="3" />
                        <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="7.5" fill="#6b7280">{d.label}</text>
                    </g>
                );
            })}
            <line x1={startX} y1={H} x2={W - 4} y2={H} stroke="#e5e7eb" strokeWidth="1" />
        </svg>
    );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const PAReport = () => {
    const [search, setSearch] = useState('');

    const records = [
        { date: 'Jan 31, 2024', route: 'Route C – Downtown Area',   jobs: 4, status: 'Present',  reason: '–',                    notes: 'All jobs on board'       },
        { date: 'Jan 31, 2024', route: 'Route T – Overshire',       jobs: 3, status: 'Present',  reason: '–',                    notes: 'On time arrival'         },
        { date: 'Jan 09, 2024', route: 'Route C – Downtown Area',   jobs: 4, status: 'Present',  reason: '–',                    notes: 'No issues raised'        },
        { date: 'Jan 08, 2024', route: 'Route TR – Lonsdale',       jobs: 3, status: 'Present',  reason: '–',                    notes: '8 passengers assisted'   },
        { date: 'Jan 07, 2024', route: 'Route C – Downtown Area',   jobs: 4, status: 'Present',  reason: '–',                    notes: 'Standard procedure'      },
        { date: 'Jan 04, 2024', route: 'Route N – Occasions',       jobs: 0, status: 'Absent',   reason: 'PA was Emergency',     notes: 'Backup PA assigned'      },
        { date: 'Jan 03, 2024', route: 'Route T2 – Doorstep',       jobs: 3, status: 'Present',  reason: '–',                    notes: 'Routine feedback'        },
        { date: 'Jan 15, 2024', route: 'Route N – Occasions',       jobs: 0, status: 'Present',  reason: '–',                    notes: 'Standard assistance'     },
        { date: 'Jan 16, 2024', route: 'Route A – Montmayor',       jobs: 3, status: 'Present',  reason: '–',                    notes: 'Brief performance'       },
    ];

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">PA Attendance &amp; Availability Report</h1>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        <HiOutlineDownload size={14} className="text-red-500" />
                        Export PDF
                    </button>
                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#004D6D] hover:bg-[#003c55] transition-all">
                        <MdFileDownload size={15} />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* ── Report Filters ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-[13px] font-bold text-gray-900 mb-4">Report Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Passenger Assistant */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600">Passenger Assistant</label>
                        <div className="relative">
                            <select className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D] bg-white pr-7">
                                <option>All Passenger Assistants</option>
                            </select>
                            <HiChevronRight className="absolute right-2.5 top-2.5 text-gray-400 rotate-90 pointer-events-none" size={13} />
                        </div>
                    </div>

                    {/* Month */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600">Month</label>
                        <div className="relative">
                            <select className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D] bg-white pr-7">
                                <option>January 2024</option>
                            </select>
                            <HiChevronRight className="absolute right-2.5 top-2.5 text-gray-400 rotate-90 pointer-events-none" size={13} />
                        </div>
                    </div>

                    {/* Active Filter */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600">Active Filter</label>
                        <div className="relative">
                            <select className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D] bg-white pr-7">
                                <option>All Children</option>
                            </select>
                            <HiChevronRight className="absolute right-2.5 top-2.5 text-gray-400 rotate-90 pointer-events-none" size={13} />
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex items-end">
                        <button className="w-full flex items-center justify-center gap-2 py-2 bg-[#004D6D] text-white text-[12px] font-bold rounded-lg hover:bg-[#003c55] transition-all">
                            {/* analytics icon */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {/* ── 5 Metric Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Working Days */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-gray-900 leading-none">22</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">Working Days</div>
                    </div>
                </div>

                {/* Days Present */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-gray-900 leading-none">20</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">Days Present</div>
                    </div>
                </div>

                {/* Days Absent */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-gray-900 leading-none">1</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">Days Absent</div>
                    </div>
                </div>

                {/* Late Starts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[22px] font-bold text-gray-900 leading-none">1</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">Late Starts</div>
                    </div>
                </div>

                {/* Punctuality Rate */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8">
                            <line x1="19" y1="5" x2="5" y2="19" />
                            <circle cx="6.5" cy="6.5" r="2.5" />
                            <circle cx="17.5" cy="17.5" r="2.5" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[20px] font-bold text-gray-900 leading-none">90.9%</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">Punctuality Rate</div>
                    </div>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Attendance Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-4">Attendance Trend (Last 6 Months)</h3>
                    <AttendanceTrendChart />
                </div>

                {/* Monthly Availability Comparison */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-4">Monthly Availability Comparison</h3>
                    <AvailabilityBarChart />
                </div>
            </div>

            {/* ── Detailed Attendance Records ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Table header bar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-[14px] font-bold text-gray-900">Detailed Attendance Records</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <HiSearch className="absolute left-3 top-2.5 text-gray-400" size={13} />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D] w-44"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 transition-all">
                            <HiFilter size={12} />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wide">
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Assigned Route</th>
                                <th className="px-5 py-3 text-center">Job Count</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Reason</th>
                                <th className="px-5 py-3">Notes</th>
                                <th className="px-5 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {records.map((row, idx) => {
                                const isAbsent = row.status === 'Absent';
                                return (
                                    <tr
                                        key={idx}
                                        className={`transition-colors ${isAbsent ? 'bg-red-50/60' : 'hover:bg-gray-50/40'}`}
                                    >
                                        <td className="px-5 py-3 text-[11px] text-gray-600 whitespace-nowrap">{row.date}</td>
                                        <td className="px-5 py-3 text-[11px] text-gray-600 whitespace-nowrap">{row.route}</td>
                                        <td className="px-5 py-3 text-[11px] text-gray-700 font-medium text-center">{row.jobs}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isAbsent ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {isAbsent ? '● Absent' : '● Present'}
                                            </span>
                                        </td>
                                        <td className={`px-5 py-3 text-[11px] ${isAbsent ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                            {row.reason}
                                        </td>
                                        <td className="px-5 py-3 text-[11px] text-gray-500">{row.notes}</td>
                                        <td className="px-5 py-3 text-center">
                                            <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all mx-auto">
                                                <HiDotsVertical size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Showing 1 to 10 of 22 records</span>
                    <div className="flex items-center gap-1">
                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors">
                            <HiChevronLeft size={14} />
                        </button>
                        {[1, 2, 3].map(n => (
                            <button
                                key={n}
                                className={`w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold transition-colors ${n === 1 ? 'bg-[#004D6D] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                {n}
                            </button>
                        ))}
                        <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors">
                            <HiChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Export Report ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-[13px] font-bold text-gray-900">Export Report</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Download this report data to your preferred format.</div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        <HiOutlinePrinter size={13} className="text-gray-500" />
                        Print Report
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        <HiOutlineDownload size={13} className="text-red-500" />
                        Export as PDF
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#004D6D] hover:bg-[#003c55] transition-all">
                        <MdFileDownload size={15} />
                        Export as Excel
                    </button>
                </div>
            </div>

        </div>
    );
};

export default PAReport;
