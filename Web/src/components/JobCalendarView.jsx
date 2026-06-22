import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdChevronLeft,
    MdChevronRight,
    MdAdd,
} from 'react-icons/md';
import { supabase } from '../lib/supabaseClient';
import { getCompanyAdminById } from '../services/companyService';
import {
    fetchJobCalendarData,
    buildMonthGrid,
    buildWeekDays,
    formatCalendarHeading,
    shiftAnchorDate,
    getJobsForDate,
    toIsoDateLocal,
    MONTH_PREVIEW_LIMIT,
} from '../services/jobCalendarService';
import { ShimmerBlock, LoadingStatus } from '../utils/Shimmer';

const getJobColor = (color) => {
    switch (color) {
        case 'green': return 'bg-green-50 text-green-700 border-green-200';
        case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'blue': return 'bg-blue-50 text-[#004D6D] border-blue-100';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

const JobTripTimes = ({ job, timeClassName = 'opacity-80 block mb-0.5', titleClassName = 'block truncate mt-0.5' }) => (
    <>
        {job.showMorning && (
            <span className={timeClassName}>Morning trip ({job.morningTime})</span>
        )}
        {job.showReturn && (
            <span className={timeClassName}>Return Trip ({job.returnTime})</span>
        )}
        <span className={titleClassName}>{job.title}</span>
    </>
);

const MonthJobCard = ({ job }) => (
    <div className={`p-1.5 rounded-md border-l-4 text-[10px] font-bold cursor-pointer hover:shadow-sm transition-all ${getJobColor(job.color)}`}>
        <JobTripTimes job={job} />
    </div>
);

const JobCalendarView = ({ createJobPath = '/portal/jobs/add-job', showCreateJob = true }) => {
    const navigate = useNavigate();
    const [view, setView] = useState('month');
    const [anchorDate, setAnchorDate] = useState(() => new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedMonthDays, setExpandedMonthDays] = useState(() => new Set());

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const uid = session?.user?.id;
                if (!uid) throw new Error('Not authenticated.');
                const admin = await getCompanyAdminById(uid);
                const cid = admin?.company_id;
                if (!cid) throw new Error('No company linked to your account.');
                const data = await fetchJobCalendarData(cid);
                if (!cancelled) setCalendarData(data);
            } catch (e) {
                if (!cancelled) setError(e?.message || 'Could not load calendar.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const heading = useMemo(() => formatCalendarHeading(view, anchorDate), [view, anchorDate]);

    const monthDays = useMemo(() => {
        if (!calendarData) return [];
        return buildMonthGrid(anchorDate).map((cell) => {
            const allJobs = getJobsForDate(calendarData, cell.date);
            return { ...cell, allJobs, iso: toIsoDateLocal(cell.date) };
        });
    }, [calendarData, anchorDate]);

    useEffect(() => {
        setExpandedMonthDays(new Set());
    }, [anchorDate.getMonth(), anchorDate.getFullYear()]);

    const toggleMonthDayExpanded = useCallback((iso) => {
        setExpandedMonthDays((prev) => {
            const next = new Set(prev);
            if (next.has(iso)) next.delete(iso);
            else next.add(iso);
            return next;
        });
    }, []);

    const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate]);

    const weekJobsByDate = useMemo(() => {
        if (!calendarData) return new Map();
        const map = new Map();
        for (const d of weekDays) {
            map.set(toIsoDateLocal(d.date), getJobsForDate(calendarData, d.date));
        }
        return map;
    }, [calendarData, weekDays]);

    const dayJobs = useMemo(() => {
        if (!calendarData) return [];
        return getJobsForDate(calendarData, anchorDate);
    }, [calendarData, anchorDate]);

    const goPrev = useCallback(() => {
        setAnchorDate((d) => shiftAnchorDate(view, d, -1));
    }, [view]);

    const goNext = useCallback(() => {
        setAnchorDate((d) => shiftAnchorDate(view, d, 1));
    }, [view]);

    const goToday = useCallback(() => {
        setAnchorDate(new Date());
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">Job Calendar</h1>
                </div>
                {showCreateJob ? (
                    <button
                        type="button"
                        onClick={() => navigate(createJobPath)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[14px] font-medium hover:bg-[#003c55] transition-all"
                    >
                        <MdAdd size={20} />
                        Create Job
                    </button>
                ) : null}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <button type="button" onClick={goPrev} className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-50">
                            <MdChevronLeft size={20} className="text-gray-400" />
                        </button>
                        <button type="button" onClick={goNext} className="p-2 hover:bg-gray-50 transition-colors">
                            <MdChevronRight size={20} className="text-gray-400" />
                        </button>
                    </div>
                    <h2 className="text-[18px] font-bold text-gray-800">{heading}</h2>
                    <button
                        type="button"
                        onClick={goToday}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[13px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Today
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                        {['month', 'week', 'day'].map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setView(v)}
                                className={`px-4 py-1.5 rounded-md text-[13px] font-semibold capitalize transition-all ${view === v ? 'bg-white text-[#004D6D] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                    {error}
                </div>
            )}

            <div className={`bg-white rounded-[24px] border border-gray-100 shadow-sm min-h-[700px] ${view === 'month' ? 'flex flex-col overflow-hidden max-h-[calc(100vh-200px)]' : 'overflow-hidden'}`}>
                {loading ? (
                    <LoadingStatus label="Loading calendar" className="p-6 space-y-4">
                        <ShimmerBlock className="h-10 w-64" />
                        <ShimmerBlock className="h-[700px] w-full rounded-2xl" />
                    </LoadingStatus>
                ) : (
                    <>
                        {view === 'month' && (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="grid grid-cols-7 shrink-0 bg-white border-b border-gray-50">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                        <div key={d} className="py-3 text-center text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                <div className="overflow-y-auto flex-1 min-h-0">
                                    <div className="grid grid-cols-7">
                                        {monthDays.map((item) => {
                                            const isExpanded = expandedMonthDays.has(item.iso);
                                            const visibleJobs = isExpanded
                                                ? item.allJobs
                                                : item.allJobs.slice(0, MONTH_PREVIEW_LIMIT);
                                            const hiddenCount = isExpanded
                                                ? 0
                                                : Math.max(0, item.allJobs.length - MONTH_PREVIEW_LIMIT);

                                            return (
                                                <div
                                                    key={item.iso}
                                                    className={`min-h-[120px] p-3 border-r border-b border-gray-50 relative ${item.isPrev || item.isNext ? 'bg-gray-50/20' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-[13px] font-bold ${item.isPrev || item.isNext ? 'text-gray-300' : 'text-gray-400'} ${item.isToday ? 'w-6 h-6 flex items-center justify-center bg-[#004D6D] text-white rounded-lg -mt-1 shadow-sm' : ''}`}>
                                                            {item.day}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 space-y-1.5 px-0.5">
                                                        {visibleJobs.map((j) => (
                                                            <MonthJobCard key={j.jobId} job={j} />
                                                        ))}
                                                        {hiddenCount > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMonthDayExpanded(item.iso)}
                                                                className="text-[10px] font-bold text-[#004D6D] hover:underline mt-1"
                                                            >
                                                                + {hiddenCount} more
                                                            </button>
                                                        )}
                                                        {isExpanded && item.allJobs.length > MONTH_PREVIEW_LIMIT && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMonthDayExpanded(item.iso)}
                                                                className="text-[10px] font-bold text-gray-500 hover:underline mt-1"
                                                            >
                                                                Show less
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'week' && (
                            <div className="grid grid-cols-7 h-[700px]">
                                {weekDays.map((d) => (
                                    <div key={toIsoDateLocal(d.date)} className={`border-r border-gray-100 flex flex-col items-center py-4 bg-white ${d.isToday ? 'bg-blue-50/10' : ''}`}>
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">{d.name}</span>
                                        <span className={`text-[16px] font-bold ${d.isToday ? 'w-9 h-9 flex items-center justify-center bg-[#004D6D] text-white rounded-full shadow-md translate-y-1' : 'text-gray-800'}`}>
                                            {d.day}
                                        </span>
                                    </div>
                                ))}
                                {weekDays.map((d) => {
                                    const iso = toIsoDateLocal(d.date);
                                    const jobs = weekJobsByDate.get(iso) || [];
                                    return (
                                        <div key={`col-${iso}`} className={`border-r border-t border-gray-100 p-3 space-y-3 min-h-[600px] ${d.isToday ? 'bg-blue-50/10' : ''}`}>
                                            {jobs.map((j) => (
                                                <div key={j.jobId} className={`p-3 rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${getJobColor(j.color)}`}>
                                                    <div className="text-[10px] font-bold mb-3">
                                                        <JobTripTimes
                                                            job={j}
                                                            timeClassName="text-[11px] font-medium opacity-80 block mb-0.5"
                                                            titleClassName="text-[10px] font-bold block mt-1"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            {j.driver ? (
                                                                <>
                                                                    <img src={j.driver.avatar} className="w-5 h-5 rounded-full border border-white" alt="" />
                                                                    <span className="text-[10px] font-bold">{j.driver.shortName || j.driver.name}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] font-bold opacity-70">Unassigned</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold opacity-80">{j.seats}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {view === 'day' && (
                            <div className="p-6 min-h-[700px]">
                                <div className="mb-6 flex items-center gap-3">
                                    <span className={`text-[16px] font-bold ${isTodayAnchor(anchorDate) ? 'w-9 h-9 flex items-center justify-center bg-[#004D6D] text-white rounded-full shadow-md' : 'text-gray-800'}`}>
                                        {anchorDate.getDate()}
                                    </span>
                                    <span className="text-[14px] font-semibold text-gray-500">
                                        {anchorDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                {dayJobs.length === 0 ? (
                                    <p className="text-[13px] text-gray-400 font-medium">No scheduled jobs with passengers for this day.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {dayJobs.map((j) => (
                                            <div key={j.jobId} className={`p-3 rounded-md border-l-4 text-[12px] font-bold cursor-pointer hover:shadow-sm transition-all ${getJobColor(j.color)}`}>
                                                <JobTripTimes
                                                    job={j}
                                                    timeClassName="opacity-80 block mb-1 text-[11px] font-medium"
                                                    titleClassName="block text-[12px] font-bold"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

function isTodayAnchor(d) {
    const today = new Date();
    return d.getDate() === today.getDate()
        && d.getMonth() === today.getMonth()
        && d.getFullYear() === today.getFullYear();
}

export default JobCalendarView;
