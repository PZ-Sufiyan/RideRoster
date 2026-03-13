import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowBack,
    MdEdit,
    MdAdd,
    MdEmail,
    MdPhone,
    MdDateRange,
    MdCheckCircle,
    MdWarningAmber,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md';

// ─── Dummy Data ───────────────────────────────────────────────
const pa = {
    name: 'Amelia Harper',
    paId: 'PA-84321',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&h=128',
    email: 'amelia.h@email.com',
    phone: '+1 (555) 123-4567',
    memberSince: 'Oct 15, 2024',
};

const documents = [
    { name: 'Passport number', detail: 'Verified • Expires Dec 2026', state: 'verified' },
    { name: 'DBS Certificate', detail: 'Verified • Expires Dec 2026', state: 'verified' },
    { name: 'Safeguarding Certificate', detail: 'Verified • Expires Jan 2026', state: 'verified' },
    { name: 'PATS Certificate', detail: 'Expires Soon • Expires: Jan 2025', state: 'warning' },
    { name: 'Right to Work', detail: 'Verified • Valid', state: 'verified' },
    { name: 'Emergency Contact', detail: 'Verified • On File', state: 'verified' },
];

const allJobs = [
    { id: '#JB-4562', route: 'Northwood Elementary Run', date: '2025-11-19', status: 'Scheduled' },
    { id: '#JB-4558', route: 'Downtown Special Needs', date: '2025-11-18', status: 'Completed' },
    { id: '#JB-4551', route: 'Westside High School', date: '2025-11-17', status: 'Completed' },
    { id: '#JB-4545', route: 'Oakridge Community Center', date: '2025-11-16', status: 'Completed' },
    { id: '#JB-4539', route: 'City General Hospital', date: '2025-11-15', status: 'Cancelled' },
    { id: '#JB-4530', route: 'Northwood Elementary Run', date: '2025-11-14', status: 'Completed' },
    { id: '#JB-4521', route: 'Riverside Academy', date: '2025-11-13', status: 'Completed' },
    { id: '#JB-4510', route: 'City General Hospital', date: '2025-11-12', status: 'Completed' },
    { id: '#JB-4498', route: 'Westside High School', date: '2025-11-11', status: 'Completed' },
    { id: '#JB-4487', route: 'Downtown Special Needs', date: '2025-11-10', status: 'Completed' },
    { id: '#JB-4476', route: 'Oakridge Community Center', date: '2025-11-09', status: 'Completed' },
    { id: '#JB-4465', route: 'Northwood Elementary Run', date: '2025-11-08', status: 'Completed' },
    { id: '#JB-4454', route: 'City General Hospital', date: '2025-11-07', status: 'Cancelled' },
    { id: '#JB-4443', route: 'Riverside Academy', date: '2025-11-06', status: 'Completed' },
    { id: '#JB-4432', route: 'Westside High School', date: '2025-11-05', status: 'Completed' },
    { id: '#JB-4421', route: 'Downtown Special Needs', date: '2025-11-04', status: 'Completed' },
    { id: '#JB-4410', route: 'Oakridge Community Center', date: '2025-11-03', status: 'Completed' },
    { id: '#JB-4399', route: 'Northwood Elementary Run', date: '2025-11-02', status: 'Completed' },
    { id: '#JB-4388', route: 'City General Hospital', date: '2025-11-01', status: 'Completed' },
    { id: '#JB-4377', route: 'Riverside Academy', date: '2025-10-31', status: 'Completed' },
    { id: '#JB-4366', route: 'Westside High School', date: '2025-10-30', status: 'Completed' },
    { id: '#JB-4355', route: 'Downtown Special Needs', date: '2025-10-29', status: 'Completed' },
    { id: '#JB-4344', route: 'Oakridge Community Center', date: '2025-10-28', status: 'Completed' },
];

const JOB_STATUS_COLORS = {
    Scheduled: 'bg-blue-50 text-blue-600 border border-blue-200',
    Completed: 'bg-green-50 text-green-700 border border-green-200',
    Cancelled: 'bg-red-50 text-red-600 border border-red-200',
};

const ITEMS_PER_PAGE = 5;

// ─── Main Component ───────────────────────────────────────────
const PADetail = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(allJobs.length / ITEMS_PER_PAGE);
    const paginated = allJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, allJobs.length);

    return (
        <div className="space-y-5">

            {/* ── Back + Title Row ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate('/admin/users/pa')}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3"
                    >
                        <MdArrowBack size={18} />
                        Back to Assistants
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{pa.name}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Passenger Assistant Profile &amp; Activity</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <MdEdit size={16} />
                        Edit Profile
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm">
                        <MdAdd size={16} />
                        Assign to Job
                    </button>
                </div>
            </div>

            {/* ── Main Content: 2 columns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

                {/* ── Left Column ── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Profile Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] flex flex-col items-center text-center gap-3">
                        <img
                            src={pa.avatar}
                            alt={pa.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                        />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{pa.name}</h2>
                            <p className="text-sm text-gray-400 mt-0.5">ID: {pa.paId}</p>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                                <span className="text-xs font-medium text-green-700">{pa.status}</span>
                            </div>
                        </div>

                        <div className="w-full border-t border-gray-100 pt-4 space-y-3 text-left">
                            <div className="flex items-center gap-3 text-sm">
                                <MdEmail size={16} className="text-gray-400 shrink-0" />
                                <span className="text-gray-700">{pa.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MdPhone size={16} className="text-gray-400 shrink-0" />
                                <span className="text-gray-700">{pa.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MdDateRange size={16} className="text-gray-400 shrink-0" />
                                <span className="text-gray-700">Member since: {pa.memberSince}</span>
                            </div>
                        </div>
                    </div>

                    {/* Required Documents Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                        <h3 className="text-sm font-bold text-gray-800">Required Documents</h3>
                        <p className="text-xs text-gray-400 mt-0.5 mb-4">Details:</p>

                        <div className="space-y-4">
                            {documents.map((doc) => (
                                <div key={doc.name} className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                                        <p className={`text-xs mt-0.5 ${doc.state === 'warning' ? 'text-orange-500' : 'text-green-600'}`}>
                                            {doc.detail}
                                        </p>
                                    </div>
                                    {doc.state === 'warning' ? (
                                        <MdWarningAmber size={22} className="text-yellow-500 shrink-0 mt-0.5" />
                                    ) : (
                                        <MdCheckCircle size={22} className="text-green-500 shrink-0 mt-0.5" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Assigned Jobs ── */}
                <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-[#005580]">Assigned Jobs</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Job ID</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Route</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginated.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-[#005580] text-xs whitespace-nowrap">
                                            {job.id}
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{job.route}</td>
                                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{job.date}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${JOB_STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-500'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button className="text-xs font-semibold text-[#005580] hover:text-sky-900 hover:underline transition-colors">
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-500">
                            Showing {startItem} to {endItem} of {allJobs.length} jobs
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <MdChevronLeft size={16} />
                            </button>

                            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePage(page)}
                                    className={`min-w-[30px] h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors
                                        ${currentPage === page
                                            ? 'bg-[#005580] text-white border-[#005580]'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <MdChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PADetail;
