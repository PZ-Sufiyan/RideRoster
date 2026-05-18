import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack,
    MdCalendarToday,
    MdWarning,
    MdCheck,
    MdClose,
    MdAttachMoney,
    MdStar,
    MdWork,
} from 'react-icons/md';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../services/companyService';
import {
    fetchJobDetailBundle,
    formatJobDisplayId,
    acceptCounterOffer,
    rejectCounterOffer,
} from '../../../../services/jobService';
import { ShimmerBlock } from '../../../../utils/Shimmer';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSemesterDate(iso) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatPay(value) {
    if (value == null || value === '') return '—';
    return `£${Number(value).toFixed(2)}`;
}

const defaultAvatar = (seed) =>
    `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`;

// ── Sub-components ────────────────────────────────────────────────────────────

const SECTION_LABEL = 'text-[11px] font-bold text-gray-400 uppercase tracking-wider';

const DetailRow = ({ icon, value, label, changed, changeLabel }) => {
    if (changed) {
        return (
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-3">
                <MdWarning size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                    <p className="text-[14px] font-bold text-gray-900">{value}</p>
                    <p className="text-[12px] font-semibold text-orange-600 mt-0.5">{changeLabel}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                {icon ? React.createElement(icon, { size: 18, className: 'text-gray-500' }) : null}
            </div>
            <div className="min-w-0">
                <p className="text-[14px] font-bold text-gray-900">{value}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
};

const OfferCard = ({
    title,
    titleClass = 'text-gray-900',
    badge,
    borderClass = 'border-gray-200',
    children,
}) => (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${borderClass}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className={`text-[15px] font-bold ${titleClass}`}>{title}</h2>
            {badge}
        </div>
        <div className="px-5 py-5 space-y-5">{children}</div>
    </div>
);

// ── Confirm Dialog ────────────────────────────────────────────────────────────

const ConfirmDialog = ({ open, type, driverName, onConfirm, onCancel, loading }) => {
    if (!open) return null;
    const isReject = type === 'reject';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!loading ? onCancel : undefined} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${isReject ? 'bg-red-50' : 'bg-green-50'}`}>
                    {isReject
                        ? <MdClose size={22} className="text-red-500" />
                        : <MdCheck size={22} className="text-green-500" />}
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-1">
                    {isReject ? 'Reject Counter-Offer?' : 'Accept Counter-Offer?'}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                    {isReject
                        ? `This will remove ${driverName || 'the driver'} from this job and clear the counter-offer. The job will return to unassigned.`
                        : `This will update the driver pay to the counter-offer amount and mark the job as accepted for ${driverName || 'the driver'}.`}
                </p>
                <div className="flex items-center gap-3 justify-end mt-5">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-5 py-2 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-50 ${
                            isReject ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                        }`}
                    >
                        {loading
                            ? (isReject ? 'Rejecting…' : 'Accepting…')
                            : (isReject ? 'Yes, Reject' : 'Yes, Accept')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const CounterOfferReview = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bundle, setBundle] = useState(null);

    const [confirm, setConfirm] = useState({ open: false, type: null });
    const [acting, setActing] = useState(false);
    const [actionError, setActionError] = useState(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const cid = admin?.company_id;
            if (!cid) throw new Error('No company linked to your account.');
            const data = await fetchJobDetailBundle(id, cid);
            setBundle(data);

            // Guard: if this job is not in counter request state, redirect to job detail
            const status = String(data?.job?.driver_approval_status || '').trim().toLowerCase();
            if (!['counter request', 'counter requested'].includes(status)) {
                navigate(`/portal/jobs/${id}`, { replace: true });
            }
        } catch (e) {
            setError(e?.message || 'Could not load job.');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { load(); }, [load]);

    const job = bundle?.job;
    const driver = bundle?.driver;
    const driverName = driver
        ? [driver.first_name, driver.last_name].filter(Boolean).join(' ')
        : null;

    const originalPay = job?.driver_pay;
    const counterPay = job?.driver_counter_offer_pay;
    const payChanged =
        counterPay != null &&
        Number(counterPay) !== Number(originalPay);

    const handleConfirm = async () => {
        setActing(true);
        setActionError(null);
        try {
            if (confirm.type === 'accept') {
                await acceptCounterOffer(id, counterPay);
                navigate(`/portal/jobs/${id}`, { replace: true });
            } else {
                await rejectCounterOffer(id);
                navigate('/portal/jobs', { replace: true });
            }
        } catch (e) {
            setActionError(e?.message || 'Action failed. Please try again.');
            setConfirm({ open: false, type: null });
        } finally {
            setActing(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="space-y-6">
                <ShimmerBlock className="h-8 w-48 rounded-md" />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <ShimmerBlock className="h-64 rounded-xl" />
                    <ShimmerBlock className="h-64 rounded-xl" />
                    <ShimmerBlock className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <p className="text-[14px] text-red-600 font-medium">{error}</p>
                <button
                    type="button"
                    onClick={() => navigate('/portal/jobs')}
                    className="text-[14px] font-bold text-[#004D6D]"
                >
                    Back to jobs
                </button>
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <ConfirmDialog
                open={confirm.open}
                type={confirm.type}
                driverName={driverName}
                onConfirm={handleConfirm}
                onCancel={() => setConfirm({ open: false, type: null })}
                loading={acting}
            />

            {/* Page header */}
            <div>
                <button
                    type="button"
                    onClick={() => navigate(`/portal/jobs/${id}`)}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-[#004D6D] hover:underline mb-4"
                >
                    <MdArrowBack size={18} />
                    Back to Job
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[24px] font-bold text-gray-900">Counter-Offer Review</h1>
                        <p className="text-[14px] text-gray-500 mt-1 font-medium">
                            Job: {job ? formatJobDisplayId(job.id) : '—'}
                            {job?.job_name ? ` · ${job.job_name}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setConfirm({ open: true, type: 'reject' })}
                            disabled={acting}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg bg-white hover:bg-red-50 text-[13px] font-bold transition-all disabled:opacity-50"
                        >
                            Reject Offer
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirm({ open: true, type: 'accept' })}
                            disabled={acting || counterPay == null}
                            className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg hover:bg-[#003c55] text-[13px] font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                            <MdCheck size={18} />
                            Accept &amp; Assign
                        </button>
                    </div>
                </div>

                {/* Action error */}
                {actionError && (
                    <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-600 font-medium">
                        <MdWarning size={16} className="shrink-0" />
                        {actionError}
                    </div>
                )}
            </div>

            {/* Three-column comparison */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* ── Original Job Offer ── */}
                <OfferCard title="Original Job Offer">
                    <div>
                        <p className={SECTION_LABEL}>Job Details</p>
                        <div className="mt-4 space-y-4">
                            <DetailRow
                                icon={MdWork}
                                value={job?.job_name || '—'}
                                label="Job Name"
                            />
                            <DetailRow
                                icon={MdCalendarToday}
                                value={formatSemesterDate(job?.semester_start)}
                                label="Semester Start"
                            />
                            <DetailRow
                                icon={MdCalendarToday}
                                value={formatSemesterDate(job?.semester_end)}
                                label="Semester End"
                            />
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-5">
                        <p className={SECTION_LABEL}>Compensation</p>
                        <div className="mt-4">
                            <DetailRow
                                icon={MdAttachMoney}
                                value={formatPay(originalPay)}
                                label="Original Driver Pay"
                            />
                        </div>
                    </div>
                </OfferCard>

                {/* ── Driver's Counter-Offer ── */}
                <OfferCard
                    title="Driver's Counter-Offer"
                    titleClass="text-[#004D6D]"
                    borderClass="border-2 border-[#004D6D]"
                    badge={
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                            Awaiting Review
                        </span>
                    }
                >
                    <div>
                        <p className={SECTION_LABEL}>Job Details</p>
                        <div className="mt-4 space-y-4">
                            <DetailRow
                                icon={MdWork}
                                value={job?.job_name || '—'}
                                label="No Change"
                            />
                            <DetailRow
                                icon={MdCalendarToday}
                                value={formatSemesterDate(job?.semester_start)}
                                label="No Change"
                            />
                            <DetailRow
                                icon={MdCalendarToday}
                                value={formatSemesterDate(job?.semester_end)}
                                label="No Change"
                            />
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-5">
                        <p className={SECTION_LABEL}>Compensation</p>
                        <div className="mt-4">
                            {payChanged ? (
                                <DetailRow
                                    value={formatPay(counterPay)}
                                    changed
                                    changeLabel={`Driver requested ${formatPay(counterPay)} (was ${formatPay(originalPay)})`}
                                />
                            ) : (
                                <DetailRow
                                    icon={MdAttachMoney}
                                    value={formatPay(counterPay ?? originalPay)}
                                    label="No change to pay"
                                />
                            )}
                        </div>
                    </div>
                </OfferCard>

                {/* ── Driver Details sidebar ── */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-5">Driver Details</h2>
                        {driver ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={defaultAvatar(driver.id)}
                                        className="w-12 h-12 rounded-full object-cover border border-gray-100"
                                        alt=""
                                    />
                                    <div>
                                        <p className="text-[15px] font-bold text-gray-900">{driverName}</p>
                                        <p className="text-[13px] text-gray-500 mt-0.5">{driver.email || '—'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-[13px]">
                                    {driver.license_no && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">License No</span>
                                            <span className="font-bold text-gray-800">{driver.license_no}</span>
                                        </div>
                                    )}
                                    {driver.phone && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Phone</span>
                                            <span className="font-bold text-gray-800">{driver.phone}</span>
                                        </div>
                                    )}
                                    {driver.status && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Status</span>
                                            <span className="font-bold text-gray-800 capitalize">{driver.status}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/portal/users/drivers/${driver.id}`)}
                                    className="mt-4 w-full py-2.5 border border-gray-200 rounded-lg text-[13px] font-bold text-[#004D6D] hover:bg-gray-50 transition-colors"
                                >
                                    View Full Profile
                                </button>
                            </>
                        ) : (
                            <p className="text-[13px] text-gray-400">No driver data available.</p>
                        )}
                    </div>

                    {/* Pay comparison summary */}
                    {payChanged && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <h2 className="text-[15px] font-bold text-gray-900 mb-4">Pay Difference</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-gray-500">Original pay</span>
                                    <span className="font-bold text-gray-800">{formatPay(originalPay)}</span>
                                </div>
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-gray-500">Counter-offer</span>
                                    <span className="font-bold text-[#004D6D]">{formatPay(counterPay)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between text-[13px]">
                                    <span className="text-gray-500">Difference</span>
                                    <span className={`font-bold ${Number(counterPay) > Number(originalPay) ? 'text-red-500' : 'text-green-500'}`}>
                                        {Number(counterPay) > Number(originalPay) ? '+' : ''}
                                        {formatPay(Number(counterPay) - Number(originalPay))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CounterOfferReview;