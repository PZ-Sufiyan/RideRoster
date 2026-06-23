import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    MdSearch,
    MdAdd,
    MdMoreVert,
    MdChevronLeft,
    MdChevronRight,
    MdCheckBoxOutlineBlank,
    MdCheckBox,
    MdKeyboardArrowDown,
} from 'react-icons/md';
import {
    updateDriver,
    driverStatusFromAction,
} from '../../../../../services/driverVehicleService';
import { useDriversList } from '../../../../../hooks/useDriversList';
import { ShimmerBlock } from '../../../../../utils/Shimmer';

const STATUS_COLORS = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-blue-50 text-blue-700 border border-blue-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
    suspended: 'bg-orange-50 text-orange-700 border border-orange-200',
};

function statusPillClass(statusRaw) {
    const s = (statusRaw || '').trim();
    if (!s) return 'bg-gray-100 text-gray-600';
    const key = Object.keys(STATUS_COLORS).find((k) => k.toLowerCase() === s.toLowerCase());
    return key ? STATUS_COLORS[key] : 'bg-gray-100 text-gray-600';
}

function formatStatusLabel(raw) {
    const s = (raw || '').trim();
    if (!s) return '—';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const ITEMS_PER_PAGE = 5;

const DRIVER_ACTION_MENU_H = 188;
const DRIVER_BULK_ACTIONS = ['Approve', 'Reject', 'Suspend'];

function getDriverRowActions(rawStatus) {
    const s = (rawStatus || '').trim().toLowerCase();
    return ['Approve', 'Reject', 'Suspend'].filter((action) => {
        if (action === 'Approve' && s === 'approved') return false;
        if (action === 'Reject' && s === 'rejected') return false;
        if (action === 'Suspend' && s === 'suspended') return false;
        return true;
    });
}

function formatUsPhone(phone) {
    if (!phone || typeof phone !== 'string') return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
        return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone.trim() || '—';
}

function formatDateAdded(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toISOString().slice(0, 10);
}

function driverDisplayName(d) {
    const n = [d.first_name, d.last_name].filter(Boolean).join(' ').trim();
    return n || '—';
}

function avatarUrlForDriver(d) {
    const name = driverDisplayName(d);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f3f4f6&color=374151&size=64`;
}

const DriversPage = () => {
    const navigate = useNavigate();
    const { drivers, loading, error: loadError, reload, setDrivers } = useDriversList();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedRows, setSelectedRows] = useState([]);
    /** Fixed-position menu (portal) so it is not clipped by table overflow */
    const [openMenu, setOpenMenu] = useState(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [actionError, setActionError] = useState(null);
    const [actionBusyId, setActionBusyId] = useState(null);
    const menuRef = useRef(null);
    const statusRef = useRef(null);
    const bulkRef = useRef(null);

    const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Suspended'];

    // Close menus on outside click (portal menu is outside the table DOM)
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current?.contains(e.target)) return;
            for (const el of document.querySelectorAll('[data-driver-action-trigger]')) {
                if (el.contains(e.target)) return;
            }
            setOpenMenu(null);
            if (statusRef.current && !statusRef.current.contains(e.target)) {
                setIsStatusDropdownOpen(false);
            }
            if (bulkRef.current && !bulkRef.current.contains(e.target)) {
                setIsBulkOpen(false);
            }
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

    // Filter logic
    const filtered = drivers.filter((d) => {
        const name = driverDisplayName(d).toLowerCase();
        const q = search.trim().toLowerCase();
        const matchSearch =
            !q ||
            name.includes(q) ||
            (d.phone || '').toLowerCase().includes(q) ||
            (d.license_no || '').toLowerCase().includes(q) ||
            (d.id || '').toLowerCase().includes(q);
        const st = (d.status || '').trim();
        const matchStatus =
            statusFilter === 'All' ||
            st.toLowerCase() === statusFilter.toLowerCase();
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleActionMenu = (e, driverId) => {
        e.stopPropagation();
        if (openMenu?.driverId === driverId) {
            setOpenMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const width = 144;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < DRIVER_ACTION_MENU_H + 16;
        const top = openUp ? rect.top - DRIVER_ACTION_MENU_H - 4 : rect.bottom + 4;
        setOpenMenu({
            driverId,
            top,
            left: Math.max(8, rect.right - width),
        });
    };

    const handleStatusChange = async (action, driverId) => {
        const nextStatus = driverStatusFromAction(action);
        if (!nextStatus) return;
        setActionBusyId(driverId);
        try {
            const updated = await updateDriver(driverId, { status: nextStatus });
            setDrivers((prev) => prev.map((row) => (row.id === driverId ? { ...row, ...updated } : row)));
        } catch (e) {
            setActionError(e?.message || 'Could not update status.');
        } finally {
            setActionBusyId(null);
            setOpenMenu(null);
        }
    };

    const handleBulkAction = async (action) => {
        const nextStatus = driverStatusFromAction(action);
        if (!nextStatus || selectedRows.length === 0) {
            setIsBulkOpen(false);
            return;
        }
        setActionBusyId('bulk');
        try {
            await Promise.all(selectedRows.map((driverId) => updateDriver(driverId, { status: nextStatus })));
            setDrivers((prev) =>
                prev.map((row) =>
                    selectedRows.includes(row.id) ? { ...row, status: nextStatus } : row
                )
            );
            setSelectedRows([]);
            setIsBulkOpen(false);
        } catch (e) {
            setActionError(e?.message || 'Could not update selected drivers.');
        } finally {
            setActionBusyId(null);
        }
    };

    const toggleRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const pageIds = paginated.map((d) => d.id);
        const allSelected = pageIds.every((id) => selectedRows.includes(id));
        setSelectedRows((prev) =>
            allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
        );
    };

    const allPageSelected = paginated.length > 0 && paginated.every((d) => selectedRows.includes(d.id));

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setSelectedRows([]);
            setIsBulkOpen(false);
        }
    };

    // Page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const menuDriver = openMenu ? drivers.find((d) => d.id === openMenu.driverId) : null;
    const driverMenuActions = menuDriver ? getDriverRowActions(menuDriver.status) : [];
    const shimmerRows = Array.from({ length: 5 });

    return (
        <div className="space-y-5">
            {(loadError || actionError) && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
                    <span>{loadError || actionError}</span>
                    <button
                        type="button"
                        onClick={() => { setActionError(null); reload(); }}
                        className="shrink-0 text-red-700 font-medium hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all drivers in your company.</p>
                </div>
                <button
                    onClick={() => navigate('/portal/users/drivers/add')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm shrink-0"
                >
                    <MdAdd size={18} />
                    Add New Driver
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-visible">
                <div className="border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdSearch className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or phone"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-56"
                                />
                            </div>

                            <div className="relative" ref={statusRef}>
                                <button
                                    onClick={() => setIsStatusDropdownOpen((o) => !o)}
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                                >
                                    {statusFilter}
                                    <MdKeyboardArrowDown className="text-gray-400" size={16} />
                                </button>
                                {isStatusDropdownOpen && (
                                    <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                        {statuses.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => { setStatusFilter(s); setIsStatusDropdownOpen(false); setCurrentPage(1); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative" ref={bulkRef}>
                            <button
                                type="button"
                                onClick={() => selectedRows.length > 0 && actionBusyId !== 'bulk' && setIsBulkOpen((o) => !o)}
                                disabled={selectedRows.length === 0 || actionBusyId === 'bulk'}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                                    selectedRows.length === 0 || actionBusyId === 'bulk'
                                        ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                        : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                Bulk Actions
                                <MdKeyboardArrowDown size={16} className="text-gray-400" />
                            </button>
                            {isBulkOpen && (
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-40 py-1">
                                    {DRIVER_BULK_ACTIONS.map((action) => (
                                        <button
                                            key={action}
                                            type="button"
                                            onClick={() => handleBulkAction(action)}
                                            disabled={actionBusyId === 'bulk'}
                                            className={`block w-full text-left px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
                                                action === 'Approve' ? 'text-green-700 hover:bg-green-50' : ''
                                            } ${
                                                action === 'Reject' ? 'text-red-700 hover:bg-red-50' : ''
                                            } ${
                                                action === 'Suspend' ? 'text-orange-700 hover:bg-orange-50' : ''
                                            }`}
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleAll}>
                                        {allPageSelected ? (
                                            <MdCheckBox className="text-blue-600 w-5 h-5" />
                                        ) : (
                                            <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver Name</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">License No.</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Added</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={loading} aria-label={loading ? 'Loading drivers' : undefined}>
                            {loading ? (
                                shimmerRows.map((_, index) => (
                                        <tr key={`driver-skeleton-${index}`}>
                                            <td className="px-4 py-3.5">
                                                <ShimmerBlock className="w-5 h-5 rounded" rounded="rounded" />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <ShimmerBlock className="h-3.5 w-36 rounded-md" />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <ShimmerBlock className="w-9 h-9 shrink-0" rounded="rounded-full" />
                                                    <div className="space-y-2 min-w-0">
                                                        <ShimmerBlock className="h-3.5 w-28 max-w-full rounded-md" />
                                                        <ShimmerBlock className="h-3 w-20 rounded-md" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <ShimmerBlock className="h-6 w-20 rounded-full" rounded="rounded-full" />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <ShimmerBlock className="ml-auto h-8 w-8 rounded-lg" />
                                            </td>
                                        </tr>
                                ))
                            ) : paginated.length > 0 ? paginated.map((driver) => {
                                const displayName = driverDisplayName(driver);
                                const statusLabel = formatStatusLabel(driver.status);
                                return (
                                <tr key={driver.id} className="hover:bg-gray-50/60 transition-colors">
                                    {/* Checkbox */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center cursor-pointer" onClick={() => toggleRow(driver.id)}>
                                            {selectedRows.includes(driver.id) ? (
                                                <MdCheckBox className="text-blue-600 w-5 h-5" />
                                            ) : (
                                                <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                            )}
                                        </div>
                                    </td>
                                    {/* Name + Avatar */}
                                    <td className="px-4 py-3.5">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => navigate(`/portal/users/drivers/${driver.id}`)}
                                        >
                                            <img
                                                src={avatarUrlForDriver(driver)}
                                                alt=""
                                                className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0"
                                            />
                                            <span className="font-medium text-gray-900 whitespace-nowrap group-hover:text-blue-600 transition-colors">{displayName}</span>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatUsPhone(driver.phone)}</td>

                                    {/* License */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap font-mono text-xs">{driver.license_no || '—'}</td>

                                    {/* Status Badge */}
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusPillClass(driver.status)}`}>
                                            {statusLabel}
                                        </span>
                                    </td>

                                    {/* Date Added */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDateAdded(driver.created_at)}</td>

                                    {/* Actions */}
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="relative flex justify-end">
                                            <button
                                                type="button"
                                                data-driver-action-trigger
                                                onClick={(e) => toggleActionMenu(e, driver.id)}
                                                disabled={actionBusyId === driver.id}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                                            >
                                                <MdMoreVert size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        No drivers found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-4 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of{' '}
                        <span className="font-medium text-gray-900">{filtered.length}</span> results
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={18} />
                        </button>

                        {getPageNumbers().map((page, i) =>
                            page === '...' ? (
                                <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`min-w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors border
                                        ${currentPage === page
                                            ? 'bg-[#005580] text-white border-[#005580] shadow-sm'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {openMenu &&
                driverMenuActions.length > 0 &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-100 w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-0.5"
                        style={{ top: openMenu.top, left: openMenu.left }}
                        role="menu"
                    >
                        {driverMenuActions.map((action) => (
                            <button
                                key={action}
                                type="button"
                                role="menuitem"
                                onClick={() => handleStatusChange(action, openMenu.driverId)}
                                disabled={actionBusyId === openMenu.driverId}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 disabled:opacity-50
                                    ${action === 'Approve' ? 'text-green-600 hover:bg-green-50' : ''}
                                    ${action === 'Reject' ? 'text-red-600 hover:bg-red-50' : ''}
                                    ${action === 'Suspend' ? 'text-orange-600 hover:bg-orange-50' : ''}
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

export default DriversPage;
