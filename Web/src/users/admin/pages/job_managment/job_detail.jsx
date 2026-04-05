import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdBlock,
    MdCheck,
    MdDirectionsCar,
    MdEdit,
    MdLocationOn,
    MdPerson,
    MdWarning,
} from 'react-icons/md';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../services/companyService';
import {
    fetchJobDetailBundle,
    cancelJobById,
    formatJobDisplayId,
    formatJobDateTimeLabel,
    deriveJobUiStatus,
} from '../../../../services/jobService';
import { ShimmerBlock, LoadingStatus } from '../../../../utils/Shimmer';

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
            const admin = await getCompanyAdminById(uid);
            const companyId = admin?.company_id;
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

    const timelineDateLabel = (() => {
        if (!job?.job_date) return 'Nov 18, 2025';
        const parsed = new Date(job.job_date);
        if (Number.isNaN(parsed.getTime())) return 'Nov 18, 2025';
        return parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    })();

    const timelineItems = [
        {
            id: 'completed',
            title: 'Job Completed',
            time: `${timelineDateLabel}, 09:45 AM`,
            note: 'Passenger dropped off successfully.',
            state: 'success',
            icon: MdCheck,
        },
        {
            id: 'dropoff',
            title: 'Arrived at Drop-off',
            time: `${timelineDateLabel}, 09:42 AM`,
            note: dropoffLine === '—' ? '123 Main Street, Anytown, USA 12345' : dropoffLine,
            state: 'active',
            icon: MdLocationOn,
        },
        {
            id: 'onboard',
            title: 'Passenger Onboard',
            time: `${timelineDateLabel}, 08:55 AM`,
            note: 'Passenger is now in the vehicle.',
            state: 'active',
            icon: MdPerson,
        },
        {
            id: 'pickup',
            title: 'Arrived at Pickup',
            time: `${timelineDateLabel}, 08:50 AM`,
            note: pickupLine === '—' ? '456 Oak Avenue, Anytown, USA 12345' : pickupLine,
            state: 'active',
            icon: MdLocationOn,
        },
        {
            id: 'enroute',
            title: 'En Route to Pickup',
            time: `${timelineDateLabel}, 08:35 AM`,
            note: '',
            state: 'muted',
            icon: MdDirectionsCar,
        },
        {
            id: 'driver_assigned',
            title: 'Driver Assigned',
            time: `${timelineDateLabel}, 08:30 AM`,
            note: driverName ? `${driverName} assigned to this job.` : 'Driver assigned to this job.',
            state: 'muted',
            icon: MdPerson,
        },
    ];

    const confirmCancel = async () => {
        if (!job || !id) return;
        setCancelling(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const companyId = admin?.company_id;
            if (!companyId) throw new Error('No company linked to your account.');
            await cancelJobById(id, companyId);
            setShowCancelModal(false);
            setCancelReason('');
            navigate('/admin/jobs');
        } catch (e) {
            setError(e?.message || 'Could not cancel job.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <LoadingStatus label="Loading job details" className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                        <ShimmerBlock className="h-8 w-64 max-w-full rounded-md" />
                        <ShimmerBlock className="h-4 w-48 max-w-full rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <ShimmerBlock className="h-10 w-28 rounded-lg" />
                        <ShimmerBlock className="h-10 w-24 rounded-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <ShimmerBlock className="h-6 w-80 max-w-full rounded-md mb-6" />
                        <div className="space-y-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={`timeline-skeleton-${i}`} className="flex items-start gap-4">
                                    <ShimmerBlock className="w-7 h-7 shrink-0 mt-1" rounded="rounded-full" />
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <ShimmerBlock className="h-4 w-44 max-w-full rounded-md" />
                                        <ShimmerBlock className="h-3 w-32 rounded-md" />
                                        <ShimmerBlock className="h-3 w-64 max-w-full rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                            <ShimmerBlock className="h-48 w-full rounded-none" rounded="rounded-none" />
                            <div className="p-5 space-y-4">
                                <ShimmerBlock className="h-4 w-32 rounded-md" />
                                <ShimmerBlock className="h-11 rounded-xl" rounded="rounded-xl" />
                                <ShimmerBlock className="h-11 rounded-xl" rounded="rounded-xl" />
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
                            <ShimmerBlock className="h-5 w-36 rounded-md" />
                            <ShimmerBlock className="h-10 rounded-xl" rounded="rounded-xl" />
                            <ShimmerBlock className="h-10 rounded-xl" rounded="rounded-xl" />
                            <ShimmerBlock className="h-10 rounded-xl" rounded="rounded-xl" />
                        </div>
                    </div>
                </div>
            </LoadingStatus>
        );
    }

    if (error && !bundle) {
        return (
            <div className="space-y-6">
                <p className="text-[14px] text-red-600 font-medium">{error}</p>
                <button
                    type="button"
                    onClick={() => navigate('/admin/jobs')}
                    className="text-[14px] font-bold text-[#004D6D]"
                >
                    Back to jobs
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                        onClick={() => navigate(`/admin/jobs/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg bg-white hover:bg-gray-50 text-[13px] font-bold transition-all"
                    >
                        <MdEdit size={18} />
                        Edit Job
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-[18px] font-bold text-gray-900 mb-4">Job Progress Timeline (Showing dummy time line for now)</h2>
                        <div className="space-y-0.5">
                            {timelineItems.map((item, idx) => {
                                const Icon = item.icon;
                                const isSuccess = item.state === 'success';
                                const isActive = item.state === 'active';
                                const isMuted = item.state === 'muted';

                                const markerClass = isSuccess
                                    ? 'bg-green-100 text-green-600'
                                    : isActive
                                    ? 'bg-[#E7F4F8] text-[#005E84]'
                                    : 'bg-gray-100 text-gray-400';

                                const titleClass = isMuted ? 'text-gray-500' : 'text-gray-900';
                                const bodyClass = isMuted ? 'text-gray-400' : 'text-gray-500';

                                return (
                                    <div key={item.id} className="flex items-start gap-4">
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${markerClass}`}>
                                                <Icon size={15} />
                                            </div>
                                            {idx < timelineItems.length - 1 && (
                                                <div className="w-px h-10 bg-gray-200 mt-1" />
                                            )}
                                        </div>
                                        <div className="pb-4 pt-0.5">
                                            <p className={`text-[21px] font-bold leading-none ${titleClass}`}>{item.title}</p>
                                            <p className={`text-[12px] font-medium mt-1 ${bodyClass}`}>{item.time}</p>
                                            {item.note ? (
                                                <p className={`text-[13px] mt-1.5 font-medium ${bodyClass}`}>{item.note}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
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

                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
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

                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
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

                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 border-t-4 border-t-green-500">
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
                    <div className="relative w-full max-w-110 bg-white rounded-3xl shadow-2xl p-8 text-center overflow-hidden">
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
