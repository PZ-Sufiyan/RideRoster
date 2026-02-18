import React, { useState } from 'react';
import {
    MdSearch,
    MdFilterList,
    MdAdd,
    MdMoreVert,
    MdChevronLeft,
    MdChevronRight,
    MdArrowDropDown,
    MdCheckBoxOutlineBlank,
    MdCheckBox
} from 'react-icons/md';

const Companies = () => {
    // Dummy Data based on screenshot
    const [companies, setCompanies] = useState([
        {
            id: 1,
            name: 'Bright Horizons Transport',
            initials: 'BH',
            initialsColor: 'text-blue-700',
            bgColor: 'bg-blue-50',
            contact: 'admin@brighthorizons.com',
            location: 'San Francisco, CA',
            status: 'Active',
            dateJoined: '2025-10-22'
        },
        {
            id: 2,
            name: 'Safe Journey Logistics',
            initials: 'SJ',
            initialsColor: 'text-orange-700',
            bgColor: 'bg-orange-50',
            contact: 'contact@safejourney.io',
            location: 'New York, NY',
            status: 'Pending',
            dateJoined: '2025-11-17'
        },
        {
            id: 3,
            name: 'NextGen Shuttles',
            initials: 'NG',
            initialsColor: 'text-blue-700',
            bgColor: 'bg-blue-50',
            contact: 'ceo@nextgenshuttles.com',
            location: 'Austin, TX',
            status: 'Active',
            dateJoined: '2025-09-15'
        },
        {
            id: 4,
            name: 'Metro Transit Solutions',
            initials: 'MT',
            initialsColor: 'text-red-700',
            bgColor: 'bg-red-50',
            contact: 'support@metrotransit.org',
            location: 'Chicago, IL',
            status: 'Rejected',
            dateJoined: '2025-11-16'
        },
        {
            id: 5,
            name: 'CityWide Transports',
            initials: 'CT',
            initialsColor: 'text-emerald-700',
            bgColor: 'bg-emerald-50',
            contact: 'info@citywide.co',
            location: 'Miami, FL',
            status: 'Inactive',
            dateJoined: '2025-08-01'
        },
    ]);

    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeActionId, setActiveActionId] = useState(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeActionId && !event.target.closest('.action-menu')) {
                setActiveActionId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeActionId]);

    const toggleSelectAll = () => {
        if (selectedRows.length === companies.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(companies.map(c => c.id));
        }
    };

    const toggleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setCompanies(companies.map(company =>
            company.id === id ? { ...company, status: newStatus } : company
        ));
        setActiveActionId(null);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active':
            case 'Approved':
                return 'bg-green-100 text-green-700';
            case 'Pending':
                return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
            case 'Rejected':
                return 'bg-red-100 text-red-700';
            case 'Inactive':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || company.status === statusFilter;

        // Handle "Approved" as alias for "Active" if needed by user requirements, or just strict matching
        // User asked for "active, approved, rejected and inactive" in filter
        // In data we have Active. Let's assume Active covers Approved based on common UI patterns or they are aliases.
        // If the user wants to filter "Approved" but data has "Active", we might need to adjust data or filter logic.
        // For now, I will treat specific matches. Data has 'Active', 'Pending', 'Rejected', 'Inactive'.
        if (statusFilter === 'Approved' && company.status === 'Active') return matchesSearch;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage, search, and filter all registered companies.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#005580] rounded-lg text-sm font-medium text-white hover:bg-sky-900 transition-colors shadow-sm">
                    <MdAdd size={18} />
                    Add New Company
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col h-full">

                {/* Controls Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="relative max-w-sm w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MdSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50"
                            />
                        </div>

                        <div className="relative group">
                            <button className="w-full sm:w-auto flex items-center justify-between gap-8 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                <span>Status: {statusFilter}</span>
                                <MdArrowDropDown className="text-gray-500" />
                            </button>
                            {/* Status Dropdown */}
                            <div className="absolute top-full left-0 mt-1 w-full sm:w-48 bg-white border border-gray-100 request-shadow rounded-lg shadow-lg z-10 hidden group-hover:block hover:block">
                                <div className="py-1">
                                    {['All', 'Active', 'Approved', 'Rejected', 'Inactive'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === status ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <button className="w-full sm:w-auto flex items-center justify-between gap-8 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                <span>Plan: All</span>
                                <MdArrowDropDown className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Button */}
                    <div>
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <MdFilterList className="text-gray-500" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleSelectAll}>
                                        {selectedRows.length === companies.length && companies.length > 0 ? (
                                            <MdCheckBox className="text-blue-600 w-5 h-5" />
                                        ) : (
                                            <MdCheckBoxOutlineBlank className="text-gray-400 w-5 h-5" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date Joined</th>
                                <th className="px-6 py-4 text-center">Actions</th>
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${company.initialsColor} ${company.bgColor}`}>
                                                    {company.initials}
                                                </div>
                                                <span className="font-semibold text-gray-900">{company.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{company.contact}</td>
                                        <td className="px-6 py-4 text-gray-500">{company.location}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(company.status)}`}>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{company.dateJoined}</td>
                                        <td className="px-6 py-4 text-center relative action-menu">
                                            <button
                                                onClick={() => setActiveActionId(activeActionId === company.id ? null : company.id)}
                                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                                            >
                                                <MdMoreVert size={20} />
                                            </button>

                                            {/* Action Menu Dropdown */}
                                            {activeActionId === company.id && (
                                                <div className="absolute right-8 top-8 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => handleStatusChange(company.id, 'Active')}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                                        >
                                                            Active
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(company.id, 'Inactive')}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                                                        >
                                                            Inactive
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No companies found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                        Showing results 1 to {filteredCompanies.length} of {companies.length}
                    </span>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-50">
                            <MdChevronLeft size={20} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E6F0F5] text-[#005580] font-medium border border-[#005580]">
                            1
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
                            2
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
                            3
                        </button>
                        <span className="px-1 text-gray-400">..</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
                            250
                        </button>
                        <button className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Companies;
