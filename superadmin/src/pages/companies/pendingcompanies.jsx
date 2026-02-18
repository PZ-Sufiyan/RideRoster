import React, { useState } from 'react';
import {
    MdSearch,
    MdFilterList,
    MdAdd,
    MdMoreHoriz,
    MdChevronLeft,
    MdChevronRight,
    MdArrowDropDown,
    MdArrowDropUp,
    MdCheckBoxOutlineBlank,
    MdCheckBox
} from 'react-icons/md';

import { Link } from 'react-router-dom';

const PendingCompanies = () => {
    // Dummy Data
    const [companies, setCompanies] = useState([
        {
            id: 1,
            name: 'Bright Horizons Transport',
            submitted: '2025-11-18',
            contact: { name: 'Esther Howard', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64' },
            location: 'San Francisco, CA',
            status: 'Pending Review'
        },
        {
            id: 2,
            name: 'Safe Journey Logistics',
            submitted: '2025-11-17',
            contact: { name: 'Cameron Williamson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64' },
            location: 'New York, NY',
            status: 'Pending Review'
        },
        {
            id: 3,
            name: 'NextGen Shuttles',
            submitted: '2025-11-17',
            contact: { name: 'Jane Cooper', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64' },
            location: 'Austin, TX',
            status: 'Pending Review'
        },
        {
            id: 4,
            name: 'Metro Transit Solutions',
            submitted: '2025-11-16',
            contact: { name: 'Robert Fox', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64' },
            location: 'Chicago, IL',
            status: 'Pending Review'
        },
        {
            id: 5,
            name: 'Urban Mobility Inc.',
            submitted: '2025-11-15',
            contact: { name: 'Kristin Watson', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=64&h=64' },
            location: 'Miami, FL',
            status: 'Pending Review'
        },
    ]);

    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);

    // Filter companies based on search query
    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedRows.length === filteredCompanies.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredCompanies.map(c => c.id));
        }
    };

    const toggleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleBulkAction = (action) => {
        if (selectedRows.length === 0) return;

        // In a real app, this would be an API call
        // For now, we just remove them from the list to simulate processing
        const remainingCompanies = companies.filter(c => !selectedRows.includes(c.id));
        setCompanies(remainingCompanies);
        setSelectedRows([]);
        setIsBulkActionOpen(false);

        console.log(`Bulk action: ${action} for ids:`, selectedRows);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Company Approvals</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and verify new company registrations.</p>
                </div>
                <Link to="/companies" className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-transparent flex items-center gap-1">
                    View All Companies
                </Link>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col h-full">

                {/* Controls Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="relative max-w-sm w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MdSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by company name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50"
                            />
                        </div>

                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <MdFilterList className="text-gray-500" />
                            Filter
                            <MdArrowDropDown className="text-gray-400" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Bulk Actions
                                <MdArrowDropDown className="text-gray-400" />
                            </button>
                            {isBulkActionOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20">
                                    <div className="py-1">
                                        <button
                                            onClick={() => handleBulkAction('approve')}
                                            className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                                            disabled={selectedRows.length === 0}
                                        >
                                            Approve Selected
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('reject')}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            disabled={selectedRows.length === 0}
                                        >
                                            Reject Selected
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#005580] rounded-lg text-sm font-medium text-white hover:bg-sky-900 transition-colors shadow-sm">
                            <MdAdd size={18} />
                            Add Company
                        </button>
                    </div>
                </div>

                {/* Table Container - Horizontal Scroll on Mobile */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleSelectAll}>
                                        {selectedRows.length === filteredCompanies.length && filteredCompanies.length > 0 ? (
                                            <MdCheckBox className="text-blue-600 w-5 h-5" />
                                        ) : (
                                            <MdCheckBoxOutlineBlank className="text-gray-400 w-5 h-5" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-gray-700 group">
                                    <div className="flex items-center gap-1">
                                        Company Name
                                        <div className="flex flex-col text-gray-400">
                                            <MdArrowDropUp size={12} className="-mb-1" />
                                            <MdArrowDropDown size={12} className="-mt-1" />
                                        </div>
                                    </div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-gray-700">
                                    <div className="flex items-center gap-1">
                                        Submitted On
                                        <div className="flex flex-col text-gray-400">
                                            <MdArrowDropUp size={12} className="-mb-1" />
                                            <MdArrowDropDown size={12} className="-mt-1" />
                                        </div>
                                    </div>
                                </th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCompanies.length > 0 ? (
                                filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center cursor-pointer" onClick={() => toggleSelectRow(company.id)}>
                                                {selectedRows.includes(company.id) ? (
                                                    <MdCheckBox className="text-blue-600 w-5 h-5" />
                                                ) : (
                                                    <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{company.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{company.submitted}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={company.contact.avatar}
                                                    alt={company.contact.name}
                                                    className="w-8 h-8 rounded-full object-cover border border-gray-100"
                                                />
                                                <span className="text-gray-700 font-medium">{company.contact.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{company.location}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/companies/review/${company.name}`}
                                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all inline-block"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No pending companies found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                        Showing results <span className="font-medium text-gray-900">1</span> to <span className="font-medium text-gray-900">{filteredCompanies.length}</span> of <span className="font-medium text-gray-900">{companies.length}</span>
                    </span>

                    {/* Pagination controls (static for now) */}
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-50">
                            <MdChevronLeft size={20} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#005580] text-white font-medium shadow-sm">
                            1
                        </button>
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PendingCompanies;
