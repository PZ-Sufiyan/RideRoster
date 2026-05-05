import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdOutlineToggleOff,
    MdOutlineToggleOn,
    MdWbSunny,
    MdNightlight,
    MdDateRange,
    MdInfoOutline,
} from 'react-icons/md';
import { supabase } from '../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../services/companyService';
import {
    loadJobDraft,
    saveJobDraft,
    clearJobDraft,
    createJobFromDraft,
} from '../../../services/jobService';

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const Step3Job = ({ setToasts }) => {
    const navigate = useNavigate();

    const initial = (() => {
        const d = loadJobDraft();
        const s3 = d.step3 || {};
        return {
            semesterStart: s3.semester_start || todayIsoDate(),
            semesterEnd: s3.semester_end || '',
            hasOutbound: s3.has_outbound !== false, // default true
            hasInbound: s3.has_inbound !== false,   // default true
            morningStartTime: s3.morning_start_time || '',
            morningEndTime: s3.morning_end_time || '',
            eveningStartTime: s3.evening_start_time || '',
            driverPay: s3.driver_pay ?? '',
            passengerAssistantPay: s3.passenger_assistant_pay ?? '',
        };
    })();

    const [semesterStart, setSemesterStart] = useState(initial.semesterStart);
    const [semesterEnd, setSemesterEnd] = useState(initial.semesterEnd);
    const [hasOutbound, setHasOutbound] = useState(initial.hasOutbound);
    const [hasInbound, setHasInbound] = useState(initial.hasInbound);
    const [morningStartTime, setMorningStartTime] = useState(initial.morningStartTime);
    const [morningEndTime, setMorningEndTime] = useState(initial.morningEndTime);
    const [eveningStartTime, setEveningStartTime] = useState(initial.eveningStartTime);
    const [driverPay, setDriverPay] = useState(initial.driverPay);
    const [passengerAssistantPay, setPassengerAssistantPay] = useState(initial.passengerAssistantPay);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Persist draft on every change
    useEffect(() => {
        saveJobDraft({
            step3: {
                semester_start: semesterStart,
                semester_end: semesterEnd,
                has_outbound: hasOutbound,
                has_inbound: hasInbound,
                morning_start_time: morningStartTime,
                morning_end_time: morningEndTime,
                evening_start_time: eveningStartTime,
                driver_pay: driverPay,
                passenger_assistant_pay: passengerAssistantPay,
            },
        });
    }, [semesterStart, semesterEnd, hasOutbound, hasInbound, morningStartTime, morningEndTime, eveningStartTime, driverPay, passengerAssistantPay]);

    const pushToast = (type, message) =>
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: type === 'error' ? 6000 : 3500 },
        ]);

    
  

    const dateFieldClass = (invalid) =>
        `w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 transition-all ${
            invalid
                ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
        }`;

    // Same style as dateFieldClass, reused for time inputs
    const timeFieldClass = dateFieldClass;

    const handleFinish = async () => {
        setSubmitAttempted(true);

        if (!semesterStart) { pushToast('warning', 'Please set the semester start date.'); return; }
        if (!semesterEnd) { pushToast('warning', 'Please set the semester end date.'); return; }
        if (semesterEnd < semesterStart) { pushToast('warning', 'Semester end date must be after start date.'); return; }
        if (!hasOutbound && !hasInbound) { pushToast('warning', 'Enable at least one of morning or evening jobs.'); return; }
        if (hasOutbound && !morningStartTime) { pushToast('warning', 'Please set the morning start time.'); return; }
        if (hasOutbound && !morningEndTime) { pushToast('warning', 'Please set the morning end time.'); return; }
        if (hasInbound && !eveningStartTime) { pushToast('warning', 'Please set the evening start time.'); return; }

        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const companyId = admin?.company_id;
            if (!companyId) throw new Error('No company linked to your account.');

            const draft = loadJobDraft();
            const merged = {
                ...draft,
                step3: {
                    semester_start: semesterStart,
                    semester_end: semesterEnd,
                    has_outbound: hasOutbound,
                    has_inbound: hasInbound,
                    morning_start_time: morningStartTime,
                    morning_end_time: morningEndTime,
                    evening_start_time: eveningStartTime,
                    driver_pay: driverPay,
                    passenger_assistant_pay: passengerAssistantPay,
                },
            };

            await createJobFromDraft(companyId, merged);
            clearJobDraft();
            pushToast('success', 'Job created. Passenger schedules have been generated automatically.');
            navigate('/subadmin/jobs');
        } catch (e) {
            pushToast('error', e?.message || 'Could not create job.');
        } finally {
            setSubmitting(false);
        }
    };

    const endDateInvalid = submitAttempted && semesterEnd && semesterEnd < semesterStart;

    return (
        <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
                        Step 3 of 3: Schedule & Pay
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Set the semester date range. Passenger schedules are generated automatically
                        from each passenger's weekly schedule and locations.
                    </p>
                </div>
            </div>

            <div className="max-w-[900px] mx-auto space-y-5">

                {/* ── Semester Dates ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                        <MdDateRange size={18} className="text-[#004D6D]" />
                        <h2 className="text-[16px] font-bold text-gray-900">Semester Duration</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-[13px] text-gray-500 mb-5">
                            This job will remain active for the entire semester. No individual daily jobs
                            are created — passenger schedules handle the day-by-day logic automatically.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">
                                    Semester Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={semesterStart}
                                    onChange={(e) => setSemesterStart(e.target.value)}
                                    className={dateFieldClass(submitAttempted && !semesterStart)}
                                />
                                {submitAttempted && !semesterStart && (
                                    <p className="text-[12px] font-semibold text-red-600">Start date is required.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">
                                    Semester End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={semesterEnd}
                                    min={semesterStart || undefined}
                                    onChange={(e) => setSemesterEnd(e.target.value)}
                                    className={dateFieldClass((submitAttempted && !semesterEnd) || endDateInvalid)}
                                />
                                {submitAttempted && !semesterEnd && (
                                    <p className="text-[12px] font-semibold text-red-600">End date is required.</p>
                                )}
                                {endDateInvalid && (
                                    <p className="text-[12px] font-semibold text-red-600">End date must be after start date.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Journey Directions + Times ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h2 className="text-[16px] font-bold text-gray-900">Journey Directions</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">
                            Enable which directions this job covers. At least one is required.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {/* Morning / Outbound */}
                        <div>
                            <div className="px-6 py-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                        <MdWbSunny size={20} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-gray-900">Morning Run (Outbound)</div>
                                        <div className="text-[12px] text-gray-500 mt-0.5">
                                            Home → Educational Site · Each passenger uses their own pickup time
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasOutbound((v) => !v)}
                                    className="transition-all active:scale-95 shrink-0"
                                    aria-pressed={hasOutbound}
                                >
                                    {hasOutbound
                                        ? <MdOutlineToggleOn size={48} className="text-[#004D6D]" />
                                        : <MdOutlineToggleOff size={48} className="text-gray-300" />}
                                </button>
                            </div>
                            {/* Morning time fields — shown only when outbound is on */}
                            {hasOutbound && (
                                <div className="px-6 pb-5 grid grid-cols-2 gap-4 -mt-1">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Pick up Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={morningStartTime}
                                            onChange={(e) => setMorningStartTime(e.target.value)}
                                            className={timeFieldClass(submitAttempted && hasOutbound && !morningStartTime)}
                                        />
                                        <p className="text-[11px] text-gray-400">When the driver departs for first pickup</p>
                                        {submitAttempted && hasOutbound && !morningStartTime && (
                                            <p className="text-[12px] font-semibold text-red-600">Morning start time is required.</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Est.Drop-off<span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={morningEndTime}
                                            onChange={(e) => setMorningEndTime(e.target.value)}
                                            className={timeFieldClass(submitAttempted && hasOutbound && !morningEndTime)}
                                        />
                                        <p className="text-[11px] text-gray-400">When the last drop-off is expected</p>
                                        {submitAttempted && hasOutbound && !morningEndTime && (
                                            <p className="text-[12px] font-semibold text-red-600">Morning end time is required.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Evening / Inbound */}
                        <div>
                            <div className="px-6 py-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                        <MdNightlight size={20} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-gray-900">Evening Return (Inbound)</div>
                                        <div className="text-[12px] text-gray-500 mt-0.5">
                                            Educational Site → Home · Set when the driver departs school
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasInbound((v) => !v)}
                                    className="transition-all active:scale-95 shrink-0"
                                    aria-pressed={hasInbound}
                                >
                                    {hasInbound
                                        ? <MdOutlineToggleOn size={48} className="text-[#004D6D]" />
                                        : <MdOutlineToggleOff size={48} className="text-gray-300" />}
                                </button>
                            </div>
                            {/* Evening time field — shown only when inbound is on */}
                            {hasInbound && (
                                <div className="px-6 pb-5 -mt-1">
                                    <div className="space-y-1.5 max-w-[260px]">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            School Departure Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={eveningStartTime}
                                            onChange={(e) => setEveningStartTime(e.target.value)}
                                            className={timeFieldClass(submitAttempted && hasInbound && !eveningStartTime)}
                                        />
                                        <p className="text-[11px] text-gray-400">When the driver picks up from school for the return run</p>
                                        {submitAttempted && hasInbound && !eveningStartTime && (
                                            <p className="text-[12px] font-semibold text-red-600">Evening start time is required.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Both off warning */}
                    {!hasOutbound && !hasInbound && (
                        <div className="px-6 pb-5">
                            <p className="text-[12px] font-semibold text-red-600">
                                At least one direction must be enabled.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Compensation ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h2 className="text-[16px] font-bold text-gray-900">Compensation</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">Optional flat rates — you can update these later.</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Driver Pay (flat rate)', value: driverPay, onChange: setDriverPay },
                                { label: 'Passenger Assistant Pay (flat rate)', value: passengerAssistantPay, onChange: setPassengerAssistantPay },
                            ].map(({ label, value, onChange }) => (
                                <div key={label} className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">{label}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                        <input
                                            type="text"
                                            placeholder="e.g., 50.00"
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                    type="button"
                    onClick={() => navigate('/subadmin/jobs/add-job?step=2')}
                    disabled={submitting}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleFinish}
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95 disabled:opacity-60"
                >
                    {submitting ? 'Creating…' : 'Finish & Create Job'}
                </button>
            </div>
        </>
    );
};

export default Step3Job;