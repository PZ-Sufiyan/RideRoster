import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdBlock, MdEdit, MdWarning, MdWbSunny, MdNightlight,
    MdCalendarToday, MdPeopleAlt, MdAccessible, MdSchool, MdHome,
    MdCheckCircle, MdCancel, MdRadioButtonUnchecked, MdRefresh, MdInfoOutline,
} from 'react-icons/md';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../services/companyService';
import {
    fetchJobDetailBundle,
    fetchJobSchedulePassengers,
    fetchJobSessionsForDisplay,
    fetchSessionPassengers,
    cancelJobById,
    formatJobDisplayId,
    deriveJobUiStatus,
    formatTimeDisplay,
} from '../../../../services/jobService';
import { ShimmerBlock, LoadingStatus } from '../../../../utils/Shimmer';

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultAvatar = (seed) => `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`;
const WEEKDAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const WEEKDAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function formatSemesterDate(iso) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTimestamp(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function passengerDisplayName(p) {
    return [p?.first_name, p?.surname].filter(Boolean).join(' ').trim() || 'Passenger';
}

// ── Sub-components ────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, valueClass = 'text-gray-800' }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
        <span className="text-[12px] text-gray-500 font-medium shrink-0">{label}</span>
        <span className={`text-[13px] font-bold text-right ${valueClass}`}>{value}</span>
    </div>
);

const STATUS_CFG = {
    pending:     { label: 'Pending',     cls: 'bg-gray-100 text-gray-500',  Icon: MdRadioButtonUnchecked },
    picked_up:   { label: 'Picked Up',   cls: 'bg-blue-50 text-blue-600',   Icon: MdCheckCircle },
    missed:      { label: 'Missed',      cls: 'bg-red-50 text-red-600',     Icon: MdCancel },
    dropped_off: { label: 'Dropped Off', cls: 'bg-green-50 text-green-600', Icon: MdCheckCircle },
};
const StatusBadge = ({ status }) => {
    const { label, cls, Icon } = STATUS_CFG[status] || STATUS_CFG.pending;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
            <Icon size={11} />{label}
        </span>
    );
};

// ── SessionCard ───────────────────────────────────────────────────────────────

const SessionCard = ({ session, direction, jobHasDirection, sessionPassengers, paxLoading }) => {
    const isMorning = direction === 'outbound';
    const Icon = isMorning ? MdWbSunny : MdNightlight;
    const label = isMorning ? 'Morning' : 'Evening';
    const accentBg = isMorning ? 'bg-amber-50' : 'bg-indigo-50';
    const accentBorder = isMorning ? 'border-amber-200' : 'border-indigo-200';
    const accentText = isMorning ? 'text-amber-500' : 'text-indigo-500';
    const barColor = isMorning ? 'bg-amber-500' : 'bg-indigo-500';

    const total = sessionPassengers.length;
    const done = sessionPassengers.filter(p => p.status === 'dropped_off').length;
    const missed = sessionPassengers.filter(p => p.status === 'missed').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    if (!jobHasDirection) {
        return (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 opacity-50">
                <div className="flex items-center gap-2"><Icon size={14} className="text-gray-400" /><span className="text-[13px] font-bold text-gray-400">{label}</span></div>
                <p className="text-[11px] text-gray-400 mt-1">Disabled for this job</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className={`rounded-xl border border-dashed ${accentBorder} ${accentBg}/30 p-4`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Icon size={14} className={accentText} /><span className="text-[13px] font-bold text-gray-700">{label}</span></div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Not Started</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                    Session created when driver starts from the app.
                </p>
            </div>
        );
    }

    const statusLabel = session.status === 'active' ? 'In Progress' : session.status === 'completed' ? 'Completed' : 'Pending';
    const statusCls = session.status === 'active' ? 'bg-green-100 text-green-700' : session.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';
    const isActive = session.status === 'active';

    return (
        <div className={`rounded-xl border ${isActive ? accentBorder : 'border-gray-200'} bg-white overflow-hidden`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 ${isActive ? accentBg : 'bg-gray-50'} border-b border-gray-100`}>
                <div className="flex items-center gap-2">
                    <Icon size={14} className={accentText} />
                    <span className="text-[13px] font-bold text-gray-800">{label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
            </div>

            {/* Times */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-50 text-[11px] text-gray-500">
                {session.started_at && <span>Started <span className="font-bold text-gray-700">{formatTimestamp(session.started_at)}</span></span>}
                {session.completed_at && <span>Completed <span className="font-bold text-gray-700">{formatTimestamp(session.completed_at)}</span></span>}
                {!session.started_at && !session.completed_at && <span className="text-gray-400">Not yet started by driver</span>}
            </div>

            {/* Progress */}
            {total > 0 && (
                <div className="px-4 py-2.5 border-b border-gray-50">
                    <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-gray-500">
                            {done}/{total} completed
                            {missed > 0 && <span className="text-red-500 ml-1.5">· {missed} missed</span>}
                        </span>
                        <span className="font-bold text-gray-600">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                </div>
            )}

            {/* Passenger rows */}
            {paxLoading ? (
                <div className="px-4 py-3 space-y-2">
                    <ShimmerBlock className="h-8 rounded-lg" />
                    <ShimmerBlock className="h-8 rounded-lg" />
                </div>
            ) : sessionPassengers.length === 0 ? (
                <p className="px-4 py-3 text-[11px] text-gray-400 italic">No passengers in this session yet.</p>
            ) : (
                <div className="divide-y divide-gray-50">
                    {sessionPassengers.map((sp, idx) => {
                        const pax = sp.passenger || {};
                        const numCls = sp.status === 'dropped_off' ? 'bg-green-100 text-green-600'
                            : sp.status === 'missed' ? 'bg-red-100 text-red-600'
                            : sp.status === 'picked_up' ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500';
                        return (
                            <div key={sp.id} className="flex items-center gap-3 px-4 py-2.5">
                                <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${numCls}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-gray-800 truncate">
                                        {passengerDisplayName(pax)}
                                        {pax.wheelchair_required && <MdAccessible size={11} className="inline ml-1 text-blue-500" />}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate">{sp.pickup_address}</p>
                                </div>
                                <StatusBadge status={sp.status} />
                                {sp.picked_up_at && (
                                    <span className="text-[10px] text-gray-400 shrink-0">{formatTimestamp(sp.picked_up_at)}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const JobDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bundle, setBundle] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [cancelling, setCancelling] = useState(false);

    const [sessions, setSessions] = useState({ morning: null, evening: null, source: 'none' });
    const [morningPax, setMorningPax] = useState([]);
    const [eveningPax, setEveningPax] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [paxLoading, setPaxLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const companyId = admin?.company_id;
            if (!companyId) throw new Error('No company linked to your account.');
            const [data, pax] = await Promise.all([
                fetchJobDetailBundle(id, companyId),
                fetchJobSchedulePassengers(id),
            ]);
            setBundle(data);
            setPassengers(pax);
        } catch (e) {
            setError(e?.message || 'Could not load job.');
            setBundle(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadSessions = useCallback(async () => {
        if (!id) return;
        setSessionsLoading(true);
        try {
            const data = await fetchJobSessionsForDisplay(id);
            setSessions(data);
            setPaxLoading(true);
            const [mPax, ePax] = await Promise.all([
                data.morning ? fetchSessionPassengers(data.morning.id, 'outbound') : Promise.resolve([]),
                data.evening ? fetchSessionPassengers(data.evening.id, 'inbound') : Promise.resolve([]),
            ]);
            setMorningPax(mPax);
            setEveningPax(ePax);
            setLastRefreshed(new Date());
        } catch (e) {
            console.error('Session load error:', e?.message);
        } finally {
            setSessionsLoading(false);
            setPaxLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { loadSessions(); }, [loadSessions]);

    // Auto-refresh every 30s while a session is active
    useEffect(() => {
        const hasActive = sessions.morning?.status === 'active' || sessions.evening?.status === 'active';
        if (!hasActive) return;
        const timer = setInterval(loadSessions, 30_000);
        return () => clearInterval(timer);
    }, [sessions, loadSessions]);

    const job = bundle?.job;
    const ui = job ? deriveJobUiStatus(job) : { label: '', statusColor: '' };
    const driverName = bundle?.driver ? [bundle.driver.first_name, bundle.driver.last_name].filter(Boolean).join(' ') : null;
    const vehicleLabel = bundle?.vehicle?.taxi_license_plate_number || bundle?.driver?.license_no || null;
    const paName = bundle?.pa ? [bundle.pa.first_name, bundle.pa.surname].filter(Boolean).join(' ') : null;
    const totalPay = (Number(job?.driver_pay) || 0) + (Number(job?.passenger_assistant_pay) || 0);
    const hasActive = sessions.morning?.status === 'active' || sessions.evening?.status === 'active';

    const confirmCancel = async () => {
        if (!job || !id) return;
        setCancelling(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            const admin = await getCompanyAdminById(uid);
            await cancelJobById(id, admin?.company_id);
            setShowCancelModal(false);
            navigate('/portal/jobs');
        } catch (e) {
            setError(e?.message || 'Could not cancel job.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <LoadingStatus label="Loading job details" className="space-y-6">
                <div className="flex justify-between gap-4">
                    <ShimmerBlock className="h-8 w-64 rounded-md" />
                    <div className="flex gap-3"><ShimmerBlock className="h-10 w-28 rounded-lg" /><ShimmerBlock className="h-10 w-24 rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                        {[...Array(4)].map((_, i) => <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3"><ShimmerBlock className="h-5 w-40 rounded-md" /><ShimmerBlock className="h-20 rounded-xl" /></div>)}
                    </div>
                    <div className="space-y-5">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3"><ShimmerBlock className="h-5 w-32 rounded-md" /><ShimmerBlock className="h-12 rounded-xl" /></div>)}
                    </div>
                </div>
            </LoadingStatus>
        );
    }

    if (error && !bundle) {
        return (
            <div className="space-y-4">
                <p className="text-[14px] text-red-600 font-medium">{error}</p>
                <button type="button" onClick={() => navigate('/portal/jobs')} className="text-[14px] font-bold text-[#004D6D]">Back to jobs</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-[24px] font-bold text-gray-900">{job ? formatJobDisplayId(job.id) : '—'}</h1>
                        {job && (
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border ${ui.statusColor}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{ui.label}
                            </span>
                        )}
                    </div>
                    <p className="text-[14px] text-gray-500 mt-1 font-medium">
                        {job?.job_name || '—'}{job?.client_school_name ? ` · ${job.client_school_name}` : ''}
                    </p>
                    {job?.semester_start && (
                        <p className="text-[13px] text-[#004D6D] font-semibold mt-0.5">
                            {formatSemesterDate(job.semester_start)} – {formatSemesterDate(job.semester_end)}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setShowCancelModal(true)} disabled={!job || job.status === 'cancelled'}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg bg-white hover:bg-red-50 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <MdBlock size={18} />Cancel Job
                    </button>
                    <button type="button" onClick={() => navigate(`/portal/jobs/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg bg-white hover:bg-gray-50 text-[13px] font-bold transition-all">
                        <MdEdit size={18} />Edit Job
                    </button>
                </div>
            </div>

            {(() => {
                if (!job) return null;
                const statusNorm = String(job.driver_approval_status || '').trim().toLowerCase();
                if (!['counter request', 'counter requested'].includes(statusNorm)) return null;

                const counterPay = job.driver_counter_offer_pay;

                return (
                    <div className="flex items-center justify-between gap-4 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <MdWarning size={18} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-gray-900">
                                    Driver has submitted a counter-offer
                                </p>
                                <p className="text-[13px] text-amber-700 mt-0.5">
                                    {counterPay != null
                                        ? `Requested pay: £${Number(counterPay).toFixed(2)}`
                                        : 'Review the counter-offer to accept or reject.'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/portal/jobs/${id}/counter-offer`)}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm"
                        >
                            Review Offer →
                        </button>
                    </div>
                );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ════ LEFT (2/3) ════ */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── TODAY'S SESSIONS ── */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${hasActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                <h2 className="text-[15px] font-bold text-gray-900">
                                    {sessions.source === 'yesterday' ? "Yesterday's Sessions" : "Today's Sessions"}
                                </h2>
                                {sessions.source === 'none' && !sessionsLoading && (
                                    <span className="text-[11px] text-gray-400 font-medium">— no data yet</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {lastRefreshed && (
                                    <span className="text-[10px] text-gray-400">
                                        {lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                <button type="button" onClick={loadSessions} disabled={sessionsLoading}
                                    className="p-1.5 text-gray-400 hover:text-[#004D6D] transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-50" title="Refresh">
                                    <MdRefresh size={16} className={sessionsLoading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            {sessionsLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ShimmerBlock className="h-36 rounded-xl" />
                                    <ShimmerBlock className="h-36 rounded-xl" />
                                </div>
                            ) : sessions.source === 'none' ? (
                                <div className="flex items-start gap-3">
                                    <MdInfoOutline size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[13px] font-semibold text-gray-700">No sessions recorded yet</p>
                                        <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                                            Sessions are created when the driver taps "Start Route" in the driver app.
                                            Morning and evening are tracked as separate sessions.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SessionCard
                                        session={sessions.morning}
                                        direction="outbound"
                                        jobHasDirection={Boolean(job?.has_outbound)}
                                        sessionPassengers={morningPax}
                                        paxLoading={paxLoading}
                                    />
                                    <SessionCard
                                        session={sessions.evening}
                                        direction="inbound"
                                        jobHasDirection={Boolean(job?.has_inbound)}
                                        sessionPassengers={eveningPax}
                                        paxLoading={paxLoading}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Job Overview ── */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Job Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <div>
                                <InfoRow label="City" value={job?.city || '—'} />
                                <InfoRow label="Job Type" value={job?.job_type || '—'} />
                                <InfoRow label="Internal ID" value={job?.internal_job_id || '—'} />
                                <InfoRow label="Semester Start" value={formatSemesterDate(job?.semester_start)} valueClass="text-[#004D6D]" />
                                <InfoRow label="Semester End" value={formatSemesterDate(job?.semester_end)} valueClass="text-[#004D6D]" />
                            </div>
                            <div>
                                <InfoRow label="Morning Run" value={job?.has_outbound ? 'Enabled' : 'Disabled'} valueClass={job?.has_outbound ? 'text-amber-600' : 'text-gray-400'} />
                                <InfoRow label="Evening Return" value={job?.has_inbound ? 'Enabled' : 'Disabled'} valueClass={job?.has_inbound ? 'text-indigo-600' : 'text-gray-400'} />
                                <InfoRow label="Driver Approval" value={job?.driver_approval_status || 'N/A'} />
                                <InfoRow label="Status" value={ui.label || '—'} />
                            </div>
                        </div>
                    </div>

                    {/* ── Journey Times ── */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Journey Times</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`rounded-xl p-4 ${job?.has_outbound ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100 opacity-50'}`}>
                                <div className="flex items-center gap-2 mb-3"><MdWbSunny size={18} className="text-amber-500" /><span className="text-[13px] font-bold text-gray-800">Morning (Outbound)</span></div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[12px]"><span className="text-gray-500">Route starts</span><span className="font-bold text-amber-700">{job?.morning_start_time ? formatTimeDisplay(job.morning_start_time) : '—'}</span></div>
                                    <div className="flex justify-between text-[12px]"><span className="text-gray-500">Route ends</span><span className="font-bold text-amber-700">{job?.morning_end_time ? formatTimeDisplay(job.morning_end_time) : '—'}</span></div>
                                    <p className="text-[11px] text-gray-400 mt-1">Each passenger picked up at their own time</p>
                                </div>
                            </div>
                            <div className={`rounded-xl p-4 ${job?.has_inbound ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100 opacity-50'}`}>
                                <div className="flex items-center gap-2 mb-3"><MdNightlight size={18} className="text-indigo-500" /><span className="text-[13px] font-bold text-gray-800">Evening (Inbound)</span></div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[12px]"><span className="text-gray-500">Departs school</span><span className="font-bold text-indigo-700">{job?.evening_start_time ? formatTimeDisplay(job.evening_start_time) : '—'}</span></div>
                                    <p className="text-[11px] text-gray-400 mt-1">All passengers depart school together</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Passengers ── */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[15px] font-bold text-gray-900">Passengers</h2>
                            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#004D6D] bg-[#004D6D]/5 px-2.5 py-1 rounded-full">
                                <MdPeopleAlt size={14} />{passengers.length}
                            </span>
                        </div>
                        {passengers.length === 0 ? (
                            <p className="text-[13px] text-gray-400 italic">No passengers scheduled on this job yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {passengers.map((p) => (
                                    <div key={p.id} onClick={() => navigate(`/portal/users/passengers/${p.id}`)}
                                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer">
                                        <img src={`https://i.pravatar.cc/150?u=${p.id}`} alt={passengerDisplayName(p)} className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[13px] font-bold text-gray-900">{passengerDisplayName(p)}</span>
                                                {p.wheelchair_required && <MdAccessible size={14} className="text-blue-500" />}
                                            </div>
                                            {p.activeWeekdays?.length > 0 && (
                                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                                    {WEEKDAY_ORDER.filter(d => p.activeWeekdays.includes(d)).map(d => (
                                                        <span key={d} className="text-[10px] font-bold bg-[#004D6D]/10 text-[#004D6D] px-1.5 py-0.5 rounded">{WEEKDAY_LABELS[d]}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-1 flex gap-3">
                                                {p.primary_pickup_postcode && <div className="flex items-center gap-1 text-[11px] text-gray-400"><MdHome size={11} />{p.primary_pickup_postcode}</div>}
                                                {p.educational_site_postcode && <div className="flex items-center gap-1 text-[11px] text-gray-400"><MdSchool size={11} />{p.educational_site_postcode}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ════ RIGHT (1/3) ════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4"><MdCalendarToday size={16} className="text-[#004D6D]" /><h2 className="text-[14px] font-bold text-gray-900">Semester</h2></div>
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-[13px]"><span className="text-gray-500">Start</span><span className="font-bold text-gray-800">{formatSemesterDate(job?.semester_start)}</span></div>
                            <div className="flex justify-between text-[13px]"><span className="text-gray-500">End</span><span className="font-bold text-gray-800">{formatSemesterDate(job?.semester_end)}</span></div>
                            <div className="flex gap-2 pt-1">
                                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${job?.has_outbound ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400 line-through'}`}><MdWbSunny size={12} />Morning</span>
                                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${job?.has_inbound ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400 line-through'}`}><MdNightlight size={12} />Evening</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Assigned Driver</h2>
                        {driverName ? (
                            <div className="flex items-center gap-3">
                                <img src={defaultAvatar(bundle.driver.id)} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                                <div><p className="text-[14px] font-bold text-gray-900">{driverName}</p><p className="text-[12px] text-gray-500 mt-0.5">{vehicleLabel || '—'}</p></div>
                            </div>
                        ) : <p className="text-[13px] text-gray-500">No driver assigned</p>}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Passenger Assistant</h2>
                        {paName ? (
                            <div className="flex items-center gap-3">
                                <img src={bundle.pa.profile_picture_url || defaultAvatar(bundle.pa.id)} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                                <div><p className="text-[14px] font-bold text-gray-900">{paName}</p><p className="text-[12px] text-gray-500 mt-0.5">Passenger Assistant</p></div>
                            </div>
                        ) : <p className="text-[13px] text-gray-500">No passenger assistant assigned</p>}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm border-t-4 border-t-green-500">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Compensation</h2>
                        <div className="space-y-1">
                            <InfoRow label="Driver Pay" value={job?.driver_pay != null ? `£${Number(job.driver_pay).toFixed(2)}` : '—'} />
                            <InfoRow label="PA Pay" value={job?.passenger_assistant_pay != null ? `£${Number(job.passenger_assistant_pay).toFixed(2)}` : '—'} />
                            <InfoRow label="Total" value={totalPay > 0 ? `£${totalPay.toFixed(2)}` : '—'} valueClass="text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !cancelling && setShowCancelModal(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4"><MdWarning className="text-red-500" size={24} /><h2 className="text-[18px] font-bold text-gray-900">Cancel Job</h2></div>
                        <p className="text-[13px] text-gray-500 mb-5">Are you sure you want to cancel <span className="font-bold text-gray-800">{job ? formatJobDisplayId(job.id) : 'this job'}</span>?</p>
                        <div className="text-left mb-6">
                            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Reason <span className="text-red-500">*</span></label>
                            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] resize-none h-24"
                                placeholder="e.g., Semester ended early..." />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" disabled={cancelling || !cancelReason.trim()} onClick={confirmCancel}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600 disabled:opacity-50">
                                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                            </button>
                            <button type="button" disabled={cancelling} onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50">
                                Keep Job
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetail;