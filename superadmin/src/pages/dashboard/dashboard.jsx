import React from 'react';
import { Link } from 'react-router-dom';
import {
    MdBusiness,
    MdPeople,
    MdTimeline,
    MdHourglassEmpty,
    MdArrowUpward,
    MdFileDownload,
    MdAdd
} from 'react-icons/md';

const Dashboard = () => {
    // Dummy Data for Stats
    const stats = [
        {
            label: 'Total Companies',
            value: '1,250',
            change: '+15.2% from last month',
            isPositive: true,
            icon: <MdBusiness className="text-blue-500" />,
            bg: 'bg-blue-50'
        },
        {
            label: 'Total Users',
            value: '15,782',
            change: '+8.5% from last month',
            isPositive: true,
            icon: <MdPeople className="text-orange-500" />,
            bg: 'bg-orange-50'
        },
        {
            label: 'Active Jobs Today',
            value: '8,940',
            change: '+5.1% from yesterday',
            isPositive: true,
            icon: <MdTimeline className="text-green-500" />,
            bg: 'bg-green-50'
        },
        {
            label: 'Pending Approvals',
            value: '12',
            change: 'Requires immediate attention',
            isPositive: false, // Contextual (alert)
            icon: <MdHourglassEmpty className="text-yellow-600" />,
            bg: 'bg-yellow-50'
        },
    ];

    // Dummy Data for Table
    const pendingApprovals = [
        { id: 1, name: 'Bright Horizons Transport', submitted: '2025-11-18', location: 'San Francisco, CA', status: 'Pending Review' },
        { id: 2, name: 'Safe Journey Logistics', submitted: '2025-11-17', location: 'New York, NY', status: 'Pending Review' },
        { id: 3, name: 'NextGen Shuttles', submitted: '2025-11-17', location: 'Austin, TX', status: 'Pending Review' },
        { id: 4, name: 'Metro Transit Solutions', submitted: '2025-11-16', location: 'Chicago, IL', status: 'Pending Review' },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Titles */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back, Eleanor. Here's a global overview of the platform.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <MdFileDownload size={18} />
                        Export Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#005580] rounded-lg text-sm font-medium text-white hover:bg-sky-900 transition-colors shadow-sm">
                        <MdAdd size={18} />
                        Add New Company
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h2 className="text-3xl font-bold text-gray-900">{stat.value}</h2>
                            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stat.isPositive ? 'text-green-600' : 'text-gray-500'}`}>
                                {stat.isPositive && <MdArrowUpward size={14} />}
                                <span>{stat.change}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart Area (2 cols) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Monthly Member Growth</h3>
                    {/* Simple SVG Line Chart Mock */}
                    <div className="w-full h-64 flex items-end justify-between gap-2 text-xs text-gray-400 relative px-4">
                        {/* Y Axis Labels (Absolute for simplicity in this mock) */}
                        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-gray-300 w-8 text-right pr-2">
                            <span>100</span><span>50</span><span>$40k</span><span>$30k</span><span>$20k</span><span>$0</span>
                        </div>

                        {/* Chart Content */}
                        <div className="relative w-full h-full ml-10 border-b border-gray-100 border-dashed">
                            {/* Grid Lines */}
                            {[0, 20, 40, 60, 80].map(bottom => (
                                <div key={bottom} className="absolute w-full border-t border-gray-50" style={{ bottom: `${bottom}%` }}></div>
                            ))}

                            {/* The Line (Path) */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                <path
                                    d="M0 150 C 50 140, 100 100, 150 80 C 200 60, 250 80, 300 50 C 350 30, 400 60, 450 40 C 500 20, 550 0, 600 0"
                                    fill="none"
                                    stroke="#005580"
                                    strokeWidth="3"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Area under curve gradient (optional) */}
                                <path
                                    d="M0 150 C 50 140, 100 100, 150 80 C 200 60, 250 80, 300 50 C 350 30, 400 60, 450 40 C 500 20, 550 0, 600 0 V 200 H 0 Z"
                                    fill="url(#gradient)"
                                    opacity="0.1"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#005580" />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                    {/* X Axis */}
                    <div className="flex justify-between pl-10 pt-2 text-gray-400 text-xs">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span>
                    </div>
                </div>

                {/* Donut Chart Area (1 col) */}
                <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6">Company Sign-ups by Type</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {/* SVG Donut */}
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                {/* Segment 1: Large (Dark Blue) - 40% */}
                                <path className="text-sky-900" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="9" strokeDasharray="40, 100" />
                                {/* Segment 2: Medium (Blue) - 35% starting at 40% */}
                                <path className="text-blue-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="9" strokeDasharray="35, 100" strokeDashoffset="-40" />
                                {/* Segment 3: Small (Light Blue) - 25% starting at 75% */}
                                <path className="text-blue-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="9" strokeDasharray="25, 100" strokeDashoffset="-75" />
                            </svg>
                            {/* Inner hole is created by transparency and stroke width */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-24 h-24 bg-white rounded-full"></span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-gray-600">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-sky-900 block rounded-sm"></span>Small company</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 block rounded-sm"></span>Medium company</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-200 block rounded-sm"></span>Large company</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-50">
                    <h3 className="font-bold text-gray-800">Pending Company Approvals</h3>
                    <Link to="/companies/pending" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Company Name</th>
                                <th className="px-6 py-3">Submitted On</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pendingApprovals.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{row.submitted}</td>
                                    <td className="px-6 py-4 text-gray-500">{row.location}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-100">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/companies/review/${row.name}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                            Review
                                        </Link>
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

export default Dashboard;
