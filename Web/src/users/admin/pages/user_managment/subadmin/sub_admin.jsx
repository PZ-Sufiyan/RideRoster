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
    MdFilterList,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import {
    getSubAdminsByCompany,
    updateSubAdmin,
    formatSubAdminPermissionsSummary,
    normalizeSubAdminStatus,
    subAdminStatusLabel,
    actionToSubAdminDbStatus,
} from '../../../../../services/subAdminService';
import { ShimmerBlock } from '../../../../../utils/Shimmer';

const STATUS_COLORS = {
    Active: 'bg-green-50 text-green-700 border border-green-200',
    Suspended: 'bg-orange-50 text-orange-600 border border-orange-200',
};

const ITEMS_PER_PAGE = 10;

const SUBADMIN_ACTION_MENU_H = 188;

function formatUpdatedAt(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

function getSubAdminRowActions(statusLabel) {
    return ['Suspend', 'Active'].filter((action) => {
        if (statusLabel === 'Active' && action === 'Active') return false;
        if (statusLabel === 'Suspended' && action === 'Suspend') return false;
        return true;
    });
}

// ─── Component ────────────────────────────────────────────────
const SubAdminList = () => {
    const navigate = useNavigate();
    const [subAdmins, setSubAdmins] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Status: All');
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

    const statuses = ['Status: All', 'Active', 'Suspended'];

    useEffect(() => {
        const loadSubAdmins = async () => {
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

                const rows = await getSubAdminsByCompany(admin.company_id);
                const mapped = (rows || []).map((row) => ({
                    id: row.id,
                    name: row.name?.trim() || '—',
                    email: row.email != null && String(row.email).trim() !== '' ? String(row.email).trim() : '',
                    phone: row.phone != null && String(row.phone).trim() !== '' ? String(row.phone).trim() : '',
                    avatar: `https://i.pravatar.cc/64?u=${row.id}`,
                    permissions: formatSubAdminPermissionsSummary(row),
                    statusDb: normalizeSubAdminStatus(row.status),
                    updatedAt: row.updated_at,
                }));
                setSubAdmins(mapped);
            } catch (err) {
                console.error('Failed loading sub-admins:', err);
                setLoadError(err?.message || 'Failed to load sub-admins.');
                setSubAdmins([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadSubAdmins();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current?.contains(e.target)) return;
            for (const el of document.querySelectorAll('[data-subadmin-action-trigger]')) {
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
    const filtered = subAdmins.filter((sa) => {
        const q = search.toLowerCase();
        const idStr = String(sa.id || '').toLowerCase();
        const matchSearch =
            sa.name.toLowerCase().includes(q) ||
            (sa.email && sa.email.toLowerCase().includes(q)) ||
            (sa.phone && sa.phone.toLowerCase().includes(q)) ||
            idStr.includes(q);
        const label = subAdminStatusLabel(sa.statusDb);
        const matchStatus = statusFilter === 'Status: All' || label === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const handleAction = async (action, id) => {
        const nextDb = actionToSubAdminDbStatus(action);
        if (!nextDb) return;
        setStatusUpdateError('');
        setIsSavingStatus(true);
        try {
            const updated = await updateSubAdmin(id, { status: nextDb });
            setSubAdmins((prev) =>
                prev.map((sa) =>
                    sa.id === id
                        ? {
                            ...sa,
                            statusDb: normalizeSubAdminStatus(updated?.status ?? nextDb),
                            updatedAt: updated?.updated_at ?? sa.updatedAt,
                        }
                        : sa
                )
            );
            setOpenMenu(null);
        } catch (err) {
            console.error('Failed to update sub-admin status:', err);
            setStatusUpdateError(err?.message || 'Failed to update status.');
        } finally {
            setIsSavingStatus(false);
        }
    };

    const handleBulkAction = async (action) => {
        const nextDb = actionToSubAdminDbStatus(action);
        if (!nextDb || selectedRows.length === 0) {
            setIsBulkOpen(false);
            return;
        }
        setStatusUpdateError('');
        setIsSavingStatus(true);
        try {
            const results = await Promise.all(
                selectedRows.map((rowId) => updateSubAdmin(rowId, { status: nextDb }))
            );
            setSubAdmins((prev) =>
                prev.map((sa) => {
                    if (!selectedRows.includes(sa.id)) return sa;
                    const updated = results.find((r) => r.id === sa.id);
                    return updated
                        ? {
                            ...sa,
                            statusDb: normalizeSubAdminStatus(updated.status),
                            updatedAt: updated.updated_at,
                        }
                        : { ...sa, statusDb: normalizeSubAdminStatus(nextDb) };
                })
            );
            setSelectedRows([]);
            setIsBulkOpen(false);
        } catch (err) {
            console.error('Failed bulk sub-admin status update:', err);
            setStatusUpdateError(err?.message || 'Failed to update status.');
        } finally {
            setIsSavingStatus(false);
        }
    };

    const menuSa = openMenu ? subAdmins.find((sa) => sa.id === openMenu.subAdminId) : null;
    const subAdminMenuActions = menuSa ? getSubAdminRowActions(subAdminStatusLabel(menuSa.statusDb)) : [];

    const toggleRow = (id) => setSelectedRows((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
    const toggleAll = () => {
        const pageIds = paginated.map((sa) => sa.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedRows.includes(id));
        setSelectedRows((prev) =>
            allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
        );
    };
    const allPageSelected = paginated.length > 0 && paginated.every((sa) => selectedRows.includes(sa.id));
    const shimmerRows = Array.from({ length: 6 });

    const handlePage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setSelectedRows([]);
            setIsBulkOpen(false);
        }
    };

    const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

    return (
        <div className="space-y-5">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sub-Admins</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage users who help with administrative tasks.</p>
                </div>
                <button
                    onClick={() => navigate('/portal/users/subadmins/add')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm shrink-0"
                >
                    <MdAdd size={18} />
                    Add Sub-Admin
                </button>
            </div>

            {/* ── Card ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-visible">

                {/* Toolbar */}
                <div className="border-b border-gray-100">
                    {(loadError || statusUpdateError) && (
                        <div className="mx-4 mt-3 space-y-2">
                            {loadError && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {loadError}
                                </div>
                            )}
                            {statusUpdateError && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {statusUpdateError}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MdSearch className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or ID"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-64 transition-colors"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative" ref={statusRef}>
                            <button
                                onClick={() => setIsStatusOpen((o) => !o)}
                                className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                <MdFilterList size={16} className="text-gray-500" />
                                {statusFilter}
                                <MdKeyboardArrowDown size={18} className="text-gray-400 ml-1" />
                            </button>
                            {isStatusOpen && (
                                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                    {statuses.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setStatusFilter(s);
                                                setIsStatusOpen(false);
                                                setCurrentPage(1);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bulk Actions & Menu */}
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={bulkRef}>
                            <button
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
                                    {['Suspend', 'Active'].map((action) => (
                                        <button
                                            key={action}
                                            disabled={isSavingStatus}
                                            onClick={() => handleBulkAction(action)}
                                            className={`block w-full text-left px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
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
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="border-b border-gray-100 bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-3.5 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleAll}>
                                        {allPageSelected
                                            ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                            : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center shrink-0 w-24 sm:text-left sm:w-auto">Name</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Permissions</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Last updated</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={isLoading} aria-label={isLoading ? 'Loading sub-admins' : undefined}>
                            {isLoading ? (
                                shimmerRows.map((_, index) => (
                                    <tr key={`subadmin-skeleton-${index}`}>
                                        <td className="px-4 py-4">
                                            <ShimmerBlock className="w-5 h-5 rounded" rounded="rounded" />
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <ShimmerBlock className="mx-auto h-3.5 w-32 rounded-md" />
                                        </td>
                                        <td className="px-4 py-4 sm:pl-4">
                                            <div className="flex items-center gap-3">
                                                <ShimmerBlock className="w-10 h-10 shrink-0" rounded="rounded-full" />
                                                <div className="space-y-2 min-w-0">
                                                    <ShimmerBlock className="h-3.5 w-28 max-w-full rounded-md" />
                                                    <ShimmerBlock className="h-3 w-32 rounded-md" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <ShimmerBlock className="mx-auto h-3.5 w-40 rounded-md" />
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <ShimmerBlock className="mx-auto h-6 w-20 rounded-full" rounded="rounded-full" />
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <ShimmerBlock className="mx-auto h-3.5 w-32 rounded-md" />
                                        </td>
                                        <td className="px-4 py-4 text-right pr-4">
                                            <ShimmerBlock className="ml-auto h-8 w-8 rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : paginated.length > 0 ? (
                                paginated.map((sa) => {
                                    const statusLabel = subAdminStatusLabel(sa.statusDb);
                                    const secondaryLine = sa.email || sa.phone || '—';
                                    return (
                                        <tr key={sa.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center cursor-pointer" onClick={() => toggleRow(sa.id)}>
                                                    {selectedRows.includes(sa.id)
                                                        ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                                        : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 sm:pl-4">
                                                <div
                                                    className="flex flex-col sm:flex-row items-center sm:items-start sm:gap-3 cursor-pointer group"
                                                    onClick={() => navigate(`/portal/users/subadmins/${sa.id}`)}
                                                >
                                                    <img
                                                        src={sa.avatar}
                                                        alt={sa.name}
                                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-100 shrink-0 mb-2 sm:mb-0"
                                                    />
                                                    <div className="text-center sm:text-left min-w-0">
                                                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">{sa.name}</p>
                                                        <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 break-all">{secondaryLine}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-gray-600 text-center whitespace-normal max-w-xs">
                                                {sa.permissions}
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${STATUS_COLORS[statusLabel] || 'bg-gray-100 text-gray-500'}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-gray-500 text-center whitespace-normal">
                                                {formatUpdatedAt(sa.updatedAt)}
                                            </td>

                                            <td className="px-4 py-4 text-right pr-4">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        type="button"
                                                        data-subadmin-action-trigger
                                                        disabled={isSavingStatus}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (openMenu?.subAdminId === sa.id) {
                                                                setOpenMenu(null);
                                                                return;
                                                            }
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const width = 144;
                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                            const openUp = spaceBelow < SUBADMIN_ACTION_MENU_H + 16;
                                                            const top = openUp
                                                                ? rect.top - SUBADMIN_ACTION_MENU_H - 4
                                                                : rect.bottom + 4;
                                                            setOpenMenu({
                                                                subAdminId: sa.id,
                                                                top,
                                                                left: Math.max(8, rect.right - width),
                                                            });
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005580]/20 disabled:opacity-40"
                                                    >
                                                        <MdMoreVert size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        No sub-admins found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing results{' '}
                        <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
                        <span className="font-semibold text-gray-900">{endItem}</span>
                        {' '}of{' '}
                        <span className="font-semibold text-gray-900">{filtered.length}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => handlePage(currentPage - 1)}
                            disabled={currentPage === 1 || isLoading}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={18} />
                        </button>

                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePage(page)}
                                    disabled={isLoading}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors border
                                        ${currentPage === page
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'text-gray-600 hover:bg-gray-50 border-gray-200'
                                        } disabled:opacity-40`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePage(currentPage + 1)}
                            disabled={currentPage === totalPages || isLoading}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {openMenu &&
                subAdminMenuActions.length > 0 &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-100 w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-1"
                        style={{ top: openMenu.top, left: openMenu.left }}
                        role="menu"
                    >
                        {subAdminMenuActions.map((action) => (
                            <button
                                key={action}
                                type="button"
                                role="menuitem"
                                disabled={isSavingStatus}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(action, openMenu.subAdminId);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50
                                    ${action === 'Suspend' ? 'text-orange-700 hover:bg-orange-50' : ''}
                                    ${action === 'Active' ? 'text-blue-700 hover:bg-blue-50' : ''}
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

export default SubAdminList;
