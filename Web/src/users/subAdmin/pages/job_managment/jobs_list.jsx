import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import {
    MdEventNote,
    MdAdd,
    MdFilterList,
    MdRefresh,
    MdMoreVert,
    MdPeopleAlt,
    MdChevronLeft,
    MdChevronRight,
    MdSearch,
    MdClose,
    MdCheck,
    MdPersonAddAlt1,
    MdWarning,
    MdPersonRemove,
} from 'react-icons/md';
import { ToastStack } from '../../../../utils/Toast';
import {
    driversAvailableForAssignment,
    passengerAssistantsAvailableForAssignment,
    validateDriverAssignment,
    updateJobAssignedDriver,
    updateJobAssignedPa,
    removeJobAssignedDriver,
    removeJobAssignedPa,
} from '../../../../services/jobService';
import { ShimmerBlock } from '../../../../utils/Shimmer';
import { truncateText } from '../../../../utils/truncateText';
import { useSubAdminPermissions } from '../../../../context/subAdminPermissionsContext';
import { useJobsListRealtimeSync } from '../../../../hooks/useJobsListRealtimeSync';
import { useJobsList } from '../../../../hooks/useJobsList';

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Remove', onConfirm, onCancel, danger = true }) => {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
                        <MdWarning size={22} className={danger ? 'text-red-500' : 'text-amber-500'} />
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{message}</p>
                </div>
                <div className="px-6 pb-6 flex items-center gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2 rounded-xl text-[13px] font-bold text-white transition-all ${
                            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ActiveJobs = () => {
    const navigate = useNavigate();
    const { can } = useSubAdminPermissions();
    const {
        companyId,
        jobs,
        jobsMinimal,
        driversCatalog,
        pasCatalog,
        loading,
        refreshing,
        error: loadError,
        reload: reloadData,
        setJobs,
        setJobsMinimal,
    } = useJobsList();
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [showAssignPA, setShowAssignPA] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [driverQuery, setDriverQuery] = useState('');
    const [paQuery, setPaQuery] = useState('');
    const [assigningDriverId, setAssigningDriverId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, job: null });

    const menuRef = useRef(null);
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.closest?.('[data-job-actions-trigger]')) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
                setActionMenuAnchor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeMenu === null) return undefined;
        const close = () => {
            setActiveMenu(null);
            setActionMenuAnchor(null);
        };
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [activeMenu]);

    const companyIdRef = useRef(null);

    useEffect(() => {
        companyIdRef.current = companyId;
    }, [companyId]);

    const reloadDataRef = useRef(reloadData);
    useEffect(() => { reloadDataRef.current = reloadData; }, [reloadData]);

    const catalogsRef = useRef({ drivers: [], passengerAssistants: [] });
    useEffect(() => {
        catalogsRef.current = { drivers: driversCatalog, passengerAssistants: pasCatalog };
    }, [driversCatalog, pasCatalog]);

    useJobsListRealtimeSync({
        companyId,
        companyIdRef,
        setJobs,
        setJobsMinimal,
        getCatalogs: () => catalogsRef.current,
        reloadDataRef,
    });

    const handleRefresh = async () => {
        try {
            await reloadData();
        } catch (e) {
            pushToast('error', e?.message || 'Could not refresh.');
        }
    };

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 5000 },
        ]);
    };

    useEffect(() => {
        if (loadError) {
            pushToast('error', loadError);
        }
    }, [loadError]);

    const toggleRow = (id) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
    };

    const handleAssignDriver = (job) => {
        if (!can('edit_jobs')) return;
        setSelectedJob(job);
        setDriverQuery('');
        setShowAssignDriver(true);
        setActiveMenu(null);
        setActionMenuAnchor(null);
    };

    const handleAssignPA = (job) => {
        if (!can('edit_jobs')) return;
        setSelectedJob(job);
        setPaQuery('');
        setShowAssignPA(true);
        setActiveMenu(null);
        setActionMenuAnchor(null);
    };

    const handleRemoveDriver = (job) => {
        if (!can('edit_jobs')) return;
        setActiveMenu(null);
        setActionMenuAnchor(null);
        setConfirmDialog({ open: true, type: 'driver', job });
    };

    const handleRemovePA = (job) => {
        if (!can('edit_jobs')) return;
        setActiveMenu(null);
        setActionMenuAnchor(null);
        setConfirmDialog({ open: true, type: 'pa', job });
    };

    const executeRemove = async () => {
        const { type, job } = confirmDialog;
        setConfirmDialog({ open: false, type: null, job: null });
        try {
            if (type === 'driver') {
                await removeJobAssignedDriver(job.id);
                pushToast('success', `Driver removed from ${formatShortJobLabel(job.id)}.`);
            } else {
                await removeJobAssignedPa(job.id);
                pushToast('success', `Passenger assistant removed from ${formatShortJobLabel(job.id)}.`);
            }
            await reloadData();
        } catch (e) {
            pushToast('error', e?.message || 'Could not remove assignment.');
        }
    };

    const toggleJobActionMenu = (e, idx) => {
        if (activeMenu === idx) {
            setActiveMenu(null);
            setActionMenuAnchor(null);
            return;
        }
        const r = e.currentTarget.getBoundingClientRect();
        setActionMenuAnchor({
            top: r.bottom + 8,
            right: window.innerWidth - r.right,
        });
        setActiveMenu(idx);
    };

    const assignDriverToJob = async (jobId, driverRow) => {
        if (!can('edit_jobs')) return;
        setAssigningDriverId(driverRow.id);
        try {
            await validateDriverAssignment(jobId, driverRow.id, companyId);
            await updateJobAssignedDriver(jobId, driverRow.id);
            pushToast('success', `Driver assigned to ${formatShortJobLabel(jobId)}.`);
            setShowAssignDriver(false);
            await reloadData();
        } catch (e) {
            pushToast('error', e?.message || 'Could not assign driver.');
        } finally {
            setAssigningDriverId(null);
        }
    };

    const assignPaToJob = async (jobId, paRow) => {
        if (!can('edit_jobs')) return;
        try {
            await updateJobAssignedPa(jobId, paRow.id);
            pushToast('success', `Passenger assistant assigned to ${formatShortJobLabel(jobId)}.`);
            setShowAssignPA(false);
            await reloadData();
        } catch (e) {
            pushToast('error', e?.message || 'Could not assign PA.');
        }
    };

    function formatShortJobLabel(jobId) {
        return `#J-${String(jobId).replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    }

    const filteredDriverRows = useMemo(() => {
        if (!selectedJob || !showAssignDriver) return [];
        const available = driversAvailableForAssignment(driversCatalog, jobsMinimal, selectedJob.id);
        const q = driverQuery.trim().toLowerCase();
        return available
            .filter((d) => {
                if (!q) return true;
                const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
                const lic = (d.license_no || '').toLowerCase();
                return name.includes(q) || lic.includes(q);
            })
            .map((d) => ({
                id: d.id,
                name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
                vehicleLabel: d.license_no ? `License ${d.license_no}` : 'Registered driver',
                vehicleCode: d.license_no || '—',
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(d.id)}`,
            }));
    }, [selectedJob, showAssignDriver, driversCatalog, jobsMinimal, driverQuery]);

    const filteredPaRows = useMemo(() => {
        if (!selectedJob || !showAssignPA) return [];
        const list = passengerAssistantsAvailableForAssignment(pasCatalog, jobsMinimal, selectedJob.id);
        const q = paQuery.trim().toLowerCase();
        return list
            .filter((p) => {
                if (!q) return true;
                const name = `${p.first_name || ''} ${p.surname || ''}`.toLowerCase();
                return name.includes(q);
            })
            .map((p) => ({
                id: p.id,
                name: `${p.first_name || ''} ${p.surname || ''}`.trim(),
                avatar: p.profile_picture_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.id)}`,
            }));
    }, [selectedJob, showAssignPA, pasCatalog, jobsMinimal, paQuery]);

    const filteredJobs = useMemo(() => {
        if (statusFilter === 'all') return jobs;
        return jobs.filter((job) => {
            const normalized = String(job.status || '').trim().toLowerCase();
            if (statusFilter === 'active') return normalized === 'active';
            if (statusFilter === 'complete') return normalized === 'completed' || normalized === 'complete';
            if (statusFilter === 'in-progress') return normalized === 'in progress' || normalized === 'in-progress';
            if (statusFilter === 'cancelled') return normalized === 'cancelled' || normalized === 'canceled';
            return true;
        });
    }, [jobs, statusFilter]);

    const totalJobs = filteredJobs.length;
    const footerLabel = totalJobs === 0 ? '0' : `1–${totalJobs}`;

    return (
        <div className="space-y-6">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.type === 'driver' ? 'Remove Driver?' : 'Remove Passenger Assistant?'}
                message={
                    confirmDialog.type === 'driver'
                        ? `This will unassign the driver from ${confirmDialog.job ? formatShortJobLabel(confirmDialog.job.id) : 'this job'}. The job will return to "Unassigned" status.`
                        : `This will unassign the passenger assistant from ${confirmDialog.job ? formatShortJobLabel(confirmDialog.job.id) : 'this job'}.`
                }
                confirmLabel="Remove"
                onConfirm={executeRemove}
                onCancel={() => setConfirmDialog({ open: false, type: null, job: null })}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">Active Jobs</h1>
                    <p className="text-[14px] text-gray-500 mt-0.5">Manage and monitor all ongoing jobs for today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/team/jobs/calendar')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                    >
                        <MdEventNote size={18} />
                        View Calendar
                    </button>
                    {can('create_jobs') ? (
                        <button
                            onClick={() => navigate('/team/jobs/add-job')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                        >
                            <MdAdd size={20} />
                            Create New Job
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white">
                        <MdFilterList size={18} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white text-[13px] font-medium text-gray-700 outline-none border-none pr-2 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="complete">Complete</option>
                            <option value="in-progress">In Progress</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading || refreshing}
                        className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50"
                        aria-label="Refresh jobs"
                    >
                        <MdRefresh size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#004D6D] focus:ring-[#004D6D] cursor-pointer" />
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[22%]">Job ID / Route</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-[14%]">Schedule</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[18%]">Driver & Vehicle</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-[14%]">Driver Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-[10%]">Passengers</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-[12%]">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right pr-8 w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50" aria-busy={loading}>
                            {loading &&
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={`jobs-skeleton-${i}`}>
                                        <td className="px-6 py-5"><ShimmerBlock className="w-4 h-4 rounded" rounded="rounded" /></td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-2">
                                                <ShimmerBlock className="h-3.5 w-32 rounded-md" />
                                                <ShimmerBlock className="h-3 w-44 rounded-md" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="mx-auto space-y-2 w-fit">
                                                <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                                <ShimmerBlock className="h-3 w-20 rounded-md" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="mx-auto flex items-center gap-3 w-fit">
                                                <ShimmerBlock className="w-9 h-9 shrink-0" rounded="rounded-full" />
                                                <div className="space-y-2">
                                                    <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                                    <ShimmerBlock className="h-3 w-16 rounded-md" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><ShimmerBlock className="mx-auto h-3.5 w-16 rounded-md" /></td>
                                        <td className="px-6 py-5"><ShimmerBlock className="mx-auto h-3.5 w-10 rounded-md" /></td>
                                        <td className="px-6 py-5"><ShimmerBlock className="mx-auto h-6 w-20 rounded-full" rounded="rounded-full" /></td>
                                        <td className="px-6 py-5"><ShimmerBlock className="ml-auto h-8 w-8 rounded-full" rounded="rounded-full" /></td>
                                    </tr>
                                ))}
                            {!loading && filteredJobs.map((job, idx) => (
                                <tr key={job.id} className="hover:bg-gray-50/50 transition-all">
                                    <td className="px-6 py-5">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(job.id)}
                                            onChange={() => toggleRow(job.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-[#004D6D] focus:ring-[#004D6D] cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5 max-w-0">
                                        <Link
                                            to={`/team/jobs/${job.id}`}
                                            className="block rounded-lg -m-1 p-1 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004D6D]/30"
                                        >
                                            <p className="text-[14px] font-bold text-gray-900 hover:text-[#004D6D] transition-colors truncate" title={job.displayId}>
                                                {truncateText(job.displayId, 35)}
                                            </p>
                                            <p className="text-[12px] text-gray-400 mt-0.5 font-medium hover:text-gray-600 transition-colors truncate" title={job.route}>
                                                {truncateText(job.route, 45)}
                                            </p>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5 text-center whitespace-nowrap">
                                        <p className="text-[13px] font-bold text-gray-800">{job.startTime} - {job.endTime}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{job.duration}</p>
                                    </td>
                                    <td className="px-6 py-5 max-w-0">
                                        {job.driver ? (
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img src={job.driver.avatar} className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                                                <div className="text-left min-w-0 overflow-hidden">
                                                    <p className="text-[13px] font-bold text-gray-800 truncate" title={job.driver.name}>
                                                        {truncateText(job.driver.name, 30)}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium uppercase tracking-wider truncate" title={job.vehicle || '—'}>
                                                        {truncateText(job.vehicle || '—', 18)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : can('edit_jobs') ? (
                                            <button
                                                onClick={() => handleAssignDriver(job)}
                                                className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[11px] font-bold border border-orange-100 hover:bg-orange-100 transition-all"
                                            >
                                                Assign Driver
                                            </button>
                                        ) : (
                                            <span className="text-[11px] text-gray-400 font-medium">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center max-w-0">
                                        {(() => {
                                            const statusNorm = String(job.driverApprovalStatus || '').trim().toLowerCase();
                                            const isCounter = ['counter request', 'counter requested'].includes(statusNorm);

                                            if (isCounter) {
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/team/jobs/${job.id}/counter-offer`)}
                                                        className="inline-flex flex-col items-center gap-1 group max-w-full"
                                                    >
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-600 group-hover:bg-amber-100 transition-colors">
                                                            <MdWarning size={12} />
                                                            Counter Request
                                                        </span>
                                                        {job.driverCounterOfferLabel && (
                                                            <span className="text-[11px] font-semibold text-amber-600 truncate max-w-full" title={job.driverCounterOfferLabel}>
                                                                {truncateText(job.driverCounterOfferLabel, 30)}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-[#004D6D] font-semibold underline underline-offset-2 group-hover:no-underline">
                                                            Review →
                                                        </span>
                                                    </button>
                                                );
                                            }

                                            return (
                                                <div className="flex flex-col items-center min-w-0">
                                                    <span className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide truncate max-w-full" title={job.driverApprovalStatus}>
                                                        {truncateText(job.driverApprovalStatus, 25)}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-gray-600">
                                            <MdPeopleAlt size={16} />
                                            <span className="text-[13px] font-bold">{job.passengers}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border ${job.statusColor}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-6 align-middle">
                                        <button
                                            type="button"
                                            data-job-actions-trigger
                                            onClick={(e) => toggleJobActionMenu(e, idx)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-all rounded-full hover:bg-gray-100"
                                            aria-expanded={activeMenu === idx}
                                            aria-haspopup="menu"
                                        >
                                            <MdMoreVert size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredJobs.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-[14px] text-gray-500 font-medium">
                                        No jobs match the selected status filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-[#F9FAFB] border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[13px] text-gray-500 font-medium tracking-tight">
                        Showing <span className="text-gray-900 font-bold">{footerLabel}</span> of{' '}
                        <span className="text-gray-900 font-bold">{totalJobs}</span> jobs
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50">
                            <MdChevronLeft size={20} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F9FF] text-[#004D6D] border border-blue-100 text-[13px] font-bold">
                            1
                        </button>
                        <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50">
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {showAssignDriver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignDriver(false)} />
                    <div className="relative w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign Driver to Job</h2>
                            <button onClick={() => setShowAssignDriver(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job ID: {selectedJob?.displayId}</p>
                                    <p className="text-[16px] font-bold text-gray-900 mt-1">{selectedJob?.route}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                                    <p className="text-[14px] font-bold text-gray-900 mt-1">{selectedJob?.dateTimeStr}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-700">
                                <MdWarning size={16} className="shrink-0 mt-0.5 text-blue-400" />
                                <span>
                                    Drivers must be approved and already have a vehicle assigned. Drivers on other jobs are hidden. Assignment will be blocked if the vehicle has insufficient seats or lacks wheelchair access.
                                </span>
                            </div>

                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search driver by name or license..."
                                    value={driverQuery}
                                    onChange={(e) => setDriverQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                />
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>

                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {filteredDriverRows.length === 0 && (
                                    <div className="px-4 py-6 text-center text-[13px] text-gray-500 font-medium border border-dashed border-gray-200 rounded-2xl">
                                        No available drivers found.{driverQuery ? ' Try clearing your search.' : ' Drivers must be approved, have a vehicle assigned, and not already be on another job.'}
                                    </div>
                                )}
                                {filteredDriverRows.map((driver) => {
                                    const isCurrent = selectedJob?.assigned_driver_id === driver.id;
                                    const isLoading = assigningDriverId === driver.id;
                                    return (
                                        <div
                                            key={driver.id}
                                            className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${
                                                isCurrent ? 'bg-[#F4F9FF] border-[#004D6D]/20' : 'bg-white border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                                                <img src={driver.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                                                <div className="min-w-0 overflow-hidden">
                                                    <p className="text-[14px] font-bold text-gray-900 truncate" title={driver.name}>
                                                        {truncateText(driver.name, 40)}
                                                    </p>
                                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5 truncate" title={`${driver.vehicleLabel} • ${driver.vehicleCode}`}>
                                                        {truncateText(`${driver.vehicleLabel} • ${driver.vehicleCode}`, 40)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!selectedJob || isCurrent || isLoading) return;
                                                    assignDriverToJob(selectedJob.id, driver);
                                                }}
                                                disabled={isLoading}
                                                className={`shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition-all min-w-[72px] text-center ${
                                                    isCurrent
                                                        ? 'border border-[#004D6D]/30 text-[#004D6D] bg-white cursor-default'
                                                        : isLoading
                                                            ? 'border border-gray-200 text-gray-400 bg-gray-50 cursor-wait'
                                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {isCurrent ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[#004D6D]">
                                                        <MdCheck size={16} />
                                                        Current
                                                    </span>
                                                ) : isLoading ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                        </svg>
                                                        Checking
                                                    </span>
                                                ) : (
                                                    'Assign'
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                            <button onClick={() => setShowAssignDriver(false)} className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignPA && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignPA(false)} />
                    <div className="relative w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign PA to Job</h2>
                            <button onClick={() => setShowAssignPA(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job ID: {selectedJob?.displayId}</p>
                                    <p className="text-[16px] font-bold text-gray-900 mt-1">{selectedJob?.route}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                                    <p className="text-[14px] font-bold text-gray-900 mt-1">{selectedJob?.dateTimeStr}</p>
                                </div>
                            </div>

                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search PA by name..."
                                    value={paQuery}
                                    onChange={(e) => setPaQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                />
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>

                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {filteredPaRows.length === 0 && (
                                    <div className="px-4 py-6 text-center text-[13px] text-gray-500 font-medium border border-dashed border-gray-200 rounded-2xl">
                                        No passenger assistants available (all assigned to other jobs) or no search match.
                                    </div>
                                )}
                                {filteredPaRows.map((pa) => {
                                    const isCurrent = selectedJob?.assigned_pa_id === pa.id;
                                    return (
                                        <div
                                            key={pa.id}
                                            className={`p-4 bg-white border rounded-2xl flex items-center justify-between transition-all hover:border-gray-200 ${
                                                isCurrent ? 'border-[#004D6D]/20 bg-[#F4F9FF]' : 'border-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <img src={pa.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                                                <div>
                                                    <p className="text-[14px] font-bold text-gray-900">{pa.name}</p>
                                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">Passenger Assistant</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!selectedJob || isCurrent) return;
                                                    assignPaToJob(selectedJob.id, pa);
                                                }}
                                                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                                                    isCurrent
                                                        ? 'border border-[#004D6D]/30 text-[#004D6D] bg-white cursor-default'
                                                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {isCurrent ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[#004D6D]">
                                                        <MdCheck size={16} />
                                                        Current
                                                    </span>
                                                ) : (
                                                    'Assign'
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                            <button onClick={() => setShowAssignPA(false)} className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeMenu !== null &&
                actionMenuAnchor &&
                filteredJobs[activeMenu] &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        className="fixed z-[300] w-52 min-w-[13rem] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
                        style={{ top: actionMenuAnchor.top, right: actionMenuAnchor.right }}
                    >
                        <div className="py-1">
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    const job = filteredJobs[activeMenu];
                                    setActiveMenu(null);
                                    setActionMenuAnchor(null);
                                    navigate(`/team/jobs/${job.id}`);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium border-b border-gray-50"
                            >
                                View Details
                            </button>

                            {can('edit_jobs') && (
                                <>
                                    {filteredJobs[activeMenu].driver ? (
                                        <>
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => handleAssignDriver(filteredJobs[activeMenu])}
                                                className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium"
                                            >
                                                Reassign Driver
                                            </button>
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => handleRemoveDriver(filteredJobs[activeMenu])}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 text-left font-medium"
                                            >
                                                <MdPersonRemove size={15} />
                                                Remove Driver
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => handleAssignDriver(filteredJobs[activeMenu])}
                                            className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium"
                                        >
                                            Add Driver
                                        </button>
                                    )}

                                    <div className="border-t border-gray-50">
                                        {filteredJobs[activeMenu].pa ? (
                                            <>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={() => handleAssignPA(filteredJobs[activeMenu])}
                                                    className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium"
                                                >
                                                    Reassign PA
                                                </button>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={() => handleRemovePA(filteredJobs[activeMenu])}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 text-left font-medium"
                                                >
                                                    <MdPersonRemove size={15} />
                                                    Remove PA
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => handleAssignPA(filteredJobs[activeMenu])}
                                                className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium"
                                            >
                                                Add PA
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ActiveJobs;
