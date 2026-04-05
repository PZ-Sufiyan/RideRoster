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
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import {
    getPassengerAssistants,
    updatePassengerAssistant,
} from '../../../../../services/passengerAsssistantService';
import { ShimmerBlock } from '../../../../../utils/Shimmer';

/** DB `passenger_assistant.status` values (lowercase) */
const PA_STATUS_DB = {
    PENDING: 'pending',
    APPROVE: 'approve',
    REJECT: 'reject',
    SUSPEND: 'suspend',
    ACTIVE: 'active',
};

function normalizePaStatus(raw) {
    if (raw == null || raw === '') return PA_STATUS_DB.PENDING;
    const s = String(raw).trim().toLowerCase();
    if (['pending', 'approve', 'reject', 'suspend', 'active'].includes(s)) return s;
    if (s === 'approved') return PA_STATUS_DB.APPROVE;
    if (s === 'rejected') return PA_STATUS_DB.REJECT;
    if (s === 'suspended') return PA_STATUS_DB.SUSPEND;
    return s;
}

function paStatusLabel(dbStatus) {
    const s = normalizePaStatus(dbStatus);
    const labels = {
        [PA_STATUS_DB.PENDING]: 'Pending',
        [PA_STATUS_DB.APPROVE]: 'Approved',
        [PA_STATUS_DB.REJECT]: 'Rejected',
        [PA_STATUS_DB.SUSPEND]: 'Suspended',
        [PA_STATUS_DB.ACTIVE]: 'Active',
    };
    return labels[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending');
}

const STATUS_COLORS = {
    Pending: 'bg-amber-50 text-amber-800 border border-amber-200',
    Approved: 'bg-green-50 text-green-700 border border-green-200',
    Rejected: 'bg-gray-100 text-gray-600 border border-gray-200',
    Suspended: 'bg-red-50 text-red-600 border border-red-200',
    Active: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const ITEMS_PER_PAGE = 10;

const PA_ACTION_MENU_H = 188;

const PA_MENU_ACTIONS = ['Approve', 'Reject', 'Suspend', 'Active'];

function actionToDbStatus(action) {
    const map = {
        Approve: PA_STATUS_DB.APPROVE,
        Reject: PA_STATUS_DB.REJECT,
        Suspend: PA_STATUS_DB.SUSPEND,
        Active: PA_STATUS_DB.ACTIVE,
    };
    return map[action] ?? null;
}

// ─── Component ────────────────────────────────────────────────
const PAListPage = () => {
    const navigate = useNavigate();
    const [pas, setPas] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [selectedRows, setSelectedRows] = useState([]);
    const [openMenu, setOpenMenu] = useState(null);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [statusUpdateError, setStatusUpdateError] = useState('');
    const [isSavingStatus, setIsSavingStatus] = useState(false);

    const menuRef = useRef(null);
    const statusRef = useRef(null);
    const bulkRef = useRef(null);

    const statuses = ['All Statuses', 'Pending', 'Approved', 'Rejected', 'Suspended', 'Active'];

    useEffect(() => {
        const loadPassengerAssistants = async () => {
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

                const rows = await getPassengerAssistants({ companyId: admin.company_id });
                const mapped = (rows || []).map((row) => ({
                    id: row.id,
                    paId: row.id,
                    name: `${row.first_name || ''} ${row.surname || ''}`.trim() || 'N/A',
                    avatar: row.profile_picture_url || `https://i.pravatar.cc/64?u=${row.id}`,
                    email: row.email || '-',
                    phone: row.phone || '-',
                    assignedJobs: 0,
                    statusDb: normalizePaStatus(row.status),
                    dateAdded: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '-',
                }));
                setPas(mapped);
            } catch (err) {
                console.error('Failed loading passenger assistants:', err);
                setLoadError(err?.message || 'Failed to load passenger assistants.');
                setPas([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadPassengerAssistants();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current?.contains(e.target)) return;
            for (const el of document.querySelectorAll('[data-pa-action-trigger]')) {
                if (el.contains(e.target)) return;
            }
            setOpenMenu(null);
            if (statusRef.current && !statusRef.current.contains(e.target)) setIsStatusOpen(false);
            if (bulkRef.current && !bulkRef.current.contains(e.target)) setIsBulkOpen(false);
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

    // Filter
    const filtered = pas.filter((p) => {
        const q = search.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.phone.toLowerCase().includes(q) ||
            p.paId.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'All Statuses' || paStatusLabel(p.statusDb) === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const handleAction = async (action, paId) => {
        const nextDb = actionToDbStatus(action);
        if (!nextDb) return;
        setStatusUpdateError('');
        setIsSavingStatus(true);
        try {
            await updatePassengerAssistant(paId, { status: nextDb });
            setPas((prev) => prev.map((p) => (p.id === paId ? { ...p, statusDb: nextDb } : p)));
            setOpenMenu(null);
        } catch (err) {
            console.error('Failed to update PA status:', err);
            setStatusUpdateError(err?.message || 'Failed to update status.');
        } finally {
            setIsSavingStatus(false);
        }
    };

    const handleBulkAction = async (action) => {
        const nextDb = actionToDbStatus(action);
        if (!nextDb || selectedRows.length === 0) {
            setIsBulkOpen(false);
            return;
        }
        setStatusUpdateError('');
        setIsSavingStatus(true);
        try {
            await Promise.all(selectedRows.map((id) => updatePassengerAssistant(id, { status: nextDb })));
            setPas((prev) =>
                prev.map((p) => (selectedRows.includes(p.id) ? { ...p, statusDb: nextDb } : p))
            );
            setSelectedRows([]);
            setIsBulkOpen(false);
        } catch (err) {
            console.error('Failed bulk PA status update:', err);
            setStatusUpdateError(err?.message || 'Failed to update status.');
        } finally {
            setIsSavingStatus(false);
        }
    };

    const menuPa = openMenu ? pas.find((p) => p.id === openMenu.paId) : null;
    const paMenuActions = menuPa ? PA_MENU_ACTIONS : [];
    const shimmerRows = Array.from({ length: 5 });

    const toggleRow = (id) => setSelectedRows((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
    const toggleAll = () => {
        const pageIds = paginated.map((p) => p.id);
        const allSelected = pageIds.every((id) => selectedRows.includes(id));
        setSelectedRows((prev) =>
            allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
        );
    };
    const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedRows.includes(p.id));

    const handlePage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setSelectedRows([]);
            setIsBulkOpen(false);
        }
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [1, 2, 3];
        if (currentPage > 4) pages.push('...');
        if (currentPage > 3 && currentPage < totalPages - 1) pages.push(currentPage);
        if (!pages.includes(totalPages)) pages.push(totalPages);
        return [...new Set(pages)];
    };

    const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

    return (
        <div className="space-y-5">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Passenger Assistants</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all passenger assistants in your company.</p>
                </div>
                <button
                    onClick={() => navigate('/admin/users/pa/add')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm shrink-0"
                >
                    <MdAdd size={18} />
                    Add New PA
                </button>
            </div>

            {/* ── Card ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-visible">

                {/* Toolbar */}
                <div className="border-b border-gray-100">
                    {statusUpdateError && (
                        <div className="mx-4 mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {statusUpdateError}
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MdSearch className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or email"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-56"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative" ref={statusRef}>
                            <button
                                onClick={() => setIsStatusOpen((o) => !o)}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                {statusFilter}
                                <MdKeyboardArrowDown size={16} className="text-gray-400" />
                            </button>
                            {isStatusOpen && (
                                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                    {statuses.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setStatusFilter(s); setIsStatusOpen(false); setCurrentPage(1); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative" ref={bulkRef}>
                            <button
                                type="button"
                                onClick={() => selectedRows.length > 0 && !isSavingStatus && setIsBulkOpen((o) => !o)}
                                disabled={selectedRows.length === 0 || isSavingStatus}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                                    selectedRows.length === 0 || isSavingStatus
                                        ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                        : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                Bulk Actions
                                <MdKeyboardArrowDown size={16} className="text-gray-400" />
                            </button>
                            {isBulkOpen && (
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-40 py-1">
                                    {PA_MENU_ACTIONS.map((action) => (
                                        <button
                                            key={action}
                                            type="button"
                                            onClick={() => handleBulkAction(action)}
                                            disabled={isSavingStatus}
                                            className={`block w-full text-left px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
                                                action === 'Approve' ? 'text-green-700 hover:bg-green-50' : ''
                                            } ${
                                                action === 'Reject' ? 'text-red-700 hover:bg-red-50' : ''
                                            } ${
                                                action === 'Suspend' ? 'text-orange-700 hover:bg-orange-50' : ''
                                            } ${
                                                action === 'Active' ? 'text-blue-700 hover:bg-blue-50' : ''
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
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-gray-100 bg-gray-50/30">
                            <tr>
                                <th className="px-4 py-3.5 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleAll}>
                                        {allPageSelected
                                            ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                            : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Jobs</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Added</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={isLoading} aria-label={isLoading ? 'Loading passenger assistants' : undefined}>
                            {isLoading ? shimmerRows.map((_, index) => (
                                <tr key={`pa-skeleton-${index}`}>
                                    <td className="px-4 py-3.5">
                                        <ShimmerBlock className="w-5 h-5 rounded" rounded="rounded" />
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <ShimmerBlock className="h-3.5 w-32 rounded-md" />
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <ShimmerBlock className="w-9 h-9 shrink-0" rounded="rounded-full" />
                                            <div className="space-y-2 min-w-0">
                                                <ShimmerBlock className="h-3.5 w-28 max-w-full rounded-md" />
                                                <ShimmerBlock className="h-3 w-16 rounded-md" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="space-y-2">
                                            <ShimmerBlock className="h-3.5 w-36 rounded-md" />
                                            <ShimmerBlock className="h-3 w-24 rounded-md" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <ShimmerBlock className="h-3.5 w-20 rounded-md" />
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
                            )) : paginated.length > 0 ? paginated.map((pa) => (
                                <tr key={pa.id} className="hover:bg-gray-50/60 transition-colors">
                                    {/* Checkbox */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center cursor-pointer" onClick={() => toggleRow(pa.id)}>
                                            {selectedRows.includes(pa.id)
                                                ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                                : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
                                        </div>
                                    </td>
                                    {/* Name + PA ID */}
                                    <td className="px-4 py-3.5">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => navigate(`/admin/users/pa/${pa.id}`)}
                                        >
                                            <img
                                                src={pa.avatar}
                                                alt={pa.name}
                                                className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">{pa.name}</p>
                                            </div>
                                        </div>
                                    </td>

                                    

                                    {/* Contact Info */}
                                    <td className="px-4 py-3.5">
                                        <p className="text-gray-700 text-sm">{pa.email}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{pa.phone}</p>
                                    </td>

                                    {/* Assigned Jobs */}
                                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                        {pa.assignedJobs} Active
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[paStatusLabel(pa.statusDb)] || 'bg-gray-100 text-gray-500'}`}>
                                            {paStatusLabel(pa.statusDb)}
                                        </span>
                                    </td>

                                    {/* Date Added */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{pa.dateAdded}</td>

                                    {/* Actions */}
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="relative flex justify-end">
                                            <button
                                                type="button"
                                                data-pa-action-trigger
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isSavingStatus) return;
                                                    if (openMenu?.paId === pa.id) {
                                                        setOpenMenu(null);
                                                        return;
                                                    }
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const width = 144;
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    const openUp = spaceBelow < PA_ACTION_MENU_H + 16;
                                                    const top = openUp
                                                        ? rect.top - PA_ACTION_MENU_H - 4
                                                        : rect.bottom + 4;
                                                    setOpenMenu({
                                                        paId: pa.id,
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
                                    <td colSpan="8" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        {isLoading
                                            ? 'Loading passenger assistants...'
                                            : loadError
                                                ? loadError
                                                : 'No passenger assistants found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing results{' '}
                        <span className="font-medium text-gray-900">{startItem} to {endItem}</span>
                        {' '}of{' '}
                        <span className="font-medium text-gray-900">{filtered.length}</span>
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={18} />
                        </button>

                        {getPageNumbers().map((page, i) =>
                            page === '...' ? (
                                <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">..</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => handlePage(page)}
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
                            onClick={() => handlePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {openMenu &&
                paMenuActions.length > 0 &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-100 w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-0.5"
                        style={{ top: openMenu.top, left: openMenu.left }}
                        role="menu"
                    >
                        {paMenuActions.map((action) => (
                            <button
                                key={action}
                                type="button"
                                role="menuitem"
                                disabled={isSavingStatus}
                                onClick={() => handleAction(action, openMenu.paId)}
                                className={`block w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50
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

export default PAListPage;
