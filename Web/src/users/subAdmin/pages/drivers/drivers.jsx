import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdSearch,
    MdFilterList,
    MdAdd,
    MdMoreVert,
    MdChevronLeft,
    MdChevronRight,
    MdCheckBoxOutlineBlank,
    MdCheckBox,
    MdKeyboardArrowDown,
} from 'react-icons/md';

const allDrivers = [
    { id: 1, name: 'Cody Fisher',    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=64&h=64', contact: '(201) 555-0124', license: 'D123-456-7890', status: 'Active',            dateAdded: '2025-10-22' },
    { id: 2, name: 'Robert Fox',     avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64', contact: '(308) 555-0121', license: 'E567-890-1234', status: 'Pending Applicant', dateAdded: '2025-09-15' },
    { id: 3, name: 'Kristin Watson', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&h=64', contact: '(229) 555-0109', license: 'F901-234-5678', status: 'Pending Documents', dateAdded: '2025-09-01' },
    { id: 4, name: 'Guy Hawkins',    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64', contact: '(480) 555-0103', license: 'G234-567-8901', status: 'Active',            dateAdded: '2025-08-11' },
    { id: 5, name: 'Floyd Miles',    avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=64&h=64', contact: '(207) 555-0119', license: 'H567-890-1234', status: 'Suspended',         dateAdded: '2025-07-30' },
    { id: 6, name: 'Jenny Wilson',   avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64', contact: '(320) 555-0192', license: 'I890-123-4567', status: 'Active',            dateAdded: '2025-07-10' },
    { id: 7, name: 'Marvin McKinney',avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=64&h=64', contact: '(405) 555-0171', license: 'J123-456-7890', status: 'Pending Applicant', dateAdded: '2025-06-22' },
    { id: 8, name: 'Jane Cooper',    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=64&h=64', contact: '(217) 555-0155', license: 'K456-789-0123', status: 'Active',            dateAdded: '2025-06-01' },
    { id: 9, name: 'Jacob Jones',    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64', contact: '(503) 555-0136', license: 'L789-012-3456', status: 'Suspended',         dateAdded: '2025-05-14' },
    { id: 10, name: 'Eleanor Pena',  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64', contact: '(615) 555-0118', license: 'M012-345-6789', status: 'Active',            dateAdded: '2025-04-30' },
    { id: 11, name: 'Albert Flores', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64', contact: '(312) 555-0143', license: 'N345-678-9012', status: 'Pending Documents', dateAdded: '2025-04-15' },
    { id: 12, name: 'Bessie Cooper', avatar: 'https://images.unsplash.com/photo-1531746020798-e795c5399c7c?auto=format&fit=crop&w=64&h=64', contact: '(702) 555-0127', license: 'O678-901-2345', status: 'Active',            dateAdded: '2025-04-02' },
    { id: 13, name: 'Theresa Webb',  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64', contact: '(214) 555-0112', license: 'P901-234-5678', status: 'Suspended',         dateAdded: '2025-03-20' },
    { id: 14, name: 'Ronald Richards',avatar:'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=64&h=64', contact: '(404) 555-0148', license: 'Q234-567-8901', status: 'Active',            dateAdded: '2025-03-08' },
    { id: 15, name: 'Dianne Russell', avatar:'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=64&h=64', contact: '(626) 555-0164', license: 'R567-890-1234', status: 'Pending Applicant', dateAdded: '2025-02-25' },
    { id: 16, name: 'Ralph Edwards',  avatar:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64', contact: '(818) 555-0133', license: 'S890-123-4567', status: 'Active',            dateAdded: '2025-02-14' },
    { id: 17, name: 'Arlene McCoy',   avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64', contact: '(713) 555-0119', license: 'T123-456-7890', status: 'Pending Documents', dateAdded: '2025-01-30' },
    { id: 18, name: 'Guy Hawkins',    avatar:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64', contact: '(602) 555-0145', license: 'U456-789-0123', status: 'Active',            dateAdded: '2025-01-18' },
    { id: 19, name: 'Cody Fisher',    avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=64&h=64', contact: '(206) 555-0122', license: 'V789-012-3456', status: 'Suspended',         dateAdded: '2025-01-05' },
    { id: 20, name: 'Jenny Wilson',   avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64', contact: '(415) 555-0138', license: 'W012-345-6789', status: 'Active',            dateAdded: '2024-12-22' },
    { id: 21, name: 'Robert Fox',     avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64', contact: '(512) 555-0161', license: 'X345-678-9012', status: 'Pending Applicant', dateAdded: '2024-12-10' },
    { id: 22, name: 'Kristin Watson', avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&h=64', contact: '(757) 555-0147', license: 'Y678-901-2345', status: 'Active',            dateAdded: '2024-11-28' },
    { id: 23, name: 'Floyd Miles',    avatar:'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=64&h=64', contact: '(901) 555-0153', license: 'Z901-234-5678', status: 'Active',            dateAdded: '2024-11-14' },
    { id: 24, name: 'Jacob Jones',    avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64', contact: '(336) 555-0129', license: 'A234-567-8901', status: 'Pending Documents', dateAdded: '2024-11-01' },
    { id: 25, name: 'Eleanor Pena',   avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64', contact: '(404) 555-0175', license: 'B567-890-1234', status: 'Active',            dateAdded: '2024-10-20' },
];

const STATUS_COLORS = {
    'Active':            'bg-green-50 text-green-700 border border-green-200',
    'Pending Applicant': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    'Pending Documents': 'bg-orange-50 text-orange-600 border border-orange-200',
    'Suspended':         'bg-red-50 text-red-600 border border-red-200',
};

const ITEMS_PER_PAGE = 5;

const SubAdmin_Drivers = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState(allDrivers);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedRows, setSelectedRows] = useState([]);
    const [openActionId, setOpenActionId] = useState(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const actionRef = useRef(null);
    const statusRef = useRef(null);

    const statuses = ['All', 'Active', 'Pending Applicant', 'Pending Documents', 'Suspended'];

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (actionRef.current && !actionRef.current.contains(e.target)) {
                setOpenActionId(null);
            }
            if (statusRef.current && !statusRef.current.contains(e.target)) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = drivers.filter((d) => {
        const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || d.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleStatusChange = (action, driverId) => {
        const statusMap = { Approve: 'Active', Suspend: 'Suspended', Active: 'Active', Reject: 'Suspended' };
        setDrivers((prev) =>
            prev.map((d) => d.id === driverId ? { ...d, status: statusMap[action] || d.status } : d)
        );
        setOpenActionId(null);
    };

    const toggleRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const pageIds = paginated.map((d) => d.id);
        const allSelected = pageIds.every((id) => selectedRows.includes(id));
        setSelectedRows((prev) =>
            allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
        );
    };

    const allPageSelected = paginated.length > 0 && paginated.every((d) => selectedRows.includes(d.id));

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setSelectedRows([]);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Search + Filter */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MdSearch className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-56"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative" ref={statusRef}>
                        <button
                            onClick={() => setIsStatusDropdownOpen((o) => !o)}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <MdFilterList className="text-gray-500" size={16} />
                            Status: {statusFilter}
                            <MdKeyboardArrowDown className="text-gray-400" size={16} />
                        </button>
                        {isStatusDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                {statuses.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setIsStatusDropdownOpen(false); setCurrentPage(1); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Driver Button */}
                <button className="flex items-center gap-2 px-4 py-2 bg-[#005C7A] text-white rounded-lg text-sm font-medium hover:bg-[#004a63] transition-colors shadow-sm">
                    <MdAdd size={18} />
                    Add Driver
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <div className="flex items-center cursor-pointer" onClick={toggleAll}>
                                        {allPageSelected ? (
                                            <MdCheckBox className="text-blue-600 w-5 h-5" />
                                        ) : (
                                            <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver Name</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">License No.</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Added</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.length > 0 ? paginated.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50/60 transition-colors">
                                    {/* Checkbox */}
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center cursor-pointer" onClick={() => toggleRow(driver.id)}>
                                            {selectedRows.includes(driver.id) ? (
                                                <MdCheckBox className="text-blue-600 w-5 h-5" />
                                            ) : (
                                                <MdCheckBoxOutlineBlank className="text-gray-300 w-5 h-5" />
                                            )}
                                        </div>
                                    </td>

                                    {/* Name + Avatar */}
                                    <td className="px-4 py-3.5">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => navigate(`/subadmin/drivers/${driver.id}`)}
                                        >
                                            <img
                                                src={driver.avatar}
                                                alt={driver.name}
                                                className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0"
                                            />
                                            <span className="font-medium text-gray-900 whitespace-nowrap group-hover:text-blue-600 transition-colors">{driver.name}</span>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{driver.contact}</td>

                                    {/* License */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap font-mono text-xs">{driver.license}</td>

                                    {/* Status Badge */}
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[driver.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {driver.status}
                                        </span>
                                    </td>

                                    {/* Date Added */}
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{driver.dateAdded}</td>

                                    {/* Actions */}
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="relative flex justify-end" ref={openActionId === driver.id ? actionRef : null}>
                                            <button
                                                onClick={() => setOpenActionId(openActionId === driver.id ? null : driver.id)}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                            >
                                                <MdMoreVert size={18} />
                                            </button>

                                            {openActionId === driver.id && (
                                                <div className="absolute right-0 top-8 w-36 bg-white border border-gray-100 rounded-lg shadow-lg z-30">
                                                    {['Approve', 'Reject', 'Suspend', 'Active'].map((action) => (
                                                        <button
                                                            key={action}
                                                            onClick={() => handleStatusChange(action, driver.id)}
                                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50
                                                                ${action === 'Approve' ? 'text-green-600 hover:bg-green-50' : ''}
                                                                ${action === 'Reject'  ? 'text-red-600 hover:bg-red-50'   : ''}
                                                                ${action === 'Suspend' ? 'text-orange-600 hover:bg-orange-50' : ''}
                                                                ${action === 'Active'  ? 'text-blue-600 hover:bg-blue-50'  : ''}
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
                                        No drivers found matching your search.
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
                        <span className="font-medium text-gray-900">{filtered.length}</span> results
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

export default SubAdmin_Drivers;
