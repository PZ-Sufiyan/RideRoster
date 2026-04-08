import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineClipboardList } from 'react-icons/hi';
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
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminById, getCompanyById } from '../../../../services/companyService';
import { getAdminCompanyDashboard } from '../../../../services/dashboardService';
import { downloadAdminDashboardReportPdf } from '../../../../services/dashboardReportPdfService';

const DONUT_CIRC = 100

function buildDonutSegments(items) {
    if (!items.length) return []
    const total = items.reduce((s, x) => s + (x.count || 0), 0)
    if (total <= 0) return []
    let offset = 0
    return items.map((item) => {
        const len = ((item.count || 0) / total) * DONUT_CIRC
        const seg = {
            color: item.color,
            dasharray: `${len} ${DONUT_CIRC - len}`,
            dashoffset: -offset,
        }
        offset += len
        return seg
    })
}

const Admin_Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [reportGenerating, setReportGenerating] = useState(false);
    const [hoveredLinePointIdx, setHoveredLinePointIdx] = useState(null);
    const lineSvgRef = useRef(null);

    const load = useCallback(async () => {
        setError(null);
        const {
            data: { session },
        } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) {
            setError('Not authenticated.');
            setLoading(false);
            return;
        }
        const admin = await getCompanyAdminById(uid);
        const companyId = admin?.company_id;
        if (!companyId) {
            setError('No company linked to your account.');
            setLoading(false);
            return;
        }
        const dash = await getAdminCompanyDashboard(companyId);
        setData(dash);
    }, []);

    const handleGenerateReport = useCallback(async () => {
        if (!data) {
            setError('Dashboard data is not loaded yet.');
            return;
        }
        setReportGenerating(true);
        setError(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) {
                setError('Not authenticated.');
                return;
            }
            const admin = await getCompanyAdminById(uid);
            const companyId = admin?.company_id;
            if (!companyId) {
                setError('No company linked to your account.');
                return;
            }
            const company = await getCompanyById(companyId);
            downloadAdminDashboardReportPdf({
                companyName: company?.company_name,
                data,
            });
        } catch (e) {
            setError(e?.message || 'Could not generate report.');
        } finally {
            setReportGenerating(false);
        }
    }, [data]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await load();
                if (!cancelled) setError(null);
            } catch (e) {
                if (!cancelled) setError(e?.message || 'Could not load dashboard.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [load]);

    const fleetLegend = useMemo(() => {
        if (!data?.fleetDistribution?.length) return [];
        const total = data.fleetDistribution.reduce((s, x) => s + (x.count || 0), 0);
        if (total <= 0) return [];
        return data.fleetDistribution.map((row) => ({
            label: row.label,
            color: row.color,
            count: row.count || 0,
            pct: Math.round(((row.count || 0) / total) * 1000) / 10,
        }));
    }, [data]);

    const donutSegments = useMemo(() => buildDonutSegments(fleetLegend), [fleetLegend]);

    const linePointObjs = useMemo(() => {
        const pts = data?.jobsByMonth || [];
        if (!pts.length) return [];
        const max = data?.maxMonthCount || 1;
        const n = pts.length;
        return pts.map((m, i) => {
            const x = 50 + (i * 400) / Math.max(n - 1, 1);
            const y = 260 - ((m?.count || 0) / max) * 220;
            return { x, y, count: m?.count || 0, label: m?.label };
        });
    }, [data]);

    const linePoints = useMemo(() => {
        if (!linePointObjs.length) return '';
        return linePointObjs.map((p) => `${p.x},${p.y}`).join(' ');
    }, [linePointObjs]);

    const hoveredLinePoint = useMemo(() => {
        if (hoveredLinePointIdx == null) return null;
        return linePointObjs[hoveredLinePointIdx] || null;
    }, [hoveredLinePointIdx, linePointObjs]);

    const handleLineChartMouseMove = useCallback(
        (e) => {
            if (!linePointObjs.length) return;
            const svg = lineSvgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const w = rect.width || 1;
            const xInViewBox = ((e.clientX - rect.left) / w) * 500; // viewBox width

            let bestIdx = 0;
            let bestDist = Infinity;
            for (let i = 0; i < linePointObjs.length; i++) {
                const d = Math.abs(linePointObjs[i].x - xInViewBox);
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                }
            }
            setHoveredLinePointIdx(bestIdx);
        },
        [linePointObjs]
    );

    const handleLineChartMouseLeave = useCallback(() => {
        setHoveredLinePointIdx(null);
    }, []);

    const yTicks = useMemo(() => {
        const max = data?.maxMonthCount ?? 1;
        return [max, Math.round((max * 3) / 4), Math.round(max / 2), Math.round(max / 4), 0];
    }, [data]);

    const fmtInt = (n) => (loading ? '—' : Number(n ?? 0).toLocaleString());

    const trendBlock = (pct) => {
        if (loading) {
            return (
                <div className="text-sm font-medium text-gray-400">—</div>
            );
        }
        const n = Number(pct) || 0;
        const cls = n >= 0 ? 'text-green-500' : 'text-red-500';
        return (
            <div className="text-sm font-medium">
                <span className={cls}>
                    {n > 0 ? '+' : ''}
                    {n}%
                </span>
                <span className="text-gray-400 ml-1 font-normal">vs last month</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}
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
                                    <span className="text-[28px] font-bold text-gray-900">
                                        {fmtInt(data?.fleetHeadline)}
                                    </span>
                                    <div className="w-10 h-10 rounded-[12px] bg-blue-50 flex items-center justify-center text-blue-600">
                                        <MdDirectionsCar size={22} />
                                    </div>
                                </div>
                            </div>
                            {trendBlock(data?.fleetTrendPct)}
                        </div>

                        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-50 flex flex-col justify-between h-[160px]">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">Active Jobs</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[28px] font-bold text-gray-900">
                                        {fmtInt(data?.activeJobsCount)}
                                    </span>
                                    <div className="w-10 h-10 rounded-[12px] bg-green-50 flex items-center justify-center text-green-600">
                                        <HiOutlineClipboardList size={22} />
                                    </div>
                                </div>
                            </div>
                            {trendBlock(data?.jobsTrendPct)}
                        </div>
                    </div>

                    {/* Fleet Distribution Pie Chart */}
                    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-50 flex-1">
                        <h3 className="text-[17px] font-bold text-gray-900 mb-6">Fleet Distribution</h3>
                        <div className="relative flex justify-center py-4">
                            <svg viewBox="0 0 36 36" className="w-48 h-48 transform -rotate-90">
                                {donutSegments.length === 0 ? (
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="16"
                                        fill="transparent"
                                        stroke="#e5e7eb"
                                        strokeWidth="4"
                                        strokeDasharray="100 0"
                                    />
                                ) : (
                                    donutSegments.map((seg, i) => (
                                        <circle
                                            key={i}
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="transparent"
                                            stroke={seg.color}
                                            strokeWidth="4"
                                            strokeDasharray={seg.dasharray}
                                            strokeDashoffset={seg.dashoffset}
                                        />
                                    ))
                                )}
                                <circle cx="18" cy="18" r="12" fill="white"></circle>
                                <text
                                    x="18"
                                    y="19"
                                    textAnchor="middle"
                                    className="text-[4px] font-bold fill-gray-800 rotate-90"
                                    style={{ transformOrigin: 'center' }}
                                >
                                    Fleet
                                </text>
                            </svg>
                        </div>
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-y-3 mt-4 px-2">
                            {fleetLegend.length === 0 && !loading && (
                                <p className="text-sm text-gray-500 col-span-2">
                                    No job types yet — published jobs will appear here.
                                </p>
                            )}
                            {fleetLegend.map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-gray-600">{item.label}</span>
                                    <span className="text-sm font-semibold text-gray-800 ml-auto mr-4">{item.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Large Line Chart */}
                <div className="lg:col-span-6 bg-white p-8 rounded-[20px] shadow-sm border border-gray-50 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[17px] font-bold text-gray-900">Active Jobs</h3>
                        <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Chart options">
                            <MdMoreVert size={20} />
                        </button>
                    </div>

                    <div className="flex-1 relative min-h-[400px]">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 select-none">
                            {yTicks.map((t, idx) => (
                                <span key={`${idx}-${t}`}>{t}</span>
                            ))}
                        </div>

                        {/* Chart Area */}
                        <div className="ml-8 mr-4 h-full relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="border-b border-gray-100 w-full h-0"></div>
                                ))}
                            </div>

                            {/* SVG Chart Content */}
                            <svg
                                ref={lineSvgRef}
                                className="absolute inset-0 w-full h-full overflow-visible"
                                preserveAspectRatio="none"
                                viewBox="0 0 500 300"
                                onMouseMove={handleLineChartMouseMove}
                                onMouseLeave={handleLineChartMouseLeave}
                            >
                                <defs>
                                    <linearGradient id="adminLineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {linePoints && (
                                    <>
                                        <path
                                            d={`M 50 300 L ${linePoints} L 450 300 Z`}
                                            fill="url(#adminLineGradient)"
                                        />
                                        {/* wider invisible stroke for easier hover */}
                                        <polyline
                                            fill="none"
                                            stroke="transparent"
                                            strokeWidth="14"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            points={linePoints}
                                        />
                                        <polyline
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            points={linePoints}
                                        />
                                        {linePointObjs.map((p, i) => {
                                            const isHovered = i === hoveredLinePointIdx;
                                            return (
                                                <g key={i}>
                                                    <circle
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r={isHovered ? '5' : '4'}
                                                        fill="#fff"
                                                        stroke="#3b82f6"
                                                        strokeWidth={isHovered ? '2.5' : '2'}
                                                    />
                                                </g>
                                            );
                                        })}
                                        {hoveredLinePoint && (
                                            <g>
                                                <circle
                                                    cx={hoveredLinePoint.x}
                                                    cy={hoveredLinePoint.y}
                                                    r="6"
                                                    fill="rgba(59,130,246,0.12)"
                                                    stroke="rgba(59,130,246,0.25)"
                                                    strokeWidth="1"
                                                />
                                                <rect
                                                    x={Math.max(6, Math.min(500 - 86, hoveredLinePoint.x - 40))}
                                                    y={Math.max(6, hoveredLinePoint.y - 40)}
                                                    width="80"
                                                    height="22"
                                                    rx="6"
                                                    fill="#111827"
                                                    opacity="0.92"
                                                />
                                                <text
                                                    x={Math.max(6, Math.min(500 - 86, hoveredLinePoint.x - 40)) + 40}
                                                    y={Math.max(6, hoveredLinePoint.y - 40) + 15}
                                                    textAnchor="middle"
                                                    fontSize="11"
                                                    fill="#fff"
                                                >
                                                    {Number(hoveredLinePoint.count ?? 0).toLocaleString()}
                                                </text>
                                            </g>
                                        )}
                                    </>
                                )}
                            </svg>

                            {/* X-axis labels */}
                            <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-4 text-xs text-gray-400 select-none">
                                {(data?.jobsByMonth || []).map((m) => (
                                    <span key={m.label}>{m.label}</span>
                                ))}
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
                        {loading && (
                            <p className="text-sm text-gray-400">Loading activity…</p>
                        )}
                        {!loading && (!data?.recentActivities || data.recentActivities.length === 0) && (
                            <p className="text-sm text-gray-500">No recent activity yet.</p>
                        )}
                        {!loading &&
                            (data?.recentActivities || []).map((act) => {
                                const iconWrap =
                                    act.variant === 'success'
                                        ? 'bg-green-50 text-green-500'
                                        : act.variant === 'info'
                                          ? 'bg-blue-50 text-blue-500'
                                          : act.variant === 'warning'
                                            ? 'bg-yellow-50 text-yellow-500'
                                            : 'bg-purple-50 text-purple-500';
                                const Icon =
                                    act.variant === 'success'
                                        ? MdCheckCircle
                                        : act.variant === 'info'
                                          ? MdDirectionsCarFilled
                                          : act.variant === 'warning'
                                            ? MdError
                                            : MdAdd;
                                return (
                                    <div key={act.id} className="flex items-start gap-4">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconWrap}`}
                                        >
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{act.text}</p>
                                            <p className="text-xs text-gray-400 mt-1">{act.timeLabel}</p>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-4 bg-white p-6 rounded-[20px] shadow-sm border border-gray-50">
                    <h3 className="text-[17px] font-bold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/users/drivers/add')}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#004D6D] hover:bg-[#003c55] text-white rounded-xl font-bold transition-all transform active:scale-[0.98]"
                        >
                            <MdAdd size={22} />
                            <span>Add Employee</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/jobs/add-job')}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f0f3f5] hover:bg-[#e4e9ed] text-gray-700 rounded-xl font-bold transition-all transform active:scale-[0.98]"
                        >
                            <MdFolder size={20} className="text-gray-500" />
                            <span>New Job</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerateReport}
                            disabled={loading || reportGenerating}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f0f3f5] hover:bg-[#e4e9ed] text-gray-700 rounded-xl font-bold transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                        >
                            <MdDescription size={20} className="text-gray-500" />
                            <span>{reportGenerating ? 'Generating…' : 'Generate Report'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Dashboard;
