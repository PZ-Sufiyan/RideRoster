import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowBack,
    MdEdit,
    MdMessage,
    MdCalendarToday,
    MdDirectionsBus,
    MdSecurity,
    MdCreditCard,
    MdImage,
    MdHelpOutline,
    MdCamera,
    MdEventSeat,
    MdBuild,
    MdLocalOffer,
    MdShield,
} from 'react-icons/md';

// ─── Dummy Data ──────────────────────────────────────────────
const driver = {
    name: 'James Rodriguez',
    id: 'DRV-84321',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&h=128',
    email: 'james.r@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, USA',
    memberSince: 'Oct 15, 2023',
    performance: {
        totalJobs: 214,
        acceptanceRate: 98,
        onTimeRate: 99,
    },
    jobHistory: [
        { id: 'JOB-98765', date: '2025-11-17', route: 'Northwood Elementary Run', status: 'Completed' },
        { id: 'JOB-98764', date: '2025-11-16', route: 'Westside High AM Pickup', status: 'Completed' },
        { id: 'JOB-98762', date: '2025-11-15', route: 'Downtown Charter School', status: 'Completed' },
        { id: 'JOB-98760', date: '2025-11-14', route: 'Oak Creek Academy PM', status: 'Completed' },
    ],
};

// ─── Small Helpers ───────────────────────────────────────────
const DocumentImage = ({ label, sub }) => (
    <div className="flex flex-col items-center gap-1.5 py-5 flex-1 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded bg-gray-100 text-gray-400">
            {sub ? <MdHelpOutline size={22} /> : <MdImage size={22} />}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        Verified: 'bg-green-50 text-green-700 border border-green-200',
        Void: 'bg-gray-100 text-gray-500 border border-gray-200',
        Complete: 'bg-green-50 text-green-700 border border-green-200',
    };
    return (
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    );
};

const ExpiryDateBtn = () => (
    <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
        <MdCalendarToday size={13} />
        Expiry Date
    </button>
);

const DocSection = ({ icon: Icon, title, subtitle, status, children, extra }) => (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon size={15} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">{title}</p>
                    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge status={status} />
                <ExpiryDateBtn />
            </div>
        </div>

        {/* Content */}
        {children}

        {/* Optional bottom row */}
        {extra && (
            <div className="px-4 py-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                {extra}
            </div>
        )}
    </div>
);

// ─── Main Component ──────────────────────────────────────────
const DriverDetail = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">

            {/* ── Back navigation ── */}
            <button
                onClick={() => navigate('/admin/users/drivers')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors -mb-2"
            >
                <MdArrowBack size={18} />
                Back to Drivers List
            </button>

            {/* ── Driver Header ── */}
            <div className="bg-white border border-gray-100 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <img
                            src={driver.avatar}
                            alt={driver.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                        />
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">{driver.name}</h1>
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                {driver.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">Driver ID: {driver.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <MdMessage size={16} />
                        Send Message
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm">
                        <MdEdit size={16} />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* ── Driver Details + Performance ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Driver Details */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                    <h2 className="text-sm font-bold text-gray-800 mb-4">Driver Details</h2>
                    <div className="space-y-3 text-sm">
                        {[
                            { label: 'Email Address', value: driver.email },
                            { label: 'Phone Number', value: driver.phone },
                            { label: 'Address', value: driver.address },
                            { label: 'Member Since', value: driver.memberSince },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-start gap-4">
                                <span className="text-gray-400 shrink-0">{label}</span>
                                <span className="text-gray-800 font-medium text-right">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Overview */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                    <h2 className="text-sm font-bold text-gray-800 mb-4">Performance Overview</h2>
                    <div className="grid grid-cols-3 divide-x divide-gray-100">
                        <div className="flex flex-col items-center gap-1 px-4 first:pl-0">
                            <span className="text-3xl font-bold text-gray-900">{driver.performance.totalJobs}</span>
                            <span className="text-xs text-gray-400">Total Jobs</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-3xl font-bold text-green-600">{driver.performance.acceptanceRate}%</span>
                            <span className="text-xs text-gray-400">Acceptance Rate</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4">
                            <span className="text-3xl font-bold text-green-600">{driver.performance.onTimeRate}%</span>
                            <span className="text-xs text-gray-400">On-Time Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Compliance & Documents ── */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] space-y-4">
                <h2 className="text-sm font-bold text-gray-800">Compliance &amp; Documents</h2>

                {/* Driving License */}
                <DocSection icon={MdCreditCard} title="Driving License" subtitle="Required for all drivers" status="Verified">
                    <div className="flex divide-x divide-gray-100 border-t border-gray-100">
                        <DocumentImage label="Front Image" />
                        <DocumentImage label="Back Image" />
                    </div>
                </DocSection>

                {/* Taxi Badge */}
                <DocSection icon={MdDirectionsBus} title="Taxi Badge" status="Verified">
                    <div className="flex divide-x divide-gray-100 border-t border-gray-100">
                        <DocumentImage label="Front Image" />
                        <DocumentImage label="Back Image" />
                    </div>
                </DocSection>

                {/* DBS Check */}
                <DocSection
                    icon={MdSecurity}
                    title="DBS Check"
                    status="Verified"
                    extra={
                        <>
                            <span>DBS Update Service ID</span>
                            <span className="font-medium text-gray-700">C123456789</span>
                        </>
                    }
                >
                    <div className="flex divide-x divide-gray-100 border-t border-gray-100">
                        <DocumentImage label="Front Image" />
                        <DocumentImage label="Back Image" />
                    </div>
                </DocSection>

                {/* Derby City Safeguarding Certificate */}
                <DocSection
                    icon={MdShield}
                    title="Derby City Safeguarding Certificate"
                    status="Void"
                    extra={
                        <>
                            <span>Issue Date</span>
                            <span className="font-medium text-gray-700">March 15, 2024</span>
                        </>
                    }
                >
                    <div className="flex justify-center border-t border-gray-100">
                        <DocumentImage label="Certificate" sub />
                    </div>
                </DocSection>

                {/* Vehicle Details */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <MdDirectionsBus size={15} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Vehicle Details</p>
                            </div>
                        </div>
                        <StatusBadge status="Complete" />
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-3">V5 Registration</p>

                        {/* Row 1: V5 Front + V5 Inside */}
                        <div className="flex divide-x divide-gray-100 border border-gray-100 rounded-lg mb-3">
                            <DocumentImage label="V5 Front" />
                            <DocumentImage label="V5 Inside" />
                        </div>

                        {/* Row 2: MOT + Taxi License Plate + Insurance */}
                        <div className="grid grid-cols-3 border border-gray-100 rounded-lg divide-x divide-gray-100 mb-3">
                            <div className="flex flex-col items-center gap-1.5 py-5">
                                <div className="flex items-center justify-center w-10 h-10 rounded bg-gray-100 text-gray-400">
                                    <MdBuild size={20} />
                                </div>
                                <span className="text-xs text-gray-500">MOT Certificate</span>
                                <span className="text-xs text-green-600 font-medium">✓ Valid until Dec 2025</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 py-5">
                                <div className="flex items-center justify-center w-10 h-10 rounded bg-gray-100 text-gray-400">
                                    <MdLocalOffer size={20} />
                                </div>
                                <span className="text-xs text-gray-500">Taxi License Plate</span>
                                <span className="text-xs text-green-600 font-medium">✓ Valid until Oct 2025</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 py-5">
                                <div className="flex items-center justify-center w-10 h-10 rounded bg-gray-100 text-gray-400">
                                    <MdShield size={20} />
                                </div>
                                <span className="text-xs text-gray-500">Insurance Certificate</span>
                                <span className="text-xs text-green-600 font-medium">✓ Valid until Jun 2026</span>
                            </div>
                        </div>

                        {/* Row 3: Vehicle Photo + Seating Capacity */}
                        <div className="grid grid-cols-2 border border-gray-100 rounded-lg divide-x divide-gray-100">
                            <div className="flex flex-col items-center gap-1.5 py-5">
                                <div className="flex items-center justify-center w-10 h-10 rounded bg-gray-100 text-gray-400">
                                    <MdCamera size={20} />
                                </div>
                                <span className="text-xs text-gray-500">Vehicle Photo</span>
                                <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 py-5">
                                <div className="flex items-center justify-center w-10 h-10 rounded bg-gray-100 text-gray-400">
                                    <MdEventSeat size={20} />
                                </div>
                                <span className="text-xs text-gray-500">Seating Capacity</span>
                                <span className="text-xs font-semibold text-gray-700">8 Passengers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Job History ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800">Job History</h2>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        View All Jobs
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job ID</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {driver.jobHistory.map((job) => (
                                <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-gray-700 font-mono text-xs">{job.id}</td>
                                    <td className="px-5 py-3.5 text-gray-500">{job.date}</td>
                                    <td className="px-5 py-3.5 text-gray-700">{job.route}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs font-medium text-green-600">
                                            {job.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default DriverDetail;
