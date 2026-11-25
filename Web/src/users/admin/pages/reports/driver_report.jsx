import React, { useEffect, useMemo, useState } from 'react';
import {
    HiOutlineDownload,
    HiOutlineCalendar,
    HiSearch,
    HiChevronLeft,
    HiChevronRight,
    HiArrowLeft,
} from 'react-icons/hi';
import {
    MdAnalytics,
    MdDirectionsCar,
    MdWbSunny,
    MdNightsStay,
    MdWarning,
} from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminDriverReport } from '../../../../hooks/useAdminDriverReport';
import {
    monthInputValue,
    monthLabel,
    parseMonthInput,
} from '../../../../services/adminReportService';
import { downloadAdminDriverReportPdf } from '../../../../services/adminDriverReportPdfService';
import FleetBadge from '../../../../components/FleetBadge';
import { ShimmerBlock } from '../../../../utils/Shimmer';

const ITEMS_PER_PAGE = 10;

function money(n) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return `£${Number(n).toFixed(2)}`;
}

function statusClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') return 'bg-green-50 text-green-600';
    if (s === 'skipped' || s === 'incomplete') return 'bg-orange-50 text-orange-600';
    if (s === 'cancelled' || s === 'canceled') return 'bg-red-50 text-red-600';
    if (s === 'active') return 'bg-blue-50 text-blue-600';
    return 'bg-gray-50 text-gray-600';
}

const DriverReport = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const driverId = searchParams.get('id') || '';

    const now = new Date();
    const [monthValue, setMonthValue] = useState(monthInputValue(now.getFullYear(), now.getMonth() + 1));
    const [searchJobs, setSearchJobs] = useState('');
    const [searchSessions, setSearchSessions] = useState('');
    const [sessionPage, setSessionPage] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [pdfError, setPdfError] = useState(null);

    const { year, month } = useMemo(() => parseMonthInput(monthValue), [monthValue]);
    const periodText = useMemo(() => `for ${monthLabel(year, month)}`, [year, month]);

    const {
        companyName,
        driver,
        data: report,
        profileLoading,
        loading,
        error,
    } = useAdminDriverReport({
        driverId,
        year,
        month,
    });

    useEffect(() => {
        setSessionPage(1);
        setPdfError(null);
    }, [driverId, year, month]);

    const stats = report?.stats;

    const filteredJobs = useMemo(() => {
        const rows = report?.jobsBreakdown || [];
        const q = searchJobs.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (j) =>
                String(j.jobName || '').toLowerCase().includes(q) ||
                String(j.school || '').toLowerCase().includes(q),
        );
    }, [report, searchJobs]);

    const filteredSessions = useMemo(() => {
        const rows = report?.sessionHistory || [];
        const q = searchSessions.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (s) =>
                String(s.jobName || '').toLowerCase().includes(q) ||
                String(s.direction || '').toLowerCase().includes(q) ||
                String(s.status || '').toLowerCase().includes(q) ||
                String(s.date || '').includes(q),
        );
    }, [report, searchSessions]);

    const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(sessionPage, totalPages);
    const paginatedSessions = filteredSessions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    const dailyTrend = report?.dailyTrend || [];
    const activeDays = useMemo(
        () => dailyTrend.filter((d) => (d.completed || 0) > 0),
        [dailyTrend],
    );
    const dayMax = Math.max(1, ...activeDays.map((d) => d.completed || 0));
    const dayTicks = useMemo(() => {
        const max = dayMax;
        if (max <= 1) return [1, 0];
        if (max === 2) return [2, 1, 0];
        return [max, Math.round(max / 2), 0];
    }, [dayMax]);
    const mv = report?.morningVsEvening || { morning: 0, evening: 0 };
    const mvMax = Math.max(1, mv.morning || 0, mv.evening || 0);

    const handlePdf = () => {
        if (!report) {
            setPdfError('Report data is not loaded yet.');
            return;
        }
        setGenerating(true);
        setPdfError(null);
        try {
            downloadAdminDriverReportPdf({ companyName, report });
        } catch (e) {
            setPdfError(e?.message || 'Could not generate PDF.');
        } finally {
            setGenerating(false);
        }
    };

    const fmt = (n) =>
        loading ? <ShimmerBlock className="h-7 w-14 rounded-md inline-block" /> : Number(n ?? 0).toLocaleString();

    const displayError = pdfError || error;

    if (!driverId) {
        return (
            <div className="space-y-4 max-w-[1400px] mx-auto">
                <button
                    type="button"
                    onClick={() => navigate('/portal/reports')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#004D6D] hover:underline"
                >
                    <HiArrowLeft size={16} /> Back to reports
                </button>
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Open a driver from the staff table to view their performance report.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/portal/reports')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#004D6D] hover:underline mb-2"
                    >
                        <HiArrowLeft size={16} /> Back to reports
                    </button>
                    <h1 className="text-[22px] font-bold text-gray-900">Driver Performance Report</h1>
                    <p className="text-[13px] text-gray-400 font-medium mt-0.5">Sessions and jobs {periodText}</p>
                </div>
                <button
                    type="button"
                    onClick={handlePdf}
                    disabled={loading || generating || !report}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#004D6D] hover:bg-[#003c55] transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                    <MdAnalytics size={15} />
                    {generating ? 'Generating…' : 'Generate PDF'}
                </button>
            </div>

            {displayError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {displayError}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="max-w-xs space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">
                        Month & Year <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="month"
                            value={monthValue}
                            onChange={(e) => setMonthValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D] pr-9"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        {profileLoading ? (
                            <ShimmerBlock className="w-16 h-16 rounded-full" />
                        ) : (
                            <img
                                src={driver?.avatar}
                                alt=""
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                            />
                        )}
                        <div>
                            <div className="text-[16px] font-bold text-gray-900">
                                {profileLoading ? <ShimmerBlock className="h-5 w-40 rounded" /> : driver?.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {!profileLoading && <FleetBadge fleet={driver?.fleet} />}
                                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">
                                    {profileLoading ? '—' : driver?.status}
                                </span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1.5 font-medium">
                                {profileLoading ? '—' : driver?.vehicleLabel || 'No vehicle assigned'}
                                {!profileLoading && driver?.licenseNo ? ` · License ${driver.licenseNo}` : ''}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-gray-900 leading-none min-h-7 flex items-center justify-center">
                                {fmt(stats?.jobsAssigned)}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Jobs Assigned</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-gray-900 leading-none min-h-7 flex items-center justify-center">
                                {fmt(stats?.totalSessions)}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Total Sessions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-gray-900 leading-none min-h-7 flex items-center justify-center">
                                {fmt(stats?.completedSessions)}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[22px] font-bold text-green-500 leading-none min-h-7 flex items-center justify-center">
                                {loading ? (
                                    <ShimmerBlock className="h-7 w-14 rounded-md" />
                                ) : (
                                    `${Number(stats?.completionRate || 0)}%`
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 font-medium">Completion</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                        <MdWbSunny size={18} />
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none min-h-8 flex items-center">
                        {fmt(stats?.morningCompleted)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Morning Completed</div>
                    <div className="text-[11px] text-gray-400 mt-2 font-semibold">{periodText}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center mb-3 text-orange-500">
                        <MdNightsStay size={18} />
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none min-h-8 flex items-center">
                        {fmt(stats?.eveningCompleted)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Evening Completed</div>
                    <div className="text-[11px] text-gray-400 mt-2 font-semibold">{periodText}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-3 text-red-500">
                        <MdWarning size={18} />
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none min-h-8 flex items-center">
                        {fmt((stats?.skippedSessions || 0) + (stats?.incompleteSessions || 0))}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Skipped / Incomplete</div>
                    <div className="text-[11px] text-gray-400 mt-2 font-semibold">{periodText}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3 text-green-600">
                        {profileLoading ? (
                            <ShimmerBlock className="h-4 w-4 rounded" />
                        ) : driver?.isPrivate ? (
                            <MdAnalytics size={18} />
                        ) : (
                            <MdDirectionsCar size={18} />
                        )}
                    </div>
                    <div className="text-[26px] font-bold text-gray-900 leading-none min-h-8 flex items-center">
                        {loading || profileLoading ? (
                            <ShimmerBlock className="h-7 w-16 rounded-md" />
                        ) : driver?.isPrivate ? (
                            money(stats?.estimatedPay)
                        ) : (
                            Number(stats?.leaveDays || 0).toLocaleString()
                        )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium min-h-4">
                        {profileLoading ? (
                            <ShimmerBlock className="h-3 w-24 rounded" />
                        ) : driver?.isPrivate ? (
                            'Estimated Pay'
                        ) : (
                            'Leave Requests'
                        )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-2 font-semibold">{periodText}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-1">Daily Completed Sessions</h3>
                    <p className="text-[11px] text-gray-400 mb-4">
                        {periodText}
                        {!loading && activeDays.length > 0
                            ? ` · ${activeDays.length} day${activeDays.length === 1 ? '' : 's'} with sessions`
                            : ''}
                    </p>
                    {!loading && activeDays.length === 0 && (
                        <p className="text-sm text-gray-400 py-10 text-center">No completed sessions this month.</p>
                    )}
                    {(loading || activeDays.length > 0) && (
                        <div className="relative h-52 pl-7">
                            <div className="absolute left-0 top-0 bottom-8 w-6 flex flex-col justify-between text-[10px] font-semibold text-gray-300 select-none">
                                {dayTicks.map((t) => (
                                    <span key={t}>{t}</span>
                                ))}
                            </div>
                            <div className="absolute inset-0 left-7 bottom-8 flex flex-col justify-between pointer-events-none">
                                {dayTicks.map((t) => (
                                    <div key={`g-${t}`} className="border-b border-gray-100 w-full h-0" />
                                ))}
                            </div>
                            <div className="relative h-[calc(100%-2rem)] flex items-end justify-center gap-3 px-2">
                                {activeDays.map((d) => {
                                    const pct = ((d.completed || 0) / dayMax) * 100;
                                    const dayNum = String(d.date || '').slice(8, 10).replace(/^0/, '') || d.label;
                                    return (
                                        <div
                                            key={d.date}
                                            className="flex flex-col items-center justify-end h-full"
                                            style={{ width: activeDays.length <= 4 ? 56 : 36 }}
                                        >
                                            <div className="text-[10px] font-bold text-gray-500 mb-1">
                                                {d.completed}
                                            </div>
                                            <div
                                                className="w-full rounded-t-md bg-[#004D6D] shadow-sm"
                                                style={{
                                                    height: `${pct}%`,
                                                    minHeight: d.completed ? 10 : 0,
                                                }}
                                                title={`${d.date}: ${d.completed} completed`}
                                            />
                                            <div className="text-[10px] font-bold text-gray-400 mt-2 tabular-nums">
                                                {dayNum}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-1">Morning vs Evening</h3>
                    <p className="text-[11px] text-gray-400 mb-6">Completed sessions {periodText}</p>
                    <div className="flex items-end justify-center gap-10 h-44">
                        <div className="flex flex-col items-center gap-2 w-20">
                            <div className="text-[12px] font-bold text-gray-500">{mv.morning || 0}</div>
                            <div
                                className="w-14 bg-blue-500 rounded-t"
                                style={{
                                    height: `${((mv.morning || 0) / mvMax) * 140}px`,
                                    minHeight: mv.morning ? 6 : 0,
                                }}
                            />
                            <div className="text-[11px] font-bold text-gray-400">Morning</div>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-20">
                            <div className="text-[12px] font-bold text-gray-500">{mv.evening || 0}</div>
                            <div
                                className="w-14 bg-orange-500 rounded-t"
                                style={{
                                    height: `${((mv.evening || 0) / mvMax) * 140}px`,
                                    minHeight: mv.evening ? 6 : 0,
                                }}
                            />
                            <div className="text-[11px] font-bold text-gray-400">Evening</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-900">Jobs Breakdown</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Sessions by job {periodText}</p>
                    </div>
                    <div className="relative">
                        <HiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchJobs}
                            onChange={(e) => setSearchJobs(e.target.value)}
                            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-[#004D6D] w-44"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="border-b border-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wide">
                                <th className="px-5 py-3">Job</th>
                                <th className="px-5 py-3 text-center">Sessions</th>
                                <th className="px-5 py-3 text-center">Completed</th>
                                <th className="px-5 py-3 text-center">Morning</th>
                                <th className="px-5 py-3 text-center">Evening</th>
                                {driver?.isPrivate && <th className="px-5 py-3 text-right">Pay</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td colSpan={driver?.isPrivate ? 6 : 5} className="px-5 py-8 text-center text-gray-400">
                                        Loading jobs…
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredJobs.length === 0 && (
                                <tr>
                                    <td colSpan={driver?.isPrivate ? 6 : 5} className="px-5 py-8 text-center text-gray-400">
                                        No jobs in this period.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filteredJobs.map((j) => (
                                    <tr key={j.jobId} className="hover:bg-gray-50/40">
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-gray-800">{j.jobName}</div>
                                            <div className="text-gray-400 mt-0.5">{j.school}</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center font-bold text-gray-900">{j.totalSessions}</td>
                                        <td className="px-5 py-3.5 text-center text-gray-700">{j.completedSessions}</td>
                                        <td className="px-5 py-3.5 text-center text-gray-500">{j.morningCompleted}</td>
                                        <td className="px-5 py-3.5 text-center text-gray-500">{j.eveningCompleted}</td>
                                        {driver?.isPrivate && (
                                            <td className="px-5 py-3.5 text-right font-semibold text-gray-800">
                                                {money(j.estimatedPay)}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-900">Session History</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">{periodText}</p>
                    </div>
                    <div className="relative">
                        <HiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchSessions}
                            onChange={(e) => {
                                setSearchSessions(e.target.value);
                                setSessionPage(1);
                            }}
                            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-[#004D6D] w-44"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="border-b border-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wide">
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Job</th>
                                <th className="px-5 py-3">Direction</th>
                                <th className="px-5 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                                        Loading sessions…
                                    </td>
                                </tr>
                            )}
                            {!loading && paginatedSessions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                                        No sessions in this period.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                paginatedSessions.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/40">
                                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{s.date}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="font-medium text-gray-800">{s.jobName}</div>
                                            <div className="text-gray-400 mt-0.5">{s.school}</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-600">{s.direction}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${statusClass(s.statusRaw)}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                        {filteredSessions.length === 0
                            ? '0 sessions'
                            : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredSessions.length)} of ${filteredSessions.length}`}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                        >
                            <HiChevronLeft size={15} />
                        </button>
                        <span className="px-2 text-[11px] font-bold text-gray-600">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setSessionPage((p) => Math.min(totalPages, p + 1))}
                            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                        >
                            <HiChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-[13px] font-bold text-gray-900">{loading ? 'Loading report…' : 'Report ready'}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                        {Number(stats?.totalSessions || 0).toLocaleString()} sessions
                        <span className="mx-1.5 opacity-30">•</span>
                        {monthLabel(year, month)}
                        {driver?.isPrivate ? (
                            <>
                                <span className="mx-1.5 opacity-30">•</span>
                                {money(stats?.estimatedPay)}
                            </>
                        ) : null}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handlePdf}
                    disabled={loading || generating || !report}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#004D6D] hover:bg-[#003c55] transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                    <HiOutlineDownload size={14} />
                    {generating ? 'Generating…' : 'Export PDF'}
                </button>
            </div>
        </div>
    );
};

export default DriverReport;
