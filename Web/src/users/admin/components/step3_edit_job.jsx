import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdOutlineToggleOff, MdOutlineToggleOn,
    MdWbSunny, MdNightlight, MdDateRange,
    MdSearch, MdClose, MdCheck, MdPersonAddAlt1,
    MdPersonRemove, MdWarning,
} from 'react-icons/md';
import { useEditJob } from '../../../context/editJobContext';
import {
    formatJobDisplayId,
    driversAvailableForAssignment,
    passengerAssistantsAvailableForAssignment,
    validateDriverAssignment,
} from '../../../services/jobService';

// ── Confirm removal dialog ────────────────────────────────────────────────────

const RemoveConfirm = ({ open, label, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <MdWarning size={22} className="text-red-500" />
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-1">Remove {label}?</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                        This will clear the {label.toLowerCase()} from this job draft. You can reassign before saving.
                    </p>
                </div>
                <div className="px-6 pb-6 flex items-center gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-red-500 hover:bg-red-600 transition-all">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Step3EditJob ──────────────────────────────────────────────────────────────

const Step3EditJob = ({ setToasts }) => {
    const navigate = useNavigate();
    const { id }   = useParams();

    const {
        bundle, step3Draft, setStep3Draft,
        driversCatalog, pasCatalog, jobsMinimal,
        companyId,
        draftDriverId, setDraftDriverId,
        draftPaId,     setDraftPaId,
        saveAllChanges, saveInProgress,
    } = useEditJob();

    const [submitAttempted, setSubmitAttempted]   = useState(false);
    const [showDriverModal, setShowDriverModal]   = useState(false);
    const [showPaModal,     setShowPaModal]       = useState(false);
    const [driverQuery,     setDriverQuery]       = useState('');
    const [paQuery,         setPaQuery]           = useState('');
    const [pickingDriverId, setPickingDriverId]   = useState(null); // per-row loading in driver modal
    const [confirmRemove,   setConfirmRemove]     = useState(null); // 'driver' | 'pa' | null

    const pushToast = (type, message) =>
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: type === 'error' ? 6000 : 3500 },
        ]);

    // ── Field helpers ──────────────────────────────────────────────────────────

    const dateFieldClass = (invalid) =>
        `w-full px-4 py-3 bg-[#F9FAFB] border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 transition-all ${
            invalid
                ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
        }`;
    const timeFieldClass = dateFieldClass;

    const endDateInvalid = submitAttempted && step3Draft.semesterEnd && step3Draft.semesterEnd < step3Draft.semesterStart;

    // ── Driver / PA display ────────────────────────────────────────────────────

    const driverDisplay = useMemo(() => {
        if (!draftDriverId) return { name: null, sub: null, avatar: null };
        const d = driversCatalog.find((x) => x.id === draftDriverId) || bundle?.driver;
        if (!d) return { name: 'Driver', sub: null, avatar: null };
        return {
            name:   [d.first_name, d.last_name].filter(Boolean).join(' ').trim() || null,
            sub:    d.license_no || null,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(d.id)}`,
        };
    }, [draftDriverId, driversCatalog, bundle]);

    const paDisplay = useMemo(() => {
        if (!draftPaId) return { name: null, avatar: null };
        const p = pasCatalog.find((x) => x.id === draftPaId) || bundle?.pa;
        if (!p) return { name: 'Passenger assistant', avatar: null };
        return {
            name:   [p.first_name, p.surname].filter(Boolean).join(' ').trim() || null,
            avatar: p.profile_picture_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.id)}`,
        };
    }, [draftPaId, pasCatalog, bundle]);

    // ── Available lists ────────────────────────────────────────────────────────

    const filteredDriverRows = useMemo(() => {
        if (!showDriverModal) return [];
        const available = driversAvailableForAssignment(driversCatalog, jobsMinimal, id);
        const q = driverQuery.trim().toLowerCase();
        return available.filter((d) => {
            if (!q) return true;
            return `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase().includes(q)
                || (d.license_no || '').toLowerCase().includes(q);
        }).map((d) => ({
            id:     d.id,
            name:   [d.first_name, d.last_name].filter(Boolean).join(' ').trim(),
            sub:    d.license_no ? `License ${d.license_no}` : 'Registered driver',
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(d.id)}`,
        }));
    }, [showDriverModal, driversCatalog, jobsMinimal, id, driverQuery]);

    const filteredPaRows = useMemo(() => {
        if (!showPaModal) return [];
        const available = passengerAssistantsAvailableForAssignment(pasCatalog, jobsMinimal, id);
        const q = paQuery.trim().toLowerCase();
        return available.filter((p) => {
            if (!q) return true;
            return `${p.first_name || ''} ${p.surname || ''}`.toLowerCase().includes(q);
        }).map((p) => ({
            id:     p.id,
            name:   [p.first_name, p.surname].filter(Boolean).join(' ').trim(),
            avatar: p.profile_picture_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.id)}`,
        }));
    }, [showPaModal, pasCatalog, jobsMinimal, id, paQuery]);

    // ── Pick driver (with seat + wheelchair validation) ────────────────────────
    // Validates against DB state (other-job conflict, vehicle capacity, wheelchair).
    // This gives immediate feedback in the modal before the full save.

    const handlePickDriver = async (row) => {
        if (!companyId) return;
        setPickingDriverId(row.id);
        try {
            await validateDriverAssignment(id, row.id, companyId);
            setDraftDriverId(row.id);
            setShowDriverModal(false);
        } catch (e) {
            pushToast('error', e?.message || 'Cannot assign this driver.');
        } finally {
            setPickingDriverId(null);
        }
    };

    // ── Remove helpers ─────────────────────────────────────────────────────────

    const handleConfirmRemove = () => {
        if (confirmRemove === 'driver') setDraftDriverId(null);
        if (confirmRemove === 'pa')     setDraftPaId(null);
        setConfirmRemove(null);
    };

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSubmitAttempted(true);

        if (!step3Draft.semesterStart)  { pushToast('warning', 'Please set the semester start date.'); return; }
        if (!step3Draft.semesterEnd)    { pushToast('warning', 'Please set the semester end date.'); return; }
        if (step3Draft.semesterEnd < step3Draft.semesterStart) { pushToast('warning', 'Semester end must be after start.'); return; }
        if (!step3Draft.hasOutbound && !step3Draft.hasInbound)  { pushToast('warning', 'Enable at least one direction.'); return; }
        if (step3Draft.hasOutbound && !step3Draft.morningStartTime) { pushToast('warning', 'Morning start time is required.'); return; }
        if (step3Draft.hasOutbound && !step3Draft.morningEndTime)   { pushToast('warning', 'Morning end time is required.'); return; }
        if (step3Draft.hasInbound  && !step3Draft.eveningStartTime) { pushToast('warning', 'Evening start time is required.'); return; }

        try {
            await saveAllChanges();
            pushToast('success', 'Job updated. Passenger schedules regenerated.');
            navigate(`/portal/jobs/${id}`);
        } catch (e) {
            pushToast('error', e?.message || 'Could not save changes.');
        }
    };

    const jobDisplayId = bundle?.job ? formatJobDisplayId(bundle.job.id) : '';

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Remove confirmation dialogs */}
            <RemoveConfirm
                open={confirmRemove === 'driver'}
                label="Driver"
                onConfirm={handleConfirmRemove}
                onCancel={() => setConfirmRemove(null)}
            />
            <RemoveConfirm
                open={confirmRemove === 'pa'}
                label="Passenger Assistant"
                onConfirm={handleConfirmRemove}
                onCancel={() => setConfirmRemove(null)}
            />

            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 3 of 3: Schedule & Pay</h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Changes on all steps are applied together when you press Save Changes.
                        Passenger schedules are regenerated from the updated passenger order and directions.
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
                            Updating dates will apply to the job record. Existing exception rows are preserved;
                            base schedule rows are regenerated from the new passenger list and order.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">
                                    Semester Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={step3Draft.semesterStart}
                                    onChange={(e) => setStep3Draft((p) => ({ ...p, semesterStart: e.target.value }))}
                                    className={dateFieldClass(submitAttempted && !step3Draft.semesterStart)}
                                />
                                {submitAttempted && !step3Draft.semesterStart && (
                                    <p className="text-[12px] font-semibold text-red-600">Start date is required.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">
                                    Semester End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={step3Draft.semesterEnd}
                                    min={step3Draft.semesterStart || undefined}
                                    onChange={(e) => setStep3Draft((p) => ({ ...p, semesterEnd: e.target.value }))}
                                    className={dateFieldClass((submitAttempted && !step3Draft.semesterEnd) || endDateInvalid)}
                                />
                                {submitAttempted && !step3Draft.semesterEnd && (
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
                        <p className="text-[13px] text-gray-500 mt-0.5">Enable which directions this job covers. At least one is required.</p>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {/* Morning */}
                        <div>
                            <div className="px-6 py-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                        <MdWbSunny size={20} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-gray-900">Morning Run (Outbound)</div>
                                        <div className="text-[12px] text-gray-500 mt-0.5">Home → Educational Site</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setStep3Draft((p) => ({ ...p, hasOutbound: !p.hasOutbound }))}
                                    className="transition-all active:scale-95 shrink-0" aria-pressed={step3Draft.hasOutbound}>
                                    {step3Draft.hasOutbound
                                        ? <MdOutlineToggleOn  size={48} className="text-[#004D6D]" />
                                        : <MdOutlineToggleOff size={48} className="text-gray-300"  />}
                                </button>
                            </div>
                            {step3Draft.hasOutbound && (
                                <div className="px-6 pb-5 grid grid-cols-2 gap-4 -mt-1">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Pick up Time <span className="text-red-500">*</span>
                                        </label>
                                        <input type="time" value={step3Draft.morningStartTime}
                                            onChange={(e) => setStep3Draft((p) => ({ ...p, morningStartTime: e.target.value }))}
                                            className={timeFieldClass(submitAttempted && step3Draft.hasOutbound && !step3Draft.morningStartTime)} />
                                        <p className="text-[11px] text-gray-400">When the driver departs for first pickup</p>
                                        {submitAttempted && step3Draft.hasOutbound && !step3Draft.morningStartTime && (
                                            <p className="text-[12px] font-semibold text-red-600">Morning start time is required.</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Est. Drop-off <span className="text-red-500">*</span>
                                        </label>
                                        <input type="time" value={step3Draft.morningEndTime}
                                            onChange={(e) => setStep3Draft((p) => ({ ...p, morningEndTime: e.target.value }))}
                                            className={timeFieldClass(submitAttempted && step3Draft.hasOutbound && !step3Draft.morningEndTime)} />
                                        <p className="text-[11px] text-gray-400">When the last drop-off is expected</p>
                                        {submitAttempted && step3Draft.hasOutbound && !step3Draft.morningEndTime && (
                                            <p className="text-[12px] font-semibold text-red-600">Morning end time is required.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Evening */}
                        <div>
                            <div className="px-6 py-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                        <MdNightlight size={20} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-gray-900">Evening Return (Inbound)</div>
                                        <div className="text-[12px] text-gray-500 mt-0.5">Educational Site → Home</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setStep3Draft((p) => ({ ...p, hasInbound: !p.hasInbound }))}
                                    className="transition-all active:scale-95 shrink-0" aria-pressed={step3Draft.hasInbound}>
                                    {step3Draft.hasInbound
                                        ? <MdOutlineToggleOn  size={48} className="text-[#004D6D]" />
                                        : <MdOutlineToggleOff size={48} className="text-gray-300"  />}
                                </button>
                            </div>
                            {step3Draft.hasInbound && (
                                <div className="px-6 pb-5 -mt-1">
                                    <div className="space-y-1.5 max-w-[260px]">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            School Departure Time <span className="text-red-500">*</span>
                                        </label>
                                        <input type="time" value={step3Draft.eveningStartTime}
                                            onChange={(e) => setStep3Draft((p) => ({ ...p, eveningStartTime: e.target.value }))}
                                            className={timeFieldClass(submitAttempted && step3Draft.hasInbound && !step3Draft.eveningStartTime)} />
                                        <p className="text-[11px] text-gray-400">When the driver picks up from school for the return run</p>
                                        {submitAttempted && step3Draft.hasInbound && !step3Draft.eveningStartTime && (
                                            <p className="text-[12px] font-semibold text-red-600">Evening start time is required.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {!step3Draft.hasOutbound && !step3Draft.hasInbound && (
                        <div className="px-6 pb-5">
                            <p className="text-[12px] font-semibold text-red-600">At least one direction must be enabled.</p>
                        </div>
                    )}
                </div>

                {/* ── Compensation ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h2 className="text-[16px] font-bold text-gray-900">Compensation</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">Optional flat rates.</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Driver Pay (flat rate)',              key: 'driverPay' },
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
                                            onChange={(e) => setStep3Draft((p) => ({ ...p, [key]: e.target.value }))}
                                            className="w-full pl-8 pr-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Driver & PA assignment ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h2 className="text-[16px] font-bold text-gray-900">Driver & Passenger Assistant</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">Assignments are saved when you press Save Changes.</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* ── Driver card ── */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-3">Assigned Driver</label>
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {driverDisplay.avatar
                                            ? <img src={driverDisplay.avatar} className="w-[38px] h-[38px] rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                                            : <div className="w-[38px] h-[38px] rounded-full bg-gray-100 border border-gray-100 shrink-0" />
                                        }
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                                                {driverDisplay.name || 'Unassigned'}
                                            </p>
                                            {driverDisplay.sub && (
                                                <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">{driverDisplay.sub}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {draftDriverId && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmRemove('driver')}
                                                title="Remove driver"
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <MdPersonRemove size={17} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setDriverQuery(''); setShowDriverModal(true); }}
                                            className="text-[12px] font-bold text-[#004D6D] hover:underline px-2"
                                        >
                                            {driverDisplay.name ? 'Change' : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── PA card ── */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-900 mb-3">Passenger Assistant</label>
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {paDisplay.avatar
                                            ? <img src={paDisplay.avatar} className="w-[38px] h-[38px] rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                                            : <div className="w-[38px] h-[38px] rounded-full bg-gray-100 border border-gray-100 shrink-0" />
                                        }
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                                                {paDisplay.name || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {draftPaId && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmRemove('pa')}
                                                title="Remove PA"
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <MdPersonRemove size={17} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setPaQuery(''); setShowPaModal(true); }}
                                            className="text-[12px] font-bold text-[#004D6D] hover:underline px-2"
                                        >
                                            {paDisplay.name ? 'Change' : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button type="button" onClick={() => navigate(`/portal/jobs/${id}/edit?step=2`)} disabled={saveInProgress}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50">
                    Back
                </button>
                <button type="button" onClick={handleSave} disabled={saveInProgress}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95 disabled:opacity-60">
                    {saveInProgress ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            {/* ── Driver Modal ── */}
            {showDriverModal && (
                <AssignmentModal
                    title="Assign Driver"
                    jobDisplayId={jobDisplayId}
                    jobName={bundle?.job?.job_name}
                    query={driverQuery}
                    onQueryChange={setDriverQuery}
                    searchPlaceholder="Search driver by name or license..."
                    infoNote="Drivers already assigned to other jobs are hidden. Seat capacity and wheelchair access are validated when you select."
                    rows={filteredDriverRows}
                    currentId={draftDriverId}
                    loadingId={pickingDriverId}
                    onPick={handlePickDriver}
                    onClose={() => setShowDriverModal(false)}
                    disabled={saveInProgress}
                    emptyText="No drivers available (all assigned to other jobs)."
                    renderSub={(row) => row.sub}
                    inviteLabel="Invite Driver"
                />
            )}

            {/* ── PA Modal ── */}
            {showPaModal && (
                <AssignmentModal
                    title="Assign Passenger Assistant"
                    jobDisplayId={jobDisplayId}
                    jobName={bundle?.job?.job_name}
                    query={paQuery}
                    onQueryChange={setPaQuery}
                    searchPlaceholder="Search PA by name..."
                    infoNote={null}
                    rows={filteredPaRows}
                    currentId={draftPaId}
                    loadingId={null}
                    onPick={(row) => { setDraftPaId(row.id); setShowPaModal(false); }}
                    onClose={() => setShowPaModal(false)}
                    disabled={saveInProgress}
                    emptyText="No passenger assistants available."
                    renderSub={() => 'Passenger Assistant'}
                    inviteLabel="Invite PA"
                />
            )}
        </>
    );
};

// ── Shared assignment modal ───────────────────────────────────────────────────

const AssignmentModal = ({
    title, jobDisplayId, jobName,
    query, onQueryChange, searchPlaceholder,
    infoNote,
    rows, currentId, loadingId, onPick, onClose,
    disabled, emptyText, renderSub, inviteLabel,
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !disabled && onClose()} />
        <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <h2 className="text-[20px] font-bold text-gray-900">{title}</h2>
                <button type="button" onClick={() => !disabled && onClose()}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                    <MdClose size={24} />
                </button>
            </div>

            <div className="p-8 space-y-5 overflow-y-auto">
                {/* Job info strip */}
                <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job ID: {jobDisplayId}</p>
                        <p className="text-[15px] font-bold text-gray-900 mt-1 truncate">{jobName}</p>
                    </div>
                </div>

                {/* Optional info note (driver modal only) */}
                {infoNote && (
                    <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-700">
                        <MdWarning size={16} className="shrink-0 mt-0.5 text-blue-400" />
                        <span>{infoNote}</span>
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" value={query} onChange={(e) => onQueryChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10" />
                </div>

                {/* Rows */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {rows.length === 0 && (
                        <div className="px-4 py-6 text-center text-[13px] text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                            {emptyText}
                        </div>
                    )}
                    {rows.map((row) => {
                        const isCurrent = currentId === row.id;
                        const isLoading = loadingId === row.id;
                        return (
                            <div key={row.id}
                                className={`p-4 border rounded-2xl flex items-center justify-between gap-3 transition-all ${
                                    isCurrent ? 'bg-[#F4F9FF] border-[#004D6D]/20' : 'bg-white border-gray-100'
                                }`}>
                                <div className="flex items-center gap-4 min-w-0">
                                    <img src={row.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold text-gray-900 truncate">{row.name}</p>
                                        {renderSub && (
                                            <p className="text-[12px] text-gray-400 font-medium mt-0.5 truncate">{renderSub(row)}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={disabled || isCurrent || !!loadingId}
                                    onClick={() => !isCurrent && !loadingId && onPick(row)}
                                    className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all shrink-0 min-w-[80px] text-center ${
                                        isCurrent
                                            ? 'border border-[#004D6D]/30 text-[#004D6D] bg-white cursor-default'
                                            : isLoading
                                            ? 'border border-gray-200 text-gray-400 bg-gray-50 cursor-wait'
                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                                    }`}
                                >
                                    {isCurrent ? (
                                        <span className="inline-flex items-center gap-1.5 text-[#004D6D]">
                                            <MdCheck size={16} />Current
                                        </span>
                                    ) : isLoading ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Checking
                                        </span>
                                    ) : (
                                        'Assign'
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100 shrink-0">
                <button type="button" onClick={onClose}
                    className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900">
                    Cancel
                </button>
                <button type="button"
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] shadow-lg shadow-[#004D6D]/10">
                    <MdPersonAddAlt1 size={20} />
                    {inviteLabel}
                </button>
            </div>
        </div>
    </div>
);

export default Step3EditJob;