import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const SubAdmin_EditJob = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [jobTitle, setJobTitle] = useState('Morning School Run - Route A');
    const [jobType, setJobType] = useState('Regular Contract');
    const [clientName, setClientName] = useState('Westwood High School District');
    const [clientOpen, setClientOpen] = useState(false);
    const [internalId, setInternalId] = useState('NHS-MORN-001');
    const [notes, setNotes] = useState('Please coordinate with dispatch if pickup is delayed by more than 10 minutes.');
    const [pickupStops, setPickupStops] = useState([
        { id: 1, gps: '51.5074,-0.1278', postCode: 'SW1A 1AA', passenger: 'John Doe', notes: 'Ring the bell at gate 2.' },
    ]);
    const [dropoffStops, setDropoffStops] = useState([
        { id: 1, gps: '51.5155,-0.0922', postCode: 'E1 6AN', passenger: 'John Doe', notes: 'Drop at main reception.' },
    ]);
    const [jobDate, setJobDate] = useState('2025-11-25');
    const [pickupTime, setPickupTime] = useState('07:30');
    const [estDropoff, setEstDropoff] = useState('08:15');
    const [isRecurring, setIsRecurring] = useState(true);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [toasts, setToasts] = useState([]);

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3200 },
        ]);
    };

    const createStop = () => ({ id: Date.now() + Math.random(), gps: '', postCode: '', passenger: '', notes: '' });
    const addPickup = () => setPickupStops((prev) => [...prev, createStop()]);
    const addDropoff = () => setDropoffStops((prev) => [...prev, createStop()]);
    const removePickup = (idToRemove) => setPickupStops((prev) => prev.filter((s) => s.id !== idToRemove));
    const removeDropoff = (idToRemove) => setDropoffStops((prev) => prev.filter((s) => s.id !== idToRemove));
    const updatePickup = (idToUpdate, field, value) => setPickupStops((prev) => prev.map((s) => (s.id === idToUpdate ? { ...s, [field]: value } : s)));
    const updateDropoff = (idToUpdate, field, value) => setDropoffStops((prev) => prev.map((s) => (s.id === idToUpdate ? { ...s, [field]: value } : s)));

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

    const handleSaveChanges = () => {
        setSubmitAttempted(true);
        if (isFormInvalid) {
            pushToast('warning', 'Please fill in all required fields before saving changes.');
            return;
        }
        pushToast('success', `Job ${id || ''} updated successfully.`);
        navigate(`/subadmin/jobs/${id}`);
    };

    return (
        <div className="space-y-5">
            <ToastStack toasts={toasts} onClose={(tid) => setToasts((prev) => prev.filter((t) => t.id !== tid))} />

            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Edit Job</h1>
                <button
                    type="button"
                    onClick={() => navigate(`/subadmin/jobs/${id}`)}
                    className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Back to Details
                </button>
            </div>


            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Route &amp; Client Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Title / Route Name <span className="text-red-500">*</span></label>
                        <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={textInputClass(submitAttempted && !jobTitle.trim())} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <button type="button" onClick={() => setClientOpen((v) => !v)} className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                                <span>{clientName}</span>
                            </button>
                            {clientOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                    {clientOptions.map((opt) => (
                                        <button key={opt} type="button" onClick={() => { setClientName(opt); setClientOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Type <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={textInputClass(submitAttempted && !jobType.trim())}>
                                {jobTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Internal Job ID (Optional)</label>
                        <input type="text" value={internalId} onChange={(e) => setInternalId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Internal Notes</label>
                    <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] resize-none" />
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Pickup &amp; Drop-off Points</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Pickup Stops</h3>
                        <button type="button" onClick={addPickup} className="flex items-center gap-1.5 text-sm font-semibold text-[#005C7A] hover:text-[#004a63] transition-colors"><HiPlus size={16} />Add Pickup</button>
                    </div>
                    {pickupStops.map((stop, idx) => (
                        <div key={stop.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-700">Pickup {idx + 1}</p>
                                {pickupStops.length > 1 && <button type="button" onClick={() => removePickup(stop.id)} className="text-gray-400 hover:text-red-500"><MdDeleteOutline size={20} /></button>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5"><HiOutlineLocationMarker className="inline mr-1 text-blue-500" />GPS <span className="text-red-500">*</span></label>
                                    <input type="text" value={stop.gps} onChange={(e) => updatePickup(stop.id, 'gps', e.target.value)} className={textInputClass(submitAttempted && !stop.gps.trim())} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Post Code <span className="text-red-500">*</span></label>
                                    <input type="text" value={stop.postCode} onChange={(e) => updatePickup(stop.id, 'postCode', e.target.value)} className={textInputClass(submitAttempted && !stop.postCode.trim())} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Passenger <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select value={stop.passenger} onChange={(e) => updatePickup(stop.id, 'passenger', e.target.value)} className={textInputClass(submitAttempted && !stop.passenger.trim())}>
                                            <option value="">Select passenger</option>
                                            {passengerOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                       
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Drop-off Stops</h3>
                        <button type="button" onClick={addDropoff} className="flex items-center gap-1.5 text-sm font-semibold text-[#005C7A] hover:text-[#004a63] transition-colors"><HiPlus size={16} />Add Drop-off</button>
                    </div>
                    {dropoffStops.map((stop, idx) => (
                        <div key={stop.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-700">Drop-off {idx + 1}</p>
                                {dropoffStops.length > 1 && <button type="button" onClick={() => removeDropoff(stop.id)} className="text-gray-400 hover:text-red-500"><MdDeleteOutline size={20} /></button>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5"><HiOutlineFlag className="inline mr-1 text-red-500" />GPS <span className="text-red-500">*</span></label>
                                    <input type="text" value={stop.gps} onChange={(e) => updateDropoff(stop.id, 'gps', e.target.value)} className={textInputClass(submitAttempted && !stop.gps.trim())} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Post Code <span className="text-red-500">*</span></label>
                                    <input type="text" value={stop.postCode} onChange={(e) => updateDropoff(stop.id, 'postCode', e.target.value)} className={textInputClass(submitAttempted && !stop.postCode.trim())} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Passenger <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select value={stop.passenger} onChange={(e) => updateDropoff(stop.id, 'passenger', e.target.value)} className={textInputClass(submitAttempted && !stop.passenger.trim())}>
                                            <option value="">Select passenger</option>
                                            {passengerOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Schedule &amp; Compensation</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Date <span className="text-red-500">*</span></label>
                        <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className={textInputClass(submitAttempted && !jobDate)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Time <span className="text-red-500">*</span></label>
                        <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={textInputClass(submitAttempted && !pickupTime)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Est. Drop-off</label>
                        <input type="time" value={estDropoff} onChange={(e) => setEstDropoff(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]" />
                    </div>
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-900">Recurring Job</p>
                        <p className="text-xs text-gray-500 mt-0.5">Set this job to repeat on a schedule.</p>
                    </div>
                    <button type="button" onClick={() => setIsRecurring((v) => !v)} className="transition-all active:scale-95">
                        {isRecurring ? <MdOutlineToggleOn size={44} className="text-[#005C7A]" /> : <MdOutlineToggleOff size={44} className="text-gray-300" />}
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Assigned Staff &amp; Rates</h2>
                <p className="text-xs text-gray-500">Read-only details for currently assigned staff.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/40">
                        <p className="text-sm font-semibold text-gray-800">Assigned Driver</p>
                        <p className="text-[15px] font-bold text-gray-900 mt-1">Robert Fox</p>
                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Rate (per hour)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
                                <input
                                    type="text"
                                    value="50.00"
                                    readOnly
                                    className="w-full pl-7 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                                />
                                <MdLock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/40">
                        <p className="text-sm font-semibold text-gray-800">Assigned Passenger Assistant</p>
                        <p className="text-[15px] font-bold text-gray-900 mt-1">Annette Black</p>
                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Rate (per hour)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
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
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pb-4">
                <button type="button" onClick={() => navigate(`/subadmin/jobs/${id}`)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                    Cancel
                </button>
                <button type="button" onClick={handleSaveChanges} className="flex items-center gap-2 px-6 py-2.5 bg-[#005C7A] hover:bg-[#004a63] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default SubAdmin_EditJob;
