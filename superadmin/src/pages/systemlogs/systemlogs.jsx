import React from 'react';
import {
    MdFileDownload,
    MdDateRange,
    MdPersonOutline,
    MdKeyboardArrowDown,
    MdChevronLeft,
    MdChevronRight
} from 'react-icons/md';

const SystemLogs = () => {
    // Dummy Data matching screenshot
    const logs = [
        {
            id: 1,
            timestamp: "2025-11-18 20:15:33 UTC",
            user: { name: "Jacob Jones", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64" },
            actionType: "APPROVED",
            actionDetail: "company 'Bright Horizons'",
            status: "Success",
            ip: "192.168.1.101"
        },
        {
            id: 2,
            timestamp: "2025-11-18 19:45:01 UTC",
            user: { name: "Eleanor Pena", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64" },
            actionType: "EXPORTED",
            actionDetail: "user report",
            status: "Success",
            ip: "78.12.55.203"
        },
        {
            id: 3,
            timestamp: "2025-11-18 18:30:12 UTC",
            user: { name: "Cameron Williamson", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" },
            actionType: "LOGIN",
            actionDetail: "attempt failed",
            status: "Failure",
            ip: "104.28.210.117"
        },
        {
            id: 4,
            timestamp: "2025-11-18 17:55:48 UTC",
            user: { name: "Robert Fox", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64" },
            actionType: "APPROVED",
            actionDetail: "company 'Elf Cafe'",
            status: "Success",
            ip: "208.80.154.224"
        },
        {
            id: 5,
            timestamp: "2025-11-17 14:02:19 UTC",
            user: { name: "Jenny Wilson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" },
            actionType: "DELETED",
            actionDetail: "user 'temp_user@acme.com'",
            status: "Success",
            ip: "151.101.194.133"
        }
    ];

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
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                    <MdFileDownload className="w-5 h-5" />
                    Export Logs
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col">

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
                                placeholder="Select date range"
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
                                placeholder="e.g., eleanor@..."
                                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Action Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">Action Type</label>
                        <div className="relative">
                            <select className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors appearance-none text-gray-900">
                                <option>All Actions</option>
                                <option>Login</option>
                                <option>Approved</option>
                                <option>Deleted</option>
                                <option>Exported</option>
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
                            <select className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors appearance-none text-gray-900">
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
                <div className="overflow-x-auto">
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
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-6 py-4 text-gray-500 font-medium font-mono text-xs">
                                        {log.timestamp}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={log.user.avatar}
                                                alt={log.user.name}
                                                className="w-8 h-8 rounded-full border border-gray-200"
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                        Showing <span className="font-medium text-gray-900">1</span> to <span className="font-medium text-gray-900">10</span> of <span className="font-medium text-gray-900">1,428</span> results
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-50">
                            <MdChevronLeft className="w-4 h-4" />
                        </button>

                        <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs border border-blue-100">
                            1
                        </button>
                        <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 font-medium text-xs border border-transparent">
                            2
                        </button>
                        <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 font-medium text-xs border border-transparent">
                            3
                        </button>
                        <span className="min-w-[32px] h-8 flex items-center justify-center text-gray-400 text-xs">...</span>
                        <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 font-medium text-xs border border-transparent">
                            143
                        </button>

                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                            <MdChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SystemLogs;
