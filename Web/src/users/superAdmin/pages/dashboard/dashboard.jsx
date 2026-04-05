import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    MdBusiness,
    MdPeople,
    MdTimeline,
    MdHourglassEmpty,
    MdFileDownload,
} from 'react-icons/md';

import {
    getPendingCompanyApprovals,
    getSuperAdminDashboardStats,
    getCompanyGrowthByMonth,
    getCompanyTypeBreakdown,
} from '../../../../services/dashboardService'
import { ShimmerBlock } from '../../../../utils/Shimmer'

const Dashboard = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [statsData, setStatsData] = useState({
        totalCompanies: 0,
        usersTotal: 0,
        activeJobsToday: 0,
        pendingApprovals: 0,
    })
    const [pendingApprovals, setPendingApprovals] = useState([])
    const [companyGrowth, setCompanyGrowth] = useState([])
    const [companyTypeBreakdown, setCompanyTypeBreakdown] = useState({
        small: 0,
        medium: 0,
        large: 0,
    })

    useEffect(() => {
        let isMounted = true

        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const [stats, pending, growth, types] = await Promise.all([
                    getSuperAdminDashboardStats(),
                    getPendingCompanyApprovals({ limit: 4 }),
                    getCompanyGrowthByMonth({ months: 12 }),
                    getCompanyTypeBreakdown(),
                ])
                if (!isMounted) return
                setStatsData(stats)
                setPendingApprovals(pending)
                setCompanyGrowth(growth || [])
                setCompanyTypeBreakdown(types || { small: 0, medium: 0, large: 0 })
            } catch (e) {
                if (!isMounted) return
                setError(e?.message || 'Failed to load dashboard data.')
            } finally {
                if (!isMounted) return
                setLoading(false)
            }
        }

        load()
        return () => {
            isMounted = false
        }
    }, [])

    const stats = useMemo(() => ([
        {
            label: 'Total Companies',
            value: loading ? '—' : statsData.totalCompanies?.toLocaleString?.() ?? String(statsData.totalCompanies ?? 0),
            change: 'Live from database',
            icon: <MdBusiness className="text-blue-500" />,
            bg: 'bg-blue-50'
        },
        {
            label: 'Total Users',
            value: loading ? '—' : statsData.usersTotal?.toLocaleString?.() ?? String(statsData.usersTotal ?? 0),
            change: 'Drivers + Passengers + Sub Admins + Company Admins',
            icon: <MdPeople className="text-orange-500" />,
            bg: 'bg-orange-50'
        },
        {
            label: 'Active Jobs Today',
            value: loading ? '—' : statsData.activeJobsToday?.toLocaleString?.() ?? String(statsData.activeJobsToday ?? 0),
            change: 'Mapped to bookings created today',
            icon: <MdTimeline className="text-green-500" />,
            bg: 'bg-green-50'
        },
        {
            label: 'Pending Approvals',
            value: loading ? '—' : statsData.pendingApprovals?.toLocaleString?.() ?? String(statsData.pendingApprovals ?? 0),
            change: 'Companies with status = pending',
            icon: <MdHourglassEmpty className="text-yellow-600" />,
            bg: 'bg-yellow-50'
        },
    ]), [loading, statsData])

    const formatDate = (isoString) => {
        if (!isoString) return '—'
        const d = new Date(isoString)
        if (Number.isNaN(d.getTime())) return '—'
        return d.toISOString().slice(0, 10)
    }

    const lineChartPoints = useMemo(() => {
        if (!companyGrowth.length) return ''
        const maxValue = Math.max(...companyGrowth.map(p => p.total || 0), 1)
        const width = 100
        const height = 100
        const stepX = companyGrowth.length > 1 ? width / (companyGrowth.length - 1) : 0

        return companyGrowth
            .map((point, index) => {
                const x = stepX * index
                const normalized = (point.total || 0) / maxValue
                const y = height - normalized * height
                return `${x},${y}`
            })
            .join(' ')
    }, [companyGrowth])

    const companyTypeTotals = useMemo(() => {
        const small = companyTypeBreakdown.small ?? 0
        const medium = companyTypeBreakdown.medium ?? 0
        const large = companyTypeBreakdown.large ?? 0
        const total = small + medium + large
        if (!total) {
            return {
                total: 0,
                small: { count: 0, percent: 0 },
                medium: { count: 0, percent: 0 },
                large: { count: 0, percent: 0 },
            }
        }
        const toPercent = (value) => Math.round((value / total) * 100)
        return {
            total,
            small: { count: small, percent: toPercent(small) },
            medium: { count: medium, percent: toPercent(medium) },
            large: { count: large, percent: toPercent(large) },
        }
    }, [companyTypeBreakdown])

    const shimmerStats = Array.from({ length: 4 })
    const shimmerRows = Array.from({ length: 4 })

    return (
        <div className="space-y-6" {...(loading ? { role: 'status', 'aria-busy': true, 'aria-label': 'Loading dashboard' } : {})}>
            {loading && <span className="sr-only">Loading dashboard</span>}
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
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {loading
                    ? shimmerStats.map((_, index) => (
                        <div key={`stat-skeleton-${index}`} className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <ShimmerBlock className="h-4 w-28 rounded-md" />
                                <div className="p-2 rounded-lg bg-gray-100/90">
                                    <ShimmerBlock className="h-5 w-5 rounded" rounded="rounded" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                <ShimmerBlock className="h-9 w-20 rounded-md" />
                                <ShimmerBlock className="h-3 w-32 rounded-md" />
                            </div>
                        </div>
                    ))
                    : stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="mt-4">
                                <h2 className="text-3xl font-bold text-gray-900">{stat.value}</h2>
                                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-500">
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
                    <div className="w-full h-64 flex items-end justify-between gap-2 text-xs text-gray-400 relative px-4">
                        {loading && (
                            <div className="absolute inset-0 z-10 rounded-xl bg-white/70 backdrop-blur-[1px] flex items-end px-4 pb-6">
                                <div className="w-full h-full flex items-end justify-between gap-2">
                                    {Array.from({ length: 12 }).map((_, index) => (
                                        <div key={`growth-skeleton-${index}`} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                            <ShimmerBlock className="w-full h-24 rounded-t-lg" rounded="rounded-t-lg" />
                                            <ShimmerBlock className="h-3 w-6 rounded" rounded="rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-gray-300 w-8 text-right pr-2">
                            <span>Max</span>
                            <span>75%</span>
                            <span>50%</span>
                            <span>25%</span>
                            <span>0</span>
                        </div>

                        <div className="relative w-full h-full ml-10 border-b border-gray-100 border-dashed">
                            {[0, 25, 50, 75].map(bottom => (
                                <div key={bottom} className="absolute w-full border-t border-gray-50" style={{ bottom: `${bottom}%` }}></div>
                            ))}

                            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {companyGrowth.length > 0 && (
                                    <>
                                        <polyline
                                            fill="none"
                                            stroke="#005580"
                                            strokeWidth="1.5"
                                            vectorEffect="non-scaling-stroke"
                                            points={lineChartPoints}
                                        />
                                        <defs>
                                            <linearGradient id="growthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#005580" stopOpacity="0.25" />
                                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <polygon
                                            fill="url(#growthGradient)"
                                            opacity="0.2"
                                            points={`${lineChartPoints} 100,100 0,100`}
                                        />
                                    </>
                                )}
                            </svg>
                        </div>
                    </div>
                    {/* X Axis */}
                    <div className="flex justify-between pl-10 pt-2 text-gray-400 text-xs">
                        {companyGrowth.map((p, idx) => (
                            <span key={idx}>{p.label}</span>
                        ))}
                        {!companyGrowth.length && (
                            <>
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Donut Chart Area (1 col) */}
                <div className="relative bg-white p-6 rounded-xl shadow-[0_2px_10px_-4_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6">Company Sign-ups by Type</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {loading && (
                            <div className="absolute inset-0 z-10 rounded-xl bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                <ShimmerBlock className="w-48 h-48 border-8 border-gray-100/90" rounded="rounded-full" />
                            </div>
                        )}
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path
                                    className="text-gray-100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="9"
                                    strokeDasharray="100, 100"
                                />
                                {companyTypeTotals.total > 0 && (
                                    <>
                                        <path
                                            className="text-sky-900"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="9"
                                            strokeDasharray={`${companyTypeTotals.small.percent}, 100`}
                                        />
                                        <path
                                            className="text-blue-500"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="9"
                                            strokeDasharray={`${companyTypeTotals.medium.percent}, 100`}
                                            strokeDashoffset={-companyTypeTotals.small.percent}
                                        />
                                        <path
                                            className="text-blue-200"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="9"
                                            strokeDasharray={`${companyTypeTotals.large.percent}, 100`}
                                            strokeDashoffset={-(companyTypeTotals.small.percent + companyTypeTotals.medium.percent)}
                                        />
                                    </>
                                )}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                                    <span className="text-xs text-gray-400">Total</span>
                                    <span className="text-lg font-semibold text-gray-800">
                                        {loading ? '—' : companyTypeTotals.total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-sky-900 block rounded-sm"></span>
                                <span>Small company</span>
                                <span className="text-gray-400 ml-1">
                                    {loading ? '' : `· ${companyTypeTotals.small.count} (${companyTypeTotals.small.percent}%)`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 block rounded-sm"></span>
                                <span>Medium company</span>
                                <span className="text-gray-400 ml-1">
                                    {loading ? '' : `· ${companyTypeTotals.medium.count} (${companyTypeTotals.medium.percent}%)`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-200 block rounded-sm"></span>
                                <span>Large company</span>
                                <span className="text-gray-400 ml-1">
                                    {loading ? '' : `· ${companyTypeTotals.large.count} (${companyTypeTotals.large.percent}%)`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-50">
                    <h3 className="font-bold text-gray-800">Pending Company Approvals</h3>
                    <Link to="/superadmin/companies/pending" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Company ID</th>
                                <th className="px-6 py-3">Company Name</th>
                                <th className="px-6 py-3">Submitted On</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={loading} aria-label={loading ? 'Loading pending approvals' : undefined}>
                            {loading ? shimmerRows.map((_, idx) => (
                                <tr key={`pending-skeleton-${idx}`}>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-3.5 w-24 rounded-md" /></td>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-3.5 w-36 rounded-md" /></td>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-3.5 w-24 rounded-md" /></td>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-3.5 w-40 rounded-md" /></td>
                                    <td className="px-6 py-4"><ShimmerBlock className="h-6 w-20 rounded-full" rounded="rounded-full" /></td>
                                    <td className="px-6 py-4 text-right"><ShimmerBlock className="ml-auto h-3.5 w-12 rounded-md" /></td>
                                </tr>
                            )) : pendingApprovals.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500">{row.id || '—'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{row.company_name || '—'}</td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(row.created_at)}</td>
                                    <td className="px-6 py-4 text-gray-500">{row.company_operating_address || row.company_address || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-100">
                                            {row.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/superadmin/companies/review/${row.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {!loading && pendingApprovals.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-gray-500" colSpan={6}>
                                        No pending approvals.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
