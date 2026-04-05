import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdOutlineToggleOff,
    MdOutlineToggleOn,
    MdClose,
    MdSearch,
    MdPersonAddAlt1,
    MdCheck,
} from 'react-icons/md';
import { useEditJob } from '../../../context/editJobContext';
import {
    formatJobDisplayId,
    formatJobDateTimeLabel,
    driversAvailableForAssignment,
    passengerAssistantsAvailableForAssignment,
} from '../../../services/jobService';

const Step3EditJob = ({ setToasts }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const {
        bundle,
        driversCatalog,
        pasCatalog,
        jobsMinimal,
        step3Draft,
        setStep3Draft,
        draftDriverId,
        setDraftDriverId,
        draftPaId,
        setDraftPaId,
        saveAllChanges,
        saveInProgress,
    } = useEditJob();

    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [showAssignPA, setShowAssignPA] = useState(false);
    const [driverQuery, setDriverQuery] = useState('');
    const [paQuery, setPaQuery] = useState('');

    const pushToast = (type, message) =>
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: type === 'error' ? 6000 : 3500 },
        ]);

    const selectedJob = useMemo(() => {
        if (!bundle?.job) return null;
        const j = bundle.job;
        const jd = step3Draft.jobDate || j.job_date;
        const pt = step3Draft.pickupTime || '';
        return {
            id: j.id,
            displayId: formatJobDisplayId(j.id),
            route: j.job_name,
            dateTimeStr: formatJobDateTimeLabel(jd, pt || j.pickup_time),
            assigned_driver_id: draftDriverId,
            assigned_pa_id: draftPaId,
        };
    }, [bundle, step3Draft.jobDate, step3Draft.pickupTime, draftDriverId, draftPaId]);

    const filteredDriverRows = useMemo(() => {
        if (!selectedJob || !showAssignDriver) return [];
        const list = driversAvailableForAssignment(driversCatalog, jobsMinimal, selectedJob.id);
        const q = driverQuery.trim().toLowerCase();
        return list
            .filter((d) => {
                if (!q) return true;
                const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
                const lic = (d.license_no || '').toLowerCase();
                return name.includes(q) || lic.includes(q);
            })
            .map((d) => ({
                id: d.id,
                name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
                vehicleLabel: d.license_no ? `License ${d.license_no}` : 'Registered driver',
                vehicleCode: d.license_no || '—',
                tag: 'Available',
                tagColor: 'text-gray-500 bg-gray-100',
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(d.id)}`,
            }));
    }, [selectedJob, showAssignDriver, driversCatalog, jobsMinimal, driverQuery]);

    const filteredPaRows = useMemo(() => {
        if (!selectedJob || !showAssignPA) return [];
        const list = passengerAssistantsAvailableForAssignment(pasCatalog, jobsMinimal, selectedJob.id);
        const q = paQuery.trim().toLowerCase();
        return list
            .filter((p) => {
                if (!q) return true;
                const name = `${p.first_name || ''} ${p.surname || ''}`.toLowerCase();
                return name.includes(q);
            })
            .map((p) => ({
                id: p.id,
                name: `${p.first_name || ''} ${p.surname || ''}`.trim(),
                tag: 'Available',
                tagColor: 'text-gray-500 bg-gray-100',
                avatar: p.profile_picture_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.id)}`,
            }));
    }, [selectedJob, showAssignPA, pasCatalog, jobsMinimal, paQuery]);

    const pickDriverDraft = (driverRow) => {
        setDraftDriverId(driverRow.id);
        setShowAssignDriver(false);
    };

    const pickPaDraft = (paRow) => {
        setDraftPaId(paRow.id);
        setShowAssignPA(false);
    };

    const handleSave = async () => {
        setSubmitAttempted(true);
        if (!step3Draft.jobDate || !step3Draft.pickupTime || !step3Draft.estDropoff) {
            pushToast('warning', 'Please fill in job date, pickup time, and estimated drop-off.');
            return;
        }
        try {
            await saveAllChanges();
            pushToast('success', 'Job updated successfully.');
            navigate(`/admin/jobs/${id}`);
        } catch (e) {
            pushToast('error', e?.message || 'Could not save changes.');
        }
    };

    const timeFieldClass = (invalid) =>
        `w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 ${
            invalid
                ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
        }`;

    const driverDisplay = useMemo(() => {
        if (!draftDriverId) return { name: null, sub: null, avatar: null };
        const fromCat = driversCatalog.find((d) => d.id === draftDriverId);
        if (fromCat) {
            return {
                name: [fromCat.first_name, fromCat.last_name].filter(Boolean).join(' ').trim() || null,
                sub: fromCat.license_no || null,
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(fromCat.id)}`,
            };
        }
        if (bundle?.driver?.id === draftDriverId) {
            return {
                name: [bundle.driver.first_name, bundle.driver.last_name].filter(Boolean).join(' ').trim() || null,
                sub: bundle.driver.license_no || null,
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(bundle.driver.id)}`,
            };
        }
        return { name: 'Driver', sub: null, avatar: null };
    }, [draftDriverId, driversCatalog, bundle]);

    const paDisplay = useMemo(() => {
        if (!draftPaId) return { name: null, avatar: null };
        const fromCat = pasCatalog.find((p) => p.id === draftPaId);
        if (fromCat) {
            return {
                name: [fromCat.first_name, fromCat.surname].filter(Boolean).join(' ').trim() || null,
                avatar: fromCat.profile_picture_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(fromCat.id)}`,
            };
        }
        if (bundle?.pa?.id === draftPaId) {
            return {
                name: [bundle.pa.first_name, bundle.pa.surname].filter(Boolean).join(' ').trim() || null,
                avatar: bundle.pa.profile_picture_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(bundle.pa.id)}`,
            };
        }
        return { name: 'Passenger assistant', avatar: null };
    }, [draftPaId, pasCatalog, bundle]);

    return (
        <>
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 3 of 3: Schedule, Pay &amp; Staff</h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        All edits on every step are applied together when you press Save Changes below (including driver and PA).
                    </p>
                </div>
            </div>

            <div className="max-w-[900px] mx-auto space-y-8">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50">
                        <h2 className="text-[18px] font-bold text-gray-900 mb-1">Job Timings</h2>
                        <p className="text-[14px] text-gray-500 mb-8">Specify the date and time for this job.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">
                                    Job Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={step3Draft.jobDate}
                                    onChange={(e) => setStep3Draft((prev) => ({ ...prev, jobDate: e.target.value }))}
                                    className={timeFieldClass(submitAttempted && !step3Draft.jobDate)}
                                />
                                {submitAttempted && !step3Draft.jobDate && (
                                    <p className="text-[12px] font-semibold text-red-600">Job Date is required.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">
                                    Pickup Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={step3Draft.pickupTime}
                                    onChange={(e) => setStep3Draft((prev) => ({ ...prev, pickupTime: e.target.value }))}
                                    className={timeFieldClass(submitAttempted && !step3Draft.pickupTime)}
                                />
                                {submitAttempted && !step3Draft.pickupTime && (
                                    <p className="text-[12px] font-semibold text-red-600">Pickup Time is required.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">
                                    Est. Drop-off <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={step3Draft.estDropoff}
                                    onChange={(e) => setStep3Draft((prev) => ({ ...prev, estDropoff: e.target.value }))}
                                    className={timeFieldClass(submitAttempted && !step3Draft.estDropoff)}
                                />
                                {submitAttempted && !step3Draft.estDropoff && (
                                    <p className="text-[12px] font-semibold text-red-600">Estimated drop-off is required.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-[18px] font-bold text-gray-900">Recurring Job</h2>
                            <p className="text-[14px] text-gray-500 mt-1">When enabled, a simple weekly pattern is stored.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setStep3Draft((prev) => ({ ...prev, isRecurring: !prev.isRecurring }))
                            }
                            className="transition-all active:scale-95"
                            aria-pressed={step3Draft.isRecurring}
                        >
                            {step3Draft.isRecurring ? (
                                <MdOutlineToggleOn size={48} className="text-[#004D6D]" />
                            ) : (
                                <MdOutlineToggleOff size={48} className="text-gray-300" />
                            )}
                        </button>
                    </div>

                    <div className="p-8 border-b border-gray-50">
                        <h2 className="text-[18px] font-bold text-gray-900 mb-1">Compensation</h2>
                        <p className="text-[14px] text-gray-500 mb-8">Flat-rate pay for this job.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { label: 'Driver Pay (flat rate)', key: 'driverPay' },
                                { label: 'Passenger Assistant Pay (flat rate)', key: 'passengerAssistantPay' },
                            ].map(({ label, key }) => (
                                <div key={key} className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">{label}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                                        <input
                                            type="text"
                                            placeholder="e.g., 50.00"
                                            value={step3Draft[key]}
                                            onChange={(e) =>
                                                setStep3Draft((prev) => ({ ...prev, [key]: e.target.value }))
                                            }
                                            className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        <h2 className="text-[18px] font-bold text-gray-900 mb-1">Driver &amp; Passenger Assistant</h2>
                        <p className="text-[14px] text-gray-500 mb-6">
                            Same lists as on Active Jobs. Assignments are saved when you press Save Changes.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-3">Assigned Driver</label>
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {driverDisplay.avatar ? (
                                            <img
                                                src={driverDisplay.avatar}
                                                className="w-[38px] h-[38px] rounded-full object-cover border border-gray-100 shrink-0"
                                                alt=""
                                            />
                                        ) : (
                                            <div className="w-[38px] h-[38px] rounded-full bg-gray-100 border border-gray-100 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                                                {driverDisplay.name || 'Unassigned'}
                                            </p>
                                            {driverDisplay.sub && (
                                                <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                                                    {driverDisplay.sub}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDriverQuery('');
                                            setShowAssignDriver(true);
                                        }}
                                        className="text-[12px] font-bold text-[#004D6D] hover:underline px-2 shrink-0"
                                    >
                                        {driverDisplay.name ? 'Change' : 'Assign'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-3">Passenger Assistant</label>
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {paDisplay.avatar ? (
                                            <img
                                                src={paDisplay.avatar}
                                                className="w-[38px] h-[38px] rounded-full object-cover border border-gray-100 shrink-0"
                                                alt=""
                                            />
                                        ) : (
                                            <div className="w-[38px] h-[38px] rounded-full bg-gray-100 border border-gray-100 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                                                {paDisplay.name || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaQuery('');
                                            setShowAssignPA(true);
                                        }}
                                        className="text-[12px] font-bold text-[#004D6D] hover:underline px-2 shrink-0"
                                    >
                                        {paDisplay.name ? 'Change' : 'Assign'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                    type="button"
                    onClick={() => navigate(`/admin/jobs/${id}/edit?step=2`)}
                    disabled={saveInProgress}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveInProgress}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95 disabled:opacity-60"
                >
                    {saveInProgress ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            {showAssignDriver && selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !saveInProgress && setShowAssignDriver(false)}
                    />
                    <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign Driver to Job</h2>
                            <button
                                type="button"
                                onClick={() => !saveInProgress && setShowAssignDriver(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start gap-4">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Job ID: {selectedJob.displayId}
                                    </p>
                                    <p className="text-[16px] font-bold text-gray-900 mt-1 truncate">{selectedJob.route}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date &amp; Time</p>
                                    <p className="text-[14px] font-bold text-gray-900 mt-1">{selectedJob.dateTimeStr}</p>
                                </div>
                            </div>
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search driver by name or license..."
                                    value={driverQuery}
                                    onChange={(e) => setDriverQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                />
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>
                            <div className="space-y-3">
                                {filteredDriverRows.length === 0 && (
                                    <div className="px-4 py-6 text-center text-[13px] text-gray-500 font-medium border border-dashed border-gray-200 rounded-2xl">
                                        No drivers available (all assigned to other jobs) or no match search.
                                    </div>
                                )}
                                {filteredDriverRows.map((driver) => {
                                    const isCurrent = selectedJob.assigned_driver_id === driver.id;
                                    return (
                                        <div
                                            key={driver.id}
                                            className={`p-4 border rounded-2xl flex items-center justify-between transition-all gap-3 ${
                                                isCurrent ? 'bg-[#F4F9FF] border-[#004D6D]/20' : 'bg-white border-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <img
                                                    src={driver.avatar}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                                                    alt=""
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-bold text-gray-900 truncate">{driver.name}</p>
                                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5 truncate">
                                                        {driver.vehicleLabel} • {driver.vehicleCode}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span
                                                    className={`hidden sm:inline px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${driver.tagColor}`}
                                                >
                                                    {driver.tag}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={saveInProgress || isCurrent}
                                                    onClick={() => pickDriverDraft(driver)}
                                                    className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                                                        isCurrent
                                                            ? 'border border-[#004D6D]/30 text-[#004D6D] bg-white cursor-default'
                                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                                                    }`}
                                                >
                                                    {isCurrent ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[#004D6D]">
                                                            <MdCheck size={16} />
                                                            Current
                                                        </span>
                                                    ) : (
                                                        'Assign'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowAssignDriver(false)}
                                className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] shadow-lg shadow-[#004D6D]/10"
                            >
                                <MdPersonAddAlt1 size={20} />
                                Invite Driver
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignPA && selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !saveInProgress && setShowAssignPA(false)}
                    />
                    <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign PA to Job</h2>
                            <button
                                type="button"
                                onClick={() => !saveInProgress && setShowAssignPA(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start gap-4">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Job ID: {selectedJob.displayId}
                                    </p>
                                    <p className="text-[16px] font-bold text-gray-900 mt-1 truncate">{selectedJob.route}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date &amp; Time</p>
                                    <p className="text-[14px] font-bold text-gray-900 mt-1">{selectedJob.dateTimeStr}</p>
                                </div>
                            </div>
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search PA by name..."
                                    value={paQuery}
                                    onChange={(e) => setPaQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                />
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>
                            <div className="space-y-3">
                                {filteredPaRows.length === 0 && (
                                    <div className="px-4 py-6 text-center text-[13px] text-gray-500 font-medium border border-dashed border-gray-200 rounded-2xl">
                                        No passenger assistants available (all assigned to other jobs) or no match search.
                                    </div>
                                )}
                                {filteredPaRows.map((pa) => {
                                    const isCurrent = selectedJob.assigned_pa_id === pa.id;
                                    return (
                                        <div
                                            key={pa.id}
                                            className={`p-4 bg-white border rounded-2xl flex items-center justify-between transition-all hover:border-gray-200 gap-3 ${
                                                isCurrent ? 'border-[#004D6D]/20 bg-[#F4F9FF]' : 'border-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <img
                                                    src={pa.avatar}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                                                    alt=""
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-bold text-gray-900 truncate">{pa.name}</p>
                                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">Passenger Assistant</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span
                                                    className={`hidden sm:inline px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${pa.tagColor}`}
                                                >
                                                    {pa.tag}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={saveInProgress || isCurrent}
                                                    onClick={() => pickPaDraft(pa)}
                                                    className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                                                        isCurrent
                                                            ? 'border border-[#004D6D]/30 text-[#004D6D] bg-white cursor-default'
                                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                                                    }`}
                                                >
                                                    {isCurrent ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[#004D6D]">
                                                            <MdCheck size={16} />
                                                            Current
                                                        </span>
                                                    ) : (
                                                        'Assign'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowAssignPA(false)}
                                className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] shadow-lg shadow-[#004D6D]/10"
                            >
                                <MdPersonAddAlt1 size={20} />
                                Invite PA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Step3EditJob;
