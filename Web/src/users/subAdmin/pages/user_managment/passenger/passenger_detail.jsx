import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdHome,
    MdSchool,
    MdEdit,
    MdBlock,
    MdLocationOn,
    MdHotel,
    MdCalendarToday,
    MdWbSunny,
    MdNightlight,
    MdAdd,
    MdClose,
    MdCheck,
    MdWarningAmber,
} from 'react-icons/md';
import { getPassengerDetailBundle } from '../../../../../services/passengerService';
import { supabase } from '../../../../../lib/supabaseClient';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';
import { useSubAdminPermissions } from '../../../../../context/subAdminPermissionsContext';

// ── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = [
    { key: 'mon', label: 'Mon', short: 'M' },
    { key: 'tue', label: 'Tue', short: 'T' },
    { key: 'wed', label: 'Wed', short: 'W' },
    { key: 'thu', label: 'Thu', short: 'T' },
    { key: 'fri', label: 'Fri', short: 'F' },
    { key: 'sat', label: 'Sat', short: 'S' },
    { key: 'sun', label: 'Sun', short: 'S' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime12h(timeValue) {
    if (timeValue == null || timeValue === '') return '—';
    const [h, m] = String(timeValue).split(':');
    const hourNum = Number(h);
    if (Number.isNaN(hourNum)) return String(timeValue);
    const meridian = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${m ?? '00'} ${meridian}`;
}

function formatDateTime(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return String(iso);
    }
}

function display(v) {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
}

function shortenUuid(value) {
    if (value == null) return '—';
    const s = String(value).trim();
    if (!s) return '—';
    const first = s.split('-')[0];
    return first || s;
}

function normalizePassengerStatus(raw) {
    if (raw == null || raw === '') return 'pending';
    return String(raw).trim().toLowerCase();
}

function passengerStatusLabel(dbStatus) {
    const s = normalizePassengerStatus(dbStatus);
    const labels = {
        pending: 'Pending', approve: 'Approved', approved: 'Approved',
        reject: 'Rejected', rejected: 'Rejected', suspend: 'Suspended',
        suspended: 'Suspended', active: 'Active', inactive: 'Inactive',
    };
    return labels[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending');
}

function statusBadgeClass(dbStatus) {
    const s = normalizePassengerStatus(dbStatus);
    const map = {
        active: 'text-green-600', approve: 'text-green-600', approved: 'text-green-600',
        pending: 'text-yellow-600', reject: 'text-gray-500', rejected: 'text-gray-500',
        suspend: 'text-orange-600', suspended: 'text-orange-600', inactive: 'text-orange-500',
    };
    return map[s] || 'text-gray-600';
}

// ISO date → weekday key (mon/tue/…)
function isoToWeekdayKey(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return keys[d.getDay()];
}

// ── Sub-components ────────────────────────────────────────────────────────────

const Toggle = ({ checked }) => (
    <div className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#004D6D]' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
);

const ReadField = ({ label, value }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] text-gray-500">{label}</label>
        <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-white break-words">
            {value}
        </div>
    </div>
);

// Location display card (read-only)
const LocationCard = ({ icon, iconBg, title, badge, badgeColor, address, postcode, time, timeLabel, timeColor, emptyText }) => {
    const hasData = address && address !== '—';
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                        {icon}
                    </div>
                    <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
                </div>
                {badge && (
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {badge}
                    </span>
                )}
            </div>

            {!hasData ? (
                <p className="text-[12px] text-gray-400 italic">{emptyText || 'Not set'}</p>
            ) : (
                <div className="space-y-2.5">
                    <div>
                        <div className="text-[10px] text-gray-400 font-medium mb-0.5">Address</div>
                        <div className="text-[13px] text-gray-800 font-medium">{address}</div>
                    </div>
                    {postcode && postcode !== '—' && (
                        <div>
                            <div className="text-[10px] text-gray-400 font-medium mb-0.5">Post Code</div>
                            <div className="text-[13px] text-gray-800 font-medium">{postcode}</div>
                        </div>
                    )}
                    {time && time !== '—' && (
                        <div>
                            <div className="text-[10px] text-gray-400 font-medium mb-0.5">{timeLabel}</div>
                            <div className={`text-[14px] font-bold ${timeColor}`}>{time}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Exception Manager (inline panel) ─────────────────────────────────────────

const ExceptionManager = ({ passengerId, jobId, weeklySchedule, locations }) => {
    const [exceptionDate, setExceptionDate] = useState('');
    const [direction, setDirection] = useState('outbound');
    const [exceptionType, setExceptionType] = useState('skip');
    // Which saved location to use — 'secondary_pickup' | 'respite'
    const [selectedLocationType, setSelectedLocationType] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [exceptions, setExceptions] = useState([]);
    const [loadingEx, setLoadingEx] = useState(false);
    const todayIso = new Date().toISOString().slice(0, 10);

    // Available alternative locations for radio selection
    const secondaryLoc = locations?.find((l) => l.location_type === 'secondary_pickup') || null;
    const respiteLoc = locations?.find((l) => l.location_type === 'respite') || null;
    const altLocationOptions = [
        secondaryLoc && { key: 'secondary_pickup', label: 'Secondary Address', loc: secondaryLoc },
        respiteLoc && { key: 'respite', label: 'Respite Address', loc: respiteLoc },
    ].filter(Boolean);

    // Auto-select first option when switching to alternative_location
    useEffect(() => {
        if (exceptionType === 'alternative_location' && !selectedLocationType && altLocationOptions.length > 0) {
            setSelectedLocationType(altLocationOptions[0].key);
        }
    }, [exceptionType, selectedLocationType, altLocationOptions]);

    useEffect(() => {
        if (!passengerId || !jobId) return;
        setLoadingEx(true);
        supabase
            .from('passenger_schedules')
            .select('*')
            .eq('passenger_id', passengerId)
            .eq('job_id', jobId)
            .not('exception_date', 'is', null)
            .gte('exception_date', todayIso)
            .order('exception_date', { ascending: true })
            .then(({ data, error }) => {
                if (!error) setExceptions(data || []);
            })
            .finally(() => setLoadingEx(false));
    }, [passengerId, jobId, saveSuccess, todayIso]);

    const detectedWeekday = exceptionDate ? isoToWeekdayKey(exceptionDate) : null;
    const isScheduledDay = detectedWeekday && weeklySchedule?.[detectedWeekday];

    // Resolve the chosen alternative location object
    const chosenLoc = altLocationOptions.find((o) => o.key === selectedLocationType)?.loc || null;

    const handleSave = async () => {
        if (!exceptionDate) { setSaveError('Please select a date.'); return; }
        if (!jobId) { setSaveError('No job is linked to this passenger yet.'); return; }

        if (exceptionType === 'alternative_location') {
            if (altLocationOptions.length === 0) {
                setSaveError('No alternative locations saved on this passenger. Add them via Edit Profile first.');
                return;
            }
            if (!chosenLoc) { setSaveError('Please select an alternative location.'); return; }
        }

        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            const weekday = isoToWeekdayKey(exceptionDate);
            if (!weekday) throw new Error('Invalid exception date.');

            // Prefer updating an existing exception row for the selected date/direction.
            // If not present, fall back to the base weekday row.
            const { data: existingExceptionRow, error: existingExceptionErr } = await supabase
                .from('passenger_schedules')
                .select('id')
                .eq('job_id', jobId)
                .eq('passenger_id', passengerId)
                .eq('direction', direction)
                .eq('exception_date', exceptionDate)
                .maybeSingle();

            if (existingExceptionErr) throw existingExceptionErr;

            let targetRow = existingExceptionRow;

            if (!targetRow?.id) {
                const { data: baseRow, error: baseErr } = await supabase
                    .from('passenger_schedules')
                    .select('id')
                    .eq('job_id', jobId)
                    .eq('passenger_id', passengerId)
                    .eq('weekday', weekday)
                    .eq('direction', direction)
                    .is('exception_date', null)
                    .maybeSingle();

                if (baseErr) throw baseErr;
                targetRow = baseRow;
            }

            if (!targetRow?.id) {
                throw new Error('No schedule row found for this date and direction.');
            }

            const { error } = await supabase
                .from('passenger_schedules')
                .update({
                    exception_date: exceptionDate,
                    exception_type: exceptionType,
                    notes: exceptionType === 'alternative_location'
                        ? `location_type:${selectedLocationType}`
                        : null,
                })
                .eq('id', targetRow.id);

            if (error) throw error;

            setSaveSuccess(true);
            setExceptionDate('');
            setSelectedLocationType('');
            setExceptionType('skip');
            setTimeout(() => setSaveSuccess(false), 3500);
        } catch (err) {
            setSaveError(err?.message || 'Could not save exception.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteException = async (exceptionId) => {
        const { error } = await supabase
            .from('passenger_schedules')
            .update({
                exception_date: null,
                exception_type: null,
                notes: null,
            })
            .eq('id', exceptionId);
        if (!error) setExceptions((prev) => prev.filter((e) => e.id !== exceptionId));
    };

    const typeColors = {
        skip: 'bg-red-50 text-red-600 border-red-100',
        alternative_location: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-[15px] font-bold text-gray-900 mb-1">Schedule Exceptions</h2>
            <p className="text-[12px] text-gray-400 mb-4 leading-relaxed">
                Override this passenger's schedule for a specific date. Applies to that date only —
                the following week returns to normal automatically.
            </p>

            {!jobId && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg mb-4">
                    <MdWarningAmber size={14} className="text-amber-500 shrink-0" />
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        This passenger is not in any job currently. Schedule exceptions apply after they are assigned to a job.
                    </p>
                </div>
            )}

            <div className="space-y-3">

                {/* Date */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">Exception Date</label>
                    <input
                        type="date"
                        value={exceptionDate}
                        min={todayIso}
                        onChange={(e) => setExceptionDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                    />
                    {detectedWeekday && (
                        <p className={`text-[11px] font-semibold mt-1 ${isScheduledDay ? 'text-[#004D6D]' : 'text-amber-600'}`}>
                            {isScheduledDay
                                ? `✓ ${WEEKDAYS.find(d => d.key === detectedWeekday)?.label} is a scheduled day`
                                : `⚠ ${WEEKDAYS.find(d => d.key === detectedWeekday)?.label} is not in their regular schedule`}
                        </p>
                    )}
                </div>

                {/* Direction */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">Journey</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: 'outbound', icon: <MdWbSunny size={14} className="text-amber-500" />, label: 'Morning' },
                            { val: 'inbound', icon: <MdNightlight size={14} className="text-indigo-500" />, label: 'Evening' },
                        ].map(({ val, icon, label }) => (
                            <button key={val} type="button" onClick={() => setDirection(val)}
                                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
                                    direction === val
                                        ? 'bg-[#004D6D] text-white border-[#004D6D]'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#004D6D]'
                                }`}
                            >
                                {icon}{label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Exception type — only Skip and Alternative Location */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">Exception Type</label>
                    <div className="grid grid-cols-1 gap-1.5">
                        {[
                            { val: 'skip', label: 'Skip — passenger not on this run', color: 'text-red-600' },
                            { val: 'alternative_location', label: 'Alternative Location', color: 'text-purple-600' },
                        ].map(({ val, label, color }) => (
                            <button key={val} type="button" onClick={() => setExceptionType(val)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12px] font-medium text-left transition-all ${
                                    exceptionType === val
                                        ? 'border-[#004D6D] bg-[#004D6D]/5'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${exceptionType === val ? 'border-[#004D6D]' : 'border-gray-300'}`}>
                                    {exceptionType === val && <div className="w-1.5 h-1.5 rounded-full bg-[#004D6D]" />}
                                </div>
                                <span className={exceptionType === val ? color : 'text-gray-600'}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Alternative location radio selection */}
                {exceptionType === 'alternative_location' && (
                    <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-semibold text-gray-600">
                            {direction === 'outbound' ? 'Pick up from' : 'Drop off at'}
                            <span className="text-red-500 ml-0.5">*</span>
                        </label>

                        {altLocationOptions.length === 0 ? (
                            <div className="px-3 py-3 bg-amber-50 border border-amber-100 rounded-lg">
                                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                    No alternative locations saved on this passenger's profile.
                                    Add a Secondary or Respite address via <span className="font-bold">Edit Profile</span> first.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {altLocationOptions.map(({ key, label, loc }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedLocationType(key)}
                                        className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-all ${
                                            selectedLocationType === key
                                                ? 'border-[#004D6D] bg-[#004D6D]/5'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedLocationType === key ? 'border-[#004D6D]' : 'border-gray-300'}`}>
                                            {selectedLocationType === key && <div className="w-1.5 h-1.5 rounded-full bg-[#004D6D]" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-bold text-gray-800">{label}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{loc.address}</p>
                                            {loc.postcode && (
                                                <p className="text-[10px] text-gray-400">{loc.postcode}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {saveError && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                        <MdWarningAmber size={14} className="text-red-500 shrink-0" />
                        <p className="text-[11px] text-red-600 font-medium">{saveError}</p>
                    </div>
                )}

                {saveSuccess && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                        <MdCheck size={14} className="text-green-600 shrink-0" />
                        <p className="text-[11px] text-green-600 font-medium">Exception saved. Next occurrence of this date uses normal schedule.</p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !exceptionDate || !jobId}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MdAdd size={16} />
                    {saving ? 'Saving...' : 'Save Exception'}
                </button>
            </div>

            {/* ── Existing Exceptions ── */}
            {(loadingEx || exceptions.length > 0) && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                    <h3 className="text-[12px] font-bold text-gray-700 mb-2">Saved Exceptions</h3>
                    {loadingEx ? (
                        <div className="space-y-2">
                            {[1, 2].map((i) => <ShimmerBlock key={i} className="h-10 rounded-lg" />)}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {exceptions.map((ex) => {
                                const dirIcon = ex.direction === 'outbound'
                                    ? <MdWbSunny size={12} className="text-amber-500 shrink-0" />
                                    : <MdNightlight size={12} className="text-indigo-400 shrink-0" />;
                                // Parse location label from notes field if set
                                const locLabel = ex.notes?.startsWith('location_type:')
                                    ? ex.notes.replace('location_type:', '').replace('_', ' ')
                                    : null;
                                return (
                                    <div key={ex.id} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {dirIcon}
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-semibold text-gray-800">
                                                    {new Date(ex.exception_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    <span className="text-gray-400 font-normal ml-1 text-[11px]">
                                                        ({WEEKDAYS.find(d => d.key === ex.weekday)?.label})
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${typeColors[ex.exception_type] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                        {ex.exception_type?.replace('_', ' ')}
                                                    </span>
                                                    {locLabel && (
                                                        <span className="text-[10px] text-gray-400 capitalize">{locLabel}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteException(ex.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                            aria-label="Delete exception"
                                        >
                                            <MdClose size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const PassengerDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can } = useSubAdminPermissions();
    const canViewUsers = can('view_users');

    if (!canViewUsers) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You do not have permission to view users.
            </div>
        );
    }

    const [bundle, setBundle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!id) { setLoading(false); setBundle(null); return; }
            setLoading(true);
            setError('');
            try {
                const data = await getPassengerDetailBundle(id);
                if (!cancelled) setBundle(data);
            } catch (e) {
                if (!cancelled) { setError(e?.message || 'Failed to load passenger.'); setBundle(null); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const p = bundle?.passenger;
    const job = bundle?.job;
    const driver = bundle?.driver;
    const pa = bundle?.passengerAssistant;
    const locations = bundle?.locations || [];

    // Helper to find an optional location by type
    const locByType = (type) => locations.find((l) => l.location_type === type) || null;
    const secondaryLoc = locByType('secondary_pickup');
    const respiteLoc = locByType('respite');

    const fullName = useMemo(() => {
        if (!p) return '';
        return `${p.first_name || ''} ${p.surname || ''}`.trim() || 'Passenger';
    }, [p]);

    const avatarUrl = useMemo(() => {
        if (!p) return '';
        const name = encodeURIComponent(`${p.first_name || 'P'}+${p.surname || ''}`);
        return `https://ui-avatars.com/api/?name=${name}&background=e5e7eb&color=374151&size=128`;
    }, [p]);

    const jobTitleLine = useMemo(() => {
        if (!job) return 'Not assigned to any job currently';
        const ref = shortenUuid(job.id).toUpperCase();
        return `Job ${ref} – ${job.job_name || '—'}`;
    }, [job]);

    // Weekly schedule from passenger record
    const weeklySchedule = p?.weekly_schedule || {};
    const activeDays = WEEKDAYS.filter((d) => Boolean(weeklySchedule[d.key]));

    if (loading) {
        return (
            <LoadingStatus label="Loading passenger profile" className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <ShimmerBlock className="h-7 w-48 rounded-md" />
                    <div className="flex items-center gap-3">
                        <ShimmerBlock className="h-10 w-28 rounded-lg" />
                        <ShimmerBlock className="h-10 w-28 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    <div className="lg:col-span-2 space-y-5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <ShimmerBlock className="h-5 w-40 rounded-md" />
                                <div className="grid grid-cols-2 gap-4">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="space-y-2">
                                            <ShimmerBlock className="h-3 w-24 rounded-md" />
                                            <ShimmerBlock className="h-11 rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-1 space-y-5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <ShimmerBlock className="h-5 w-36 rounded-md" />
                                <ShimmerBlock className="h-24 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </LoadingStatus>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
        );
    }

    if (!p) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-[14px] text-gray-600">
                Passenger not found.
            </div>
        );
    }

    const statusLabel = passengerStatusLabel(p.status);
    const badgeClass = statusBadgeClass(p.status);

    // Renamed column reads with legacy fallback
    const primaryAddress = p.primary_pickup_address ?? p.pickup_address ?? '';
    const primaryPostcode = p.primary_pickup_postcode ?? p.pickup_postal_code ?? '';
    const primaryPickupTime = p.primary_pickup_time ?? p.pickup_time ?? '';
    const eduAddress = p.educational_site_address ?? p.dropoff_address ?? '';
    const eduPostcode = p.educational_site_postcode ?? p.dropoff_postal_code ?? '';
    const eduDropoffTime = p.educational_site_dropoff_time ?? p.dropoff_time ?? '';

    return (
        <div className="space-y-5">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-end flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 border border-red-400 rounded-lg text-[13px] font-semibold text-red-500 bg-white hover:bg-red-50 transition-all"
                    >
                        <MdBlock size={16} />
                        Deactivate
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/team/users/passengers/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                    >
                        <MdEdit size={15} />
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* ════════ LEFT (2/3) ════════ */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── Profile Summary Card ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-4 mb-5">
                            <img src={avatarUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shrink-0" />
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[18px] font-bold text-gray-900">{fullName}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>{statusLabel}</span>
                                    {p.wheelchair_required && (
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-500">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                                <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5h2l1 4h3v2h-3.5l-.5-2H13l1 4a4 4 0 1 1-2 0l-1-4z" />
                                            </svg>
                                            Wheelchair Required
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4">
                            <div>
                                <div className="text-[10px] text-gray-400 font-medium mb-1">Assigned Job</div>
                                <div className="text-[13px] font-semibold text-[#004D6D] break-words">{jobTitleLine}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-medium mb-1">Assigned Driver</div>
                                <div className="text-[13px] font-semibold text-gray-800">
                                    {driver ? `${driver.first_name} ${driver.last_name}` : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-medium mb-1">Assigned PA</div>
                                <div className="text-[13px] font-semibold text-gray-800">
                                    {pa ? `${pa.first_name} ${pa.surname}` : '—'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Personal Information ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-5">Personal Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <ReadField label="First Name" value={display(p.first_name)} />
                            <ReadField label="Surname" value={display(p.surname)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <ReadField label="Email ID" value={display(p.email)} />
                            <ReadField label="Contact Number 1" value={display(p.contact_number_1)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ReadField label="Contact Number 2 (Optional)" value={display(p.contact_number_2)} />
                        </div>
                    </div>

                    {/* ── Weekly Schedule ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <MdCalendarToday size={16} className="text-[#004D6D]" />
                            <h2 className="text-[15px] font-bold text-gray-900">Weekly Schedule</h2>
                        </div>

                        {activeDays.length === 0 ? (
                            <p className="text-[13px] text-gray-400 italic">No weekly schedule configured.</p>
                        ) : (
                            <>
                                <div className="flex gap-2 flex-wrap mb-3">
                                    {WEEKDAYS.map((day) => {
                                        const active = Boolean(weeklySchedule[day.key]);
                                        return (
                                            <div
                                                key={day.key}
                                                className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
                                                    active
                                                        ? 'bg-[#004D6D] text-white shadow-sm'
                                                        : 'bg-gray-100 text-gray-400'
                                                }`}
                                            >
                                                {day.short}
                                                <span className="text-[8px] mt-0.5 opacity-70">{day.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[12px] text-gray-500">
                                    Active <span className="font-semibold text-[#004D6D]">{activeDays.length}</span> day{activeDays.length !== 1 ? 's' : ''} per week:
                                    {' '}{activeDays.map(d => d.label).join(', ')}
                                </p>
                            </>
                        )}
                    </div>

                    {/* ── Location Cards: Primary + Educational ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <LocationCard
                            icon={<MdHome size={18} className="text-[#004D6D]" />}
                            iconBg="bg-blue-50"
                            title="Primary Address"
                            badge="Required"
                            badgeColor="bg-blue-50 text-[#004D6D]"
                            address={display(primaryAddress)}
                            postcode={display(primaryPostcode)}
                            time={formatTime12h(primaryPickupTime)}
                            timeLabel="Pick-up Time (Morning)"
                            timeColor="text-[#004D6D]"
                        />
                        <LocationCard
                            icon={<MdSchool size={18} className="text-orange-500" />}
                            iconBg="bg-orange-50"
                            title="Educational Site Address 1"
                            badge="Required"
                            badgeColor="bg-orange-50 text-orange-600"
                            address={display(eduAddress)}
                            postcode={display(eduPostcode)}
                            time={formatTime12h(eduDropoffTime)}
                            timeLabel="Drop-off Time (Morning)"
                            timeColor="text-orange-500"
                        />
                    </div>

                    {/* ── Location Cards: Secondary + Respite ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <LocationCard
                            icon={<MdLocationOn size={18} className="text-purple-500" />}
                            iconBg="bg-purple-50"
                            title="Secondary Address"
                            badge="Optional"
                            badgeColor="bg-gray-100 text-gray-500"
                            address={secondaryLoc ? display(secondaryLoc.address) : ''}
                            postcode={secondaryLoc ? display(secondaryLoc.postcode) : ''}
                            emptyText="No secondary address set."
                        />
                        <LocationCard
                            icon={<MdHotel size={18} className="text-teal-500" />}
                            iconBg="bg-teal-50"
                            title="Respite Address"
                            badge="Optional"
                            badgeColor="bg-gray-100 text-gray-500"
                            address={respiteLoc ? display(respiteLoc.address) : ''}
                            postcode={respiteLoc ? display(respiteLoc.postcode) : ''}
                            emptyText="No respite address set."
                        />
                    </div>

                </div>

                {/* ════════ RIGHT (1/3) ════════ */}
                <div className="lg:col-span-1 space-y-5">

                    {/* ── Accessibility & Notes ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Accessibility &amp; Notes</h2>

                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-[13px] font-bold text-gray-800">Wheelchair Requirement</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">Requires accessible vehicle</div>
                            </div>
                            <Toggle checked={!!p.wheelchair_required} />
                        </div>

                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <div className="text-[13px] font-bold text-gray-800">Harness Requirement</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">Requires safety harness</div>
                            </div>
                            <Toggle checked={!!p.harness_required} />
                        </div>

                        <div>
                            <div className="text-[13px] font-bold text-gray-800 mb-2">Special Instructions / Notes</div>
                            <div className="w-full px-3 py-3 border border-gray-200 rounded-lg text-[12px] text-gray-700 bg-white leading-relaxed min-h-[90px] whitespace-pre-wrap">
                                {p.notes?.trim() ? p.notes : '—'}
                            </div>
                            <p className="text-[11px] text-gray-400 italic mt-2">Internal notes for drivers and PAs.</p>
                        </div>
                    </div>

                    {/* ── Audit & History ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Audit &amp; History</h2>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] text-gray-500 shrink-0">Created</span>
                                <span className="text-[12px] font-medium text-gray-700 text-right">{formatDateTime(p.created_at)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] text-gray-500 shrink-0">Last updated</span>
                                <span className="text-[12px] font-medium text-gray-700 text-right">{formatDateTime(p.updated_at)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] text-gray-500 shrink-0">Last updated by</span>
                                <span className="text-[12px] font-medium text-gray-700 text-right">Not stored</span>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-gray-500 mb-2">Record timeline</div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-[#004D6D] shrink-0 mt-1.5" />
                                    <div>
                                        <div className="text-[12px] font-semibold text-gray-800">Passenger created</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(p.created_at)}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-[#004D6D] shrink-0 mt-1.5" />
                                    <div>
                                        <div className="text-[12px] font-semibold text-gray-800">Passenger last updated</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(p.updated_at)}</div>
                                    </div>
                                </div>
                                {job && (
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-[#004D6D] shrink-0 mt-1.5" />
                                        <div>
                                            <div className="text-[12px] font-semibold text-gray-800">Assigned job</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{jobTitleLine}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Schedule Exceptions ── */}
                    <ExceptionManager
                        passengerId={p.id}
                        jobId={job?.id || null}
                        weeklySchedule={weeklySchedule}
                        locations={locations}
                    />

                </div>
            </div>
        </div>
    );
};

export default PassengerDetail;