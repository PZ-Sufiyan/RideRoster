import React, { useState, useRef, useEffect } from 'react';
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
    MdOutlineFileDownload,
} from 'react-icons/md';

// ─── Dummy Data ───────────────────────────────────────────────
const allPAs = [
    { id: 1, paId: 'PA-00123', name: 'Theresa Webb', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64', email: 'theresa.webb@example.com', phone: '(201) 555-0123', assignedJobs: 5, status: 'Active', dateAdded: '2025-10-22' },
    { id: 2, paId: 'PA-00124', name: 'Jenny Wilson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64', email: 'jenny.wilson@example.com', phone: '(202) 555-0145', assignedJobs: 8, status: 'Active', dateAdded: '2025-10-15' },
    { id: 3, paId: 'PA-00125', name: 'Robert Fox', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64', email: 'robert.fox@example.com', phone: '(203) 555-0167', assignedJobs: 3, status: 'Active', dateAdded: '2025-09-30' },
    { id: 4, paId: 'PA-00126', name: 'Annette Black', avatar: 'https://images.unsplash.com/photo-1531746020798-e795c5399c7c?auto=format&fit=crop&w=64&h=64', email: 'annette.black@example.com', phone: '(204) 555-0189', assignedJobs: 0, status: 'Inactive', dateAdded: '2025-09-01' },
    { id: 5, paId: 'PA-00127', name: 'Kristin Watson', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&h=64', email: 'kristin.watson@example.com', phone: '(205) 555-0112', assignedJobs: 6, status: 'Active', dateAdded: '2025-08-20' },
    { id: 6, paId: 'PA-00128', name: 'Eleanor Pena', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64', email: 'eleanor.pena@example.com', phone: '(206) 555-0134', assignedJobs: 4, status: 'Active', dateAdded: '2025-08-10' },
    { id: 7, paId: 'PA-00129', name: 'Marvin McKinney', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=64&h=64', email: 'marvin.mckinney@example.com', phone: '(207) 555-0156', assignedJobs: 2, status: 'Inactive', dateAdded: '2025-07-28' },
    { id: 8, paId: 'PA-00130', name: 'Jane Cooper', avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=64&h=64', email: 'jane.cooper@example.com', phone: '(208) 555-0178', assignedJobs: 7, status: 'Active', dateAdded: '2025-07-15' },
    { id: 9, paId: 'PA-00131', name: 'Jacob Jones', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64', email: 'jacob.jones@example.com', phone: '(209) 555-0190', assignedJobs: 9, status: 'Active', dateAdded: '2025-07-03' },
    { id: 10, paId: 'PA-00132', name: 'Albert Flores', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64', email: 'albert.flores@example.com', phone: '(210) 555-0111', assignedJobs: 1, status: 'Inactive', dateAdded: '2025-06-22' },
    // pages 2-10 (87 more to reach 97)
    ...Array.from({ length: 87 }, (_, i) => ({
        id: i + 11,
        paId: `PA-001${(i + 33).toString().padStart(2, '0')}`,
        name: `Passenger Assistant ${i + 11}`,
        avatar: `https://i.pravatar.cc/64?img=${(i % 70) + 1}`,
        email: `pa${i + 11}@example.com`,
        phone: `(300) 555-0${String(i).padStart(3, '0')}`,
        assignedJobs: Math.floor(Math.random() * 12),
        status: i % 3 === 0 ? 'Inactive' : 'Active',
        dateAdded: '2025-01-01',
    })),
];

const STATUS_COLORS = {
    Active: 'bg-green-50 text-green-700 border border-green-200',
    Inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
    Suspended: 'bg-red-50 text-red-600 border border-red-200',
};

const ITEMS_PER_PAGE = 10;

// ─── Component ────────────────────────────────────────────────
const PAListPage = () => {
    const navigate = useNavigate();
    const [pas, setPas] = useState(allPAs);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [selectedRows, setSelectedRows] = useState([]);
    const [openActionId, setOpenActionId] = useState(null);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const actionRef = useRef(null);
    const statusRef = useRef(null);

    const statuses = ['All Statuses', 'Active', 'Inactive', 'Suspended'];

    useEffect(() => {
        const handler = (e) => {
            if (actionRef.current && !actionRef.current.contains(e.target)) setOpenActionId(null);
            if (statusRef.current && !statusRef.current.contains(e.target)) setIsStatusOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Filter
    const filtered = pas.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All Statuses' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

    const handleAction = (action, paId) => {
        const statusMap = { Approve: 'Active', Active: 'Active', Reject: 'Inactive', Suspend: 'Suspended' };
        setPas((prev) => prev.map((p) => p.id === paId ? { ...p, status: statusMap[action] || p.status } : p));
        setOpenActionId(null);
    };

    const toggleRow = (id) => setSelectedRows((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
    const toggleAll = () => {
        const pageIds = paginated.map((p) => p.id);
        const allSelected = pageIds.every((id) => selectedRows.includes(id));
        setSelectedRows((prev) =>
            allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
        );
    };
    const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedRows.includes(p.id));

    const handlePage = (page) => {
        if (page >= 1 && page <= totalPages) { setCurrentPage(page); setSelectedRows([]); }
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [1, 2, 3];
        if (currentPage > 4) pages.push('...');
        if (currentPage > 3 && currentPage < totalPages - 1) pages.push(currentPage);
        if (!pages.includes(totalPages)) pages.push(totalPages);
        return [...new Set(pages)];
    };

    const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

    return (
        <div className="space-y-5">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Passenger Assistants</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all passenger assistants in your company.</p>
                </div>
                <button
                    onClick={() => navigate('/admin/users/pa/add')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm shrink-0"
                >
                    <MdAdd size={18} />
                    Add New PA
                </button>
            </div>

            {/* ── Card ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MdSearch className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or email"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-56"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative" ref={statusRef}>
                            <button
                                onClick={() => setIsStatusOpen((o) => !o)}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                {statusFilter}
                                <MdKeyboardArrowDown size={16} className="text-gray-400" />
                            </button>
                            {isStatusOpen && (
                                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                    {statuses.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setStatusFilter(s); setIsStatusOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export */}
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        <MdOutlineFileDownload size={16} />
                        Export
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-gray-100 bg-gray-50/30">
                            <tr>
                                <th className="px-4 py-3.5 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleAll}>
                                        {allPageSelected
                                            ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                            : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Jobs</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Added</th>
                                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.length > 0 ? paginated.map((pa) => (
                                <tr key={pa.id} className="hover:bg-gray-50/60 transition-colors">
                                    {/* Checkbox */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center cursor-pointer" onClick={() => toggleRow(pa.id)}>
                                            {selectedRows.includes(pa.id)
                                                ? <MdCheckBox className="text-blue-600 w-5 h-5" />
                                                : <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />}
                                        </div>
                                    </td>

                                    {/* Name + PA ID */}
                                    <td className="px-4 py-3.5">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => navigate(`/admin/users/pa/${pa.id}`)}
                                        >
                                            <img
                                                src={pa.avatar}
                                                alt={pa.name}
                                                className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">{pa.name}</p>
                                                <p className="text-xs text-gray-400">{pa.paId}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact Info */}
                                    <td className="px-4 py-3.5">
                                        <p className="text-gray-700 text-sm">{pa.email}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{pa.phone}</p>
                                    </td>

                                    {/* Assigned Jobs */}
                                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                                        {pa.assignedJobs} Active
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[pa.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {pa.status}
                                        </span>
                                    </td>

                                    {/* Date Added */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{pa.dateAdded}</td>

                                    {/* Actions */}
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="relative flex justify-end" ref={openActionId === pa.id ? actionRef : null}>
                                            <button
                                                onClick={() => setOpenActionId(openActionId === pa.id ? null : pa.id)}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                            >
                                                <MdMoreVert size={18} />
                                            </button>
                                            {openActionId === pa.id && (
                                                <div className="absolute right-0 top-8 w-36 bg-white border border-gray-100 rounded-lg shadow-lg z-30">
                                                    {['Approve', 'Reject', 'Suspend', 'Active'].map((action) => (
                                                        <button
                                                            key={action}
                                                            onClick={() => handleAction(action, pa.id)}
                                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg
                                                                ${action === 'Approve' ? 'text-green-600 hover:bg-green-50' : ''}
                                                                ${action === 'Reject' ? 'text-red-600 hover:bg-red-50' : ''}
                                                                ${action === 'Suspend' ? 'text-orange-600 hover:bg-orange-50' : ''}
                                                                ${action === 'Active' ? 'text-blue-600 hover:bg-blue-50' : ''}
                                                            `}
                                                        >
                                                            {action}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        No passenger assistants found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing results{' '}
                        <span className="font-medium text-gray-900">{startItem} to {endItem}</span>
                        {' '}of{' '}
                        <span className="font-medium text-gray-900">{filtered.length}</span>
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdChevronLeft size={18} />
                        </button>

                        {getPageNumbers().map((page, i) =>
                            page === '...' ? (
                                <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">..</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => handlePage(page)}
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors border
                                        ${currentPage === page
                                            ? 'bg-[#005580] text-white border-[#005580] shadow-sm'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => handlePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
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

export default PAListPage;
