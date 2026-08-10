import React, { useState, useMemo, useEffect } from 'react';
import {
    MdSearch,
    MdMoreVert,
    MdChevronLeft,
    MdChevronRight,
    MdCheckBoxOutlineBlank,
    MdCheckBox
} from 'react-icons/md';
import { getAllCompanies } from '../../../../services/companyService' // added
import { ShimmerBlock } from '../../../../utils/Shimmer';

const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    const value = String(text);
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

const Companies = () => {
    // replaced hardcoded dummy -> fetch from backend
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeActionId, setActiveActionId] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // fetch on mount
    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await getAllCompanies()
                // map DB columns -> UI shape used in this component
                const mapped = (data || []).map((c) => ({
                    id: c.id,
                    name: c.company_name || '—',
                    initials: getInitials(c.company_name || ''),
                    initialsColor: 'text-blue-700',
                    bgColor: 'bg-blue-50',
                    contact: c.company_email || '',
                    location: c.company_address || '',
                    status: capitalizeStatus(c.status || ''),
                    dateJoined: formatDate(c.created_at)
                }))
                setCompanies(mapped)
            } catch (err) {
                console.error('load companies', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // helpers
    const getInitials = (name = '') => {
        const parts = name.trim().split(/\s+/)
        if (parts.length === 0) return ''
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    const formatDate = (d) => {
        if (!d) return ''
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return ''
        return dt.toISOString().slice(0, 10) // YYYY-MM-DD
    }
    const capitalizeStatus = (s) => {
        if (!s) return ''
        const v = s.toString()
        return v.charAt(0).toUpperCase() + v.slice(1)
    }

    // Filter Logic
    const filteredCompanies = useMemo(() => {
        return companies.filter(company =>
            company.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [companies, searchQuery]);

    // Derived Pagination Values
    const totalItems = filteredCompanies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Get Current Page Data
    const pagedCompanies = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCompanies.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCompanies, currentPage, itemsPerPage]);

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedRows.length === pagedCompanies.length && pagedCompanies.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(pagedCompanies.map(c => c.id));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleStatusChange = (id, newStatus) => {
        setCompanies(prev => prev.map(company =>
            company.id === id ? { ...company, status: newStatus } : company
        ));
        setActiveActionId(null);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Pending': return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
            case 'Rejected': return 'bg-red-100 text-red-700';
            case 'Inactive': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const shimmerRows = Array.from({ length: itemsPerPage });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and search all registered companies.</p>
                </div>
            </div>

            <div
                className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col"
                style={{ minHeight: '500px' }}
            >
                <div className="p-4 border-b border-gray-100">
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
                </div>

                <div className="grow overflow-x-auto" style={{ minHeight: '400px' }}>
                    <table className="w-full text-sm text-left table-fixed">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleSelectAll}>
                                        {selectedRows.length === pagedCompanies.length && pagedCompanies.length > 0 ? (
                                            <MdCheckBox className="text-blue-600 w-5 h-5" />
                                        ) : (
                                            <MdCheckBoxOutlineBlank className="text-gray-400 w-5 h-5" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-[22%]">Company</th>
                                <th className="px-6 py-4 w-[18%]">Contact</th>
                                <th className="px-6 py-4 w-[22%]">Location</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Date Joined</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={loading} aria-label={loading ? 'Loading companies' : undefined}>
                            {loading ? (
                                shimmerRows.map((_, index) => (
                                    <tr key={`company-skeleton-${index}`}>
                                        <td className="px-6 py-4">
                                            <ShimmerBlock className="w-5 h-5 rounded" rounded="rounded" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <ShimmerBlock className="w-8 h-8 shrink-0" rounded="rounded-full" />
                                                <ShimmerBlock className="h-3.5 w-36 rounded-md" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ShimmerBlock className="h-3.5 w-36 rounded-md" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <ShimmerBlock className="h-3.5 w-40 rounded-md" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <ShimmerBlock className="mx-auto h-6 w-20 rounded-full" rounded="rounded-full" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <ShimmerBlock className="mx-auto h-8 w-8 rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : pagedCompanies.length > 0 ? (
                                pagedCompanies.map((company) => (
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
                                        <td className="px-6 py-4 font-medium text-gray-900 max-w-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 shrink-0 rounded flex items-center justify-center font-bold text-xs ${company.initialsColor} ${company.bgColor}`}>
                                                    {company.initials}
                                                </div>
                                                <span className="truncate" title={company.name}>
                                                    {truncateText(company.name, 40)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-0">
                                            <span className="block truncate" title={company.contact}>
                                                {truncateText(company.contact, 35)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs max-w-0">
                                            <span className="block truncate" title={company.location}>
                                                {truncateText(company.location, 45)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusStyle(company.status)}`}>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{company.dateJoined}</td>
                                        <td className="px-6 py-4 text-center relative">
                                            <button
                                                onClick={() => setActiveActionId(activeActionId === company.id ? null : company.id)}
                                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <MdMoreVert size={20} />
                                            </button>
                                            {activeActionId === company.id && (
                                                <div className="absolute right-12 top-0 w-32 bg-white rounded-md shadow-xl border border-gray-100 z-50 py-1 overflow-hidden">
                                                    {['Active', 'Inactive', 'Pending'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleStatusChange(company.id, s)}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-lg font-medium text-gray-900">No companies found</span>
                                            <p className="text-sm">Try adjusting your search terms.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm mt-auto font-sans">
                    <span className="text-gray-500 font-medium">
                        {totalItems > 0 ? (
                            <>Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-gray-900">{totalItems}</span> companies</>
                        ) : 'No results'}
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || totalItems === 0}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={20} />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === i + 1
                                    ? 'bg-[#E6F0F5] text-[#005580] border border-[#005580]'
                                    : 'border border-gray-200 hover:border-gray-400 text-gray-600'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalItems === 0}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Companies;
