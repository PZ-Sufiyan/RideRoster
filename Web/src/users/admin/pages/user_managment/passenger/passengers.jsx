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
    MdAccessible,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { getPassengers, updatePassenger } from '../../../../../services/passengerService';
import { ShimmerBlock } from '../../../../../utils/Shimmer';

const STATUS_STYLES = {
    Active:   'text-blue-600 font-bold text-[11px] uppercase tracking-wide',
    Inactive: 'text-orange-600 font-bold text-[11px] uppercase tracking-wide',
};

const PASSENGER_ACTION_MENU_H = 188;
const PASSENGER_MENU_ACTIONS  = ['Inactive', 'Active'];
const ROWS_OPTIONS             = [10, 20, 50, 100];

function normalizePassengerStatus(raw) {
    if (raw == null || raw === '') return 'pending';
    const s = String(raw).trim().toLowerCase();
    return s;
}

function passengerStatusLabel(dbStatus) {
    const s = normalizePassengerStatus(dbStatus);
    const labels = { inactive: 'Inactive', active: 'Active' };
    return labels[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending');
}

function actionToPassengerDbStatus(action) {
    return { Inactive: 'inactive', Active: 'active' }[action] ?? null;
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

/* ── Dropdown — only one open at a time via `openKey` ── */
const Dropdown = ({ label, options, value, dropdownKey, openKey, setOpenKey, onChange }) => {
    const isOpen = openKey === dropdownKey;
    return (
        <div className="relative">
            <button
                onClick={() => setOpenKey(isOpen ? null : dropdownKey)}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
                {label && <span>{label}:</span>}
                <span className="font-medium">{value}</span>
                <MdKeyboardArrowDown className="text-gray-400 ml-0.5" size={16} />
            </button>
            {isOpen && (
                <div className="absolute left-0 top-full mt-1 min-w-[120px] bg-white border border-gray-100 rounded-lg shadow-lg z-30">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpenKey(null); }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                value === opt ? 'font-semibold text-[#004D6D]' : 'text-gray-700'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Component ── */
const PassengersPage = () => {
    const navigate = useNavigate();

    const [passengers,       setPassengers]       = useState([]);
    const [search,           setSearch]           = useState('');
    const [wcFilter,         setWcFilter]         = useState('All');
    const [statusFilter,     setStatusFilter]     = useState('All');
    const [selectedRows,     setSelectedRows]     = useState([]);
    const [openMenu,         setOpenMenu]         = useState(null);
    const [rowsPerPage,      setRowsPerPage]      = useState(10);
    const [currentPage,      setCurrentPage]      = useState(1);

    // Single key controls which dropdown is open — null = all closed
    const [openDropdownKey,  setOpenDropdownKey]  = useState(null);

    const [isLoading,        setIsLoading]        = useState(true);
    const [loadError,        setLoadError]        = useState('');
    const [statusUpdateError,setStatusUpdateError]= useState('');
    const [isSavingStatus,   setIsSavingStatus]   = useState(false);

    const menuRef = useRef(null);

    /* ── Load passengers ── */
    useEffect(() => {
        const loadPassengers = async () => {
            setIsLoading(true);
            setLoadError('');
            setStatusUpdateError('');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;
                if (!userId) throw new Error('Not authenticated.');
                const admin = await getCompanyAdminById(userId);
                if (!admin?.company_id) throw new Error('No company linked to your account.');
                const rows = await getPassengers({ companyId: admin.company_id });
                setPassengers((rows || []).map((row) => ({
                    id:              row.id,
                    passengerId:     row.id,
                    name:            `${row.first_name || ''} ${row.surname || ''}`.trim() || 'N/A',
                    avatar:          `https://i.pravatar.cc/150?u=${row.id}`,
                    contact:         row.contact_number_1 || '-',
                    pickupPostcode:  row.primary_pickup_postcode ?? row.pickup_postal_code  ?? '-',
                    pickupAddress:   row.primary_pickup_address  ?? row.pickup_address       ?? '-',
                    dropoffPostcode: row.educational_site_postcode ?? row.dropoff_postal_code ?? '-',
                    dropoffAddress:  row.educational_site_address  ?? row.dropoff_address     ?? '-',
                    time:            formatTime12h(row.primary_pickup_time ?? row.pickup_time),
                    wheelchair:      Boolean(row.wheelchair_required),
                    statusDb:        normalizePassengerStatus(row.status),
                })));
            } catch (err) {
                setLoadError(err?.message || 'Failed to load passengers.');
                setPassengers([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadPassengers();
    }, []);

    /* ── Close action menu on outside click / scroll / resize ── */
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

    /* ── Close dropdowns on outside click ── */
    useEffect(() => {
        if (!openDropdownKey) return;
        const handler = (e) => {
            // If the click is inside any dropdown or its trigger, ignore
            if (e.target.closest('[data-dropdown-root]')) return;
            setOpenDropdownKey(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [openDropdownKey]);

    /* ── Filtering ── */
    const filtered = passengers.filter((p) => {
        const q = search.toLowerCase();
        const matchSearch =
            p.name.toLowerCase().includes(q) ||
            p.pickupPostcode.toLowerCase().includes(q) ||
            p.dropoffPostcode.toLowerCase().includes(q);
        const matchWc =
            wcFilter === 'All' ||
            (wcFilter === 'Yes' && p.wheelchair) ||
            (wcFilter === 'No' && !p.wheelchair);
        const matchStatus =
            statusFilter === 'All' || passengerStatusLabel(p.statusDb) === statusFilter;
        return matchSearch && matchWc && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    /* ── Selection ── */
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

    const allSel      = paginated.length > 0 && paginated.every((p) => selectedRows.includes(p.id));
    const shimmerRows = Array.from({ length: 6 });

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        setSelectedRows([]);
        setOpenMenu(null);
    };

    const handleRowsPerPageChange = (n) => {
        setRowsPerPage(n);
        setCurrentPage(1);
        setSelectedRows([]);
        setOpenDropdownKey(null);
    };

    /* ── Status action ── */
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
                setStatusUpdateError(err?.message || 'Failed to update status.');
            })
            .finally(() => setIsSavingStatus(false));
    };

    const menuPassenger      = openMenu ? passengers.find((x) => x.id === openMenu.passengerId) : null;
    const passengerMenuActions = menuPassenger ? PASSENGER_MENU_ACTIONS : [];

    const handleReset = () => {
        setSearch('');
        setWcFilter('All');
        setStatusFilter('All');
        setCurrentPage(1);
        setSelectedRows([]);
        setOpenDropdownKey(null);
    };

    /* ── Shared props factory for filter dropdowns ── */
    const dropdownProps = (key, label, options, value, onChange) => ({
        label,
        options,
        value,
        dropdownKey: key,
        openKey:     openDropdownKey,
        setOpenKey:  setOpenDropdownKey,
        onChange,
    });

    return (
        <div className="space-y-5" data-dropdown-root>

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900">Passengers</h1>
                    <p className="text-[13px] text-gray-400 mt-0.5">Manage registered passengers</p>
                </div>
                <button
                    onClick={() => navigate('/admin/users/passengers/add')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                >
                    <MdAdd size={18} />
                    Add Passenger
                </button>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm" data-dropdown-root>
                <div className="relative flex-1 min-w-[220px]">
                    <MdSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Name or Post Code..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-3 py-2 text-[13px] text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                    />
                </div>

                <Dropdown {...dropdownProps('wc',     'Wheelchair', ['All', 'Yes', 'No'],             wcFilter,     setWcFilter)} />
                <Dropdown {...dropdownProps('status', 'Status',     ['All', 'Active', 'Inactive'],     statusFilter, setStatusFilter)} />

                <button
                    onClick={handleReset}
                    className="text-[13px] font-semibold text-[#004D6D] hover:underline underline-offset-2 transition-all whitespace-nowrap"
                >
                    Reset Filters
                </button>
            </div>

            {/* ── Bulk Action Bar ── */}
            {selectedRows.length > 0 && (
                <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 px-4 py-2.5 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="cursor-pointer" onClick={toggleAll}>
                            {allSel
                                ? <MdCheckBox className="text-[#004D6D] w-5 h-5" />
                                : <MdCheckBoxOutlineBlank className="text-gray-400 w-5 h-5" />}
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
                                        selectedRows.includes(p.id) ? { ...p, statusDb: 'inactive' } : p
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
                                            : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
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
                        <tbody className="divide-y divide-gray-50" aria-busy={isLoading}>
                            {isLoading ? shimmerRows.map((_, i) => (
                                <tr key={`passenger-skeleton-${i}`}>
                                    <td className="px-4 py-4"><ShimmerBlock className="w-5 h-5 rounded" rounded="rounded" /></td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <ShimmerBlock className="w-8 h-8 shrink-0" rounded="rounded-full" />
                                            <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4"><ShimmerBlock className="h-3.5 w-24 rounded-md" /></td>
                                    <td className="px-4 py-4"><div className="space-y-2"><ShimmerBlock className="h-3.5 w-20 rounded-md" /><ShimmerBlock className="h-3 w-32 rounded-md" /></div></td>
                                    <td className="px-4 py-4"><ShimmerBlock className="h-3.5 w-16 rounded-md" /></td>
                                    <td className="px-4 py-4"><ShimmerBlock className="h-5 w-5 rounded" rounded="rounded" /></td>
                                    <td className="px-4 py-4"><div className="space-y-2"><ShimmerBlock className="h-3.5 w-20 rounded-md" /><ShimmerBlock className="h-3 w-32 rounded-md" /></div></td>
                                    <td className="px-4 py-4"><ShimmerBlock className="h-6 w-16 rounded-full" rounded="rounded-full" /></td>
                                    <td className="px-4 py-4 text-right"><ShimmerBlock className="ml-auto h-8 w-8 rounded-lg" /></td>
                                </tr>
                            )) : paginated.length > 0 ? paginated.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">

                                    {/* Checkbox */}
                                    <td className="px-4 py-4">
                                        <div className="cursor-pointer" onClick={() => toggleRow(p.id)}>
                                            {selectedRows.includes(p.id)
                                                ? <MdCheckBox className="text-[#004D6D] w-5 h-5" />
                                                : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
                                        </div>
                                    </td>

                                    {/* Name */}
                                    <td className="px-4 py-4">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => navigate(`/admin/users/passengers/${p.id}`)}
                                        >
                                            <img src={p.avatar} alt={p.name}
                                                className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0" />
                                            <span className="font-medium text-gray-900 whitespace-nowrap group-hover:text-[#004D6D] transition-colors">
                                                {p.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{p.contact}</td>

                                    {/* Pickup */}
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
                                            : <span className="text-gray-400 font-bold text-base">—</span>}
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
                                                    if (openMenu?.passengerId === p.id) { setOpenMenu(null); return; }
                                                    const rect  = e.currentTarget.getBoundingClientRect();
                                                    const width = 144;
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    const openUp = spaceBelow < PASSENGER_ACTION_MENU_H + 16;
                                                    setOpenMenu({
                                                        passengerId: p.id,
                                                        top:  openUp ? rect.top - PASSENGER_ACTION_MENU_H - 4 : rect.bottom + 4,
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
                                    <td colSpan="9" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        {loadError || 'No passengers found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Footer / Pagination ── */}
                <div className="px-4 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap" data-dropdown-root>
                    {/* Rows per page */}
                    <div className="flex items-center gap-2 text-[13px] text-gray-500">
                        <span>Rows per page:</span>
                        <Dropdown
                            {...dropdownProps(
                                'rowsPerPage', '', ROWS_OPTIONS.map(String),
                                String(rowsPerPage),
                                (val) => handleRowsPerPageChange(Number(val))
                            )}
                        />
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-2 text-[13px] text-gray-500">
                        <span>
                            {filtered.length === 0
                                ? '0 of 0 passengers'
                                : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, filtered.length)} of ${filtered.length} passengers`}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-40"
                        >
                            <MdChevronLeft size={18} />
                        </button>
                        <span className="text-[12px] font-medium text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || filtered.length === 0}
                            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-40"
                        >
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Action portal menu ── */}
            {openMenu && passengerMenuActions.length > 0 && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[100] w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-0.5"
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
                                ${action === 'Inactive' ? 'text-red-600 hover:bg-red-50'  : ''}
                                ${action === 'Active'   ? 'text-blue-600 hover:bg-blue-50' : ''}
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