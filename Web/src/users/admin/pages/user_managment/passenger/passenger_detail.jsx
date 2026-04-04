import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdHome,
    MdSchool,
    MdEdit,
    MdBlock,
} from 'react-icons/md';
import { getPassengerDetailBundle } from '../../../../../services/passengerService';

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
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
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

function money(n) {
    if (n === null || n === undefined || n === '') return '—';
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP' }).format(num);
}

function normalizePassengerStatus(raw) {
    if (raw == null || raw === '') return 'pending';
    return String(raw).trim().toLowerCase();
}

function passengerStatusLabel(dbStatus) {
    const s = normalizePassengerStatus(dbStatus);
    const labels = {
        pending: 'Pending',
        approve: 'Approved',
        approved: 'Approved',
        reject: 'Rejected',
        rejected: 'Rejected',
        suspend: 'Suspended',
        suspended: 'Suspended',
        active: 'Active',
    };
    return labels[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending');
}

function statusBadgeClass(dbStatus) {
    const s = normalizePassengerStatus(dbStatus);
    const map = {
        active: 'text-green-600',
        approve: 'text-green-600',
        approved: 'text-green-600',
        pending: 'text-yellow-600',
        reject: 'text-gray-500',
        rejected: 'text-gray-500',
        suspend: 'text-orange-600',
        suspended: 'text-orange-600',
    };
    return map[s] || 'text-gray-600';
}

/* ── Toggle Switch ────────────────────────────────────────── */
const Toggle = ({ checked }) => (
    <div
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#004D6D]' : 'bg-gray-300'}`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </div>
);

/* ── Read-only field ──────────────────────────────────────── */
const ReadField = ({ label, value }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] text-gray-500">{label}</label>
        <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-white break-words">
            {value}
        </div>
    </div>
);

/* ── Main Component ───────────────────────────────────────── */
const PassengerDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [bundle, setBundle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!id) {
                setLoading(false);
                setBundle(null);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const data = await getPassengerDetailBundle(id);
                if (!cancelled) setBundle(data);
            } catch (e) {
                if (!cancelled) {
                    setError(e?.message || 'Failed to load passenger.');
                    setBundle(null);
                }
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
    const route = bundle?.route;

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
        if (!job) return '—';
        const ref = job.internal_job_id?.trim() || job.id?.slice(0, 8) || '—';
        return `Job ${ref} – ${job.job_name || '—'}`;
    }, [job]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[240px] text-[14px] text-gray-500">
                Loading passenger…
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {error}
            </div>
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

    return (
        <div className="space-y-5">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-[22px] font-bold text-gray-900">Passenger Profile</h1>
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
                        onClick={() => navigate(`/admin/users/passengers/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                    >
                        <MdEdit size={15} />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* ════════ LEFT (2/3) ════════ */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── Profile Summary Card ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-4 mb-5">
                            <img
                                src={avatarUrl}
                                alt={fullName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shrink-0"
                            />
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[18px] font-bold text-gray-900">{fullName}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
                                        {statusLabel}
                                    </span>
                                    {p.wheelchair_required ? (
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-500">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                                <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5h2l1 4h3v2h-3.5l-.5-2H13l1 4a4 4 0 1 1-2 0l-1-4z" />
                                            </svg>
                                            Wheelchair Required
                                        </span>
                                    ) : null}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1 font-mono">ID: {p.id}</div>
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

                    {/* ── Pickup + Drop-Off (passenger record) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <MdHome size={18} className="text-[#004D6D]" />
                                </div>
                                <h3 className="text-[13px] font-bold text-gray-900">Pickup (Home)</h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Address</div>
                                    <div className="text-[13px] text-gray-800 font-medium">{display(p.pickup_address)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Post Code</div>
                                    <div className="text-[13px] text-gray-800 font-medium">{display(p.pickup_postal_code)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Pickup Time (Morning)</div>
                                    <div className="text-[14px] font-bold text-[#004D6D]">{formatTime12h(p.pickup_time)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                    <MdSchool size={18} className="text-orange-500" />
                                </div>
                                <h3 className="text-[13px] font-bold text-gray-900">Drop-Off (School)</h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Address</div>
                                    <div className="text-[13px] text-gray-800 font-medium">{display(p.dropoff_address)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Post Code</div>
                                    <div className="text-[13px] text-gray-800 font-medium">{display(p.dropoff_postal_code)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Pickup Time (Return)</div>
                                    <div className="text-[14px] font-bold text-orange-500">{formatTime12h(p.dropoff_time)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════════ RIGHT (1/3) ════════ */}
                <div className="lg:col-span-1 space-y-5">

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Accessibility &amp; Notes</h2>

                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <div className="text-[13px] font-bold text-gray-800">Wheelchair Requirement</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">Requires accessible vehicle</div>
                            </div>
                            <Toggle checked={!!p.wheelchair_required} />
                        </div>

                        <div>
                            <div className="text-[13px] font-bold text-gray-800 mb-2">Special Instructions / Notes</div>
                            <div className="w-full px-3 py-3 border border-gray-200 rounded-lg text-[12px] text-gray-700 bg-white leading-relaxed min-h-[90px] whitespace-pre-wrap">
                                {p.notes?.trim() ? p.notes : '—'}
                            </div>
                            <p className="text-[11px] text-gray-400 italic mt-2">
                                Internal notes for drivers and PAs.
                            </p>
                        </div>
                    </div>

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
                                {job ? (
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-[#004D6D] shrink-0 mt-1.5" />
                                        <div>
                                            <div className="text-[12px] font-semibold text-gray-800">Assigned job</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{jobTitleLine}</div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PassengerDetail;
