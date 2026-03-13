import React, { useState, useMemo, useEffect } from 'react';
import {
    MdFileDownload,
    MdDateRange,
    MdPersonOutline,
    MdKeyboardArrowDown,
    MdChevronLeft,
    MdChevronRight
} from 'react-icons/md';
import { exportToExcel } from '../../../../utils/exportUtils';

const SystemLogs = () => {
    // Extended Dummy Data for Pagination
    const allLogs = useMemo(() => {
        const baseLogs = [
            { id: 1, timestamp: "2025-11-18 20:15:33 UTC", user: { name: "Jacob Jones", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64" }, actionType: "APPROVED", actionDetail: "company 'Bright Horizons'", status: "Success", ip: "192.168.1.101" },
            { id: 2, timestamp: "2025-11-18 19:45:01 UTC", user: { name: "Eleanor Pena", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64" }, actionType: "EXPORTED", actionDetail: "user report", status: "Success", ip: "78.12.55.203" },
            { id: 3, timestamp: "2025-11-18 18:30:12 UTC", user: { name: "Cameron Williamson", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" }, actionType: "LOGIN", actionDetail: "attempt failed", status: "Failure", ip: "104.28.210.117" },
            { id: 4, timestamp: "2025-11-18 17:55:48 UTC", user: { name: "Robert Fox", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64" }, actionType: "APPROVED", actionDetail: "company 'Elf Cafe'", status: "Success", ip: "208.80.154.224" },
            { id: 5, timestamp: "2025-11-17 14:02:19 UTC", user: { name: "Jenny Wilson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" }, actionType: "DELETED", actionDetail: "user 'temp_user@acme.com'", status: "Success", ip: "151.101.194.133" },
            { id: 6, timestamp: "2025-11-17 12:45:10 UTC", user: { name: "Albert Flores", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64" }, actionType: "LOGIN", actionDetail: "admin login", status: "Success", ip: "203.0.113.15" },
            { id: 7, timestamp: "2025-11-17 10:20:05 UTC", user: { name: "Kristin Watson", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&h=64" }, actionType: "UPDATED", actionDetail: "system settings", status: "Success", ip: "10.0.0.42" },
            { id: 8, timestamp: "2025-11-16 16:15:33 UTC", user: { name: "Bessie Cooper", avatar: "https://images.unsplash.com/photo-1531746020798-e795c5399c7c?auto=format&fit=crop&w=64&h=64" }, actionType: "APPROVED", actionDetail: "driver 'Mike Smith'", status: "Success", ip: "192.168.1.102" },
            { id: 9, timestamp: "2025-11-16 15:30:12 UTC", user: { name: "Marvin McKinney", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=64&h=64" }, actionType: "LOGIN", actionDetail: "attempt failed", status: "Failure", ip: "45.12.110.89" },
            { id: 10, timestamp: "2025-11-16 14:10:48 UTC", user: { name: "Cody Fisher", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=64&h=64" }, actionType: "EXPORTED", actionDetail: "revenue report", status: "Success", ip: "92.168.1.1" },
            { id: 11, timestamp: "2025-11-15 09:12:33 UTC", user: { name: "Guy Hawkins", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" }, actionType: "DELETED", actionDetail: "expired logs", status: "Success", ip: "192.168.0.25" },
            { id: 12, timestamp: "2025-11-15 08:45:01 UTC", user: { name: "Theresa Webb", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" }, actionType: "UPDATED", actionDetail: "pricing model", status: "Success", ip: "172.16.0.10" },
            { id: 13, timestamp: "2025-11-14 20:15:33 UTC", user: { name: "Ronald Richards", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=64&h=64" }, actionType: "APPROVED", actionDetail: "company 'Swift Cabs'", status: "Success", ip: "192.168.1.104" },
            { id: 14, timestamp: "2025-11-14 19:45:01 UTC", user: { name: "Jane Cooper", avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=64&h=64" }, actionType: "LOGIN", actionDetail: "admin login", status: "Success", ip: "78.12.55.205" },
            { id: 15, timestamp: "2025-11-14 18:30:12 UTC", user: { name: "Arlene McCoy", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64" }, actionType: "EXPORTED", actionDetail: "compliance report", status: "Success", ip: "104.28.210.119" },
            { id: 16, timestamp: "2025-11-13 17:55:48 UTC", user: { name: "Robert Fox", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64" }, actionType: "APPROVED", actionDetail: "driver 'Sam Wilson'", status: "Success", ip: "208.80.154.226" },
            { id: 17, timestamp: "2025-11-13 14:02:19 UTC", user: { name: "Dianne Russell", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=64&h=64" }, actionType: "LOGIN", actionDetail: "attempt failed", status: "Failure", ip: "151.101.194.135" },
            { id: 18, timestamp: "2025-11-13 12:45:10 UTC", user: { name: "Ralph Edwards", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" }, actionType: "UPDATED", actionDetail: "user roles", status: "Success", ip: "203.0.113.18" },
            { id: 19, timestamp: "2025-11-12 10:20:05 UTC", user: { name: "Kristin Watson", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&h=64" }, actionType: "DELETED", actionDetail: "orphaned records", status: "Success", ip: "10.0.0.45" },
            { id: 20, timestamp: "2025-11-12 09:12:33 UTC", user: { name: "Bessie Cooper", avatar: "https://images.unsplash.com/photo-1531746020798-e795c5399c7c?auto=format&fit=crop&w=64&h=64" }, actionType: "APPROVED", actionDetail: "company 'Taxi Pro'", status: "Success", ip: "192.168.1.105" },
            { id: 21, timestamp: "2025-11-12 08:45:01 UTC", user: { name: "Marvin McKinney", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=64&h=64" }, actionType: "LOGIN", actionDetail: "attempt failed", status: "Failure", ip: "45.12.110.92" },
            { id: 22, timestamp: "2025-11-11 16:15:33 UTC", user: { name: "Cody Fisher", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=64&h=64" }, actionType: "EXPORTED", actionDetail: "asset log", status: "Success", ip: "92.168.1.5" },
            { id: 23, timestamp: "2025-11-11 15:30:12 UTC", user: { name: "Guy Hawkins", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" }, actionType: "DELETED", actionDetail: "test data", status: "Success", ip: "192.168.0.28" },
            { id: 24, timestamp: "2025-11-11 14:10:48 UTC", user: { name: "Theresa Webb", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" }, actionType: "UPDATED", actionDetail: "notification template", status: "Success", ip: "172.16.0.15" },
            { id: 25, timestamp: "2025-11-11 09:12:33 UTC", user: { name: "Albert Flores", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64" }, actionType: "LOGIN", actionDetail: "superadmin login", status: "Success", ip: "203.0.113.20" },
        ];
        return baseLogs;
    }, []);

    // Filter State
    const [searchUser, setSearchUser] = useState('');
    const [filterAction, setFilterAction] = useState('All Actions');
    const [filterStatus, setFilterStatus] = useState('Any Status');
    const [dateRange, setDateRange] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Filter Logic
    const filteredLogs = useMemo(() => {
        return allLogs.filter(log => {
            const matchesUser = log.user.name.toLowerCase().includes(searchUser.toLowerCase());
            const matchesAction = filterAction === 'All Actions' || log.actionType === filterAction.toUpperCase();
            const matchesStatus = filterStatus === 'Any Status' || log.status === filterStatus;

            // Simple date range check (matching parts of the timestamp string for this mock)
            const matchesDate = !dateRange || log.timestamp.includes(dateRange);

            return matchesUser && matchesAction && matchesStatus && matchesDate;
        });
    }, [allLogs, searchUser, filterAction, filterStatus, dateRange]);

    // Derived Pagination Values
    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchUser, filterAction, filterStatus, dateRange]);

    // Get Current Page Logs
    const currentLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const handleExport = () => {
        exportToExcel(filteredLogs, 'Filtered_SystemLogs', 'System Logs');
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
                    Export {filteredLogs.length !== allLogs.length ? 'Filtered' : ''} Excel
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col min-h-[600px]">

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
                        <tbody className="divide-y divide-gray-50">
                            {currentLogs.length > 0 ? (
                                currentLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 font-medium font-mono text-xs">
                                            {log.timestamp}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={log.user.avatar}
                                                    alt={log.user.name}
                                                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                                                />
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
                                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg font-medium text-xs border transition-colors ${currentPage === pageNum
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
                                return <span key={pageNum} className="min-w-[32px] h-8 flex items-center justify-center text-gray-400 text-xs">...</span>;
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
