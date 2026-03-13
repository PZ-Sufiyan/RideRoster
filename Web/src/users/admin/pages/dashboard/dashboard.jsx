import React from 'react';
import {
    HiOutlineTruck,
    HiOutlineClipboardList,
    HiCheckCircle,
    HiDotsVertical,
    HiClock,
    HiPlus,
    HiDocumentReport,
    HiFolderAdd,
    HiExclamation
} from 'react-icons/hi';
import {
    MdDirectionsCar,
    MdMoreVert,
    MdCheckCircle,
    MdDirectionsCarFilled,
    MdError,
    MdAdd,
    MdFolder,
    MdDescription
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../../../components/Breadcrumbs';

const Admin_Dashboard = () => {
    const navigate = useNavigate();
    // Pie Chart Data
    const fleetData = [
        { label: 'Marketing', value: 35, color: '#3b82f6' },
        { label: 'Engineering', value: 25, color: '#10b981' },
        { label: 'Sales', value: 20, color: '#f59e0b' },
        { label: 'HR', value: 12, color: '#ef4444' },
        { label: 'Finance', value: 8, color: '#8b5cf6' },
    ];

    // Simple Line Chart SVG Data Points (Jan to Jun)
    // Points relative to chart size (e.g., 0-100)
    // Jan: 2.1, Feb: 2.3, Mar: 1.9, Apr: 2.5, May: 2.1, Jun: 2.4
    // Scaled for a 500x300 SVG viewbox
    const linePoints = "50,220 130,190 210,240 290,160 370,210 450,180";

    return (
        <div className="space-y-6">
            {/* Top Grid Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Side: Summary and Pie Chart */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-50 flex flex-col justify-between h-[160px]">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">Total Vehicles</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[28px] font-bold text-gray-900">1,248</span>
                                    <div className="w-10 h-10 rounded-[12px] bg-blue-50 flex items-center justify-center text-blue-600">
                                        <MdDirectionsCar size={22} />
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-medium">
                                <span className="text-green-500">+12%</span>
                                <span className="text-gray-400 ml-1 font-normal">vs last month</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-50 flex flex-col justify-between h-[160px]">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">Active Jobs</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[28px] font-bold text-gray-900">84</span>
                                    <div className="w-10 h-10 rounded-[12px] bg-green-50 flex items-center justify-center text-green-600">
                                        <HiOutlineClipboardList size={22} />
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-medium">
                                <span className="text-green-500">+8%</span>
                                <span className="text-gray-400 ml-1 font-normal">vs last month</span>
                            </div>
                        </div>
                    </div>

                    {/* Fleet Distribution Pie Chart */}
                    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-50 flex-1">
                        <h3 className="text-[17px] font-bold text-gray-900 mb-6">Fleet Distribution</h3>
                        <div className="relative flex justify-center py-4">
                            {/* Simple Manual SVG Pie Chart */}
                            <svg viewBox="0 0 36 36" className="w-48 h-48 transform -rotate-90">
                                {/* Finance (8%) */}
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="8 92" strokeDashoffset="0"></circle>
                                {/* HR (12%) */}
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="12 88" strokeDashoffset="-8"></circle>
                                {/* Sales (20%) */}
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-20"></circle>
                                {/* Engineering (25%) */}
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-40"></circle>
                                {/* Marketing (35%) */}
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="35 65" strokeDashoffset="-65"></circle>

                                <circle cx="18" cy="18" r="12" fill="white"></circle>
                                <text x="18" y="19" textAnchor="middle" className="text-[4px] font-bold fill-gray-800 rotate-90" style={{ transformOrigin: 'center' }}>Fleet</text>
                            </svg>
                        </div>
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-y-3 mt-4 px-2">
                            {fleetData.map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-gray-600">{item.label}</span>
                                    <span className="text-sm font-semibold text-gray-800 ml-auto mr-4">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Large Line Chart */}
                <div className="lg:col-span-6 bg-white p-8 rounded-[20px] shadow-sm border border-gray-50 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[17px] font-bold text-gray-900">Active Jobs</h3>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MdMoreVert size={20} />
                        </button>
                    </div>

                    <div className="flex-1 relative min-h-[400px]">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 select-none">
                            <span>2.5</span>
                            <span>2.0</span>
                            <span>1.5</span>
                            <span>1.0</span>
                            <span>0.5</span>
                            <span>0</span>
                        </div>

                        {/* Chart Area */}
                        <div className="ml-8 mr-4 h-full relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[0, 1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="border-b border-gray-100 w-full h-0"></div>
                                ))}
                            </div>

                            {/* SVG Chart Content */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 300">
                                {/* Gradient definition */}
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Area Fill */}
                                <path
                                    d={`M 50 300 L ${linePoints} L 450 300 Z`}
                                    fill="url(#lineGradient)"
                                />

                                {/* Line */}
                                <polyline
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={linePoints}
                                />

                                {/* Points */}
                                {linePoints.split(' ').map((p, i) => {
                                    const [x, y] = p.split(',');
                                    return (
                                        <circle
                                            key={i}
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="#fff"
                                            stroke="#3b82f6"
                                            strokeWidth="2"
                                        />
                                    );
                                })}
                            </svg>

                            {/* X-axis labels */}
                            <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-4 text-xs text-gray-400 select-none">
                                <span>Jan</span>
                                <span>Feb</span>
                                <span>Mar</span>
                                <span>Apr</span>
                                <span>May</span>
                                <span>Jun</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Area: Recent Activities and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Activities */}
                <div className="lg:col-span-8 bg-white p-6 rounded-[20px] shadow-sm border border-gray-50">
                    <h3 className="text-[17px] font-bold text-gray-900 mb-6">Recent Activities</h3>
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                                <MdCheckCircle size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    Vehicle #ABC-1234 completed ride #R789 successfully
                                </p>
                                <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <MdDirectionsCarFilled size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    Vehicle #XYZ-5678 started ride #R790 to Downtown
                                </p>
                                <p className="text-xs text-gray-400 mt-1">8 minutes ago</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 shrink-0">
                                <MdError size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    Vehicle #DEF-9012 requires maintenance check
                                </p>
                                <p className="text-xs text-gray-400 mt-1">15 minutes ago</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                                <MdCheckCircle size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    Vehicle #GHI-3456 completed ride #R788 to Airport
                                </p>
                                <p className="text-xs text-gray-400 mt-1">22 minutes ago</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                                <MdAdd size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    New 8-seater vehicle #JKL-7890 added to fleet
                                </p>
                                <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-4 bg-white p-6 rounded-[20px] shadow-sm border border-gray-50">
                    <h3 className="text-[17px] font-bold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/admin/users/add')}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#004D6D] hover:bg-[#003c55] text-white rounded-xl font-bold transition-all transform active:scale-[0.98]"
                        >
                            <MdAdd size={22} />
                            <span>Add Employee</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/jobs/new')}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f0f3f5] hover:bg-[#e4e9ed] text-gray-700 rounded-xl font-bold transition-all transform active:scale-[0.98]"
                        >
                            <MdFolder size={20} className="text-gray-500" />
                            <span>New Job</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/reports/generate')}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f0f3f5] hover:bg-[#e4e9ed] text-gray-700 rounded-xl font-bold transition-all transform active:scale-[0.98]"
                        >
                            <MdDescription size={20} className="text-gray-500" />
                            <span>Generate Report</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Dashboard;
