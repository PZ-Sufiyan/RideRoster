import React, { useEffect, useState } from 'react';
import {
    MdSearch,
    MdMoreHoriz,
    MdChevronLeft,
    MdChevronRight,
    MdArrowDropDown,
    MdArrowDropUp,
    MdCheckBoxOutlineBlank,
    MdCheckBox
} from 'react-icons/md';

import { Link } from 'react-router-dom';
import {
    getPendingCompaniesWithAdminNames,
    updateCompaniesStatusByIds,
    toShortCompanyId
} from '../../../../services/companyService';
import { ShimmerBlock } from '../../../../utils/Shimmer';
import { formatLocalDate } from '../../../../utils/dateTime';

const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    const value = String(text);
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

const PendingCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
    const [activeActionMenuId, setActiveActionMenuId] = useState(null);
    const [actionError, setActionError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchPendingCompanies = async () => {
        setIsLoading(true);
        try {
            const data = await getPendingCompaniesWithAdminNames();

            const mappedCompanies = (data || []).map((company) => ({
                id: company.id,
                name: company.company_name || '',
                submitted: formatLocalDate(company.created_at) || '',
                contact: {
                    name:
                        company.admin_full_names?.[0] ||
                        company.company_admins?.[0]?.full_name ||
                        '',
                    avatar: null
                },
                location: company.company_address || '',
                status: company.status || ''
            }));

            setCompanies(mappedCompanies);
        } catch (error) {
            console.error('Error fetching pending companies:', error);
            setCompanies([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingCompanies();
    }, []);

    // Filter companies based on search query
    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const shimmerRows = Array.from({ length: 8 });

    const toggleSelectAll = () => {
        setActionError('');
        if (selectedRows.length === filteredCompanies.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredCompanies.map(c => c.id));
        }
    };

    const toggleSelectRow = (id) => {
        setActionError('');
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedRows.length === 0) {
            setActionError('Please select at least one company first.');
            return;
        }

        const nextStatus = action === 'approve' ? 'approved' : 'rejected';

        try {
            setIsProcessing(true);
            setActionError('');
            await updateCompaniesStatusByIds(selectedRows, nextStatus);
            await fetchPendingCompanies();
            setSelectedRows([]);
            setIsBulkActionOpen(false);
        } catch (error) {
            console.error(`Error applying bulk ${action}:`, error);
            setActionError('Failed to update selected companies. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSingleAction = async (companyId, action) => {
        const nextStatus = action === 'approve' ? 'approved' : 'rejected';

        try {
            setIsProcessing(true);
            setActionError('');
            await updateCompaniesStatusByIds(companyId, nextStatus);
            await fetchPendingCompanies();
            setSelectedRows(prev => prev.filter(id => id !== companyId));
            setActiveActionMenuId(null);
        } catch (error) {
            console.error(`Error applying ${action}:`, error);
            setActionError('Failed to update company status. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Company Approvals</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and verify new company registrations.</p>
                </div>
                <Link to="/platform/companies" className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-transparent flex items-center gap-1">
                    View All Companies
                </Link>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col h-full">

                {/* Controls Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">

                    {/* Search */}
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
                                            disabled={selectedRows.length === 0 || isProcessing}
                                        >
                                            Approve Selected
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('reject')}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            disabled={selectedRows.length === 0 || isProcessing}
                                        >
                                            Reject Selected
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {actionError ? (
                    <div className="px-4 pt-3">
                        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {actionError}
                        </div>
                    </div>
                ) : null}

                {/* Table Container - Horizontal Scroll on Mobile */}
                <div className="overflow-x-auto min-h-100">
                    <table className="w-full text-sm text-left table-fixed">
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
                                <th className="px-6 py-4 w-[22%] cursor-pointer hover:text-gray-700 group">
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
                                <th className="px-6 py-4 w-[18%]">Contact Person</th>
                                <th className="px-6 py-4 w-[22%]">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={isLoading} aria-label={isLoading ? 'Loading pending companies' : undefined}>
                            {isLoading ? shimmerRows.map((_, index) => (
                                <tr key={`pending-company-skeleton-${index}`}>
                                    <td className="px-6 py-4">
                                        <ShimmerBlock className="w-5 h-5 rounded" rounded="rounded" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ShimmerBlock className="h-3.5 w-40 rounded-md" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <ShimmerBlock className="w-8 h-8 shrink-0" rounded="rounded-full" />
                                            <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <ShimmerBlock className="h-3.5 w-40 rounded-md" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ShimmerBlock className="h-6 w-20 rounded-full" rounded="rounded-full" />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ShimmerBlock className="ml-auto h-8 w-8 rounded-lg" />
                                    </td>
                                </tr>
                            )) : filteredCompanies.length > 0 ? (
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
                                        <td className="px-6 py-4 max-w-0">
                                            <Link
                                                to={`/platform/companies/review/${toShortCompanyId(company.id)}`}
                                                className="font-bold text-gray-900 hover:text-blue-600 hover:underline block truncate"
                                                title={company.name}
                                            >
                                                {truncateText(company.name, 40)}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{company.submitted}</td>
                                        <td className="px-6 py-4 max-w-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {company.contact.avatar ? (
                                                    <img
                                                        src={company.contact.avatar}
                                                        alt={company.contact.name}
                                                        className="w-8 h-8 shrink-0 rounded-full object-cover border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 shrink-0 rounded-full border border-gray-100 bg-gray-100" />
                                                )}
                                                <span
                                                    className="text-gray-700 font-medium truncate"
                                                    title={company.contact.name}
                                                >
                                                    {truncateText(company.contact.name, 35)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-0">
                                            <span className="block truncate" title={company.location}>
                                                {truncateText(company.location, 45)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100 capitalize">
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveActionMenuId(activeActionMenuId === company.id ? null : company.id)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                >
                                                    <MdMoreHoriz className="w-5 h-5" />
                                                </button>
                                                {activeActionMenuId === company.id && (
                                                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                                                        <button
                                                            onClick={() => handleSingleAction(company.id, 'approve')}
                                                            disabled={isProcessing}
                                                            className="block w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-60"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleSingleAction(company.id, 'reject')}
                                                            disabled={isProcessing}
                                                            className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
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