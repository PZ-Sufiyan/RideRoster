import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCheckBoxOutlineBlank,
    MdCheckBox,
    MdKeyboardArrowDown,
    MdChevronLeft,
    MdChevronRight,
    MdAdd,
} from 'react-icons/md';

/* ─── Data ───────────────────────────────────────────────── */
const allJobs = [
    { id: '#J843-A1', name: 'Northwood Elementary Run',  datetime: 'Nov 18, 2025 at 07:30 AM', driver: 'Unassigned',     status: 'Pending'   },
    { id: '#J842-B3', name: 'Downtown Express Loop',      datetime: 'Nov 18, 2025 at 08:00 AM', driver: 'Cody Fisher',    status: 'Assigned'  },
    { id: '#J841-C1', name: 'Westside High School PM',    datetime: 'Nov 17, 2025 at 03:45 PM', driver: 'Esther Howard',  status: 'Completed' },
    { id: '#J840-D5', name: 'City Center Special Needs',  datetime: 'Nov 17, 2025 at 11:00 AM', driver: 'Robert Fox',     status: 'Completed' },
    { id: '#J839-A9', name: 'Suburban Connect AM',        datetime: 'Nov 17, 2025 at 07:15 AM', driver: 'Kristin Watson', status: 'Cancelled' },
    { id: '#J838-B2', name: 'Eastside Academy Run',       datetime: 'Nov 16, 2025 at 08:15 AM', driver: 'Guy Hawkins',    status: 'Completed' },
    { id: '#J837-C4', name: 'Central Park Loop',          datetime: 'Nov 16, 2025 at 09:00 AM', driver: 'Floyd Miles',    status: 'Assigned'  },
    { id: '#J836-D1', name: 'Harbor View Express',        datetime: 'Nov 15, 2025 at 07:45 AM', driver: 'Jenny Wilson',   status: 'Pending'   },
    { id: '#J835-A3', name: 'Highland School AM',         datetime: 'Nov 15, 2025 at 08:30 AM', driver: 'Unassigned',     status: 'Pending'   },
    { id: '#J834-B6', name: 'Riverside Connect PM',       datetime: 'Nov 14, 2025 at 03:15 PM', driver: 'Marvin McKinney',status: 'Completed' },
    { id: '#J833-C7', name: 'Metro Station Shuttle',      datetime: 'Nov 14, 2025 at 07:00 AM', driver: 'Jane Cooper',    status: 'Cancelled' },
    { id: '#J832-D8', name: 'Southgate Elementary Run',   datetime: 'Nov 13, 2025 at 08:00 AM', driver: 'Cody Fisher',    status: 'Completed' },
    { id: '#J831-A5', name: 'Lakeview Special Needs',     datetime: 'Nov 13, 2025 at 10:00 AM', driver: 'Esther Howard',  status: 'Assigned'  },
    { id: '#J830-B9', name: 'Northgate Academy Loop',     datetime: 'Nov 12, 2025 at 07:30 AM', driver: 'Robert Fox',     status: 'Completed' },
    { id: '#J829-C2', name: 'Downtown Charter School',    datetime: 'Nov 12, 2025 at 08:45 AM', driver: 'Unassigned',     status: 'Pending'   },
    { id: '#J828-D3', name: 'Oak Creek AM Run',           datetime: 'Nov 11, 2025 at 07:15 AM', driver: 'Kristin Watson', status: 'Completed' },
    { id: '#J827-A7', name: 'Westfield Express',          datetime: 'Nov 11, 2025 at 09:00 AM', driver: 'Guy Hawkins',    status: 'Assigned'  },
    { id: '#J826-B4', name: 'University Loop PM',         datetime: 'Nov 10, 2025 at 04:00 PM', driver: 'Floyd Miles',    status: 'Completed' },
    { id: '#J825-C6', name: 'Airport Connect Shuttle',    datetime: 'Nov 10, 2025 at 05:30 AM', driver: 'Jenny Wilson',   status: 'Cancelled' },
    { id: '#J824-D2', name: 'Pinewood School Run',        datetime: 'Nov 09, 2025 at 07:45 AM', driver: 'Marvin McKinney',status: 'Completed' },
    { id: '#J823-A8', name: 'Clearwater Academy AM',      datetime: 'Nov 09, 2025 at 08:00 AM', driver: 'Jane Cooper',    status: 'Assigned'  },
    { id: '#J822-B1', name: 'Meadowbrook Loop',           datetime: 'Nov 08, 2025 at 07:30 AM', driver: 'Cody Fisher',    status: 'Completed' },
    { id: '#J821-C9', name: 'Springfield Special Needs',  datetime: 'Nov 08, 2025 at 10:30 AM', driver: 'Unassigned',     status: 'Pending'   },
    { id: '#J820-D4', name: 'Hillcrest School PM',        datetime: 'Nov 07, 2025 at 03:30 PM', driver: 'Esther Howard',  status: 'Completed' },
    { id: '#J819-A6', name: 'Bayside Express AM',         datetime: 'Nov 07, 2025 at 07:00 AM', driver: 'Robert Fox',     status: 'Cancelled' },
    { id: '#J818-B5', name: 'Greenfield Academy Run',     datetime: 'Nov 06, 2025 at 08:15 AM', driver: 'Kristin Watson', status: 'Completed' },
    { id: '#J817-C3', name: 'Sunridge Loop',              datetime: 'Nov 06, 2025 at 07:45 AM', driver: 'Guy Hawkins',    status: 'Assigned'  },
    { id: '#J816-D6', name: 'Westmoor Special Needs',     datetime: 'Nov 05, 2025 at 11:00 AM', driver: 'Unassigned',     status: 'Pending'   },
    { id: '#J815-A4', name: 'Fairview School AM',         datetime: 'Nov 05, 2025 at 07:30 AM', driver: 'Floyd Miles',    status: 'Completed' },
    { id: '#J814-B7', name: 'Lakeside Connect PM',        datetime: 'Nov 04, 2025 at 03:45 PM', driver: 'Jenny Wilson',   status: 'Completed' },
    { id: '#J813-C8', name: 'Ridgemont Academy Loop',     datetime: 'Nov 04, 2025 at 08:00 AM', driver: 'Marvin McKinney',status: 'Cancelled' },
    { id: '#J812-D9', name: 'Maplewood Express',          datetime: 'Nov 03, 2025 at 07:15 AM', driver: 'Jane Cooper',    status: 'Completed' },
    { id: '#J811-A2', name: 'Creston School Run',         datetime: 'Nov 03, 2025 at 08:30 AM', driver: 'Cody Fisher',    status: 'Assigned'  },
    { id: '#J810-B8', name: 'Northern Valley AM',         datetime: 'Nov 02, 2025 at 07:00 AM', driver: 'Esther Howard',  status: 'Completed' },
    { id: '#J809-C5', name: 'Central District Loop',      datetime: 'Nov 02, 2025 at 09:15 AM', driver: 'Unassigned',     status: 'Pending'   },
    { id: '#J808-D7', name: 'Brookfield School PM',       datetime: 'Nov 01, 2025 at 03:00 PM', driver: 'Robert Fox',     status: 'Completed' },
    { id: '#J807-A3', name: 'Willowbrook Express',        datetime: 'Nov 01, 2025 at 08:00 AM', driver: 'Kristin Watson', status: 'Assigned'  },
    { id: '#J806-B6', name: 'Silverton AM Run',           datetime: 'Oct 31, 2025 at 07:30 AM', driver: 'Guy Hawkins',    status: 'Completed' },
    { id: '#J805-C1', name: 'Eastbrook Academy Loop',     datetime: 'Oct 31, 2025 at 08:45 AM', driver: 'Floyd Miles',    status: 'Cancelled' },
    { id: '#J804-D4', name: 'Sunnyside School Run',       datetime: 'Oct 30, 2025 at 07:15 AM', driver: 'Jenny Wilson',   status: 'Completed' },
    { id: '#J803-A9', name: 'Cloverdale Special Needs',   datetime: 'Oct 30, 2025 at 10:00 AM', driver: 'Marvin McKinney',status: 'Completed' },
    { id: '#J802-B2', name: 'Fireside Connect AM',        datetime: 'Oct 29, 2025 at 07:45 AM', driver: 'Jane Cooper',    status: 'Assigned'  },
];

const STATUS_STYLES = {
    Pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
    Assigned:  'bg-purple-50 text-purple-700 border border-purple-200',
    Completed: 'bg-green-50 text-green-700 border border-green-200',
    Cancelled: 'bg-red-50 text-red-500 border border-red-200',
};

const STATUSES = ['All Statuses', 'Pending', 'Assigned', 'Completed', 'Cancelled'];
const ITEMS_PER_PAGE = 5;

/* ─── Component ──────────────────────────────────────────── */
const SubAdmin_Jobs = () => {
    const navigate = useNavigate();
    const [dateRange, setDateRange]           = useState('');
    const [statusFilter, setStatusFilter]     = useState('All Statuses');
    const [appliedStatus, setAppliedStatus]   = useState('All Statuses');
    const [appliedDate, setAppliedDate]       = useState('');
    const [statusOpen, setStatusOpen]         = useState(false);
    const [selectedRows, setSelectedRows]     = useState([]);
    const [currentPage, setCurrentPage]       = useState(1);
    const statusRef = useRef(null);

    // Close status dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (statusRef.current && !statusRef.current.contains(e.target)) {
                setStatusOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = allJobs.filter((j) =>
        appliedStatus === 'All Statuses' || j.status === appliedStatus
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleRow = (id) =>
        setSelectedRows((p) => p.includes(id) ? p.filter((r) => r !== id) : [...p, id]);

    const toggleAll = () => {
        const ids = paginated.map((j) => j.id);
        const allSel = ids.every((id) => selectedRows.includes(id));
        setSelectedRows((p) => allSel ? p.filter((id) => !ids.includes(id)) : [...new Set([...p, ...ids])]);
    };

    const allPageSelected = paginated.length > 0 && paginated.every((j) => selectedRows.includes(j.id));

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) { setCurrentPage(page); setSelectedRows([]); }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const handleApply = () => {
        setAppliedStatus(statusFilter);
        setAppliedDate(dateRange);
        setCurrentPage(1);
        setSelectedRows([]);
    };

    const handleClear = () => {
        setDateRange('');
        setStatusFilter('All Statuses');
        setAppliedStatus('All Statuses');
        setAppliedDate('');
        setCurrentPage(1);
        setSelectedRows([]);
    };

    return (
        <div className="space-y-5">

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900">Job List</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review, assign, and manage all scheduled jobs.</p>
                </div>
                <button onClick={() => navigate('/subadmin/jobs/create')} className="flex items-center gap-2 px-4 py-2 bg-[#005C7A] hover:bg-[#004a63] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                    <MdAdd size={18} />
                    Create Job
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                    {/* Date Range */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date Range</label>
                        <input
                            type="text"
                            placeholder="Select date range"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] bg-white"
                        />
                    </div>

                    {/* Status Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                        <div className="relative" ref={statusRef}>
                            <button
                                onClick={() => setStatusOpen((o) => !o)}
                                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                            >
                                <span>{statusFilter}</span>
                                <MdKeyboardArrowDown size={18} className="text-gray-400" />
                            </button>
                            {statusOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === s ? 'font-semibold text-[#005C7A]' : 'text-gray-700'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Apply Filters */}
                    <button
                        onClick={handleApply}
                        className="px-6 py-2 bg-[#005C7A] hover:bg-[#004a63] text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        Apply Filters
                    </button>

                    {/* Clear */}
                    <button
                        onClick={handleClear}
                        className="px-6 py-2 border border-gray-200 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleAll}>
                                        {allPageSelected
                                            ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                            : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                        }
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job ID</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Name</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.length > 0 ? paginated.map((job) => (
                                <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center cursor-pointer" onClick={() => toggleRow(job.id)}>
                                            {selectedRows.includes(job.id)
                                                ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                                : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                            }
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-500 font-mono text-xs whitespace-nowrap">{job.id}</td>
                                    <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{job.name}</td>
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{job.datetime}</td>
                                    <td className={`px-4 py-3.5 whitespace-nowrap font-medium ${job.driver === 'Unassigned' ? 'text-gray-400' : 'text-gray-800'}`}>
                                        {job.driver}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[job.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <button className="text-[13px] font-semibold text-[#005C7A] hover:underline whitespace-nowrap">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        No jobs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-4 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of{' '}
                        <span className="font-medium text-gray-900">{filtered.length}</span> jobs
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={18} />
                        </button>

                        {getPageNumbers().map((page, i) =>
                            page === '...' ? (
                                <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors border
                                        ${currentPage === page
                                            ? 'bg-[#005C7A] text-white border-[#005C7A] shadow-sm'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SubAdmin_Jobs;
