import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCheck,
    MdDeleteOutline,
    MdAdd,
    MdLocationOn,
    MdTrendingFlat,
    MdOutlinePinDrop,
    MdKeyboardArrowDown,
} from 'react-icons/md';
import { ToastStack } from '../../../../utils/Toast';

const createLocationRow = () => ({
    id: Date.now() + Math.random(),
    postcode: '',
    gps: '',
    passenger: '',
    notes: '',
});

const AddNewJobStep2 = () => {
    const navigate = useNavigate();
    const [pickups, setPickups] = useState([createLocationRow()]);
    const [dropoffs, setDropoffs] = useState([createLocationRow()]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addPickup = () => setPickups((prev) => [...prev, createLocationRow()]);
    const addDropoff = () => setDropoffs((prev) => [...prev, createLocationRow()]);

    const removePickup = (id) => setPickups((prev) => prev.filter((p) => p.id !== id));
    const removeDropoff = (id) => setDropoffs((prev) => prev.filter((d) => d.id !== id));

    const updatePickup = (id, field, value) =>
        setPickups((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    const updateDropoff = (id, field, value) =>
        setDropoffs((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));

    const hasLocationErrors = (row) => !row.postcode.trim() || !row.gps.trim() || !row.passenger.trim();

    const handleNext = () => {
        setSubmitAttempted(true);
        const invalidPickups = pickups.some(hasLocationErrors);
        const invalidDropoffs = dropoffs.some(hasLocationErrors);
        if (invalidPickups || invalidDropoffs) {
            setToasts((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: 'warning',
                    message: 'Please complete all required pickup and drop-off fields.',
                    autoClose: true,
                    duration: 3500,
                },
            ]);
            return;
        }
        navigate('/admin/jobs/create-step3');
    };

    const handleBack = () => {
        navigate('/admin/jobs/create-step1');
    };

    return (
        <div className="max-w-[1280px] mx-auto pb-32">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 2 of 3: Pickups & Drop-offs</h1>
                </div>
            </div>

            <div className="relative mb-12 px-10">
                {/* Connecting Lines */}
                <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 z-0">
                    <div className="h-full bg-[#004D6D] w-1/2"></div>
                </div>
                <div className="flex items-center justify-between relative">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#004D6D] flex items-center justify-center text-white ring-4 ring-[#004D6D]/10">
                            <MdCheck size={20} />
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Route Info</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">2</div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Pickups & Drop-offs</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-white flex items-center justify-center text-[#004D6D] font-bold">
                            3
                        </div>
                        <span className="text-[13px] font-bold text-[#004D6D]">Schedule & Pay</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8 max-w-[900px] mx-auto">
                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold text-gray-900">Pickup Locations</h2>
                    {pickups.map((pickup, index) => (
                        <div key={pickup.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-[14px] font-bold text-gray-800">Pickup Location {index + 1}</h3>
                                {pickups.length > 1 ? (
                                    <button onClick={() => removePickup(pickup.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                        <MdDeleteOutline size={20} />
                                    </button>
                                ) : (
                                    <MdDeleteOutline size={20} className="text-gray-300" />
                                )}
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Address <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Post Code"
                                                    value={pickup.postcode}
                                                    onChange={(e) => updatePickup(pickup.id, 'postcode', e.target.value)}
                                                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                                        submitAttempted && !pickup.postcode.trim() ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                    }`}
                                                />
                                                <MdOutlinePinDrop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="GPS type coordinate"
                                                    value={pickup.gps}
                                                    onChange={(e) => updatePickup(pickup.id, 'gps', e.target.value)}
                                                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                                        submitAttempted && !pickup.gps.trim() ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                    }`}
                                                />
                                                <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                        {submitAttempted && (!pickup.postcode.trim() || !pickup.gps.trim()) && <p className="text-[12px] font-semibold text-red-600">Pickup address postcode and GPS are required.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Passengers <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={pickup.passenger}
                                                onChange={(e) => updatePickup(pickup.id, 'passenger', e.target.value)}
                                                className={`w-full px-4 py-3 bg-white border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                                                    submitAttempted && !pickup.passenger.trim() ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                }`}
                                            >
                                                <option value="">Select passenger</option>
                                                <option>John Doe</option>
                                                <option>Jane Smith</option>
                                                <option>Michael Brown</option>
                                            </select>
                                            <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        </div>
                                        {submitAttempted && !pickup.passenger.trim() && <p className="text-[12px] font-semibold text-red-600">Passenger selection is required.</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">Notes for Driver</label>
                                    <textarea
                                        placeholder="e.g., Please ring the bell upon arrival."
                                        rows={3}
                                        value={pickup.notes}
                                        onChange={(e) => updatePickup(pickup.id, 'notes', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addPickup} className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-[14px] font-bold text-[#004D6D] hover:bg-blue-50/50 hover:border-[#004D6D]/30 transition-all flex items-center justify-center gap-2">
                        <MdAdd size={20} />
                        Add Another Pickup
                    </button>
                </div>

                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold text-gray-900">Drop-off Locations</h2>
                    {dropoffs.map((dropoff, index) => (
                        <div key={dropoff.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-[14px] font-bold text-gray-800">Drop-off Location {index + 1}</h3>
                                {dropoffs.length > 1 ? (
                                    <button onClick={() => removeDropoff(dropoff.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                        <MdDeleteOutline size={20} />
                                    </button>
                                ) : (
                                    <MdDeleteOutline size={20} className="text-gray-300" />
                                )}
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Address <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Post Code"
                                                    value={dropoff.postcode}
                                                    onChange={(e) => updateDropoff(dropoff.id, 'postcode', e.target.value)}
                                                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                                        submitAttempted && !dropoff.postcode.trim() ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                    }`}
                                                />
                                                <MdOutlinePinDrop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="GPS type coordinate"
                                                    value={dropoff.gps}
                                                    onChange={(e) => updateDropoff(dropoff.id, 'gps', e.target.value)}
                                                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                                        submitAttempted && !dropoff.gps.trim() ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                    }`}
                                                />
                                                <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </div>
                                        {submitAttempted && (!dropoff.postcode.trim() || !dropoff.gps.trim()) && <p className="text-[12px] font-semibold text-red-600">Drop-off address postcode and GPS are required.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Passengers <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={dropoff.passenger}
                                                onChange={(e) => updateDropoff(dropoff.id, 'passenger', e.target.value)}
                                                className={`w-full px-4 py-3 bg-white border rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                                                    submitAttempted && !dropoff.passenger.trim() ? 'border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 text-gray-900 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                }`}
                                            >
                                                <option value="">Select passenger</option>
                                                <option>John Doe</option>
                                                <option>Jane Smith</option>
                                                <option>Michael Brown</option>
                                            </select>
                                            <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                        </div>
                                        {submitAttempted && !dropoff.passenger.trim() && <p className="text-[12px] font-semibold text-red-600">Passenger selection is required.</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">Notes for Driver</label>
                                    <textarea
                                        placeholder="e.g., Drop off at the main entrance."
                                        rows={3}
                                        value={dropoff.notes}
                                        onChange={(e) => updateDropoff(dropoff.id, 'notes', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addDropoff} className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-[14px] font-bold text-[#004D6D] hover:bg-blue-50/50 hover:border-[#004D6D]/30 transition-all flex items-center justify-center gap-2">
                        <MdAdd size={20} />
                        Add Another Drop-off
                    </button>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button onClick={handleBack} className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    Back
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={handleNext} className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95">
                        Next: Timings & Compensation
                        <MdTrendingFlat size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewJobStep2;
