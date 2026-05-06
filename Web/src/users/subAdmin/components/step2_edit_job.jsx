import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdTrendingFlat, MdOutlinePinDrop, MdPerson, MdDeleteOutline,
    MdKeyboardArrowDown, MdSearch, MdDragIndicator, MdCalendarToday,
    MdWbSunny, MdNightlight,
} from 'react-icons/md';
import { supabase } from '../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../services/companyService';
import { useEditJob } from '../../../context/editJobContext';
import {
    getPassengersForJobCreation,
    passengerDisplayName,
    derivePickupStops,
    deriveDropoffStops,
} from '../../../services/jobService';
import { ShimmerBlock, LoadingStatus } from '../../../utils/Shimmer';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };
const WEEKDAY_KEYS   = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const readOnlyFieldClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-800 min-h-[46px] flex items-center';

// ── Sub-components ────────────────────────────────────────────────────────────

const WeeklyScheduleBadge = ({ schedule }) => {
    if (!schedule) return null;
    const activeDays = WEEKDAY_KEYS.filter((d) => Boolean(schedule[d]));
    if (activeDays.length === 0) return <span className="text-[10px] text-gray-400">No schedule</span>;
    return (
        <span className="flex gap-0.5">
            {activeDays.map((d) => (
                <span key={d} className="w-4 h-4 rounded text-[9px] font-bold bg-[#004D6D]/10 text-[#004D6D] flex items-center justify-center">
                    {WEEKDAY_LABELS[d]}
                </span>
            ))}
        </span>
    );
};

const StopCard = ({ stop, order, label, isPickup }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
            <h3 className="text-[14px] font-bold text-gray-800">{label} {order}</h3>
        </div>
        <div className="p-6 space-y-5">
            <p className="text-[12px] text-gray-600">
                <span className="font-semibold text-gray-800">Passengers: </span>
                {stop.passengerNames}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-[13px] font-bold text-gray-700">Street address</label>
                    <div className={readOnlyFieldClass}>{stop.address?.trim() ? stop.address : '—'}</div>
                </div>
                <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700">Postcode</label>
                    <div className="relative">
                        <div className={'pl-10 pr-4 ' + readOnlyFieldClass}>{stop.postcode?.trim() ? stop.postcode : '—'}</div>
                        <MdOutlinePinDrop className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700">
                        {isPickup ? 'Scheduled pickup time' : 'Stop time'}
                    </label>
                    <div className={readOnlyFieldClass}>{stop.scheduled_time?.trim() ? stop.scheduled_time : '—'}</div>
                </div>
            </div>
        </div>
    </div>
);

// ── Draggable passenger list (same logic as Step2Job) ─────────────────────────

const DraggablePassengerList = ({ passengers, onReorder, onRemove }) => {
    const [dragFromIndex, setDragFromIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDragFromIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        const ghost = document.createElement('div');
        ghost.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 0);
    };

    const handleDragEnter = (index) => {
        if (dragFromIndex === null || dragFromIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (dragFromIndex === null || dragFromIndex === dropIndex) return;
        const reordered = [...passengers];
        const [moved] = reordered.splice(dragFromIndex, 1);
        reordered.splice(dropIndex, 0, moved);
        onReorder(reordered);
        setDragFromIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragFromIndex(null);
        setDragOverIndex(null);
    };

    if (passengers.length === 0) {
        return <p className="text-[13px] text-gray-500 py-2">No passengers yet. Add at least one to set pickup order.</p>;
    }

    return (
        <div>
            <div className="flex items-center gap-1.5 mb-2">
                <MdWbSunny size={13} className="text-amber-500" />
                <span className="text-[11px] font-semibold text-gray-500">Morning pickup order — drag to reorder:</span>
            </div>

            <div className="space-y-1.5">
                {passengers.map((p, index) => {
                    const isBeingDragged = dragFromIndex === index;
                    const isDropTarget   = dragOverIndex === index && dragFromIndex !== index;
                    return (
                        <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all select-none cursor-default
                                ${isBeingDragged ? 'opacity-40 border-dashed border-[#004D6D] bg-[#004D6D]/5' : ''}
                                ${isDropTarget   ? 'border-[#004D6D] bg-[#004D6D]/5 shadow-sm scale-[1.01]' : ''}
                                ${!isBeingDragged && !isDropTarget ? 'bg-gray-50 border-gray-200 hover:border-gray-300' : ''}
                            `}
                        >
                            <div className="w-6 h-6 rounded-full bg-[#004D6D] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                            </div>
                            <MdDragIndicator size={18} className="text-gray-400 cursor-grab active:cursor-grabbing shrink-0" />
                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-semibold text-gray-800">{passengerDisplayName(p)}</span>
                                {p.wheelchair_required && (
                                    <span className="text-[10px] uppercase font-bold text-[#004D6D]">WC</span>
                                )}
                                <WeeklyScheduleBadge schedule={p.weekly_schedule} />
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block">
                                {p.primary_pickup_postcode ?? p.pickup_postal_code ?? '—'}
                            </span>
                            <button
                                type="button"
                                onClick={() => onRemove(p.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                aria-label={`Remove ${passengerDisplayName(p)}`}
                            >
                                <MdDeleteOutline size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Evening preview */}
            {passengers.length > 1 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 mb-2">
                        <MdNightlight size={13} className="text-indigo-400" />
                        <span className="text-[11px] font-semibold text-gray-500">Evening drop-off order (automatic reverse):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {[...passengers].reverse().map((p, i) => (
                            <span key={p.id} className="flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                                <span className="font-bold">{i + 1}.</span>
                                {passengerDisplayName(p)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const Step2EditJob = ({ setToasts }) => {
    const navigate = useNavigate();
    const { id }   = useParams();
    const { selectedPassengers, setSelectedPassengers, step2Loaded } = useEditJob();

    const [catalog,               setCatalog]               = useState([]);
    const [catalogLoading,        setCatalogLoading]        = useState(true);
    const [pickIdToAdd,           setPickIdToAdd]           = useState('');
    const [passengerSearch,       setPassengerSearch]       = useState('');
    const [isDropdownOpen,        setIsDropdownOpen]        = useState(false);
    const dropdownRef = useRef(null);

    const pushToast = (type, message) =>
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 }]);

    // Load passenger catalog
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setCatalogLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const uid = session?.user?.id;
                if (!uid) throw new Error('Not authenticated.');
                const admin = await getCompanyAdminById(uid);
                const cid = admin?.company_id;
                if (!cid) throw new Error('No company linked.');
                const rows = await getPassengersForJobCreation(cid);
                if (!cancelled) setCatalog(rows);
            } catch (e) {
                if (!cancelled) pushToast('error', e?.message || 'Could not load passengers.');
            } finally {
                if (!cancelled) setCatalogLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Close dropdown on outside click
    useEffect(() => {
        const onClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    // Derived stops from passenger order
    const pickupStops  = useMemo(() => derivePickupStops(selectedPassengers),  [selectedPassengers]);
    const dropoffStops = useMemo(() => deriveDropoffStops(selectedPassengers),  [selectedPassengers]);

    const availableToAdd = useMemo(
        () => catalog.filter((p) => !selectedPassengers.some((s) => s.id === p.id)),
        [catalog, selectedPassengers]
    );
    const filteredAvailable = useMemo(
        () => availableToAdd.filter((p) =>
            passengerDisplayName(p).toLowerCase().includes(passengerSearch.toLowerCase().trim())
        ),
        [availableToAdd, passengerSearch]
    );
    const selectedToAdd = availableToAdd.find((p) => p.id === pickIdToAdd);

    const enrichStop = (stop) => ({
        ...stop,
        passengerNames: stop.passenger_ids
            .map((pid) => passengerDisplayName(selectedPassengers.find((x) => x.id === pid)))
            .filter(Boolean).join(', '),
    });

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

    const removePassenger = (pid) =>
        setSelectedPassengers((prev) => prev.filter((p) => p.id !== pid));

    const handleNext = () => {
        if (selectedPassengers.length === 0) { pushToast('warning', 'Add at least one passenger.'); return; }
        navigate(`/team/jobs/${id}/edit?step=3`);
    };

    // Show shimmer while context is still loading the initial passenger list
    if (!step2Loaded || catalogLoading) {
        return (
            <LoadingStatus label="Loading passengers" className="max-w-[900px] mx-auto space-y-8">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <ShimmerBlock className="h-5 w-44 rounded-md" />
                    <ShimmerBlock className="h-12 rounded-xl" rounded="rounded-xl" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <ShimmerBlock key={i} className="h-10 rounded-lg" rounded="rounded-lg" />
                    ))}
                </div>
            </LoadingStatus>
        );
    }

    const passengerDropdownLabel = (p) => {
        const postcode = p.primary_pickup_postcode ?? p.pickup_postal_code ?? '—';
        return `${passengerDisplayName(p)} — ${postcode}`;
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Step 2 of 3: Passengers & Pickup Order</h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Drag to reorder. The new order becomes the morning pickup sequence.
                        Evening drop-off automatically uses the reverse. Changes are saved on the last step.
                    </p>
                </div>
            </div>

            <div className="space-y-8 max-w-[900px] mx-auto">

                {/* Passenger selector + drag list */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-[16px] font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <MdPerson className="text-[#004D6D]" size={22} />
                        Passengers on this job
                    </h2>
                    <p className="text-[13px] text-gray-500 mb-5">
                        New passengers are added to the bottom. Drag <MdDragIndicator size={14} className="inline text-gray-400" /> to reorder.
                    </p>

                    {/* Add passenger row */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        <div ref={dropdownRef} className="relative flex-1">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-left focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D]"
                            >
                                {selectedToAdd ? passengerDropdownLabel(selectedToAdd) : 'Select passenger to add'}
                            </button>
                            <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            {isDropdownOpen && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2">
                                    <div className="relative mb-2">
                                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={passengerSearch}
                                            onChange={(e) => setPassengerSearch(e.target.value)}
                                            placeholder="Search passenger name..."
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredAvailable.length === 0 ? (
                                            <p className="px-2 py-2 text-[13px] text-gray-500">No passengers found.</p>
                                        ) : (
                                            filteredAvailable.map((p) => {
                                                const activeDays = WEEKDAY_KEYS.filter((d) => Boolean(p.weekly_schedule?.[d]));
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => { setPickIdToAdd(p.id); setIsDropdownOpen(false); }}
                                                        className="w-full text-left px-2 py-2.5 text-[13px] rounded-md hover:bg-gray-50 flex items-center justify-between gap-2"
                                                    >
                                                        <span className="font-medium text-gray-800">{passengerDisplayName(p)}</span>
                                                        <span className="flex items-center gap-1.5 shrink-0">
                                                            {activeDays.length > 0 && (
                                                                <span className="text-[11px] text-[#004D6D] font-semibold flex items-center gap-1">
                                                                    <MdCalendarToday size={11} />
                                                                    {activeDays.length}d/wk
                                                                </span>
                                                            )}
                                                            <span className="text-[11px] text-gray-400">
                                                                {p.primary_pickup_postcode ?? p.pickup_postal_code ?? '—'}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
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

                    <DraggablePassengerList
                        passengers={selectedPassengers}
                        onReorder={setSelectedPassengers}
                        onRemove={removePassenger}
                    />
                </div>

                {/* Pickup stops preview */}
                {pickupStops.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-[18px] font-bold text-gray-900">Pickup stops</h2>
                        <p className="text-[13px] text-gray-500 -mt-2">One stop per distinct primary address, in pickup order.</p>
                        {pickupStops.map((stop) => (
                            <StopCard key={stop.addressKey} stop={enrichStop(stop)} order={stop.pickup_order} label="Pickup" isPickup />
                        ))}
                    </div>
                )}

                {/* Dropoff stops preview */}
                {dropoffStops.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-[18px] font-bold text-gray-900">Drop-off stops</h2>
                        <p className="text-[13px] text-gray-500 -mt-2">One stop per distinct educational site address.</p>
                        {dropoffStops.map((stop) => (
                            <StopCard key={stop.addressKey} stop={enrichStop(stop)} order={stop.dropoff_order} label="Drop-off" isPickup={false} />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button type="button" onClick={() => navigate(`/team/jobs/${id}/edit?step=1`)}
                    className="text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    Back
                </button>
                <button type="button" onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/20 active:scale-95">
                    Next: Schedule & Pay
                    <MdTrendingFlat size={20} />
                </button>
            </div>
        </>
    );
};

export default Step2EditJob;