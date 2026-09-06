import React, { useState, useEffect, useMemo, useCallback, createElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack,
    MdEdit,
    MdEmail,
    MdPhone,
    MdDateRange,
    MdCheckCircle,
    MdWarningAmber,
    MdVisibility,
    MdChevronLeft,
    MdChevronRight,
    MdErrorOutline,
    MdContactEmergency,
    MdBadge,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import {
    getPassengerAssistantByIdMaybe,
    getPassengerAssistantDocuments,
    getJobsByAssignedPassengerAssistant,
    PA_DOCUMENT_TYPES,
} from '../../../../../services/passengerAsssistantService';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';
import { useSubAdminPermissions } from '../../../../../context/subAdminPermissionsContext';
import FleetBadge from '../../../../../components/FleetBadge';

const ITEMS_PER_PAGE = 10;

const DOC_TYPE_LABELS = {
    [PA_DOCUMENT_TYPES.PASSPORT]: 'Passport',
    [PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE]: 'Safeguarding Certificate',
    [PA_DOCUMENT_TYPES.BACKGROUND_CHECK]: 'Background Check Certificate',
    [PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE]: 'First Aid Certification',
};

function documentTypeLabel(type) {
    if (!type) return 'Document';
    return DOC_TYPE_LABELS[type] || String(type).replace(/_/g, ' ');
}

/** Only passport & safeguarding use expiry dates in the product; other types do not. */
const DOCUMENT_TYPES_WITH_EXPIRY = new Set([
    PA_DOCUMENT_TYPES.PASSPORT,
    PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE,
]);

function documentTypeHasExpiry(documentType) {
    return DOCUMENT_TYPES_WITH_EXPIRY.has(documentType);
}

function formatDate(isoOrDate) {
    if (!isoOrDate) return '—';
    try {
        const d = typeof isoOrDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)
            ? new Date(`${isoOrDate}T12:00:00`)
            : new Date(isoOrDate);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return '—';
    }
}

function formatMemberSince(iso) {
    return formatDate(iso);
}

function shortenUuid(value) {
    if (value == null) return '—';
    const s = String(value).trim();
    if (!s) return '—';
    const first = s.split('-')[0];
    return first || s;
}

/** @returns {'expired'|'soon'|'ok'|'none'} */
function expiryUrgency(expiryDateStr) {
    if (!expiryDateStr) return 'none';
    const exp = new Date(`${String(expiryDateStr).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(exp.getTime())) return 'none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const e = new Date(exp);
    e.setHours(0, 0, 0, 0);
    const diffMs = e.getTime() - today.getTime();
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
    if (diffMs < 0) return 'expired';
    if (diffMs <= oneMonthMs) return 'soon';
    return 'ok';
}

function normalizePaStatus(raw) {
    if (raw == null || raw === '') return 'pending';
    const s = String(raw).trim().toLowerCase();
    if (['pending', 'approve', 'reject', 'suspend', 'active'].includes(s)) return s;
    if (s === 'approved') return 'approve';
    if (s === 'rejected') return 'reject';
    if (s === 'suspended') return 'suspend';
    return s;
}

function paStatusLabel(dbStatus) {
    const s = normalizePaStatus(dbStatus);
    const labels = {
        pending: 'Pending',
        approve: 'Approved',
        reject: 'Rejected',
        suspend: 'Suspended',
        active: 'Active',
    };
    return labels[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending');
}

const STATUS_BADGE = {
    Pending: 'bg-amber-50 text-amber-800 border border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    Rejected: 'bg-gray-100 text-gray-600 border border-gray-200',
    Suspended: 'bg-red-50 text-red-600 border border-red-200',
    Active: 'bg-blue-50 text-blue-700 border border-blue-200',
};

function formatJobStatusLabel(raw) {
    if (raw == null || raw === '') return '—';
    const s = String(raw).trim().toLowerCase();
    const map = {
        draft: 'Draft',
        scheduled: 'Scheduled',
        completed: 'Completed',
        cancelled: 'Cancelled',
        active: 'Active',
        pending: 'Pending',
    };
    if (map[s]) return map[s];
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const JOB_STATUS_COLORS = {
    Draft: 'bg-gray-50 text-gray-700 border border-gray-200',
    Scheduled: 'bg-blue-50 text-blue-600 border border-blue-200',
    Completed: 'bg-green-50 text-green-700 border border-green-200',
    Cancelled: 'bg-red-50 text-red-600 border border-red-200',
    Active: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    Pending: 'bg-amber-50 text-amber-800 border border-amber-200',
};
function ProfileField({ icon,label, value }) {
    return (
        <div className="flex items-start gap-3 text-sm">
            {createElement(icon, { size: 18, className: 'text-gray-400 shrink-0 mt-0.5', 'aria-hidden': true })}
            <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-gray-800 font-medium mt-0.5 wrap-break-word">{value || '—'}</p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────
const PADetail = () => {
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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pa, setPa] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [jobs, setJobs] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);

    const load = useCallback(async () => {
        if (!id) {
            setError('Missing profile id.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');

            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) throw new Error('No company linked to your account.');

            const row = await getPassengerAssistantByIdMaybe(id);
            if (!row) {
                setPa(null);
                setDocuments([]);
                setJobs([]);
                setError('');
                setLoading(false);
                return;
            }
            if (row.company_id !== admin.company_id) {
                throw new Error('Passenger assistant not found or access denied.');
            }

            const [docs, jobRows] = await Promise.all([
                getPassengerAssistantDocuments(id),
                getJobsByAssignedPassengerAssistant(admin.company_id, id),
            ]);

            setPa(row);
            setDocuments(docs);
            setJobs(jobRows);
        } catch (e) {
            setError(e?.message || 'Failed to load profile.');
            setPa(null);
            setDocuments([]);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setCurrentPage(1);
    }, [jobs.length, id]);

    const totalPages = Math.max(1, Math.ceil(jobs.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => jobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [jobs, currentPage]
    );

    const pageNumbers = useMemo(() => {
        const maxBtns = 5;
        if (totalPages <= maxBtns) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        let start = Math.max(1, currentPage - Math.floor(maxBtns / 2));
        let end = Math.min(totalPages, start + maxBtns - 1);
        start = Math.max(1, end - maxBtns + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [totalPages, currentPage]);

    const handlePage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const startItem = jobs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, jobs.length);

    const displayName = useMemo(() => {
        if (!pa) return '';
        return `${pa.first_name || ''} ${pa.surname || ''}`.trim() || 'Passenger Assistant';
    }, [pa]);

    const avatarUrl = useMemo(() => {
        if (!pa) return '';
        if (pa.profile_picture_url) return pa.profile_picture_url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=e5e7eb&color=374151&size=128`;
    }, [pa, displayName]);

    const statusLabel = pa ? paStatusLabel(pa.status) : '—';
    const statusClass = STATUS_BADGE[statusLabel] || STATUS_BADGE.Pending;

    const openDocumentUrl = (url) => {
        if (!url || typeof url !== 'string') return;
        const u = url.trim();
        if (!u) return;
        window.open(u, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <LoadingStatus label="Loading passenger assistant profile" className="space-y-5">
                <ShimmerBlock className="h-8 w-64 rounded-md" />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    <div className="lg:col-span-2 space-y-4">
                        <ShimmerBlock className="h-48 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                        <ShimmerBlock className="h-64 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                    </div>
                    <ShimmerBlock className="lg:col-span-3 min-h-96 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                </div>
            </LoadingStatus>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => navigate('/team/users/pa')}
                    className="flex items-center gap-2 text-sm font-medium text-[#005580] hover:underline"
                >
                    <MdArrowBack size={20} />
                    Back to PA list
                </button>
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
            </div>
        );
    }

    if (!pa) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-[14px] text-gray-600">
                    Passenger assistant not found.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Back + Title Row ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Passenger Assistant Profile &amp; Activity</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate(`/team/users/pa/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <MdEdit size={16} />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* ── Main Content: 2 columns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
                {/* ── Left Column ── */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Profile Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] flex flex-col items-center text-center gap-3">
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow bg-gray-100"
                        />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
                            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                                    <span className="w-2 h-2 rounded-full bg-current opacity-60 shrink-0" />
                                    {statusLabel}
                                </div>
                                <FleetBadge fleet={pa.fleet} entity="pa" />
                            </div>
                        </div>

                        <div className="w-full border-t border-gray-100 pt-4 space-y-4 text-left">
                            <ProfileField
                                icon={MdEmail}
                                fieldName="email"
                                label="Email"
                                value={pa.email}
                            />
                            <ProfileField
                                icon={MdPhone}
                                fieldName="phone"
                                label="Phone"
                                value={pa.phone}
                            />
                            <ProfileField
                                icon={MdContactEmergency}
                                fieldName="emergency_contact_name"
                                label="Emergency contact"
                                value={
                                    pa.emergency_contact_name || pa.emergency_contact_phone
                                        ? `${pa.emergency_contact_name || '—'}${pa.emergency_contact_phone ? ` · ${pa.emergency_contact_phone}` : ''}`
                                        : ''
                                }
                            />
                            <ProfileField
                                icon={MdDateRange}
                                fieldName="created_at"
                                label="Member since"
                                value={formatMemberSince(pa.created_at)}
                            />
                        </div>
                    </div>

                    {/* Required Documents Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                        <h3 className="text-sm font-bold text-gray-800">Required Documents</h3>
                        <p className="text-xs text-gray-400 mt-0.5 mb-4">From passenger_assistant_documents</p>

                        {documents.length === 0 ? (
                            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {documents.map((doc) => {
                                    const usesExpiry = documentTypeHasExpiry(doc.document_type);
                                    const urgency = usesExpiry ? expiryUrgency(doc.expiry_date) : null;
                                    const expLine = usesExpiry
                                        ? doc.expiry_date
                                            ? `Expires ${formatDate(doc.expiry_date)}`
                                            : 'No expiry date set'
                                        : null;
                                    return (
                                        <div key={doc.id} className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800">{documentTypeLabel(doc.document_type)}</p>
                                                {expLine ? (
                                                    <p className="text-xs text-gray-500 mt-1">{expLine}</p>
                                                ) : null}
                                                {usesExpiry && urgency === 'expired' && (
                                                    <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                                                        <MdErrorOutline size={14} className="shrink-0" aria-hidden />
                                                        Expired
                                                    </p>
                                                )}
                                                {usesExpiry && urgency === 'soon' && (
                                                    <p className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1">
                                                        <MdWarningAmber size={14} className="shrink-0" aria-hidden />
                                                        Expires soon
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openDocumentUrl(doc.file_url)}
                                                    disabled={!doc.file_url}
                                                    className="p-1.5 rounded-full text-gray-400 hover:text-[#004D6D] hover:bg-[#004D6D]/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    aria-label={`Open ${documentTypeLabel(doc.document_type)}`}
                                                    title={doc.file_url ? 'Open in new tab' : 'No file URL'}
                                                >
                                                    <MdVisibility size={20} />
                                                </button>
                                                {usesExpiry ? (
                                                    urgency === 'expired' ? (
                                                        <MdErrorOutline size={22} className="text-red-500 shrink-0" aria-hidden />
                                                    ) : urgency === 'soon' ? (
                                                        <MdWarningAmber size={22} className="text-amber-500 shrink-0" aria-hidden />
                                                    ) : urgency === 'ok' ? (
                                                        <MdCheckCircle size={22} className="text-green-500 shrink-0" aria-hidden />
                                                    ) : (
                                                        <MdCheckCircle size={22} className="text-gray-300 shrink-0" aria-hidden />
                                                    )
                                                ) : (
                                                    <MdCheckCircle size={22} className="text-green-500 shrink-0" aria-hidden />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Column: Assigned Jobs ── */}
                <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-[#005580]">Assigned Jobs</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Jobs where assigned_pa_id matches this PA</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Job ID</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Route</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">
                                            No jobs assigned to this PA yet.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((job) => {
                                        const ref = shortenUuid(job.id);
                                        const statusLbl = formatJobStatusLabel(job.status);
                                        const statusStyle =
                                            JOB_STATUS_COLORS[statusLbl] || 'bg-gray-100 text-gray-600 border border-gray-200';
                                        return (
                                            <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-5 py-3.5 font-semibold text-[#005580] text-xs whitespace-nowrap">
                                                    {ref}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-700 min-w-[140px]">{job.job_name || '—'}</td>
                                                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                                                    {formatDate(job.job_date)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusStyle}`}
                                                    >
                                                        {statusLbl}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/team/jobs/${job.id}`)}
                                                        className="text-xs font-semibold text-[#005580] hover:text-sky-900 hover:underline transition-colors"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {jobs.length > 0 ? (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 text-sm flex-wrap">
                            <span className="text-gray-500">
                                Showing {startItem} to {endItem} of {jobs.length} jobs
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handlePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MdChevronLeft size={16} />
                                </button>

                                {pageNumbers.map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => handlePage(page)}
                                        className={`min-w-7.5 h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors ${
                                            currentPage === page
                                                ? 'bg-[#005580] text-white border-[#005580]'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => handlePage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MdChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default PADetail;
