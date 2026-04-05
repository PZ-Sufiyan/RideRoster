import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    MdSearch,
    MdAdd,
    MdMoreVert,
    MdChevronLeft,
    MdChevronRight,
    MdKeyboardArrowDown,
    MdCheckBoxOutlineBlank,
    MdCheckBox,
    MdNotificationsNone,
    MdAccessible,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { getPassengers, updatePassenger } from '../../../../../services/passengerService';
import { ShimmerBlock } from '../../../../../utils/Shimmer';

const STATUS_STYLES = {
    Active: 'text-blue-600 font-bold text-[11px] uppercase tracking-wide',
    Approved: 'text-green-600 font-bold text-[11px] uppercase tracking-wide',
    Pending: 'text-yellow-500 font-bold text-[11px] uppercase tracking-wide',
    Rejected: 'text-gray-500 font-bold text-[11px] uppercase tracking-wide',
    Suspended: 'text-orange-600 font-bold text-[11px] uppercase tracking-wide',
};

const PASSENGER_ACTION_MENU_H = 188;
const PASSENGER_MENU_ACTIONS = ['Approve', 'Reject', 'Suspend', 'Active'];

function normalizePassengerStatus(raw) {
    if (raw == null || raw === '') return 'pending';
    const s = String(raw).trim().toLowerCase();
    if (['pending', 'approve', 'reject', 'suspend', 'active'].includes(s)) return s;
    if (s === 'approved') return 'approve';
    if (s === 'rejected') return 'reject';
    if (s === 'suspended') return 'suspend';
    return s;
}

function passengerStatusLabel(dbStatus) {
    const s = normalizePassengerStatus(dbStatus);
    const labels = {
        pending: 'Pending',
        approve: 'Approved',
        reject: 'Rejected',
        suspend: 'Suspended',
        active: 'Active',
    };
    return labels[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending');
}

function actionToPassengerDbStatus(action) {
    const map = {
        Approve: 'approve',
        Reject: 'reject',
        Suspend: 'suspend',
        Active: 'active',
    };
    return map[action] ?? null;
}

function formatTime12h(timeValue) {
    if (!timeValue) return '-';
    const [h, m] = String(timeValue).split(':');
    const hourNum = Number(h);
    if (Number.isNaN(hourNum)) return String(timeValue);
    const meridian = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${m ?? '00'} ${meridian}`;
}

/* ── Tiny dropdown helper (top-level component to satisfy hooks lint) ── */
const Dropdown = ({ label, options, value, open, setOpen, onChange }) => (
    <div className="relative">
        <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
            {label && <span>{label}:</span>}
            <span className="font-medium">{value}</span>
            <MdKeyboardArrowDown className="text-gray-400 ml-0.5" size={16} />
        </button>
        {open && (
            <div className="absolute left-0 top-full mt-1 min-w-30 bg-white border border-gray-100 rounded-lg shadow-lg z-30">
                {options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => { onChange(opt); setOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${value === opt ? 'font-semibold text-[#004D6D]' : 'text-gray-700'}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        )}
    </div>
);

/* ── Component ───────────────────────────────────────────── */
const PassengersPage = () => {
    const navigate = useNavigate();

    const [passengers, setPassengers] = useState([]);
    const [search, setSearch]               = useState('');
    const [pickupFilter, setPickupFilter]   = useState('All Pickups');
    const [wcFilter, setWcFilter]           = useState('All');
    const [statusFilter, setStatusFilter]   = useState('All');
    const [selectedRows, setSelectedRows]   = useState([]);
    /** Portal-fixed row menu so the table card does not grow or scroll when opened */
    const [openMenu, setOpenMenu]         = useState(null);
    const [rowsPerPage]                     = useState(10);
    const [currentPage, setCurrentPage]     = useState(1);

    // dropdown open states
    const [pickupOpen, setPickupOpen]   = useState(false);
    const [wcOpen, setWcOpen]           = useState(false);
    const [statusOpen, setStatusOpen]   = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [statusUpdateError, setStatusUpdateError] = useState('');
    const [isSavingStatus, setIsSavingStatus] = useState(false);

    const menuRef = useRef(null);

    useEffect(() => {
        const loadPassengers = async () => {
            setIsLoading(true);
            setLoadError('');
            setStatusUpdateError('');
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const userId = session?.user?.id;
                if (!userId) throw new Error('Not authenticated.');

                const admin = await getCompanyAdminById(userId);
                if (!admin?.company_id) throw new Error('No company linked to your account.');

                const rows = await getPassengers({ companyId: admin.company_id });
                const mapped = (rows || []).map((row) => ({
                    id: row.id,
                    passengerId: row.id,
                    name: `${row.first_name || ''} ${row.surname || ''}`.trim() || 'N/A',
                    avatar: `https://i.pravatar.cc/150?u=${row.id}`,
                    contact: row.contact_number_1 || '-',
                    pickupPostcode: row.pickup_postal_code || '-',
                    pickupAddress: row.pickup_address || '-',
                    dropoffPostcode: row.dropoff_postal_code || '-',
                    dropoffAddress: row.dropoff_address || '-',
                    time: formatTime12h(row.pickup_time),
                    wheelchair: Boolean(row.wheelchair_required),
                    statusDb: normalizePassengerStatus(row.status),
                }));
                setPassengers(mapped);
            } catch (err) {
                console.error('Failed loading passengers:', err);
                setLoadError(err?.message || 'Failed to load passengers.');
                setPassengers([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadPassengers();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current?.contains(e.target)) return;
            for (const el of document.querySelectorAll('[data-passenger-action-trigger]')) {
                if (el.contains(e.target)) return;
            }
            setOpenMenu(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!openMenu) return;
        const close = () => setOpenMenu(null);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [openMenu]);

    /* ── Helpers ── */
    const pickupSlot = (timeStr) => {
        if (!timeStr) return 'All Pickups';
        const [time, meridian] = timeStr.split(' ');
        let [hour] = time.split(':').map(Number);
        let h24 = hour;
        if (meridian === 'PM' && hour !== 12) h24 = hour + 12;
        if (meridian === 'AM' && hour === 12) h24 = 0;
        return h24 < 12 ? 'Morning' : 'Afternoon';
    };

    /* ── Filtering ── */
    const filtered = passengers.filter((p) => {
        const matchSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.pickupPostcode.toLowerCase().includes(search.toLowerCase()) ||
            p.dropoffPostcode.toLowerCase().includes(search.toLowerCase());
        const matchPickup =
            pickupFilter === 'All Pickups' || pickupSlot(p.time) === pickupFilter;
        const matchWc =
            wcFilter === 'All' ||
            (wcFilter === 'Yes' && p.wheelchair) ||
            (wcFilter === 'No' && !p.wheelchair);
        const matchStatus =
            statusFilter === 'All' || passengerStatusLabel(p.statusDb) === statusFilter;
        return matchSearch && matchPickup && matchWc && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    /* ── Selection helpers ── */
    const toggleRow = (id) =>
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );

    const toggleAll = () => {
        const ids = paginated.map((p) => p.id);
        const allSel = ids.every((id) => selectedRows.includes(id));
        setSelectedRows((prev) =>
            allSel ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
        );
    };

    const allSel = paginated.length > 0 && paginated.every((p) => selectedRows.includes(p.id));
    const shimmerRows = Array.from({ length: 6 });

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        setSelectedRows([]);
        setOpenMenu(null);
    };

    const handlePassengerStatusAction = (action, passengerId) => {
        const nextDb = actionToPassengerDbStatus(action);
        if (!nextDb) return;
        setStatusUpdateError('');
        setIsSavingStatus(true);
        updatePassenger(passengerId, { status: nextDb })
            .then(() => {
                setPassengers((prev) =>
                    prev.map((row) => (row.id === passengerId ? { ...row, statusDb: nextDb } : row))
                );
                setOpenMenu(null);
            })
            .catch((err) => {
                console.error('Failed to update passenger status:', err);
                setStatusUpdateError(err?.message || 'Failed to update status.');
            })
            .finally(() => {
                setIsSavingStatus(false);
            });
    };

    const menuPassenger = openMenu ? passengers.find((x) => x.id === openMenu.passengerId) : null;
    const passengerMenuActions = menuPassenger ? PASSENGER_MENU_ACTIONS : [];

    /* ── Reset ── */
    const handleReset = () => {
        setSearch('');
        setPickupFilter('All Pickups');
        setWcFilter('All');
        setStatusFilter('All');
        setCurrentPage(1);
        setSelectedRows([]);
    };

    return (
        <div className="space-y-5">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900">Passengers</h1>
                    <p className="text-[13px] text-gray-400 mt-0.5">Manage registered passengers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/users/passengers/add')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                    >
                        <MdAdd size={18} />
                        Add Passenger
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                {/* Search */}
                <div className="relative flex-1 min-w-55">
                    <MdSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Name or Post Code..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-3 py-2 text-[13px] text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                    />
                </div>

                {/* All Pickups */}
                <Dropdown
                    label=""
                    options={['All Pickups', 'Morning', 'Afternoon']}
                    value={pickupFilter}
                    open={pickupOpen}
                    setOpen={setPickupOpen}
                    onChange={setPickupFilter}
                />

                {/* Wheelchair */}
                <Dropdown
                    label="Wheelchair"
                    options={['All', 'Yes', 'No']}
                    value={wcFilter}
                    open={wcOpen}
                    setOpen={setWcOpen}
                    onChange={setWcFilter}
                />

                {/* Status */}
                <Dropdown
                    label="Status"
                    options={['All', 'Active', 'Approved', 'Pending', 'Rejected', 'Suspended']}
                    value={statusFilter}
                    open={statusOpen}
                    setOpen={setStatusOpen}
                    onChange={setStatusFilter}
                />

                {/* Reset Filters */}
                <button
                    onClick={handleReset}
                    className="text-[13px] font-semibold text-[#004D6D] hover:underline underline-offset-2 transition-all whitespace-nowrap"
                >
                    Reset Filters
                </button>
            </div>

            {/* ── Bulk Action Bar (shown when rows selected) ── */}
            {selectedRows.length > 0 && (
                <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 px-4 py-2.5 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="cursor-pointer" onClick={toggleAll}>
                            {allSel
                                ? <MdCheckBox className="text-[#004D6D] w-5 h-5" />
                                : <MdCheckBoxOutlineBlank className="text-gray-400 w-5 h-5" />
                            }
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">
                            {selectedRows.length} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/admin/users/passengers/assign')}
                            className="px-4 py-1.5 border border-[#004D6D] text-[#004D6D] rounded-lg text-[12px] font-semibold hover:bg-[#004D6D] hover:text-white transition-all"
                        >
                            Bulk Assign Route
                        </button>
                        <button
                            onClick={() => {
                                setPassengers((prev) =>
                                    prev.map((p) =>
                                        selectedRows.includes(p.id)
                                            ? { ...p, status: 'Inactive' }
                                            : p
                                    )
                                );
                                setSelectedRows([]);
                            }}
                            className="px-4 py-1.5 border border-red-500 text-red-500 rounded-lg text-[12px] font-semibold hover:bg-red-500 hover:text-white transition-all"
                        >
                            Bulk Deactivate
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible">
                {statusUpdateError && (
                    <div className="mx-4 mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {statusUpdateError}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead className="border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3.5 w-10">
                                    <div className="cursor-pointer" onClick={toggleAll}>
                                        {allSel
                                            ? <MdCheckBox className="text-[#004D6D] w-5 h-5" />
                                            : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                        }
                                    </div>
                                </th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Passenger Name</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pickup</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">W/C</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Drop-off</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={isLoading} aria-label={isLoading ? 'Loading passengers' : undefined}>
                            {isLoading ? shimmerRows.map((_, index) => (
                                <tr key={`passenger-skeleton-${index}`}>
                                    <td className="px-4 py-4">
                                        <ShimmerBlock className="w-5 h-5 rounded" rounded="rounded" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <ShimmerBlock className="h-3.5 w-32 rounded-md" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <ShimmerBlock className="w-8 h-8 shrink-0" rounded="rounded-full" />
                                            <div className="space-y-2 min-w-0">
                                                <ShimmerBlock className="h-3.5 w-28 max-w-full rounded-md" />
                                                <ShimmerBlock className="h-3 w-20 rounded-md" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-2">
                                            <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                            <ShimmerBlock className="h-3 w-16 rounded-md" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-2">
                                            <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                                            <ShimmerBlock className="h-3 w-36 rounded-md" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <ShimmerBlock className="h-3.5 w-16 rounded-md" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <ShimmerBlock className="h-5 w-5 rounded" rounded="rounded" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-2">
                                            <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                                            <ShimmerBlock className="h-3 w-36 rounded-md" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <ShimmerBlock className="h-6 w-20 rounded-full" rounded="rounded-full" />
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <ShimmerBlock className="ml-auto h-8 w-8 rounded-lg" />
                                    </td>
                                </tr>
                            )) : paginated.length > 0 ? paginated.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">

                                    {/* Checkbox */}
                                    <td className="px-4 py-4">
                                        <div className="cursor-pointer" onClick={() => toggleRow(p.id)}>
                                            {selectedRows.includes(p.id)
                                                ? <MdCheckBox className="text-[#004D6D] w-5 h-5" />
                                                : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                            }
                                        </div>
                                    </td>
                                    {/* Name + Avatar */}
                                    <td className="px-4 py-4">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => navigate(`/admin/users/passengers/${p.id}`)}
                                        >
                                            <img
                                                src={p.avatar}
                                                alt={p.name}
                                                className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0"
                                            />
                                            <span className="font-medium text-gray-900 whitespace-nowrap group-hover:text-[#004D6D] transition-colors">
                                                {p.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{p.contact}</td>

                                    {/* Pickup/Drop-off address */}
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-gray-800">{p.pickupPostcode}</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5">{p.pickupAddress}</div>
                                    </td>

                                    {/* Time */}
                                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{p.time}</td>

                                    {/* W/C */}
                                    <td className="px-4 py-4">
                                        {p.wheelchair
                                            ? <MdAccessible size={20} className="text-blue-500" />
                                            : <span className="text-gray-400 font-bold text-base">—</span>
                                        }
                                    </td>

                                    {/* Drop-off */}
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-gray-800">{p.dropoffPostcode}</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5">{p.dropoffAddress}</div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-4">
                                        <span className={STATUS_STYLES[passengerStatusLabel(p.statusDb)] || 'text-gray-500 text-[11px] font-bold uppercase'}>
                                            {passengerStatusLabel(p.statusDb).toUpperCase()}
                                        </span>
                                    </td>

                                    {/* Actions ⋮ */}
                                    <td className="px-4 py-4">
                                        <div className="relative flex justify-end">
                                            <button
                                                type="button"
                                                data-passenger-action-trigger
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isSavingStatus) return;
                                                    if (openMenu?.passengerId === p.id) {
                                                        setOpenMenu(null);
                                                        return;
                                                    }
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const width = 144;
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    const openUp = spaceBelow < PASSENGER_ACTION_MENU_H + 16;
                                                    const top = openUp
                                                        ? rect.top - PASSENGER_ACTION_MENU_H - 4
                                                        : rect.bottom + 4;
                                                    setOpenMenu({
                                                        passengerId: p.id,
                                                        top,
                                                        left: Math.max(8, rect.right - width),
                                                    });
                                                }}
                                                className={`p-1.5 rounded-lg text-gray-500 transition-colors ${isSavingStatus ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                            >
                                                <MdMoreVert size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="10" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        {loadError || 'No passengers found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Footer / Pagination ── */}
                <div className="px-4 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3">
                    {/* Rows per page */}
                    <div className="flex items-center gap-2 text-[13px] text-gray-500">
                        <span>Rows per page:</span>
                        <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 text-[13px]">
                            {rowsPerPage}
                            <MdKeyboardArrowDown size={16} className="text-gray-400 ml-0.5" />
                        </div>
                    </div>

                    {/* Page info + nav */}
                    <div className="flex items-center gap-2 text-[13px] text-gray-500">
                        <span>
                            {filtered.length === 0
                                ? '0 of 0 passengers'
                                : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, filtered.length)} of ${filtered.length} passengers`}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-40"
                            disabled={currentPage === 1}
                        >
                            <MdChevronLeft size={18} />
                        </button>
                        <span className="text-[12px] font-medium text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-40"
                            disabled={currentPage === totalPages || filtered.length === 0}
                        >
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {openMenu &&
                passengerMenuActions.length > 0 &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-100 w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-0.5"
                        style={{ top: openMenu.top, left: openMenu.left }}
                        role="menu"
                    >
                        {passengerMenuActions.map((action) => (
                            <button
                                key={action}
                                type="button"
                                role="menuitem"
                                disabled={isSavingStatus}
                                onClick={() => handlePassengerStatusAction(action, openMenu.passengerId)}
                                className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                                    ${action === 'Approve' ? 'text-green-600 hover:bg-green-50' : ''}
                                    ${action === 'Reject' ? 'text-red-600 hover:bg-red-50' : ''}
                                    ${action === 'Suspend' ? 'text-orange-600 hover:bg-orange-50' : ''}
                                    ${action === 'Active' ? 'text-blue-600 hover:bg-blue-50' : ''}
                                `}
                            >
                                {action}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default PassengersPage;
