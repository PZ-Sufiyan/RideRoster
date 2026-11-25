import React, { useEffect, useMemo, useState } from 'react';
import {
    HiOutlineDownload,
    HiOutlineFilter,
    HiOutlineCalendar,
    HiSearch,
    HiChevronLeft,
    HiChevronRight,
    HiOutlineChartBar,
} from 'react-icons/hi';
import {
    MdAssignment,
    MdPeople,
    MdRoute,
    MdAnalytics,
    MdDirectionsCar,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAdminReport } from '../../../../hooks/useAdminReport';
import {
    monthInputValue,
    monthLabel,
    parseMonthInput,
} from '../../../../services/adminReportService';
import { downloadAdminMonthlyReportPdf } from '../../../../services/adminReportPdfService';
import { ShimmerBlock } from '../../../../utils/Shimmer';

const ITEMS_PER_PAGE = 8;

const Report = () => {
    const navigate = useNavigate();
    const now = new Date();
    const [monthValue, setMonthValue] = useState(monthInputValue(now.getFullYear(), now.getMonth() + 1));
    const [roleFilter, setRoleFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [reportError, setReportError] = useState(null);

    const { year, month } = useMemo(() => parseMonthInput(monthValue), [monthValue]);
    const periodText = useMemo(() => `for ${monthLabel(year, month)}`, [year, month]);
    const {
        companyName,
        data: report,
        loading,
        error,
    } = useAdminReport({ year, month, role: roleFilter });

    useEffect(() => {
        setPage(1);
        setReportError(null);
    }, [year, month, roleFilter]);

    const displayError = reportError || error;

    const filteredStaff = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = report?.staff || [];
        if (!q) return rows;
        return rows.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.role.toLowerCase().includes(q) ||
                String(s.status || '').toLowerCase().includes(q),
        );
    }, [report, search]);

    const totalPages = Math.max(1, Math.ceil(filteredStaff.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedStaff = filteredStaff.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );
    const rangeStart = filteredStaff.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const rangeEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredStaff.length);

    const handleNameClick = (staff) => {
        if (staff.role === 'Driver') {
            navigate(`/portal/reports/driver-performance?id=${encodeURIComponent(staff.id)}`);
            return;
        }
        navigate(`/portal/reports/pa-attendance?id=${encodeURIComponent(staff.id)}`);
    };

    const handleGeneratePdf = async () => {
        if (!report) {
            setReportError('Report data is not loaded yet.');
            return;
        }
        setGenerating(true);
        setReportError(null);
        try {
            downloadAdminMonthlyReportPdf({
                companyName,
                report,
            });
        } catch (e) {
            setReportError(e?.message || 'Could not generate PDF.');
        } finally {
            setGenerating(false);
        }
    };

    const stats = [
        {
            title: 'Total Jobs',
            value: report?.stats?.totalJobs,
            icon: <HiOutlineChartBar className="text-blue-600" size={20} />,
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Total Drivers',
            value: report?.stats?.totalDrivers,
            icon: <MdDirectionsCar className="text-blue-600" size={20} />,
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Total PAs',
            value: report?.stats?.totalPas,
            icon: <MdPeople className="text-green-600" size={20} />,
            bgColor: 'bg-green-50',
        },
        {
            title: 'Total Sessions',
            value: report?.stats?.totalSessions,
            icon: <MdAssignment className="text-orange-600" size={20} />,
            bgColor: 'bg-orange-50',
        },
    ];

    const topStaff = report?.topStaffBySessions || [];
    const topMax = Math.max(1, ...topStaff.map((s) => s.value || 0));
    const weekBars = report?.morningVsEveningByWeek || [];
    const weekMax = Math.max(
        1,
        ...weekBars.flatMap((w) => [w.morning || 0, w.evening || 0]),
    );

    const fmt = (n) =>
        loading ? (
            <ShimmerBlock className="h-8 w-16 rounded-md inline-block" />
        ) : (
            Number(n ?? 0).toLocaleString()
        );

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Monthly Performance Report</h1>
                    <p className="text-gray-400 text-[13px] font-medium mt-0.5">
                        Jobs, staff, and sessions for the selected month
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleGeneratePdf}
                    disabled={loading || generating || !report}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#004D6D] text-white rounded-[10px] text-[13px] font-bold hover:bg-[#003c55] shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                >
                    {generating ? (
                        <>Generating…</>
                    ) : (
                        <>
                            <MdAnalytics size={18} />
                            Generate PDF
                        </>
                    )}
                </button>
            </div>

            {displayError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {displayError}
                </div>
            )}

            <div className="bg-white rounded-[20px] shadow-sm border border-gray-50 p-6">
                <div className="flex items-center gap-2.5 mb-6">
                    <HiOutlineFilter className="text-[#004D6D]" size={20} />
                    <h2 className="text-[17px] font-bold text-gray-900">Report Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1">
                            Month & Year <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="month"
                                value={monthValue}
                                onChange={(e) => setMonthValue(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-700">Role Filter</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="driver">Driver</option>
                            <option value="pa">PA</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex flex-col justify-between min-h-[140px]"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-[14px] ${stat.bgColor} flex items-center justify-center`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="text-[28px] font-bold text-gray-900 leading-none min-h-9 flex items-center">
                                {fmt(stat.value)}
                            </div>
                            <h3 className="text-gray-500 text-[13px] font-medium mt-1">{stat.title}</h3>
                        </div>
                        <div className="text-[12px] font-semibold mt-4 text-gray-400">{periodText}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <MdAssignment className="text-blue-600" size={20} />
                            <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">Staff Performance</h2>
                        </div>
                        <p className="text-gray-400 text-[13px] font-medium mt-0.5 ml-7">
                            Jobs and sessions {periodText}
                        </p>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search staff..."
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-[12px] text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-72"
                        />
                        <HiSearch className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                    </div>
                </div>

                <div className="overflow-x-auto mt-4 px-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-4 py-4">Staff Name</th>
                                <th className="px-4 py-4">Role</th>
                                <th className="px-4 py-4 text-center">Jobs Assigned</th>
                                <th className="px-4 py-4 text-center">Total Sessions</th>
                                <th className="px-4 py-4 text-center">Morning</th>
                                <th className="px-4 py-4 text-center">Evening</th>
                                <th className="px-4 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                                        Loading staff…
                                    </td>
                                </tr>
                            )}
                            {!loading && paginatedStaff.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                                        No staff found for this filter.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                paginatedStaff.map((staff) => (
                                    <tr key={`${staff.role}-${staff.id}`} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="px-4 py-5">
                                            <button
                                                type="button"
                                                onClick={() => handleNameClick(staff)}
                                                className="flex items-center gap-3 text-left group/name hover:opacity-80 transition-opacity"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shrink-0">
                                                    <img src={staff.avatar} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="text-[13px] font-bold text-[#004D6D] leading-none group-hover/name:underline underline-offset-2">
                                                    {staff.name}
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-4 py-5">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[10px] font-bold ${
                                                    staff.role === 'Driver'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-green-50 text-green-600'
                                                }`}
                                            >
                                                {staff.role === 'Driver' ? <MdRoute size={12} /> : <MdPeople size={12} />}
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 text-[13px] font-bold text-gray-900 text-center">
                                            {staff.jobsAssigned}
                                        </td>
                                        <td className="px-4 py-5 text-[13px] font-bold text-gray-900 text-center">
                                            {staff.totalSessions}
                                        </td>
                                        <td className="px-4 py-5 text-[13px] font-medium text-gray-500 text-center">
                                            {staff.morningSessions}
                                        </td>
                                        <td className="px-4 py-5 text-[13px] font-medium text-gray-500 text-center">
                                            {staff.eveningSessions}
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className="inline-flex px-3 py-1 rounded-[10px] bg-green-50 text-green-600 text-[10px] font-bold tracking-wide">
                                                {staff.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-5 bg-gray-50/20 flex items-center justify-between border-t border-gray-50">
                    <span className="text-[12px] font-bold text-gray-400">
                        {filteredStaff.length === 0
                            ? '0 staff'
                            : `Showing ${rangeStart}–${rangeEnd} of ${filteredStaff.length} staff`}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white text-gray-400 transition-colors disabled:opacity-40"
                        >
                            <HiChevronLeft size={18} />
                        </button>
                        <span className="px-3 text-[13px] font-bold text-gray-600">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white text-gray-400 transition-colors disabled:opacity-40"
                        >
                            <HiChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white p-7 rounded-[24px] shadow-sm border border-gray-50">
                    <div className="flex items-center gap-2.5 mb-1">
                        <HiOutlineChartBar size={20} className="text-blue-600" />
                        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">
                            Sessions Completed by Staff
                        </h3>
                    </div>
                    <p className="text-gray-400 text-[12px] font-medium mb-10 ml-7">Top 5 · {periodText}</p>

                    {topStaff.length === 0 && !loading && (
                        <p className="text-sm text-gray-400 py-16 text-center">No sessions in this month yet.</p>
                    )}

                    {topStaff.length > 0 && (
                        <div className="h-72 flex items-end justify-between gap-4 px-4 relative">
                            <div className="absolute inset-0 top-0 bottom-14 flex flex-col justify-between pointer-events-none px-4">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="border-b border-gray-50 w-full h-0" />
                                ))}
                            </div>
                            {topStaff.map((item) => (
                                <div key={item.id} className="flex-1 flex flex-col items-center gap-3 relative z-10">
                                    <div className="text-[10px] font-bold text-gray-400 mb-0.5">{item.value}</div>
                                    <div
                                        className="w-full max-w-[40px] rounded-t-[4px] bg-[#004D6D] transition-all hover:brightness-110 shadow-sm"
                                        style={{ height: `${(item.value / topMax) * 100}%`, minHeight: item.value ? 8 : 0 }}
                                    />
                                    <div className="text-[10px] font-bold text-gray-500 truncate w-full text-center">
                                        {item.name.split(' ')[0]}
                                    </div>
                                    <div className="text-[9px] text-gray-400">{item.role}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-5 bg-white p-7 rounded-[24px] shadow-sm border border-gray-50">
                    <div className="flex items-center gap-2.5 mb-1">
                        <MdAssignment size={20} className="text-green-600" />
                        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Morning vs Evening</h3>
                    </div>
                    <p className="text-gray-400 text-[12px] font-medium mb-8 ml-7">Sessions by trip type · {periodText}</p>

                    <div className="flex items-center justify-center gap-8 mb-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-500 shadow-sm" />
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Morning</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-[3px] bg-orange-500 shadow-sm" />
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Evening</span>
                        </div>
                    </div>

                    {weekBars.length === 0 && !loading && (
                        <p className="text-sm text-gray-400 py-12 text-center">No session data.</p>
                    )}

                    {weekBars.length > 0 && (
                        <div className="h-56 flex items-end justify-around gap-2 px-4 relative">
                            <div className="absolute inset-0 px-4 bottom-12 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="border-b border-gray-50 w-full h-0" />
                                ))}
                            </div>
                            {weekBars.map((week) => (
                                <div key={week.label} className="flex flex-col items-center gap-4 flex-1 relative z-10">
                                    <div className="flex items-end gap-1.5 h-40 w-full justify-center">
                                        <div
                                            className="w-8 bg-blue-500 rounded-t-[4px] shadow-sm"
                                            style={{
                                                height: `${((week.morning || 0) / weekMax) * 100}%`,
                                                minHeight: week.morning ? 4 : 0,
                                            }}
                                            title={`Morning: ${week.morning}`}
                                        />
                                        <div
                                            className="w-8 bg-orange-500 rounded-t-[4px] shadow-sm"
                                            style={{
                                                height: `${((week.evening || 0) / weekMax) * 100}%`,
                                                minHeight: week.evening ? 4 : 0,
                                            }}
                                            title={`Evening: ${week.evening}`}
                                        />
                                    </div>
                                    <div className="text-[11px] font-bold text-gray-400 tracking-wide uppercase">
                                        {week.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-[15px] font-bold text-gray-900 tracking-tight">
                        {loading ? 'Loading report…' : 'Report ready'}
                    </div>
                    <div className="text-[12px] text-gray-400 font-medium tracking-wide mt-0.5">
                        {(report?.staff || []).length} staff
                        <span className="mx-1.5 opacity-30">•</span>
                        {Number(report?.stats?.totalSessions || 0).toLocaleString()} sessions
                        <span className="mx-1.5 opacity-30">•</span>
                        {monthLabel(year, month)}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleGeneratePdf}
                    disabled={loading || generating || !report}
                    className="flex items-center gap-2.5 px-6 py-2.5 bg-[#004D6D] text-white rounded-[12px] text-[13px] font-bold hover:bg-[#003c55] shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                >
                    <HiOutlineDownload size={18} />
                    {generating ? 'Generating…' : 'Export PDF'}
                </button>
            </div>
        </div>
    );
};

export default Report;
