import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCheck,
    MdDeleteOutline,
    MdTrendingFlat,
    MdOutlinePinDrop,
    MdKeyboardArrowDown,
    MdPerson,
} from 'react-icons/md';
import { ToastStack } from '../../../../utils/Toast';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../services/companyService';
import {
    loadJobDraft,
    saveJobDraft,
    getPassengersForJobCreation,
    derivePickupStops,
    deriveDropoffStops,
    passengerDisplayName,
} from '../../../../services/jobService';

const AddNewJobStep2 = () => {
    const navigate = useNavigate();
    const [selectedPassengers, setSelectedPassengers] = useState([]);
    const [pickupEdits, setPickupEdits] = useState({});
    const [dropoffEdits, setDropoffEdits] = useState({});
    const [catalog, setCatalog] = useState([]);
    const [pickIdToAdd, setPickIdToAdd] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [toasts, setToasts] = useState([]);

    const pickupStops = useMemo(
        () => derivePickupStops(selectedPassengers, pickupEdits),
        [selectedPassengers, pickupEdits]
    );
    const dropoffStops = useMemo(
        () => deriveDropoffStops(selectedPassengers, dropoffEdits),
        [selectedPassengers, dropoffEdits]
    );

    useEffect(() => {
        const d = loadJobDraft();
        const s2 = d.step2 || {};
        const ids = new Set((s2.selectedPassengers || []).map((p) => p.id));
        setPickupEdits(s2.pickupEdits || {});
        setDropoffEdits(s2.dropoffEdits || {});

        (async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const uid = session?.user?.id;
                if (!uid) throw new Error('Not authenticated.');
                const admin = await getCompanyAdminById(uid);
                const companyId = admin?.company_id;
                if (!companyId) throw new Error('No company linked to your account.');

                const rows = await getPassengersForJobCreation(companyId);
                setCatalog(rows);

                const byId = new Map(rows.map((r) => [r.id, r]));
                const restored = [...ids]
                    .map((id) => byId.get(id))
                    .filter(Boolean);
                setSelectedPassengers(restored);
            } catch (e) {
                setToasts((prev) => [
                    ...prev,
                    {
                        id: `${Date.now()}-${Math.random()}`,
                        type: 'error',
                        message: e?.message || 'Could not load passengers.',
                        autoClose: true,
                        duration: 5000,
                    },
                ]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        saveJobDraft({
            step2: {
                selectedPassengers,
                pickupEdits,
                dropoffEdits,
            },
        });
    }, [selectedPassengers, pickupEdits, dropoffEdits]);

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

    const addPassenger = () => {
        if (!pickIdToAdd) return;
        const row = catalog.find((p) => p.id === pickIdToAdd);
        if (!row) return;
        if (selectedPassengers.some((p) => p.id === row.id)) {
            pushToast('warning', 'That passenger is already on this job.');
            return;
        }
        setSelectedPassengers((prev) => [...prev, row]);
        setPickIdToAdd('');
    };

    const removePassenger = (id) => {
        setSelectedPassengers((prev) => prev.filter((p) => p.id !== id));
    };

    const updatePickupEdit = (addressKey, patch) => {
        setPickupEdits((prev) => ({
            ...prev,
            [addressKey]: { ...prev[addressKey], ...patch },
        }));
    };

    const updateDropoffEdit = (addressKey, patch) => {
        setDropoffEdits((prev) => ({
            ...prev,
            [addressKey]: { ...prev[addressKey], ...patch },
        }));
    };

    const pickupHasErrors = (stop) =>
        !String(stop.address || '').trim() ||
        !String(stop.postcode || '').trim() ||
        !String(stop.scheduled_time || '').trim();

    const dropoffHasErrors = (stop) =>
        !String(stop.address || '').trim() || !String(stop.postcode || '').trim();

    const handleNext = () => {
        setSubmitAttempted(true);
        if (selectedPassengers.length === 0) {
            pushToast('warning', 'Add at least one passenger.');
            return;
        }
        if (pickupStops.some(pickupHasErrors) || dropoffStops.some(dropoffHasErrors)) {
            pushToast('warning', 'Complete all required pickup and drop-off fields.');
            return;
        }
        navigate('/admin/jobs/create-step3');
    };

    const handleBack = () => {
        navigate('/admin/jobs/create-step1');
    };

    const availableToAdd = catalog.filter((p) => !selectedPassengers.some((s) => s.id === p.id));

    return (
        <div className="max-w-[1280px] mx-auto pb-32">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 2 of 3: Pickups & Drop-offs</h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Passengers are loaded from your directory. Shared pickup addresses use one stop; shared drop-offs use one stop. Changes here do not edit passenger records.
                    </p>
                </div>
            </div>

            <div className="relative mb-12 px-10">
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
                        <div className="w-10 h-10 rounded-full border-2 border-[#004D6D] bg-[#004D6D] flex items-center justify-center text-white font-bold ring-4 ring-[#004D6D]/10">
                            2
                        </div>
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
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MdPerson className="text-[#004D6D]" size={22} />
                        Passengers on this job
                    </h2>
                    {loading ? (
                        <p className="text-[14px] text-gray-500">Loading passengers…</p>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <div className="relative flex-1">
                                    <select
                                        value={pickIdToAdd}
                                        onChange={(e) => setPickIdToAdd(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                                    >
                                        <option value="">Select passenger to add</option>
                                        {availableToAdd.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {passengerDisplayName(p)} — {p.pickup_postal_code}
                                            </option>
                                        ))}
                                    </select>
                                    <MdKeyboardArrowDown
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                        size={20}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addPassenger}
                                    disabled={!pickIdToAdd}
                                    className="px-6 py-3 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                            {selectedPassengers.length === 0 ? (
                                <p className="text-[13px] text-gray-500">No passengers yet. Add at least one to build pickup and drop-off stops.</p>
                            ) : (
                                <ul className="flex flex-wrap gap-2">
                                    {selectedPassengers.map((p) => (
                                        <li
                                            key={p.id}
                                            className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px]"
                                        >
                                            <span className="font-semibold text-gray-800">{passengerDisplayName(p)}</span>
                                            {p.wheelchair_required && (
                                                <span className="text-[10px] uppercase font-bold text-[#004D6D]">WC</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removePassenger(p.id)}
                                                className="p-1 text-gray-400 hover:text-red-500"
                                                aria-label={`Remove ${passengerDisplayName(p)}`}
                                            >
                                                <MdDeleteOutline size={18} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold text-gray-900">Pickup stops</h2>
                    <p className="text-[13px] text-gray-500 -mt-2">One row per distinct pickup address (order follows first appearance).</p>
                    {pickupStops.length === 0 && selectedPassengers.length > 0 && (
                        <p className="text-[13px] text-amber-700">Could not derive pickups — check passenger pickup addresses.</p>
                    )}
                    {pickupStops.map((stop) => (
                        <div key={stop.addressKey} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-[14px] font-bold text-gray-800">Pickup {stop.pickup_order}</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <p className="text-[12px] text-gray-600">
                                    <span className="font-semibold text-gray-800">Passengers: </span>
                                    {stop.passenger_ids
                                        .map((id) => passengerDisplayName(selectedPassengers.find((x) => x.id === id)))
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Street address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={stop.address}
                                            onChange={(e) => updatePickupEdit(stop.addressKey, { address: e.target.value })}
                                            className={`w-full px-4 py-3 bg-white border rounded-xl text-[14px] focus:outline-none focus:ring-2 ${
                                                submitAttempted && !String(stop.address || '').trim()
                                                    ? 'border-red-400 focus:ring-red-500/20'
                                                    : 'border-gray-200 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                            }`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Postcode <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={stop.postcode}
                                                onChange={(e) => updatePickupEdit(stop.addressKey, { postcode: e.target.value })}
                                                className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-[14px] focus:outline-none focus:ring-2 ${
                                                    submitAttempted && !String(stop.postcode || '').trim()
                                                        ? 'border-red-400 focus:ring-red-500/20'
                                                        : 'border-gray-200 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                }`}
                                            />
                                            <MdOutlinePinDrop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Scheduled pickup time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={stop.scheduled_time || ''}
                                            onChange={(e) => updatePickupEdit(stop.addressKey, { scheduled_time: e.target.value })}
                                            className={`w-full px-4 py-3 bg-white border rounded-xl text-[14px] focus:outline-none focus:ring-2 ${
                                                submitAttempted && !String(stop.scheduled_time || '').trim()
                                                    ? 'border-red-400 focus:ring-red-500/20'
                                                    : 'border-gray-200 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                            }`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Latitude (optional)</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={stop.latitude ?? ''}
                                            onChange={(e) =>
                                                updatePickupEdit(stop.addressKey, {
                                                    latitude: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Longitude (optional)</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={stop.longitude ?? ''}
                                            onChange={(e) =>
                                                updatePickupEdit(stop.addressKey, {
                                                    longitude: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">Notes for driver</label>
                                    <textarea
                                        rows={2}
                                        value={stop.notes_for_driver || ''}
                                        onChange={(e) =>
                                            updatePickupEdit(stop.addressKey, { notes_for_driver: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold text-gray-900">Drop-off stops</h2>
                    <p className="text-[13px] text-gray-500 -mt-2">One row per distinct drop-off address.</p>
                    {dropoffStops.map((stop) => (
                        <div key={stop.addressKey} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-[14px] font-bold text-gray-800">Drop-off {stop.dropoff_order}</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <p className="text-[12px] text-gray-600">
                                    <span className="font-semibold text-gray-800">Passengers: </span>
                                    {stop.passenger_ids
                                        .map((id) => passengerDisplayName(selectedPassengers.find((x) => x.id === id)))
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Street address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={stop.address}
                                            onChange={(e) => updateDropoffEdit(stop.addressKey, { address: e.target.value })}
                                            className={`w-full px-4 py-3 bg-white border rounded-xl text-[14px] focus:outline-none focus:ring-2 ${
                                                submitAttempted && !String(stop.address || '').trim()
                                                    ? 'border-red-400 focus:ring-red-500/20'
                                                    : 'border-gray-200 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                            }`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Postcode <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={stop.postcode}
                                                onChange={(e) => updateDropoffEdit(stop.addressKey, { postcode: e.target.value })}
                                                className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-[14px] focus:outline-none focus:ring-2 ${
                                                    submitAttempted && !String(stop.postcode || '').trim()
                                                        ? 'border-red-400 focus:ring-red-500/20'
                                                        : 'border-gray-200 focus:ring-[#004D6D]/10 focus:border-[#004D6D]'
                                                }`}
                                            />
                                            <MdOutlinePinDrop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Stop time (optional)</label>
                                        <input
                                            type="time"
                                            value={stop.scheduled_time || ''}
                                            onChange={(e) => updateDropoffEdit(stop.addressKey, { scheduled_time: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Latitude (optional)</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={stop.latitude ?? ''}
                                            onChange={(e) =>
                                                updateDropoffEdit(stop.addressKey, {
                                                    latitude: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Longitude (optional)</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={stop.longitude ?? ''}
                                            onChange={(e) =>
                                                updateDropoffEdit(stop.addressKey, {
                                                    longitude: e.target.value === '' ? null : e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">Notes for driver</label>
                                    <textarea
                                        rows={2}
                                        value={stop.notes_for_driver || ''}
                                        onChange={(e) =>
                                            updateDropoffEdit(stop.addressKey, { notes_for_driver: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                    type="button"
                    onClick={handleBack}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    Back
                </button>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95"
                    >
                        Next: Schedule & Pay
                        <MdTrendingFlat size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewJobStep2;
