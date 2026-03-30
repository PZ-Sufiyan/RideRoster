import React, { useState } from 'react';
import { MdLock, MdWarning, MdKeyboardArrowDown, MdDeleteOutline, MdOutlineToggleOff, MdOutlineToggleOn } from 'react-icons/md';
import { HiOutlineLocationMarker, HiOutlineFlag, HiPlus } from 'react-icons/hi';
import { ToastStack } from '../../../../utils/Toast';

const clientOptions = [
    'Westwood High School District',
    'Bright Horizons Transport',
    'Northwood Academy',
    'City Center Charter School',
    'Eastside Learning Institute',
];

const jobTypeOptions = ['Regular Contract', 'One-off Trip', 'Emergency Shuttle'];
const passengerOptions = ['John Doe', 'Jane Smith', 'Michael Brown', 'Sara Wilson'];

const createStop = () => ({
    id: Date.now() + Math.random(),
    gps: '',
    postCode: '',
    passenger: '',
    notes: '',
});

const SubAdmin_NewJob = () => {
    const [jobTitle, setJobTitle] = useState('');
    const [jobType, setJobType] = useState('Regular Contract');
    const [clientName, setClientName] = useState('Westwood High School District');
    const [clientOpen, setClientOpen] = useState(false);
    const [internalId, setInternalId] = useState('');
    const [notes, setNotes] = useState('');
    const [pickupStops, setPickupStops] = useState([createStop()]);
    const [dropoffStops, setDropoffStops] = useState([createStop()]);
    const [jobDate, setJobDate] = useState('2025-11-25');
    const [pickupTime, setPickupTime] = useState('07:30');
    const [estDropoff, setEstDropoff] = useState('08:15');
    const [isRecurring, setIsRecurring] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [toasts, setToasts] = useState([]);

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                type,
                message,
                autoClose: true,
                duration: 3500,
            },
        ]);
    };

    const addPickup = () => setPickupStops((prev) => [...prev, createStop()]);
    const addDropoff = () => setDropoffStops((prev) => [...prev, createStop()]);
    const removePickup = (id) => setPickupStops((prev) => prev.filter((s) => s.id !== id));
    const removeDropoff = (id) => setDropoffStops((prev) => prev.filter((s) => s.id !== id));

    const updatePickup = (id, field, value) =>
        setPickupStops((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    const updateDropoff = (id, field, value) =>
        setDropoffStops((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

    const missingStopFields = (stop) => !stop.gps.trim() || !stop.postCode.trim() || !stop.passenger.trim();
    const isFormInvalid =
        !jobTitle.trim() ||
        !jobType.trim() ||
        !clientName.trim() ||
        !jobDate ||
        !pickupTime ||
        pickupStops.some(missingStopFields) ||
        dropoffStops.some(missingStopFields);

    const textInputClass = (isMissing) =>
        `w-full px-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${
            isMissing
                ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-200 text-gray-700 focus:border-[#005C7A] focus:ring-[#005C7A]'
        }`;

    const handleDraft = () => {
        pushToast('info', 'Draft saved locally for this session.');
    };

    const handleSubmit = () => {
        setSubmitAttempted(true);
        if (isFormInvalid) {
            pushToast('warning', 'Please fill in all required fields before submitting.');
            return;
        }
        pushToast('success', 'Job submitted for approval.');
    };

    return (
        <div className="space-y-5">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            {/* Page Title */}
            <h1 className="text-[22px] font-bold text-gray-900">Create New Job</h1>

            {/* Permission Banner */}
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <MdWarning size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-amber-700">Permission Limitations Active</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                        Your role has limited permissions. You can create jobs, but compensation rates are fixed and all new jobs require approval from a Company Admin.
                    </p>
                </div>
            </div>

            {/* ── Section 1: Route & Client Information ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Route &amp; Client Information</h2>

                {/* Job Title + Client Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Job Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Job Title / Route Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Morning School Run – Route A"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className={textInputClass(submitAttempted && !jobTitle.trim())}
                        />
                        {submitAttempted && !jobTitle.trim() && <p className="text-xs text-red-600 font-semibold mt-1">Job Title is required.</p>}
                    </div>

                    {/* Client Name Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Client Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setClientOpen((o) => !o)}
                                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] transition-colors"
                            >
                                <span>{clientName}</span>
                                <MdKeyboardArrowDown size={20} className="text-gray-400 shrink-0" />
                            </button>
                            {clientOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                    {clientOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => { setClientName(opt); setClientOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 ${clientName === opt ? 'font-semibold text-[#005C7A]' : 'text-gray-700'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job Type + Internal ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Job Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={jobType}
                                onChange={(e) => setJobType(e.target.value)}
                                className={textInputClass(submitAttempted && !jobType.trim())}
                            >
                                {jobTypeOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <MdKeyboardArrowDown size={20} className="text-gray-400 shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Internal Job ID (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. NHS-MORN-001"
                            value={internalId}
                            onChange={(e) => setInternalId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>
                </div>

                {/* Internal Notes */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Internal Notes (Optional)
                    </label>
                    <textarea
                        rows={4}
                        placeholder="add any relevant details for dispatchers or admins..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] resize-none"
                    />
                </div>
            </div>

            {/* ── Section 2: Pickup & Drop-off Points ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-bold text-gray-900">Pickup &amp; Drop-off Points</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Pickup Stops</h3>
                        <button type="button" onClick={addPickup} className="flex items-center gap-1.5 text-sm font-semibold text-[#005C7A] hover:text-[#004a63] transition-colors">
                            <HiPlus size={16} />
                            Add Pickup
                        </button>
                    </div>
                    {pickupStops.map((stop, idx) => (
                        <div key={stop.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-700">Pickup {idx + 1}</p>
                                {pickupStops.length > 1 && (
                                    <button type="button" onClick={() => removePickup(stop.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <MdDeleteOutline size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <HiOutlineLocationMarker size={16} className="text-blue-500 shrink-0" />
                                        <span className="text-sm font-semibold text-gray-700">GPS <span className="text-red-500">*</span></span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="GPS"
                                        value={stop.gps}
                                        onChange={(e) => updatePickup(stop.id, 'gps', e.target.value)}
                                        className={textInputClass(submitAttempted && !stop.gps.trim())}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-sm font-semibold text-gray-700">Post Code <span className="text-red-500">*</span></span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Post Code"
                                        value={stop.postCode}
                                        onChange={(e) => updatePickup(stop.id, 'postCode', e.target.value)}
                                        className={textInputClass(submitAttempted && !stop.postCode.trim())}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-sm font-semibold text-gray-700">Passenger <span className="text-red-500">*</span></span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={stop.passenger}
                                            onChange={(e) => updatePickup(stop.id, 'passenger', e.target.value)}
                                            className={textInputClass(submitAttempted && !stop.passenger.trim())}
                                        >
                                            <option value="">Select passenger</option>
                                            {passengerOptions.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <MdKeyboardArrowDown size={20} className="text-gray-400 shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes for Driver</label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional instructions..."
                                    value={stop.notes}
                                    onChange={(e) => updatePickup(stop.id, 'notes', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] resize-none"
                                />
                            </div>
                            {submitAttempted && missingStopFields(stop) && (
                                <p className="text-xs text-red-600 font-semibold">GPS, post code, and passenger are required for this pickup.</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Drop-off Stops</h3>
                        <button type="button" onClick={addDropoff} className="flex items-center gap-1.5 text-sm font-semibold text-[#005C7A] hover:text-[#004a63] transition-colors">
                            <HiPlus size={16} />
                            Add Drop-off
                        </button>
                    </div>
                    {dropoffStops.map((stop, idx) => (
                        <div key={stop.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-700">Drop-off {idx + 1}</p>
                                {dropoffStops.length > 1 && (
                                    <button type="button" onClick={() => removeDropoff(stop.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <MdDeleteOutline size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <HiOutlineFlag size={16} className="text-red-500 shrink-0" />
                                        <span className="text-sm font-semibold text-gray-700">GPS <span className="text-red-500">*</span></span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="GPS"
                                        value={stop.gps}
                                        onChange={(e) => updateDropoff(stop.id, 'gps', e.target.value)}
                                        className={textInputClass(submitAttempted && !stop.gps.trim())}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-sm font-semibold text-gray-700">Post Code <span className="text-red-500">*</span></span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Post Code"
                                        value={stop.postCode}
                                        onChange={(e) => updateDropoff(stop.id, 'postCode', e.target.value)}
                                        className={textInputClass(submitAttempted && !stop.postCode.trim())}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-sm font-semibold text-gray-700">Passenger <span className="text-red-500">*</span></span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={stop.passenger}
                                            onChange={(e) => updateDropoff(stop.id, 'passenger', e.target.value)}
                                            className={textInputClass(submitAttempted && !stop.passenger.trim())}
                                        >
                                            <option value="">Select passenger</option>
                                            {passengerOptions.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <MdKeyboardArrowDown size={20} className="text-gray-400 shrink-0 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes for Driver</label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional instructions..."
                                    value={stop.notes}
                                    onChange={(e) => updateDropoff(stop.id, 'notes', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] resize-none"
                                />
                            </div>
                            {submitAttempted && missingStopFields(stop) && (
                                <p className="text-xs text-red-600 font-semibold">GPS, post code, and passenger are required for this drop-off.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Section 3: Schedule & Compensation ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Schedule &amp; Compensation</h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Pickup Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Pickup Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={jobDate}
                            onChange={(e) => setJobDate(e.target.value)}
                            className={textInputClass(submitAttempted && !jobDate)}
                        />
                        {submitAttempted && !jobDate && <p className="text-xs text-red-600 font-semibold mt-1">Pickup Date is required.</p>}
                    </div>

                    {/* Pickup Time */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Pickup Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className={textInputClass(submitAttempted && !pickupTime)}
                        />
                        {submitAttempted && !pickupTime && <p className="text-xs text-red-600 font-semibold mt-1">Pickup Time is required.</p>}
                    </div>

                    {/* Estimated Drop-off */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Est. Drop-off
                        </label>
                        <input
                            type="time"
                            value={estDropoff}
                            onChange={(e) => setEstDropoff(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>

                    {/* Driver Rate — locked */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Driver Rate (per hour)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">$</span>
                            <input
                                type="text"
                                value="50.00"
                                readOnly
                                className="w-full pl-7 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                            />
                            <MdLock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* PA Rate — locked */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            PA Rate (per hour)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">$</span>
                            <input
                                type="text"
                                value="40.00"
                                readOnly
                                className="w-full pl-7 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                            />
                            <MdLock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-900">Recurring Job</p>
                        <p className="text-xs text-gray-500 mt-0.5">Set this job to repeat on a schedule.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsRecurring((prev) => !prev)}
                        className="transition-all active:scale-95"
                        aria-label="Toggle recurring job"
                    >
                        {isRecurring ? (
                            <MdOutlineToggleOn size={44} className="text-[#005C7A]" />
                        ) : (
                            <MdOutlineToggleOff size={44} className="text-gray-300" />
                        )}
                    </button>
                </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex items-center justify-end gap-3 pb-4">
                <button
                    type="button"
                    onClick={handleDraft}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                    Save as Draft
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#005C7A] hover:bg-[#004a63] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    Submit for Approval →
                </button>
            </div>

        </div>
    );
};

export default SubAdmin_NewJob;
