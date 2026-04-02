import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack,
    MdBlock,
    MdEdit,
    MdLocationOn,
    MdWarning,
} from 'react-icons/md';
import { supabase } from '../../../../lib/supabaseClient';
import { getSubAdminById } from '../../../../services/subAdminService';
import {
    fetchJobDetailBundle,
    cancelJobById,
    formatJobDisplayId,
    formatJobDateTimeLabel,
    deriveJobUiStatus,
} from '../../../../services/jobService';

const defaultAvatar = (seed) =>
    `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`;

const JobDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bundle, setBundle] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const sub = await getSubAdminById(uid);
            const companyId = sub?.company_id;
            if (!companyId) throw new Error('No company linked to your account.');
            const data = await fetchJobDetailBundle(id, companyId);
            setBundle(data);
        } catch (e) {
            setError(e?.message || 'Could not load job.');
            setBundle(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const job = bundle?.job;
    const ui = job ? deriveJobUiStatus(job) : { label: '', statusColor: '' };
    const pickups = bundle?.pickups || [];
    const dropoffs = bundle?.dropoffs || [];
    const pickupLine =
        pickups.length > 0 ? pickups[0]?.address?.trim() || '—' : '—';
    const dropoffLine =
        dropoffs.length > 0
            ? dropoffs[dropoffs.length - 1]?.address?.trim() || '—'
            : '—';

    const driverName = bundle?.driver
        ? [bundle.driver.first_name, bundle.driver.last_name].filter(Boolean).join(' ').trim()
        : null;
    const vehicleLabel =
        bundle?.vehicle?.taxi_license_plate_number ||
        bundle?.driver?.license_no ||
        null;

    const paName = bundle?.pa
        ? [bundle.pa.first_name, bundle.pa.surname].filter(Boolean).join(' ').trim()
        : null;

    const totalPay =
        (Number(job?.driver_pay) || 0) + (Number(job?.passenger_assistant_pay) || 0);
    const totalPayDisplay =
        totalPay > 0
            ? `£${totalPay.toFixed(2)}`
            : '—';

    const paymentLabel = (() => {
        const s = (job?.status || '').toLowerCase();
        if (s === 'cancelled') return 'N/A';
        if (s === 'completed') return 'Complete';
        return 'Pending';
    })();

    const confirmCancel = async () => {
        if (!job || !id) return;
        setCancelling(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const sub = await getSubAdminById(uid);
            const companyId = sub?.company_id;
            if (!companyId) throw new Error('No company linked to your account.');
            await cancelJobById(id, companyId);
            setShowCancelModal(false);
            setCancelReason('');
            navigate('/subadmin/jobs');
        } catch (e) {
            setError(e?.message || 'Could not cancel job.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <button
                    type="button"
                    onClick={() => navigate('/subadmin/jobs')}
                    className="flex items-center text-[14px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                    <MdArrowBack size={18} className="mr-2" />
                    Back to Jobs
                </button>
                <p className="text-[14px] text-gray-500 font-medium">Loading job…</p>
            </div>
        );
    }

    if (error && !bundle) {
        return (
            <div className="space-y-6">
                <button
                    type="button"
                    onClick={() => navigate('/subadmin/jobs')}
                    className="flex items-center text-[14px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                    <MdArrowBack size={18} className="mr-2" />
                    Back to Jobs
                </button>
                <p className="text-[14px] text-red-600 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button
                type="button"
                onClick={() => navigate('/subadmin/jobs')}
                className="flex items-center text-[14px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
                <MdArrowBack size={18} className="mr-2" />
                Back to Jobs
            </button>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-[24px] font-bold text-gray-900">
                            Job ID: {job ? formatJobDisplayId(job.id) : '—'}
                        </h1>
                        {job && (
                            <span
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border ${ui.statusColor}`}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                {ui.label}
                            </span>
                        )}
                    </div>
                    <p className="text-[14px] text-gray-500 mt-1 font-medium">
                        Scheduled for:{' '}
                        {job ? formatJobDateTimeLabel(job.job_date, job.pickup_time) : '—'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        disabled={!job || job.status === 'cancelled'}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg bg-white hover:bg-red-50 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <MdBlock size={18} />
                        Cancel Job
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/subadmin/jobs/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg bg-white hover:bg-gray-50 text-[13px] font-bold transition-all"
                    >
                        <MdEdit size={18} />
                        Edit Job
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
                        <h2 className="text-[18px] font-bold text-gray-900 mb-4">Job Progress Timeline</h2>
                        <p className="text-[14px] text-gray-500 leading-relaxed">
                            Detailed progress timeline is not available yet — we do not store per-step events in the
                            database. Status, schedule, and stops on this page reflect the current job record.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
                        <div className="h-48 bg-[#E5E7EB] relative overflow-hidden flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 400 200" preserveAspectRatio="none">
                                <path d="M -50 150 L 150 120 L 250 80 L 450 20" stroke="white" strokeWidth="8" fill="none" />
                                <path d="M 50 -20 L 100 80 L 200 150 L 300 220" stroke="white" strokeWidth="6" fill="none" />
                                <path d="M 150 120 L 200 150" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" />
                                <path
                                    d="M 120 150 C 150 150 180 130 200 110 C 230 80 280 90 310 50"
                                    stroke="#004D6D"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div
                                className="absolute w-3 h-3 bg-[#004D6D] border-2 border-white rounded-full shadow-md"
                                style={{ bottom: '45px', left: '115px' }}
                            />
                            <MdLocationOn className="absolute text-orange-500 drop-shadow-md" style={{ bottom: '75px', left: '190px' }} size={24} />
                            <MdLocationOn className="absolute text-orange-500 drop-shadow-md" style={{ bottom: '95px', left: '265px' }} size={24} />
                            <MdLocationOn className="absolute text-orange-500 drop-shadow-md" style={{ top: '35px', left: '300px' }} size={24} />
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-4 h-4 rounded-full border-4 border-[#004D6D] bg-white mt-0.5 shrink-0 shadow-sm" />
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pickup</p>
                                    <p className="text-[13px] font-bold text-gray-900 mt-1">{pickupLine}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MdLocationOn className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Drop-off</p>
                                    <p className="text-[13px] font-bold text-gray-900 mt-1">{dropoffLine}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-5">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Assigned Driver</h2>
                        {driverName ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={defaultAvatar(bundle.driver.id)}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                    alt=""
                                />
                                <div>
                                    <p className="text-[14px] font-bold text-gray-900">{driverName}</p>
                                    <p className="text-[12px] text-gray-500 font-medium mt-0.5">{vehicleLabel || '—'}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[13px] text-gray-500 font-medium">No driver assigned</p>
                        )}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-5">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Passenger Assistant</h2>
                        {paName ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={bundle.pa.profile_picture_url || defaultAvatar(bundle.pa.id)}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                    alt=""
                                />
                                <div>
                                    <p className="text-[14px] font-bold text-gray-900">{paName}</p>
                                    <p className="text-[12px] text-gray-500 font-medium mt-0.5">Passenger Assistant</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[13px] text-gray-500 font-medium">No passenger assistant assigned</p>
                        )}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-5 border-t-4 border-t-green-500">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-5">Compensation</h2>
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <p className="text-[13px] text-gray-500 font-medium tracking-tight">Total Amount</p>
                                <p className="text-[14px] font-bold text-green-600">{totalPayDisplay}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-[13px] text-gray-500 font-medium tracking-tight">Payment Status</p>
                                <p className="text-[13px] font-bold text-orange-500">{paymentLabel}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !cancelling && setShowCancelModal(false)} />
                    <div className="relative w-full max-w-[440px] bg-white rounded-[24px] shadow-2xl p-8 text-center overflow-hidden">
                        <div className="flex items-center justify-center mb-6">
                            <MdWarning className="text-red-500" size={28} />
                            <h2 className="text-[20px] font-bold text-gray-900 ml-2">Cancel Job Confirmation</h2>
                        </div>
                        <p className="text-[14px] text-gray-500 mb-6 font-medium">
                            Are you sure you want to cancel {job ? formatJobDisplayId(job.id) : 'this job'}? This will mark
                            the job as cancelled.
                        </p>
                        <div className="text-left mb-8">
                            <label className="block text-[13px] font-bold text-gray-900 mb-2">Reason for Cancellation*</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] resize-none h-28"
                                placeholder="e.g., Client requested cancellation, vehicle maintenance..."
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                disabled={cancelling || !cancelReason.trim()}
                                onClick={confirmCancel}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-[14px] font-bold hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {cancelling ? 'Cancelling…' : 'Yes, Cancel Job'}
                            </button>
                            <button
                                type="button"
                                disabled={cancelling}
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors"
                            >
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
