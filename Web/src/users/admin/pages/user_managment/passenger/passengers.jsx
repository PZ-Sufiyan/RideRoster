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

/* ── Static data ─────────────────────────────────────────── */
const allPassengers = [
    {
        id: 1,
        name: 'Sarah Jenkins',
        avatar: 'https://i.pravatar.cc/150?u=sarah-jenkins',
        contact: '07700 900123',
        postcode: 'NW1 5BT',
        school: "St. Mary's Primary",
        time: '08:15 AM',
        wheelchair: true,
        route: 'Route A-12',
        status: 'Active',
    },
    {
        id: 2,
        name: 'James Wilson',
        avatar: 'https://i.pravatar.cc/150?u=james-wilson',
        contact: '07700 900456',
        postcode: 'SE1 2TY',
        school: 'Bridge Academy',
        time: '07:45 AM',
        wheelchair: false,
        route: 'Route B-04',
        status: 'Active',
    },
    {
        id: 3,
        name: 'Emily Davis',
        avatar: 'https://i.pravatar.cc/150?u=emily-davis',
        contact: '07700 900789',
        postcode: 'E1 6AN',
        school: 'Central High',
        time: '08:30 AM',
        wheelchair: false,
        route: null, // Unassigned
        status: 'Pending',
    },
    {
        id: 4,
        name: 'Thomas Brown',
        avatar: 'https://i.pravatar.cc/150?u=thomas-brown',
        contact: '07700 900111',
        postcode: 'SW4 0AL',
        school: 'Green Valley',
        time: '08:00 AM',
        wheelchair: true,
        route: 'Route C-21',
        status: 'Inactive',
    },
];

const STATUS_STYLES = {
    Active:   'text-green-600 font-bold text-[11px] uppercase tracking-wide',
    Pending:  'text-yellow-500 font-bold text-[11px] uppercase tracking-wide',
    Inactive: 'text-gray-400 font-bold text-[11px] uppercase tracking-wide',
    Suspended: 'text-orange-600 font-bold text-[11px] uppercase tracking-wide',
};

const PASSENGER_ACTION_MENU_H = 188;

function getPassengerRowActions(currentStatus) {
    const s = (currentStatus || '').trim();
    return ['Approve', 'Reject', 'Suspend', 'Active'].filter((action) => {
        if (s === 'Active' && (action === 'Active' || action === 'Approve')) return false;
        if (s === 'Inactive' && action === 'Reject') return false;
        if (s === 'Suspended' && action === 'Suspend') return false;
        return true;
    });
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
            <div className="absolute left-0 top-full mt-1 min-w-[120px] bg-white border border-gray-100 rounded-lg shadow-lg z-30">
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

    const [passengers, setPassengers]       = useState(allPassengers);
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

    const menuRef = useRef(null);

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
            p.postcode.toLowerCase().includes(search.toLowerCase());
        const matchPickup =
            pickupFilter === 'All Pickups' || pickupSlot(p.time) === pickupFilter;
        const matchWc =
            wcFilter === 'All' ||
            (wcFilter === 'Yes' && p.wheelchair) ||
            (wcFilter === 'No' && !p.wheelchair);
        const matchStatus =
            statusFilter === 'All' || p.status === statusFilter;
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

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        setSelectedRows([]);
        setOpenMenu(null);
    };

    const handlePassengerStatusAction = (action, passengerId) => {
        const statusMap = { Approve: 'Active', Reject: 'Inactive', Suspend: 'Suspended', Active: 'Active' };
        const next = statusMap[action];
        if (!next) return;
        setPassengers((prev) =>
            prev.map((row) => (row.id === passengerId ? { ...row, status: next } : row))
        );
        setOpenMenu(null);
    };

    const menuPassenger = openMenu ? passengers.find((x) => x.id === openMenu.passengerId) : null;
    const passengerMenuActions = menuPassenger ? getPassengerRowActions(menuPassenger.status) : [];

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
                    options={['All', 'Active', 'Pending', 'Inactive', 'Suspended']}
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
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pickup/Drop-off</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">W/C</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pickup/Drop-off</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.length > 0 ? paginated.map((p) => (
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
                                        <div className="font-medium text-gray-800">{p.postcode}</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5">{p.school}</div>
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

                                    {/* Route */}
                                    <td className="px-4 py-4">
                                        {p.route
                                            ? <span className="text-gray-700 font-medium">{p.route}</span>
                                            : <span className="text-gray-400 italic">Unassigned</span>
                                        }
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-4">
                                        <span className={STATUS_STYLES[p.status] || 'text-gray-500 text-[11px] font-bold uppercase'}>
                                            {p.status.toUpperCase()}
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
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                            >
                                                <MdMoreVert size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        No passengers found.
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
                        className="fixed z-[100] w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-0.5"
                        style={{ top: openMenu.top, left: openMenu.left }}
                        role="menu"
                    >
                        {passengerMenuActions.map((action) => (
                            <button
                                key={action}
                                type="button"
                                role="menuitem"
                                onClick={() => handlePassengerStatusAction(action, openMenu.passengerId)}
                                className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50
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
