import React from 'react';
import {
    HiOutlineBriefcase,
    HiOutlineClipboardList,
    HiOutlineExclamationCircle,
    HiOutlineExclamation,
    HiOutlinePencil,
    HiOutlineEye,
    HiOutlineTrash,
    HiOutlineUserAdd,
    HiOutlineUserGroup,
    HiPlus,
} from 'react-icons/hi';
import { MdSignalCellularAlt } from 'react-icons/md';

/* ─── Stat Cards ─────────────────────────────────────────── */
const statCards = [
    {
        label: 'Jobs Assigned',
        value: '12',
        sub: 'Updated just now',
        icon: <HiOutlineBriefcase size={20} />,
        iconBg: 'bg-blue-50 text-blue-500',
    },
    {
        label: 'Pending Offers',
        value: '3',
        sub: 'Needs review',
        icon: <HiOutlineClipboardList size={20} />,
        iconBg: 'bg-orange-50 text-orange-500',
    },
    {
        label: 'Incomplete Checklists',
        value: '4',
        sub: 'Morning checks missing',
        icon: <HiOutlineExclamationCircle size={20} />,
        iconBg: 'bg-red-50 text-red-500',
    },
    {
        label: 'SOS Alerts',
        value: '1',
        sub: 'Read-only',
        icon: <MdSignalCellularAlt size={20} />,
        iconBg: 'bg-red-50 text-red-600',
    },
];

/* ─── Priority Tasks ─────────────────────────────────────── */
const priorityTasks = [
    {
        title: 'Review job counter-offer #J4821',
        priority: 'High',
        priorityColor: 'bg-red-100 text-red-600',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-500',
    },
    {
        title: 'Fix missing route details for #J4815',
        priority: 'Medium',
        priorityColor: 'bg-yellow-100 text-yellow-600',
        iconBg: 'bg-yellow-50',
        iconColor: 'text-yellow-500',
    },
    {
        title: 'Assign PA to job #J4819',
        priority: 'Low',
        priorityColor: 'bg-blue-100 text-blue-600',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-500',
    },
];

/* ─── Upcoming Jobs ──────────────────────────────────────── */
const upcomingJobs = [
    {
        pickup: '09:00 AM',
        dropoff: '11:30 AM',
        driver: 'John Doe',
        pa: 'Sarah Lee',
        status: 'Confirmed',
        statusStyle: 'bg-green-100 text-green-700',
        actions: ['edit', 'view'],
    },
    {
        pickup: '10:30 AM',
        dropoff: '12:00 PM',
        driver: 'Mike Ross',
        pa: 'Pending',
        status: 'Needs PA',
        statusStyle: 'bg-orange-100 text-orange-600',
        actions: ['edit', 'delete'],
    },
    {
        pickup: '02:00 PM',
        dropoff: '04:00 PM',
        driver: 'Jessica P.',
        pa: 'Harvey S.',
        status: 'On Route',
        statusStyle: 'bg-blue-100 text-blue-700',
        actions: ['assign', 'view'],
    },
];

/* ─── Driver Status ──────────────────────────────────────── */
const drivers = [
    {
        name: 'John Doe',
        status: 'Online',
        statusStyle: 'bg-green-100 text-green-700',
        sub: 'Last update: 2m ago',
        warning: null,
        avatar: 'JD',
        avatarBg: 'bg-blue-400',
    },
    {
        name: 'Mike Ross',
        status: 'On Ride',
        statusStyle: 'bg-orange-100 text-orange-600',
        sub: null,
        warning: 'Pending doc update',
        avatar: 'MR',
        avatarBg: 'bg-gray-400',
    },
    {
        name: 'David Chen',
        status: 'Offline',
        statusStyle: 'bg-gray-100 text-gray-500',
        sub: 'Last update: 1h ago',
        warning: null,
        avatar: 'DC',
        avatarBg: 'bg-gray-600',
    },
];

/* ─── Counter Offers ─────────────────────────────────────── */
const counterOffers = [
    { job: 'Job #J4821', offered: '$150', original: '$120' },
    { job: 'Job #J4818', offered: '$220', original: '$200' },
];

/* ─── Component ──────────────────────────────────────────── */
const SubAdmin_Dashboard = () => {
    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900">Sub-Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Welcome back, Ana. Here's your operational overview for today.</p>
                </div>
                    
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                                {card.icon}
                            </div>
                        </div>
                        <p className="text-[28px] font-bold text-gray-900 leading-none mb-2">{card.value}</p>
                        <p className="text-xs text-gray-400">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main Grid: Left (tasks + jobs) | Right (driver status + counter-offers + SOS) */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

                {/* LEFT COLUMN */}
                <div className="space-y-6">

                    {/* My Priority Tasks */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-[16px] font-bold text-gray-900 mb-4">My Priority Tasks</h2>
                        <div className="space-y-3">
                            {priorityTasks.map((task, i) => (
                                <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${task.iconBg}`}>
                                            <HiOutlineClipboardList size={18} className={task.iconColor} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                                            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${task.priorityColor}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-sm font-semibold text-[#005C7A] hover:underline whitespace-nowrap ml-4">
                                        Open Task
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Jobs */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-[16px] font-bold text-gray-900 mb-4">Upcoming Jobs (Assigned to Me)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-400 text-xs font-semibold border-b border-gray-100">
                                        <th className="text-left pb-3 font-semibold">Pickup Time</th>
                                        <th className="text-left pb-3 font-semibold">Drop-off Time</th>
                                        <th className="text-left pb-3 font-semibold">Driver</th>
                                        <th className="text-left pb-3 font-semibold">PA</th>
                                        <th className="text-left pb-3 font-semibold">Status</th>
                                        <th className="text-left pb-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {upcomingJobs.map((job, i) => (
                                        <tr key={i} className="text-gray-700">
                                            <td className="py-3">{job.pickup}</td>
                                            <td className="py-3">{job.dropoff}</td>
                                            <td className="py-3">{job.driver}</td>
                                            <td className="py-3 text-gray-500">{job.pa}</td>
                                            <td className="py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${job.statusStyle}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    {job.actions.includes('edit') && (
                                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                            <HiOutlinePencil size={16} />
                                                        </button>
                                                    )}
                                                    {job.actions.includes('view') && (
                                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                            <HiOutlineEye size={16} />
                                                        </button>
                                                    )}
                                                    {job.actions.includes('delete') && (
                                                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                                                            <HiOutlineTrash size={16} />
                                                        </button>
                                                    )}
                                                    {job.actions.includes('assign') && (
                                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                            <HiOutlineUserAdd size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-5">

                    {/* Driver Status */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Driver Status</h2>
                        <div className="space-y-4">
                            {drivers.map((d, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full ${d.avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                        {d.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${d.statusStyle}`}>
                                            {d.status}
                                        </span>
                                        {d.warning && (
                                            <p className="text-xs text-yellow-500 font-medium mt-0.5 flex items-center gap-1">
                                                <HiOutlineExclamation size={12} />
                                                {d.warning}
                                            </p>
                                        )}
                                        {d.sub && (
                                            <p className="text-xs text-gray-400 mt-0.5">{d.sub}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Counter-Offers */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[15px] font-bold text-gray-900">Counter-Offers</h2>
                            <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                3
                            </span>
                        </div>
                        <div className="space-y-3 mb-4">
                            {counterOffers.map((offer, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 font-medium">{offer.job}</span>
                                    <span className="text-gray-600">
                                        <span className="text-orange-500 font-semibold">{offer.offered}</span>
                                        {' '}vs {offer.original}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-2.5 bg-[#005C7A] hover:bg-[#004a63] text-white text-sm font-semibold rounded-lg transition-colors">
                            Review All Offers
                        </button>
                    </div>

                    {/* SOS Alerts (View Only) */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-3">SOS Alerts (View Only)</h2>

                        {/* Fake Map */}
                        <div className="relative w-full h-[130px] rounded-lg overflow-hidden bg-[#e8edf0]">
                            {/* Road lines */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 130" preserveAspectRatio="none">
                                <line x1="0" y1="65" x2="300" y2="65" stroke="#d1d8e0" strokeWidth="6" />
                                <line x1="150" y1="0" x2="150" y2="130" stroke="#d1d8e0" strokeWidth="6" />
                                <line x1="0" y1="30" x2="300" y2="90" stroke="#cdd4da" strokeWidth="4" />
                                <line x1="0" y1="90" x2="300" y2="30" stroke="#cdd4da" strokeWidth="4" />
                            </svg>

                            {/* SOS Pins */}
                            {[
                                { top: '28%', left: '42%' },
                                { top: '58%', left: '52%' },
                                { top: '65%', left: '35%' },
                                { top: '72%', left: '62%' },
                                { top: '40%', left: '70%' },
                            ].map((pos, i) => (
                                <div key={i} className="absolute" style={{ top: pos.top, left: pos.left }}>
                                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    </div>
                                </div>
                            ))}

                            {/* View-only badge */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                                View-only access
                            </div>
                        </div>

                        <button className="w-full mt-3 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                            Open SOS Dashboard
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SubAdmin_Dashboard;
