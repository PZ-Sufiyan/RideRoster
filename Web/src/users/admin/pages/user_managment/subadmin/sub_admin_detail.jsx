import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdEmail,
    MdPhone,
    MdCalendarToday,
    MdAccessTime,
    MdAssignment,
    MdPeopleAlt,
    MdBarChart,
    MdUpdate,
    MdArrowBack,
    MdHistory,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import {
    getSubAdminById,
    updateSubAdmin,
    subAdminStatusLabel,
    subAdminRowToPermissionState,
    permissionStateToSubAdminUpdates,
    SUB_ADMIN_PERMISSION_KEYS,
} from '../../../../../services/subAdminService';
import { getSystemLogs } from '../../../../../services/systemLogService';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';
import { ToastStack } from '../../../../../utils/Toast';
import { PERMISSIONS_CATEGORIES, allPermKeys } from './permissionsConstants';

const STATUS_BADGE_CLASS = {
    Pending: 'bg-amber-50 text-amber-800 border border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    Active: 'bg-green-50 text-green-700 border border-green-200',
    Rejected: 'bg-red-50 text-red-600 border border-red-200',
    Suspended: 'bg-orange-50 text-orange-600 border border-orange-200',
};

const CATEGORY_ICONS = [MdAssignment, MdPeopleAlt, MdBarChart];

function formatDateTime(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

function formatDateOnly(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return '—';
    }
}

function relativeTime(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
        return formatDateOnly(iso);
    } catch {
        return '';
    }
}

const PermissionToggleRow = ({ label, enabled, onToggle, disabled }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-[13px] font-medium text-gray-700">{label}</span>
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={enabled}
            className={`relative w-10 h-5 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#004D6D]/30 disabled:opacity-50 disabled:cursor-not-allowed ${enabled ? 'bg-[#004D6D]' : 'bg-gray-200'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const ActivityItem = ({ title, time, detail, isNew }) => (
    <div className="flex items-start gap-3 py-4 border-b border-gray-50 last:border-0 group cursor-default hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors">
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isNew ? 'bg-blue-50 text-[#004D6D]' : 'bg-gray-50 text-gray-400'} group-hover:scale-110 transition-transform`}
        >
            <MdUpdate size={16} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-2">
                <p className="text-[13px] text-gray-600">{title}</p>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap shrink-0">{time}</span>
            </div>
            {detail && <p className="text-[11px] text-gray-400 mt-0.5 font-medium truncate">{detail}</p>}
        </div>
    </div>
);

const emptyPermissionState = () => {
    const initial = {};
    SUB_ADMIN_PERMISSION_KEYS.forEach((key) => {
        initial[key] = false;
    });
    return initial;
};

const SubAdminDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [toasts, setToasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [row, setRow] = useState(null);
    const [permissionState, setPermissionState] = useState(emptyPermissionState);
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    const pushToast = (type, message) => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message }]);
    };
    const removeToast = (tid) => setToasts((prev) => prev.filter((t) => t.id !== tid));

    const loadSubAdmin = useCallback(async () => {
        if (!id) {
            setLoadError('Missing sub-admin id.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError('');
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');

            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) throw new Error('No company linked to your account.');

            const data = await getSubAdminById(id);
            if (data.company_id !== admin.company_id) {
                throw new Error('Sub-admin not found or access denied.');
            }

            setRow(data);
            setPermissionState(subAdminRowToPermissionState(data));
        } catch (e) {
            setRow(null);
            setLoadError(e?.message || 'Failed to load sub-admin.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadSubAdmin();
    }, [loadSubAdmin]);

    useEffect(() => {
        if (!id || loadError) return undefined;
        const channel = supabase
            .channel(`sub_admin_detail_${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sub_admins',
                    filter: `id=eq.${id}`,
                },
                () => {
                    loadSubAdmin();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, loadError, loadSubAdmin]);

    useEffect(() => {
        if (!id || loading || loadError) return;
        let cancelled = false;
        (async () => {
            setActivityLoading(true);
            try {
                const logs = await getSystemLogs({ userId: id, limit: 15, order: 'desc' });
                if (!cancelled) setActivityLogs(logs || []);
            } catch {
                if (!cancelled) setActivityLogs([]);
            } finally {
                if (!cancelled) setActivityLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, loading, loadError]);

    const togglePermissionKey = (key) => {
        setPermissionState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const activeCount = useMemo(
        () => allPermKeys.filter((k) => permissionState[k]).length,
        [permissionState]
    );

    const statusLabel = row ? subAdminStatusLabel(row.status) : 'Pending';
    const statusBadgeClass = STATUS_BADGE_CLASS[statusLabel] || STATUS_BADGE_CLASS.Pending;

    const displayName = row?.name?.trim() || '—';
    const displayEmail = row?.email?.trim() || '—';
    const displayPhone = row?.phone != null && String(row.phone).trim() !== '' ? String(row.phone).trim() : '—';
    const avatarUrl = id ? `https://i.pravatar.cc/256?u=${encodeURIComponent(id)}` : '';

    const handleSave = async () => {
        if (!id || !row) return;
        setSaving(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) throw new Error('No company linked to your account.');
            const latest = await getSubAdminById(id);
            if (latest.company_id !== admin.company_id) throw new Error('Access denied.');

            const updates = permissionStateToSubAdminUpdates(permissionState);
            const saved = await updateSubAdmin(id, updates);
            setRow(saved);
            setPermissionState(subAdminRowToPermissionState(saved));
            pushToast('success', 'Permissions saved.');
        } catch (e) {
            pushToast('error', e?.message || 'Failed to save permissions.');
        } finally {
            setSaving(false);
        }
    };

    if (loadError && !loading) {
        return (
            <div className="pb-24 mx-auto px-4 sm:px-6 lg:px-8 max-w-lg">
                <ToastStack toasts={toasts} onClose={removeToast} />
                <button
                    type="button"
                    onClick={() => navigate('/portal/users/subadmins')}
                    className="flex items-center gap-2 text-sm font-medium text-[#004D6D] mb-6 hover:underline"
                >
                    <MdArrowBack size={20} />
                    Back to Subadmins
                </button>
                <div className="bg-white border border-red-100 rounded-xl p-6 text-red-700 text-sm">{loadError}</div>
            </div>
        );
    }

    return (
        <div className="pb-24 mx-auto px-4 sm:px-6 lg:px-8">
            <ToastStack toasts={toasts} onClose={removeToast} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ── LEFT SIDEBAR ── */}
                <div className="lg:col-span-4 space-y-8">
                    {loading ? (
                        <LoadingStatus label="Loading sub-admin profile" className="space-y-6 px-2">
                            <div className="flex flex-col items-center">
                                <ShimmerBlock className="w-32 h-32 mb-4" rounded="rounded-full" />
                                <ShimmerBlock className="h-6 w-48 rounded-md mb-2" />
                                <ShimmerBlock className="h-5 w-24 rounded-full" rounded="rounded-full" />
                            </div>
                            <div className="space-y-4">
                                <ShimmerBlock className="h-4 w-full rounded-md" />
                                <ShimmerBlock className="h-4 w-full rounded-md" />
                                <ShimmerBlock className="h-4 w-2/3 rounded-md" />
                            </div>
                        </LoadingStatus>
                    ) : (
                        <>
                            <div className="flex flex-col items-center text-center p-6">
                                <div className="relative mb-4">
                                    <img
                                        src={avatarUrl}
                                        alt=""
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl bg-gray-100"
                                    />
                                    <div className="absolute bottom-1 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-sm" aria-hidden />
                                </div>
                                <h2 className="text-[20px] font-bold text-gray-900 uppercase">{displayName}</h2>
                                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                                    <span className="px-3 py-1 bg-blue-50 text-[#004D6D] text-[11px] font-bold rounded-full uppercase tracking-wider">
                                        Sub-Admin
                                    </span>
                                    <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${statusBadgeClass}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6 px-4">
                                <div className="flex items-start gap-3">
                                    <MdEmail className="text-gray-400 mt-1 shrink-0" size={18} />
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email Address</p>
                                        <p className="text-[14px] font-medium text-gray-800 break-all">{displayEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MdPhone className="text-gray-400 mt-1 shrink-0" size={18} />
                                    <div>
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">Phone Number</p>
                                        <p className="text-[14px] font-medium text-gray-800">{displayPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MdCalendarToday className="text-gray-400 mt-1 shrink-0" size={18} />
                                    <div>
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">Date Added</p>
                                        <p className="text-[14px] font-medium text-gray-800">{formatDateOnly(row?.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-8 px-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last updated</p>
                                    <p className="text-[15px] font-semibold text-gray-900">{formatDateTime(row?.updated_at)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 px-4">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                    <MdAccessTime className="text-gray-400" size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Record sync</p>
                                    <p className="text-[13px] font-bold text-gray-800">Live updates enabled</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── MAIN ── */}
                <div className="lg:col-span-8 space-y-12">
                    <div>
                        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                            <div>
                                <h3 className="text-[16px] font-bold text-gray-900">Access Permissions</h3>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded shrink-0">
                                {activeCount} / {allPermKeys.length} granted
                            </span>
                        </div>
                        <p className="text-[13px] text-gray-400 mb-6">
                            Toggle permissions for this sub-admin. Changes are stored in your database and apply on their next session.
                        </p>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-hidden>
                                {[1, 2, 3].map((i) => (
                                    <ShimmerBlock key={i} className="h-64 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {PERMISSIONS_CATEGORIES.map((category, catIdx) => {
                                    const Icon = CATEGORY_ICONS[catIdx] || MdAssignment;
                                    const enabledInCategory = category.keys.filter((k) => permissionState[k]).length;
                                    return (
                                        <div
                                            key={category.name}
                                            className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col"
                                        >
                                            <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#004D6D] shrink-0">
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-[14px] font-bold text-gray-900 truncate">{category.name}</h4>
                                                        <p className="text-[11px] text-gray-500 font-medium">
                                                            {enabledInCategory}/{category.keys.length} enabled
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 flex-1">
                                                {category.keys.map((key, index) => (
                                                    <PermissionToggleRow
                                                        key={key}
                                                        label={category.labels[index]}
                                                        enabled={!!permissionState[key]}
                                                        onToggle={() => togglePermissionKey(key)}
                                                        disabled={saving}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-[16px] font-bold text-gray-900 mb-2 tracking-tight">Recent Activity</h3>
                        <p className="text-[12px] text-gray-400 mb-4">System log entries for this user (when available).</p>
                        {activityLoading ? (
                            <LoadingStatus label="Loading activity" className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <ShimmerBlock key={i} className="h-16 rounded-lg" />
                                ))}
                            </LoadingStatus>
                        ) : activityLogs.length === 0 ? (
                            <div className="flex items-center gap-3 py-8 px-4 border border-dashed border-gray-200 rounded-xl text-gray-500 text-sm">
                                <MdHistory className="shrink-0 text-gray-300" size={24} />
                                No system log entries for this account yet.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {activityLogs.map((log, idx) => (
                                    <ActivityItem
                                        key={log.id || `${log.timestamp}-${idx}`}
                                        title={<span className="font-medium text-gray-800">{log.action || 'Action'}</span>}
                                        time={relativeTime(log.timestamp) || formatDateTime(log.timestamp)}
                                        detail={log.status ? `Status: ${log.status}` : undefined}
                                        isNew={idx < 2}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 px-8 py-4 flex justify-end gap-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <button
                    type="button"
                    onClick={() => navigate('/portal/users/subadmins')}
                    disabled={saving}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loading || !row}
                    className="px-6 py-2.5 bg-[#004D6D] text-white rounded-lg text-[13px] font-bold hover:bg-[#003c55] transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default SubAdminDetail;
