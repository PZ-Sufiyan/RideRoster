import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
    MdFileDownload,
    MdDateRange,
    MdPersonOutline,
    MdKeyboardArrowDown,
    MdChevronLeft,
    MdChevronRight
} from 'react-icons/md';
import { exportToExcel } from '../../../../utils/exportUtils';
import { getSystemLogs, getSystemLogsPage } from '../../../../services/systemLogService';
import { ShimmerBlock } from '../../../../utils/Shimmer';

const SystemLogs = () => {
    const itemsPerPage = 6;

    // Data State (Supabase)
    const [logs, setLogs] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter State
    const [searchUser, setSearchUser] = useState('');
    const [filterAction, setFilterAction] = useState('All Actions');
    const [filterStatus, setFilterStatus] = useState('Any Status');
    const [dateRange, setDateRange] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchUser, filterAction, filterStatus, dateRange]);

    const getIsoRangeFromDateInput = (value) => {
        const trimmed = (value || '').trim();
        if (!trimmed) return { from: null, to: null };
        // Expecting YYYY-MM-DD (local timezone). Convert to ISO range for that day.
        const start = new Date(`${trimmed}T00:00:00`);
        if (Number.isNaN(start.getTime())) return { from: null, to: null };
        const end = new Date(`${trimmed}T23:59:59.999`);
        return { from: start.toISOString(), to: end.toISOString() };
    };

    const formatTimestampUtc = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return String(iso);
        const parts = new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'UTC'
        }).formatToParts(d);
        const get = (type) => parts.find(p => p.type === type)?.value || '';
        return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} UTC`;
    };

    const parseAction = (action) => {
        const raw = (action || '').trim();
        if (!raw) return { type: '-', detail: '' };
        const firstToken = raw.split(/\s+/)[0] || raw;
        const type = firstToken.toUpperCase();
        const detail = raw.slice(firstToken.length).trim();
        return { type, detail };
    };

    const shimmerRows = Array.from({ length: itemsPerPage });

    const abortRef = useRef(null);

    const queryParams = useMemo(() => {
        const { from, to } = getIsoRangeFromDateInput(dateRange);
        const status = filterStatus === 'Any Status' ? null : filterStatus;
        const actionType = filterAction === 'All Actions' ? null : filterAction.toUpperCase();
        const userName = (searchUser || '').trim() ? searchUser.trim() : null;
        return { from, to, status, actionType, userName };
    }, [dateRange, filterAction, filterStatus, searchUser]);

    useEffect(() => {
        let cancelled = false;
        setError('');

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const offset = (currentPage - 1) * itemsPerPage;

        // Debounce typing a bit (especially user filter).
        const t = setTimeout(async () => {
            try {
                if (cancelled || controller.signal.aborted) return;
                setLoading(true);

                const { data, count } = await getSystemLogsPage({
                    ...queryParams,
                    limit: itemsPerPage,
                    offset,
                    orderBy: 'timestamp',
                    order: 'desc'
                });

                if (cancelled || controller.signal.aborted) return;

                const mapped = (data || []).map((row) => {
                    const parsed = parseAction(row.action);
                    return {
                        id: row.id,
                        timestamp: formatTimestampUtc(row.timestamp),
                        user: {
                            name: row.user_name || 'System',
                            avatar: null
                        },
                        actionType: parsed.type,
                        actionDetail: parsed.detail,
                        status: row.status,
                        ip: row.ip_address || '-',
                        _raw: row
                    };
                });

                setLogs(mapped);
                setTotalItems(count || 0);
            } catch (e) {
                if (cancelled || controller.signal.aborted) return;
                setLogs([]);
                setTotalItems(0);
                setError(e?.message || 'Failed to load system logs.');
            } finally {
                if (!cancelled && !controller.signal.aborted) setLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(t);
            controller.abort();
        };
    }, [currentPage, itemsPerPage, queryParams]);

    const handleExport = () => {
        (async () => {
            try {
                setError('');
                const rows = await getSystemLogs({
                    ...queryParams,
                    // For export we pull a bigger chunk (adjust if you expect more).
                    limit: 5000,
                    offset: 0,
                    orderBy: 'timestamp',
                    order: 'desc'
                });
                const exportRows = (rows || []).map((row) => ({
                    timestamp: row.timestamp,
                    user_name: row.user_name || 'System',
                    action: row.action,
                    status: row.status,
                    ip_address: row.ip_address || ''
                }));
                exportToExcel(exportRows, 'Filtered_SystemLogs', 'System Logs');
            } catch (e) {
                setError(e?.message || 'Failed to export system logs.');
            }
        })();
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Review all system-level events and user activities.
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors active:scale-95"
                >
                    <MdFileDownload className="w-5 h-5 text-blue-600" />
                    Export Excel
                </button>
            </div>

            {error ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col" style={{ minHeight: '600px' }}>

                {/* Filters Row */}
                <div className="p-5 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">Date Range</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MdDateRange className="text-gray-400 w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="YYYY-MM-DD"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* User */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">User</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MdPersonOutline className="text-gray-400 w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Action Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">Action Type</label>
                        <div className="relative">
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors appearance-none text-gray-900"
                            >
                                <option>All Actions</option>
                                <option>Login</option>
                                <option>Approved</option>
                                <option>Deleted</option>
                                <option>Exported</option>
                                <option>Updated</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <MdKeyboardArrowDown className="text-gray-400 w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">Status</label>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors appearance-none text-gray-900"
                            >
                                <option>Any Status</option>
                                <option>Success</option>
                                <option>Failure</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <MdKeyboardArrowDown className="text-gray-400 w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="grow overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={loading} aria-label={loading ? 'Loading system logs' : undefined}>
                            {loading ? shimmerRows.map((_, index) => (
                                <tr key={`systemlog-skeleton-${index}`}>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-3.5 w-40 rounded-md" /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <ShimmerBlock className="w-8 h-8 shrink-0" rounded="rounded-full" />
                                            <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-3.5 w-32 rounded-md" /></td>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-6 w-20 rounded-full" rounded="rounded-full" /></td>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-3.5 w-28 rounded-md" /></td>
                                    <td className="px-6 py-4 text-right"><ShimmerBlock className="ml-auto h-3.5 w-12 rounded-md" /></td>
                                </tr>
                            )) : logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 font-medium font-mono text-xs">
                                            {log.timestamp}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700">
                                                    {(log.user.name || 'S').trim().slice(0, 1).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-900">{log.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <span className="font-bold text-gray-800 uppercase text-xs">{log.actionType}</span>{" "}
                                            <span className="text-gray-500">{log.actionDetail}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.status === 'Success' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    Failure
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                            {log.ip}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-lg font-medium text-gray-900">No logs found</span>
                                            <p className="text-sm">Try adjusting your filters to find what you're looking for.</p>
                                            <button
                                                onClick={() => {
                                                    setSearchUser('');
                                                    setFilterAction('All Actions');
                                                    setFilterStatus('Any Status');
                                                    setDateRange('');
                                                }}
                                                className="mt-4 text-blue-600 font-semibold hover:underline"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm mt-auto">
                    <span className="text-gray-500">
                        {totalItems > 0 ? (
                            <>
                                Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-gray-900">{totalItems}</span> results
                            </>
                        ) : (
                            'No results to show'
                        )}
                    </span>

                    <div className="flex items-center gap-1.5 font-sans">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || totalItems === 0}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft className="w-4 h-4" />
                        </button>

                        {[...Array(totalPages)].map((_, idx) => {
                            const pageNum = idx + 1;
                            if (
                                totalPages <= 7 ||
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`min-w-8 h-8 flex items-center justify-center rounded-lg font-medium text-xs border transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-50 text-blue-600 border-blue-100 font-semibold'
                                            : 'hover:bg-gray-50 text-gray-600 border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            } else if (
                                pageNum === currentPage - 2 ||
                                pageNum === currentPage + 2
                            ) {
                                return <span key={pageNum} className="min-w-8 h-8 flex items-center justify-center text-gray-400 text-xs">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalItems === 0}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SystemLogs;
