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
import { useSubAdminPermissions } from '../../../../context/subAdminPermissionsContext';

const defaultAvatar = (seed) => `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`;
const WEEKDAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const WEEKDAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const InfoRow = ({ label, value, valueClass = 'text-gray-800' }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
        <span className="text-[12px] text-gray-500 font-medium shrink-0">{label}</span>
        <span className={`text-[13px] font-bold text-right ${valueClass}`}>{value}</span>
    </div>
);
const STATUS_CFG = {
    pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-500', Icon: MdRadioButtonUnchecked },
    picked_up: { label: 'Picked Up', cls: 'bg-blue-50 text-blue-600', Icon: MdCheckCircle },
    missed: { label: 'Missed', cls: 'bg-red-50 text-red-600', Icon: MdCancel },
    dropped_off: { label: 'Dropped Off', cls: 'bg-green-50 text-green-600', Icon: MdCheckCircle },
};
const StatusBadge = ({ status }) => {
    const { label, cls, Icon } = STATUS_CFG[status] || STATUS_CFG.pending;
    return <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}><Icon size={11} />{label}</span>;
};
const formatSemesterDate = (iso) => (!iso ? '—' : new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
const formatTimestamp = (iso) => (!iso ? '—' : new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
const passengerDisplayName = (p) => [p?.first_name, p?.surname].filter(Boolean).join(' ').trim() || 'Passenger';

const SessionCard = ({ session, direction, jobHasDirection, sessionPassengers, paxLoading }) => {
    const isMorning = direction === 'outbound';
    const Icon = isMorning ? MdWbSunny : MdNightlight;
    const label = isMorning ? 'Morning' : 'Evening';
    const accentBg = isMorning ? 'bg-amber-50' : 'bg-indigo-50';
    const accentBorder = isMorning ? 'border-amber-200' : 'border-indigo-200';
    const accentText = isMorning ? 'text-amber-500' : 'text-indigo-500';
    const barColor = isMorning ? 'bg-amber-500' : 'bg-indigo-500';
    const total = sessionPassengers.length;
    const done = sessionPassengers.filter((p) => p.status === 'dropped_off').length;
    const missed = sessionPassengers.filter((p) => p.status === 'missed').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    if (!jobHasDirection) return <div className="rounded-xl border border-dashed border-gray-200 p-4 opacity-50"><div className="flex items-center gap-2"><Icon size={14} className="text-gray-400" /><span className="text-[13px] font-bold text-gray-400">{label}</span></div><p className="text-[11px] text-gray-400 mt-1">Disabled for this job</p></div>;
    if (!session) return <div className={`rounded-xl border border-dashed ${accentBorder} ${accentBg}/30 p-4`}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Icon size={14} className={accentText} /><span className="text-[13px] font-bold text-gray-700">{label}</span></div><span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Not Started</span></div><p className="text-[11px] text-gray-500">Session created when driver starts from the app.</p></div>;
    const statusLabel = session.status === 'active' ? 'In Progress' : session.status === 'completed' ? 'Completed' : 'Pending';
    const statusCls = session.status === 'active' ? 'bg-green-100 text-green-700' : session.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';
    return (
        <div className={`rounded-xl border ${session.status === 'active' ? accentBorder : 'border-gray-200'} bg-white overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-3 ${session.status === 'active' ? accentBg : 'bg-gray-50'} border-b border-gray-100`}>
                <div className="flex items-center gap-2"><Icon size={14} className={accentText} /><span className="text-[13px] font-bold text-gray-800">{label}</span></div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
            </div>
            {total > 0 && <div className="px-4 py-2.5 border-b border-gray-50"><div className="flex justify-between text-[11px] mb-1.5"><span className="text-gray-500">{done}/{total} completed{missed > 0 ? <span className="text-red-500 ml-1.5">· {missed} missed</span> : null}</span><span className="font-bold text-gray-600">{pct}%</span></div><div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} /></div></div>}
            {paxLoading ? <div className="px-4 py-3 space-y-2"><ShimmerBlock className="h-8 rounded-lg" /><ShimmerBlock className="h-8 rounded-lg" /></div> : sessionPassengers.length === 0 ? <p className="px-4 py-3 text-[11px] text-gray-400 italic">No passengers in this session yet.</p> : <div className="divide-y divide-gray-50">{sessionPassengers.map((sp, idx) => <div key={sp.id} className="flex items-center gap-3 px-4 py-2.5"><div className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 bg-gray-100 text-gray-500">{idx + 1}</div><div className="flex-1 min-w-0"><p className="text-[12px] font-semibold text-gray-800 truncate">{passengerDisplayName(sp.passenger || {})}{sp.passenger?.wheelchair_required ? <MdAccessible size={11} className="inline ml-1 text-blue-500" /> : null}</p><p className="text-[10px] text-gray-400 truncate">{sp.pickup_address}</p></div><StatusBadge status={sp.status} /><span className="text-[10px] text-gray-400 shrink-0">{sp.picked_up_at ? formatTimestamp(sp.picked_up_at) : ''}</span></div>)}</div>}
        </div>
    );
};

const JobDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can } = useSubAdminPermissions();
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
        setLoading(true); setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const companyId = admin?.company_id;
            if (!companyId) throw new Error('No company linked to your account.');
            const [data, pax] = await Promise.all([fetchJobDetailBundle(id, companyId), fetchJobSchedulePassengers(id)]);
            setBundle(data); setPassengers(pax);
        } catch (e) {
            setError(e?.message || 'Could not load job.'); setBundle(null);
        } finally { setLoading(false); }
    }, [id]);
    const loadSessions = useCallback(async () => {
        if (!id) return;
        setSessionsLoading(true);
        try {
            const data = await fetchJobSessionsForDisplay(id);
            setSessions(data);
            setPaxLoading(true);
            const [mPax, ePax] = await Promise.all([data.morning ? fetchSessionPassengers(data.morning.id, 'outbound') : Promise.resolve([]), data.evening ? fetchSessionPassengers(data.evening.id, 'inbound') : Promise.resolve([])]);
            setMorningPax(mPax); setEveningPax(ePax); setLastRefreshed(new Date());
        } finally { setSessionsLoading(false); setPaxLoading(false); }
    }, [id]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { loadSessions(); }, [loadSessions]);

    const job = bundle?.job;
    const ui = job ? deriveJobUiStatus(job) : { label: '', statusColor: '' };
    const driverName = bundle?.driver ? [bundle.driver.first_name, bundle.driver.last_name].filter(Boolean).join(' ') : null;
    const vehicleLabel = bundle?.vehicle?.taxi_license_plate_number || bundle?.driver?.license_no || null;
    const paName = bundle?.pa ? [bundle.pa.first_name, bundle.pa.surname].filter(Boolean).join(' ') : null;
    const totalPay = (Number(job?.driver_pay) || 0) + (Number(job?.passenger_assistant_pay) || 0);
    const hasActive = sessions.morning?.status === 'active' || sessions.evening?.status === 'active';

    const confirmCancel = async () => {
        if (!job || !id || !can('cancel_jobs')) return;
        setCancelling(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            const admin = await getCompanyAdminById(uid);
            await cancelJobById(id, admin?.company_id);
            setShowCancelModal(false);
            navigate('/subadmin/jobs');
        } catch (e) {
            setError(e?.message || 'Could not cancel job.');
        } finally { setCancelling(false); }
    };

    if (loading) return <LoadingStatus label="Loading job details" className="space-y-6"><ShimmerBlock className="h-8 w-64 rounded-md" /><ShimmerBlock className="h-40 rounded-xl" /></LoadingStatus>;
    if (error && !bundle) return <div className="space-y-4"><p className="text-[14px] text-red-600 font-medium">{error}</p><button type="button" onClick={() => navigate('/subadmin/jobs')} className="text-[14px] font-bold text-[#004D6D]">Back to jobs</button></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-[24px] font-bold text-gray-900">{job ? formatJobDisplayId(job.id) : '—'}</h1>
                        {job ? <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border ${ui.statusColor}`}><div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{ui.label}</span> : null}
                    </div>
                    <p className="text-[14px] text-gray-500 mt-1 font-medium">{job?.job_name || '—'}{job?.client_school_name ? ` · ${job.client_school_name}` : ''}</p>
                    {job?.semester_start ? <p className="text-[13px] text-[#004D6D] font-semibold mt-0.5">{formatSemesterDate(job.semester_start)} – {formatSemesterDate(job.semester_end)}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                    {can('cancel_jobs') ? <button type="button" onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg bg-white hover:bg-red-50 text-[13px] font-bold"><MdBlock size={18} />Cancel Job</button> : null}
                    {can('edit_jobs') ? <button type="button" onClick={() => navigate(`/subadmin/jobs/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg bg-white hover:bg-gray-50 text-[13px] font-bold"><MdEdit size={18} />Edit Job</button> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full shrink-0 ${hasActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} /><h2 className="text-[15px] font-bold text-gray-900">{sessions.source === 'yesterday' ? "Yesterday's Sessions" : "Today's Sessions"}</h2></div>
                            <button type="button" onClick={loadSessions} disabled={sessionsLoading} className="p-1.5 text-gray-400 hover:text-[#004D6D]"><MdRefresh size={16} className={sessionsLoading ? 'animate-spin' : ''} /></button>
                        </div>
                        <div className="p-5">{sessionsLoading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><ShimmerBlock className="h-36 rounded-xl" /><ShimmerBlock className="h-36 rounded-xl" /></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SessionCard session={sessions.morning} direction="outbound" jobHasDirection={Boolean(job?.has_outbound)} sessionPassengers={morningPax} paxLoading={paxLoading} /><SessionCard session={sessions.evening} direction="inbound" jobHasDirection={Boolean(job?.has_inbound)} sessionPassengers={eveningPax} paxLoading={paxLoading} /></div>}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Job Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <div><InfoRow label="City" value={job?.city || '—'} /><InfoRow label="Job Type" value={job?.job_type || '—'} /></div>
                            <div><InfoRow label="Status" value={ui.label || '—'} /><InfoRow label="Driver Approval" value={job?.driver_approval_status || 'N/A'} /></div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-[15px] font-bold text-gray-900">Passengers</h2><span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#004D6D] bg-[#004D6D]/5 px-2.5 py-1 rounded-full"><MdPeopleAlt size={14} />{passengers.length}</span></div>
                        {passengers.length === 0 ? <p className="text-[13px] text-gray-400 italic">No passengers scheduled on this job yet.</p> : <div className="space-y-2">{passengers.map((p) => <div key={p.id} onClick={() => navigate(`/subadmin/users/passengers/${p.id}`)} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"><img src={`https://i.pravatar.cc/150?u=${p.id}`} alt={passengerDisplayName(p)} className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0" /><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-[13px] font-bold text-gray-900">{passengerDisplayName(p)}</span>{p.wheelchair_required ? <MdAccessible size={14} className="text-blue-500" /> : null}</div><div className="mt-1 flex gap-3">{p.primary_pickup_postcode ? <div className="flex items-center gap-1 text-[11px] text-gray-400"><MdHome size={11} />{p.primary_pickup_postcode}</div> : null}{p.educational_site_postcode ? <div className="flex items-center gap-1 text-[11px] text-gray-400"><MdSchool size={11} />{p.educational_site_postcode}</div> : null}</div></div></div>)}</div>}
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"><div className="flex items-center gap-2 mb-4"><MdCalendarToday size={16} className="text-[#004D6D]" /><h2 className="text-[14px] font-bold text-gray-900">Semester</h2></div><div className="space-y-2.5"><div className="flex justify-between text-[13px]"><span className="text-gray-500">Start</span><span className="font-bold text-gray-800">{formatSemesterDate(job?.semester_start)}</span></div><div className="flex justify-between text-[13px]"><span className="text-gray-500">End</span><span className="font-bold text-gray-800">{formatSemesterDate(job?.semester_end)}</span></div></div></div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"><h2 className="text-[14px] font-bold text-gray-900 mb-4">Assigned Driver</h2>{driverName ? <div className="flex items-center gap-3"><img src={defaultAvatar(bundle.driver.id)} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" /><div><p className="text-[14px] font-bold text-gray-900">{driverName}</p><p className="text-[12px] text-gray-500 mt-0.5">{vehicleLabel || '—'}</p></div></div> : <p className="text-[13px] text-gray-500">No driver assigned</p>}</div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"><h2 className="text-[14px] font-bold text-gray-900 mb-4">Passenger Assistant</h2>{paName ? <div className="flex items-center gap-3"><img src={bundle.pa.profile_picture_url || defaultAvatar(bundle.pa.id)} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" /><div><p className="text-[14px] font-bold text-gray-900">{paName}</p><p className="text-[12px] text-gray-500 mt-0.5">Passenger Assistant</p></div></div> : <p className="text-[13px] text-gray-500">No passenger assistant assigned</p>}</div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm border-t-4 border-t-green-500"><h2 className="text-[14px] font-bold text-gray-900 mb-4">Compensation</h2><InfoRow label="Total" value={totalPay > 0 ? `£${totalPay.toFixed(2)}` : '—'} valueClass="text-green-600" /></div>
                </div>
            </div>

            {showCancelModal ? <div className="fixed inset-0 z-50 flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !cancelling && setShowCancelModal(false)} /><div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"><div className="flex items-center justify-center gap-2 mb-4"><MdWarning className="text-red-500" size={24} /><h2 className="text-[18px] font-bold text-gray-900">Cancel Job</h2></div><p className="text-[13px] text-gray-500 mb-5">Are you sure you want to cancel <span className="font-bold text-gray-800">{job ? formatJobDisplayId(job.id) : 'this job'}</span>?</p><div className="text-left mb-6"><label className="block text-[12px] font-bold text-gray-700 mb-1.5">Reason <span className="text-red-500">*</span></label><textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] resize-none h-24" /></div><div className="flex gap-3"><button type="button" disabled={cancelling || !cancelReason.trim()} onClick={confirmCancel} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[13px] font-bold disabled:opacity-50">{cancelling ? 'Cancelling…' : 'Yes, Cancel'}</button><button type="button" disabled={cancelling} onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold">Keep Job</button></div></div></div> : null}
        </div>
    );
};

export default JobDetail;
