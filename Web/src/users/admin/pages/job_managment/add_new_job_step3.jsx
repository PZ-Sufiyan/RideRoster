import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCheck, MdOutlineToggleOff, MdOutlineToggleOn } from 'react-icons/md';
import { ToastStack } from '../../../../utils/Toast';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../services/companyService';
import {
    loadJobDraft,
    saveJobDraft,
    clearJobDraft,
    createJobFromDraft,
} from '../../../../services/jobService';

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const readStep3Form = () => {
    const d = loadJobDraft();
    const s3 = d.step3 || {};
    return {
        isRecurring: Boolean(s3.is_recurring),
        formData: {
            jobDate: s3.job_date || todayIsoDate(),
            pickupTime: s3.pickup_time || '08:30',
            estDropoff: s3.estimated_dropoff_time || '09:15',
            driverPay: s3.driver_pay ?? '',
            passengerAssistantPay: s3.passenger_assistant_pay ?? '',
        },
    };
};

const AddNewJobStep3 = () => {
    const navigate = useNavigate();
    const initial = readStep3Form();
    const [isRecurring, setIsRecurring] = useState(initial.isRecurring);
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initial.formData);

    useEffect(() => {
        saveJobDraft({
            step3: {
                job_date: formData.jobDate,
                pickup_time: formData.pickupTime,
                estimated_dropoff_time: formData.estDropoff,
                is_recurring: isRecurring,
                recurrence_pattern: isRecurring ? { frequency: 'weekly' } : null,
                driver_pay: formData.driverPay,
                passenger_assistant_pay: formData.passengerAssistantPay,
            },
        });
    }, [formData, isRecurring]);

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                type,
                message,
                autoClose: true,
                duration: type === 'error' ? 6000 : 3500,
            },
        ]);
    };

    const handleBack = () => {
        navigate('/admin/jobs/create-step2');
    };

    const handleFinish = async () => {
        setSubmitAttempted(true);
        if (!formData.jobDate || !formData.pickupTime || !formData.estDropoff) {
            pushToast('warning', 'Please fill in job date, pickup time, and estimated drop-off.');
            return;
        }

        setSubmitting(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const companyId = admin?.company_id;
            if (!companyId) throw new Error('No company linked to your account.');

            const draft = loadJobDraft();
            const merged = {
                ...draft,
                step3: {
                    job_date: formData.jobDate,
                    pickup_time: formData.pickupTime,
                    estimated_dropoff_time: formData.estDropoff,
                    is_recurring: isRecurring,
                    recurrence_pattern: isRecurring ? { frequency: 'weekly' } : null,
                    driver_pay: formData.driverPay,
                    passenger_assistant_pay: formData.passengerAssistantPay,
                },
            };

            await createJobFromDraft(companyId, merged);
            clearJobDraft();
            pushToast('success', 'Job created as draft. You can assign a driver or PA from the job list when ready.');
            navigate('/admin/jobs');
        } catch (e) {
            pushToast('error', e?.message || 'Could not create job.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-[1280px] mx-auto pb-32">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 3 of 3: Schedule & Pay</h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Submitting saves the job (status <span className="font-semibold">draft</span>), then pickups, drop-offs, and passenger links. Driver and PA can be assigned later.
                    </p>
                </div>
            </div>

            <div className="relative mb-12 px-10">
                <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 z-0">
                    <div className="h-full bg-[#004D6D] w-full"></div>
                </div>
                <div className="flex items-center justify-between relative ">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#004D6D] flex items-center justify-center text-white ring-4 ring-[#004D6D]/10">
                            <MdCheck size={20} />
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Route Info</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">
                            <MdCheck size={20} />
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Pickups & Drop-offs</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">
                            3
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Schedule & Pay</span>
                    </div>
                </div>
            </div>

            <div className="max-w-[900px] mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <div className="mb-8">
                        <h2 className="text-[18px] font-bold text-gray-900">Job Timings</h2>
                        <p className="text-[14px] text-gray-500 mt-1">Specify the date and time for this job.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Job Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.jobDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, jobDate: e.target.value }))}
                                className={`w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 ${
                                    submitAttempted && !formData.jobDate
                                        ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                }`}
                            />
                            {submitAttempted && !formData.jobDate && (
                                <p className="text-[12px] font-semibold text-red-600">Job Date is required.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Pickup Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.pickupTime}
                                onChange={(e) => setFormData((prev) => ({ ...prev, pickupTime: e.target.value }))}
                                className={`w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 ${
                                    submitAttempted && !formData.pickupTime
                                        ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                }`}
                            />
                            {submitAttempted && !formData.pickupTime && (
                                <p className="text-[12px] font-semibold text-red-600">Pickup Time is required.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">
                                Est. Drop-off <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.estDropoff}
                                onChange={(e) => setFormData((prev) => ({ ...prev, estDropoff: e.target.value }))}
                                className={`w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 ${
                                    submitAttempted && !formData.estDropoff
                                        ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                }`}
                            />
                            {submitAttempted && !formData.estDropoff && (
                                <p className="text-[12px] font-semibold text-red-600">Estimated drop-off is required.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-gray-900">Recurring Job</h2>
                        <p className="text-[14px] text-gray-500 mt-1">When enabled, a simple weekly pattern is stored (you can extend this later).</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsRecurring(!isRecurring)}
                        className="transition-all active:scale-95"
                        aria-pressed={isRecurring}
                    >
                        {isRecurring ? (
                            <MdOutlineToggleOn size={48} className="text-[#004D6D]" />
                        ) : (
                            <MdOutlineToggleOff size={48} className="text-gray-300" />
                        )}
                    </button>
                </div>

                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-[18px] font-bold text-gray-900">Compensation</h2>
                        <p className="text-[14px] text-gray-500 mt-1">Optional at creation; you can add these later.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Driver Pay (flat rate)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                <input
                                    type="text"
                                    placeholder="e.g., 50.00"
                                    value={formData.driverPay}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, driverPay: e.target.value }))}
                                    className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Passenger Assistant Pay (flat rate)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                <input
                                    type="text"
                                    placeholder="e.g., 40.00"
                                    value={formData.passengerAssistantPay}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, passengerAssistantPay: e.target.value }))
                                    }
                                    className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={submitting}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleFinish}
                        disabled={submitting}
                        className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95 disabled:opacity-60"
                    >
                        {submitting ? 'Creating…' : 'Finish & Create Job'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewJobStep3;
