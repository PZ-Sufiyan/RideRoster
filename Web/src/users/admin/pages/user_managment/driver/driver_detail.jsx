import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';
import {
    MdEdit,
    MdMessage,
    MdVisibility,
    MdChevronLeft,
    MdChevronRight,
    MdCheckCircle,
    MdWarningAmber,
    MdErrorOutline,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import {
    getDriverByIdMaybe,
    getDriverDocumentsByDriver,
    getVehiclesByDriver,
    getVehicleDocuments,
    getJobsByAssignedDriver,
} from '../../../../../services/driverVehicleService';

const JOB_PAGE_SIZE = 5;

/** Labels aligned with `add_new_driver.jsx` / DB document_type enums */
const DRIVER_DOCUMENT_LABELS = {
    driving_license_front: 'Driving licence — Front',
    driving_license_back: 'Driving licence — Back',
    taxi_badge_front: 'Taxi badge — Front',
    taxi_badge_back: 'Taxi badge — Back',
    dbs_certificate_front: 'DBS certificate — Front',
    dbs_certificate_back: 'DBS certificate — Back',
    safeguarding_certificate: 'Safeguarding certificate',
};

const VEHICLE_DOCUMENT_LABELS = {
    v5_front: 'V5 registration — Front',
    v5_inside: 'V5 registration — Inside',
    mot_certificate: 'MOT certificate',
    taxi_license_plate: 'Taxi licence plate',
    insurance_certificate: 'Insurance certificate',
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

function vehicleDocumentTypeUsesExpiry(documentType) {
    return ['mot_certificate', 'taxi_license_plate', 'insurance_certificate'].includes(documentType);
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

const JOB_STATUS_COLORS = {
    Draft: 'bg-gray-50 text-gray-700 border border-gray-200',
    Scheduled: 'bg-blue-50 text-blue-600 border border-blue-200',
    Completed: 'bg-green-50 text-green-700 border border-green-200',
    Cancelled: 'bg-red-50 text-red-600 border border-red-200',
    Active: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    Pending: 'bg-amber-50 text-amber-800 border border-amber-200',
};

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

function DocumentRow({ title, fileUrl, usesExpiry, expiryDate }) {
    const urgency = usesExpiry ? expiryUrgency(expiryDate) : null;
    const expLine =
        usesExpiry && expiryDate
            ? `Expires ${formatDate(expiryDate)}`
            : usesExpiry
              ? 'No expiry date set'
              : null;

    const openUrl = () => {
        if (!fileUrl || typeof fileUrl !== 'string') return;
        const u = fileUrl.trim();
        if (!u) return;
        window.open(u, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="flex items-start justify-between gap-3 py-3.5 border-b border-gray-100 last:border-0">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                {expLine ? <p className="text-xs text-gray-500 mt-1">{expLine}</p> : null}
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
                    onClick={openUrl}
                    disabled={!fileUrl}
                    className="p-1.5 rounded-full text-gray-400 hover:text-[#004D6D] hover:bg-[#004D6D]/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Open ${title}`}
                    title={fileUrl ? 'Open in new tab' : 'No file'}
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
    const [jobPage, setJobPage] = useState(1);

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
                setLoading(false);
                return;
            }
            if (d.company_id !== admin.company_id) {
                throw new Error('Driver not found or access denied.');
            }

            const [docs, vehicles, jobRows] = await Promise.all([
                getDriverDocumentsByDriver(id),
                getVehiclesByDriver(id),
                getJobsByAssignedDriver(admin.company_id, id),
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

    useEffect(() => {
        setJobPage(1);
    }, [jobs.length, id]);

    const displayName = useMemo(() => {
        if (!driver) return '';
        return [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim() || 'Driver';
    }, [driver]);

    const avatarUrl = useMemo(() => {
        if (!driver) return '';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=e5e7eb&color=374151&size=128`;
    }, [driver, displayName]);

    const totalJobPages = Math.max(1, Math.ceil(jobs.length / JOB_PAGE_SIZE));
    const jobSlice = useMemo(
        () => jobs.slice((jobPage - 1) * JOB_PAGE_SIZE, jobPage * JOB_PAGE_SIZE),
        [jobs, jobPage]
    );

    const jobPageNumbers = useMemo(() => {
        const maxBtns = 5;
        if (totalJobPages <= maxBtns) {
            return Array.from({ length: totalJobPages }, (_, i) => i + 1);
        }
        let start = Math.max(1, jobPage - Math.floor(maxBtns / 2));
        let end = Math.min(totalJobPages, start + maxBtns - 1);
        start = Math.max(1, end - maxBtns + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [totalJobPages, jobPage]);

    const jobRangeStart = jobs.length === 0 ? 0 : (jobPage - 1) * JOB_PAGE_SIZE + 1;
    const jobRangeEnd = Math.min(jobPage * JOB_PAGE_SIZE, jobs.length);

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
            {/* ── Driver Header ── */}
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow bg-gray-100"
                        />
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{displayName}</h1>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusPillClass(driver.status)}`}>
                                {formatStatusLabel(driver.status)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Driver ID: {driver.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <MdMessage size={16} />
                        Send Message
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/users/drivers')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#005580] text-white rounded-xl text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm"
                    >
                        <MdEdit size={16} />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* ── Driver Details + Performance ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                    <h2 className="text-base font-bold text-gray-900 mb-5">Driver Details</h2>
                    <div className="space-y-3.5 text-sm">
                        {[
                            { label: 'Email Address', value: driver.email },
                            { label: 'Phone Number', value: driver.phone },
                            { label: 'Address', value: driver.residential_address },
                            { label: 'Licence number', value: driver.license_no },
                            { label: 'Nationality', value: driver.nationality },
                            { label: 'Right to work code', value: driver.right_to_work_code },
                            { label: 'DBS update ID', value: driver.dbs_service_update_id },
                            { label: 'Emergency contact', value: driver.emergency_contact_name },
                            { label: 'Emergency phone', value: driver.emergency_contact_phone },
                            { label: 'Member Since', value: formatDate(driver.created_at) },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-start gap-5">
                                <span className="text-gray-500 shrink-0">{label}</span>
                                <span className="text-gray-800 font-medium text-right wrap-break-word">{value || '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                    <h2 className="text-base font-bold text-gray-900 mb-5">Performance Overview</h2>
                    <div className="grid grid-cols-3 divide-x divide-gray-100">
                        <div className="flex flex-col items-center gap-1 px-4 first:pl-0">
                            <span className="text-3xl font-bold text-gray-900">{jobs.length}</span>
                            <span className="text-xs text-gray-400 text-center">Total Jobs</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-3xl font-bold text-green-600">98%</span>
                            <span className="text-xs text-gray-400 text-center">Acceptance Rate</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-3xl font-bold text-green-600">99%</span>
                            <span className="text-xs text-gray-400 text-center">On-Time Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Compliance (left) + Job History (right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Compliance & Documents — PA-style list */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                    <h2 className="text-base font-bold text-gray-900 mb-1">Compliance &amp; Documents</h2>
                    <p className="text-xs text-gray-500 mb-5">Driver and vehicle files from registration (same types as Add Driver).</p>

                    <div className="space-y-7">
                        <div>
                            <h3 className="text-xs font-bold text-[#005580] uppercase tracking-wide mb-3">Driver documents</h3>
                            {driverDocs.length === 0 ? (
                                <p className="text-sm text-gray-500">No driver documents on file.</p>
                            ) : (
                                <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                                    {driverDocs.map((doc) => (
                                        <DocumentRow
                                            key={doc.id}
                                            title={DRIVER_DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                                            fileUrl={doc.file_url}
                                            usesExpiry
                                            expiryDate={doc.expiry_date}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-[#005580] uppercase tracking-wide mb-3">Vehicle</h3>
                            {vehicle ? (
                                <div className="rounded-xl border border-gray-100 p-4 mb-4 text-sm space-y-2.5 bg-gray-50/40">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Taxi licence plate</span>
                                        <span className="font-medium text-gray-800 text-right">
                                            {vehicle.taxi_license_plate_number || '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Seating capacity</span>
                                        <span className="font-medium text-gray-800">
                                            {vehicle.seating_capacity != null ? `${vehicle.seating_capacity} passengers` : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Registration number</span>
                                        <span className="font-medium text-gray-800 text-right">{vehicle.registration_number || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Make / model</span>
                                        <span className="font-medium text-gray-800 text-right">
                                            {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Vehicle colour</span>
                                        <span className="font-medium text-gray-800 text-right">{vehicle.vehicle_colour || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Year of first registration</span>
                                        <span className="font-medium text-gray-800 text-right">{formatDate(vehicle.year_of_first_registration)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Licensing type</span>
                                        <span className="font-medium text-gray-800 text-right">{vehicle.licensing_type || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Body style</span>
                                        <span className="font-medium text-gray-800 text-right">{vehicle.body_style || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Wheelchair accessible</span>
                                        <span className="font-medium text-gray-800 text-right">
                                            {vehicle.wheelchair_accessible == null ? '—' : vehicle.wheelchair_accessible ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    {vehicle.vehicle_photo_url ? (
                                        <div className="pt-2 border-t border-gray-100">
                                            <DocumentRow
                                                title="Vehicle photo"
                                                fileUrl={vehicle.vehicle_photo_url}
                                                usesExpiry={false}
                                                expiryDate={null}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 pt-1">No vehicle photo URL stored.</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 mb-2">No vehicle linked to this driver.</p>
                            )}

                            {vehicle && vehicleDocs.length > 0 ? (
                                <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                                    {vehicleDocs.map((doc) => (
                                        <DocumentRow
                                            key={doc.id}
                                            title={VEHICLE_DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                                            fileUrl={doc.file_url}
                                            usesExpiry={vehicleDocumentTypeUsesExpiry(doc.document_type)}
                                            expiryDate={doc.expiry_date}
                                        />
                                    ))}
                                </div>
                            ) : vehicle ? (
                                <p className="text-sm text-gray-500">No V5 / MOT / insurance documents on file.</p>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Job History */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Job History</h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">From jobs where you are assigned driver</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/jobs')}
                            className="text-sm text-[#005580] hover:text-sky-900 font-medium transition-colors"
                        >
                            View all jobs
                        </button>
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
                                {jobSlice.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">
                                            No assigned jobs yet.
                                        </td>
                                    </tr>
                                ) : (
                                    jobSlice.map((job) => {
                                        const ref = job.internal_job_id?.trim() || job.id?.slice(0, 8) || '—';
                                        const statusLbl = formatJobStatusLabel(job.status);
                                        const st =
                                            JOB_STATUS_COLORS[statusLbl] || 'bg-gray-100 text-gray-600 border border-gray-200';
                                        return (
                                            <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-5 py-3.5 font-semibold text-[#005580] text-xs whitespace-nowrap">
                                                    {ref}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-700 min-w-[120px]">{job.job_name || '—'}</td>
                                                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                                                    {formatDate(job.job_date)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${st}`}
                                                    >
                                                        {statusLbl}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/admin/jobs/${job.id}`)}
                                                        className="text-xs font-semibold text-[#005580] hover:underline"
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
                                Showing {jobRangeStart} to {jobRangeEnd} of {jobs.length} jobs
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                                    disabled={jobPage === 1}
                                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MdChevronLeft size={16} />
                                </button>
                                {jobPageNumbers.map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setJobPage(page)}
                                        className={`min-w-7.5 h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors ${
                                            jobPage === page
                                                ? 'bg-[#005580] text-white border-[#005580]'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setJobPage((p) => Math.min(totalJobPages, p + 1))}
                                    disabled={jobPage === totalJobPages}
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

export default DriverDetail;
