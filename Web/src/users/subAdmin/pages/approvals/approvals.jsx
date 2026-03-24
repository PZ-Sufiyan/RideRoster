import React from 'react';
import { MdFilterList, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const approvalsData = [
    {
        id: '#J78-C4F',
        type: 'Job Time Change',
        submittedBy: 'Maria Garcia',
        date: '2025-11-18',
        status: 'Pending',
        statusColor: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    {
        id: '#E12-A9B',
        type: 'Expense Claim ($45.50)',
        submittedBy: 'David Smith',
        date: '2025-11-17',
        status: 'Pending',
        statusColor: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    {
        id: '#A55-D3E',
        type: 'Driver Assignment Swap',
        submittedBy: 'System Bot',
        date: '2025-11-17',
        status: 'Pending',
        statusColor: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    {
        id: '#E10-B7C',
        type: 'Expense Claim ($12.00)',
        submittedBy: 'Emily White',
        date: '2025-11-16',
        status: 'Approved',
        statusColor: 'bg-green-50 text-green-700 border-green-200'
    },
    {
        id: '#J65-F1A',
        type: 'Job Time Change',
        submittedBy: 'Robert Brown',
        date: '2025-11-15',
        status: 'Rejected',
        statusColor: 'bg-red-50 text-red-500 border-red-200'
    }
];

const SubAdmin_Approvals = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
                    <p className="text-sm text-gray-500">Review and manage items requiring your approval.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <MdFilterList size={20} />
                    Filter
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Pending Requests</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-tight text-[11px]">Request ID</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-tight text-[11px]">Type</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-tight text-[11px]">Submitted By</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-tight text-[11px]">Date</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-tight text-[11px]">Status</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-tight text-[11px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {approvalsData.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-700">{item.id}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700">{item.type}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.submittedBy}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.statusColor}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-[#005C7A] font-bold hover:underline">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <p>Showing 1 to 5 of 12 results</p>
                    <div className="flex gap-2">
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                            <MdChevronLeft size={20} />
                        </button>
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubAdmin_Approvals;
