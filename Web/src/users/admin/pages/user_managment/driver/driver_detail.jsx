import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';
import {
    MdEdit,
    MdMessage,
    MdVisibility,
    MdCheckCircle,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import {
    getDriverByIdMaybe,
    getDriverDocumentsByDriver,
    getVehiclesByDriver,
    getVehicleDocuments,
    getJobsByAssignedDriver,
    getJobSessionsByDriver,
} from '../../../../../services/driverVehicleService';

/** Labels aligned with `add_new_driver.jsx` / DB document_type enums */
const DRIVER_DOCUMENT_LABELS = {
    driving_license_front: 'Front Image',
    driving_license_back: 'Back Image',
    taxi_badge_front: 'Front Image',
    taxi_badge_back: 'Back Image',
    dbs_certificate_front: 'Front Image',
    dbs_certificate_back: 'Back Image',
    safeguarding_certificate: 'Certificate',
};

const VEHICLE_DOCUMENT_LABELS = {
    v5_front: 'V5 Front',
    v5_inside: 'V5 Inside',
    mot_certificate: 'MOT Certificate',
    taxi_license_plate: 'Taxi License Plate',
    insurance_certificate: 'Insurance Certificate',
};

const DRIVER_DOC_ORDER = [
    'driving_license_front',
    'driving_license_back',
    'taxi_badge_front',
    'taxi_badge_back',
    'dbs_certificate_front',
    'dbs_certificate_back',
    'safeguarding_certificate',
];

const VEHICLE_DOC_ORDER = ['v5_front', 'v5_inside', 'mot_certificate', 'taxi_license_plate', 'insurance_certificate'];

function formatDate(isoOrDate) {
    if (!isoOrDate) return '—';
    try {
        const d =
            typeof isoOrDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)
                ? new Date(`${isoOrDate}T12:00:00`)
                : new Date(isoOrDate);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return '—';
    }
}

function isExpiredDate(expiryDate) {
    if (!expiryDate) return false;
    const dt = new Date(`${String(expiryDate).slice(0, 10)}T23:59:59`);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
}

function sortDocsByOrder(docs, order, typeKey = 'document_type') {
    const idx = (t) => {
        const i = order.indexOf(t);
        return i === -1 ? 999 : i;
    };
    return [...(docs || [])].sort((a, b) => idx(a[typeKey]) - idx(b[typeKey]));
}

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

function statusPillClass(statusRaw) {
    const s = (statusRaw || '').trim().toLowerCase();
    const map = {
        active: 'bg-green-50 text-green-700 border border-green-200',
        approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        rejected: 'bg-red-50 text-red-600 border border-red-200',
        suspended: 'bg-orange-50 text-orange-700 border border-orange-200',
        pending: 'bg-amber-50 text-amber-800 border border-amber-200',
    };
    return map[s] || 'bg-gray-100 text-gray-600 border border-gray-200';
}

function formatStatusLabel(raw) {
    const s = (raw || '').trim();
    if (!s) return '—';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Returns the first segment of a UUID (text before the first dash). */
function shortenUuid(value) {
    if (value == null) return '—';
    const s = String(value).trim();
    if (!s) return '—';
    const first = s.split('-')[0];
    return first || s;
}

function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
    });
}

function formatDirectionLabel(raw) {
    const s = (raw || '').trim().toLowerCase();
    if (!s) return '—';
    if (s === 'outbound') return 'Outbound';
    if (s === 'inbound') return 'Inbound';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function sessionStatusTextClass(statusRaw) {
    const s = (statusRaw || '').trim().toLowerCase();
    const map = {
        completed: 'text-emerald-600',
        active: 'text-blue-600',
        pending: 'text-amber-600',
        cancelled: 'text-red-600',
    };
    return map[s] || 'text-gray-600';
}

const DriverDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [driver, setDriver] = useState(null);
    const [driverDocs, setDriverDocs] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [vehicleDocs, setVehicleDocs] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [jobSessions, setJobSessions] = useState([]);

    const load = useCallback(async () => {
        if (!id) {
            setError('Missing driver id.');
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

            const d = await getDriverByIdMaybe(id);
            if (!d) {
                setDriver(null);
                setDriverDocs([]);
                setVehicle(null);
                setVehicleDocs([]);
                setJobs([]);
                setJobSessions([]);
                setLoading(false);
                return;
            }
            if (d.company_id !== admin.company_id) {
                throw new Error('Driver not found or access denied.');
            }

            const [docs, vehicles, jobRows, sessionRows] = await Promise.all([
                getDriverDocumentsByDriver(id),
                getVehiclesByDriver(id),
                getJobsByAssignedDriver(admin.company_id, id),
                getJobSessionsByDriver(id),
            ]);

            const v = vehicles?.[0] || null;
            let vDocs = [];
            if (v?.id) {
                vDocs = await getVehicleDocuments({ vehicleId: v.id });
            }

            setDriver(d);
            setDriverDocs(sortDocsByOrder(docs, DRIVER_DOC_ORDER));
            setVehicle(v);
            setVehicleDocs(sortDocsByOrder(vDocs, VEHICLE_DOC_ORDER));
            setJobs(jobRows || []);
            setJobSessions(sessionRows || []);
        } catch (e) {
            setError(e?.message || 'Failed to load driver.');
            setDriver(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const displayName = useMemo(() => {
        if (!driver) return '';
        return [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim() || 'Driver';
    }, [driver]);

    const avatarUrl = useMemo(() => {
        if (!driver) return '';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=e5e7eb&color=374151&size=128`;
    }, [driver, displayName]);

    const jobSessionsToShow = useMemo(() => jobSessions, [jobSessions]);
    const driverDocByType = useMemo(() => Object.fromEntries(driverDocs.map((d) => [d.document_type, d])), [driverDocs]);
    const vehicleDocByType = useMemo(() => Object.fromEntries(vehicleDocs.map((d) => [d.document_type, d])), [vehicleDocs]);
    const otherCertificateDocs = useMemo(
        () => driverDocs.filter((d) => d?.document_type === 'other_certificate'),
        [driverDocs]
    );
    const hasExpiredDriverDocs = useMemo(
        () => driverDocs.some((d) => d?.expiry_date && isExpiredDate(d.expiry_date)),
        [driverDocs]
    );
    const hasExpiredVehicleDocs = useMemo(
        () => vehicleDocs.some((d) => d?.expiry_date && isExpiredDate(d.expiry_date)),
        [vehicleDocs]
    );

    const openInNewTab = (url) => {
        const cleaned = String(url || '').trim();
        if (!cleaned) return;
        window.open(cleaned, '_blank', 'noopener,noreferrer');
    };

    const DocumentThumb = ({ doc, label }) => {
        const uploaded = Boolean(doc?.file_url);
        const expired = uploaded && doc?.expiry_date && isExpiredDate(doc.expiry_date);
        const subLabel = !uploaded ? '—' : expired ? 'Expired' : 'Uploaded';
        const subLabelClass = !uploaded ? 'text-gray-400' : expired ? 'text-red-600' : 'text-emerald-600';
        return (
        <div className="border border-gray-200 rounded-lg px-3 py-3 bg-gray-50/50 min-h-[78px] flex items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[11px] text-gray-600 truncate">{label}</p>
                <p className={`text-[11px] mt-0.5 ${subLabelClass}`}>{subLabel}</p>
                {uploaded && doc?.expiry_date ? (
                    <p className="text-[10px] text-gray-500 mt-0.5">Expiry: {formatDate(doc.expiry_date)}</p>
                ) : null}
            </div>
            <button
                type="button"
                onClick={() => openInNewTab(doc?.file_url)}
                disabled={!doc?.file_url}
                className="p-1.5 rounded text-gray-500 hover:text-[#005580] hover:bg-[#005580]/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title={doc?.file_url ? 'Open in new tab' : 'No file'}
                aria-label={`Open ${label}`}
            >
                <MdVisibility size={16} />
            </button>
        </div>
        );
    };

    if (loading) {
        return (
            <LoadingStatus label="Loading driver profile" className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <ShimmerBlock className="h-14 w-14 rounded-full shrink-0" rounded="rounded-full" />
                        <div className="flex-1 space-y-2 min-w-0">
                            <ShimmerBlock className="h-6 w-56 max-w-full rounded-md" />
                            <ShimmerBlock className="h-4 w-72 max-w-full rounded-md" />
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <ShimmerBlock className="h-10 w-28 rounded-lg" />
                            <ShimmerBlock className="h-10 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <ShimmerBlock className="h-40 rounded-xl" rounded="rounded-xl" />
                    <ShimmerBlock className="h-40 rounded-xl" rounded="rounded-xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <ShimmerBlock className="min-h-[22rem] rounded-xl" rounded="rounded-xl" />
                    <ShimmerBlock className="min-h-[22rem] rounded-xl" rounded="rounded-xl" />
                </div>
            </LoadingStatus>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
        );
    }

    if (!driver) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-[14px] text-gray-600">Driver not found.</div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="shrink-0">
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-12 h-12 rounded-full object-cover bg-gray-100"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[24px] font-bold text-gray-900">{displayName}</h1>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusPillClass(driver.status)}`}>
                                {formatStatusLabel(driver.status)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Driver ID: {driver.internal_driver_id || driver.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <MdMessage size={14} />
                        Send Message
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/portal/users/drivers')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#005580] text-white rounded-lg text-xs font-semibold hover:bg-[#004663]"
                    >
                        <MdEdit size={14} />
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h2 className="text-[22px] font-bold text-gray-900 mb-4">Driver Details</h2>
                    <div className="space-y-2.5 text-sm">
                        {[
                            { label: 'Email Address', value: driver.email },
                            { label: 'Phone Number', value: driver.phone },
                            { label: 'Address', value: driver.residential_address },
                            { label: 'Member Since', value: formatDate(driver.created_at) },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-start gap-4">
                                <span className="text-gray-500 text-[13px]">{label}</span>
                                <span className="text-gray-800 text-[13px] font-medium text-right">{value || '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h2 className="text-[22px] font-bold text-gray-900 mb-4">Performance Overview</h2>
                    <div className="grid grid-cols-3 divide-x divide-gray-100">
                        <div className="flex flex-col items-center gap-1 px-4 first:pl-0">
                            <span className="text-[36px] leading-none font-bold text-[#005580]">{jobs.length}</span>
                            <span className="text-[11px] text-gray-400 text-center">Total Jobs</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-[36px] leading-none font-bold text-green-500">98%</span>
                            <span className="text-[11px] text-gray-400 text-center">Acceptance Rate</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-[36px] leading-none font-bold text-green-500">99%</span>
                            <span className="text-[11px] text-gray-400 text-center">On-Time Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-[22px] font-bold text-gray-900">Compliance &amp; Documents</h2>
                </div>

                <div className="p-4 space-y-3">
                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">Driving License</p>
                            <span
                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                    hasExpiredDriverDocs ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {hasExpiredDriverDocs ? 'Expired' : 'Verified'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <DocumentThumb doc={driverDocByType.driving_license_front} label={DRIVER_DOCUMENT_LABELS.driving_license_front} />
                            <DocumentThumb doc={driverDocByType.driving_license_back} label={DRIVER_DOCUMENT_LABELS.driving_license_back} />
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">Taxi Badge</p>
                            <span
                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                    hasExpiredDriverDocs ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {hasExpiredDriverDocs ? 'Expired' : 'Verified'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <DocumentThumb doc={driverDocByType.taxi_badge_front} label={DRIVER_DOCUMENT_LABELS.taxi_badge_front} />
                            <DocumentThumb doc={driverDocByType.taxi_badge_back} label={DRIVER_DOCUMENT_LABELS.taxi_badge_back} />
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">DBS Check</p>
                            <span
                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                    hasExpiredDriverDocs ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {hasExpiredDriverDocs ? 'Expired' : 'Verified'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <DocumentThumb doc={driverDocByType.dbs_certificate_front} label={DRIVER_DOCUMENT_LABELS.dbs_certificate_front} />
                            <DocumentThumb doc={driverDocByType.dbs_certificate_back} label={DRIVER_DOCUMENT_LABELS.dbs_certificate_back} />
                        </div>
                        <div className="flex justify-between mt-2 text-[11px] text-gray-500">
                            <span>DBS Update Service ID</span>
                            <span className="text-gray-700">{driver.dbs_service_update_id || '—'}</span>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">Derby City Safeguarding Certificate</p>
                            <span
                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                    driverDocByType.safeguarding_certificate?.expiry_date &&
                                    isExpiredDate(driverDocByType.safeguarding_certificate.expiry_date)
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {driverDocByType.safeguarding_certificate?.expiry_date &&
                                isExpiredDate(driverDocByType.safeguarding_certificate.expiry_date)
                                    ? 'Expired'
                                    : 'Valid'}
                            </span>
                        </div>
                        <div className="mt-2">
                            <DocumentThumb doc={driverDocByType.safeguarding_certificate} label={DRIVER_DOCUMENT_LABELS.safeguarding_certificate} />
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">Vehicle Details</p>
                            <span
                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                    hasExpiredVehicleDocs ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {hasExpiredVehicleDocs ? 'Expired' : 'Complete'}
                            </span>
                        </div>
                        <p className="text-[12px] text-gray-600 mt-1">V5 Registration</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <DocumentThumb doc={vehicleDocByType.v5_front} label={VEHICLE_DOCUMENT_LABELS.v5_front} />
                            <DocumentThumb doc={vehicleDocByType.v5_inside} label={VEHICLE_DOCUMENT_LABELS.v5_inside} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                            <DocumentThumb doc={vehicleDocByType.mot_certificate} label={VEHICLE_DOCUMENT_LABELS.mot_certificate} />
                            <DocumentThumb doc={vehicleDocByType.taxi_license_plate} label={VEHICLE_DOCUMENT_LABELS.taxi_license_plate} />
                            <DocumentThumb doc={vehicleDocByType.insurance_certificate} label={VEHICLE_DOCUMENT_LABELS.insurance_certificate} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <DocumentThumb doc={vehicle?.vehicle_photo_url ? { file_url: vehicle.vehicle_photo_url } : null} label="Vehicle Photo" />
                            <div className="border border-gray-200 rounded-lg px-3 py-3 bg-gray-50/50 min-h-[78px]">
                                <p className="text-[11px] text-gray-600">Seating Capacity</p>
                                <p className="text-[13px] text-gray-800 font-semibold mt-0.5">
                                    {vehicle?.seating_capacity != null ? `${vehicle.seating_capacity} Passengers` : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-[22px] font-bold text-gray-900">Other Certificates</h2>
                </div>
                <div className="p-4">
                    {otherCertificateDocs.length === 0 ? (
                        <p className="text-sm text-gray-500">No other certificates uploaded.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {otherCertificateDocs.map((doc, idx) => (
                                <DocumentThumb
                                    key={doc.id || `${doc.file_url || 'other-cert'}-${idx}`}
                                    doc={doc}
                                    label={`Other Certificate ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-[22px] font-bold text-gray-900">Job History</h2>
                    <button
                        type="button"
                        onClick={() => navigate('/portal/jobs')}
                        className="text-[12px] text-[#005580] font-semibold hover:underline"
                    >
                        View All Jobs
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/60 border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500">Job ID</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500">Job Session ID</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500">Date</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500">Route</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500">Start Time</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500">End Time</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {jobSessionsToShow.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-gray-500">
                                        No job sessions yet.
                                    </td>
                                </tr>
                            ) : (
                                jobSessionsToShow.map((session) => (
                                    <tr key={session.id}>
                                        <td className="px-5 py-2.5 text-[12px] font-semibold text-gray-700">
                                            {shortenUuid(session.job_id)}
                                        </td>
                                        <td className="px-5 py-2.5 text-[12px] font-semibold text-gray-700">
                                            {shortenUuid(session.id)}
                                        </td>
                                        <td className="px-5 py-2.5 text-[12px] text-gray-500">
                                            {formatDate(session.session_date)}
                                        </td>
                                        <td className="px-5 py-2.5 text-[12px] text-gray-700">
                                            {formatDirectionLabel(session.direction)}
                                        </td>
                                        <td className="px-5 py-2.5 text-[12px] text-gray-500">
                                            {formatTime(session.started_at)}
                                        </td>
                                        <td className="px-5 py-2.5 text-[12px] text-gray-500">
                                            {formatTime(session.completed_at)}
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <span
                                                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${sessionStatusTextClass(session.status)}`}
                                            >
                                                <MdCheckCircle size={14} />
                                                {formatJobStatusLabel(session.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DriverDetail;
