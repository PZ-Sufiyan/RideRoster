import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    MdEventNote,
    MdAdd,
    MdFilterList,
    MdDirectionsCar,
    MdPerson,
    MdRefresh,
    MdViewList,
    MdViewModule,
    MdMoreVert,
    MdKeyboardArrowDown,
    MdPeopleAlt,
    MdChevronLeft,
    MdChevronRight,
    MdSearch,
    MdClose,
    MdCheck,
    MdPersonAddAlt1
} from 'react-icons/md';
import { ToastStack } from '../../../../utils/Toast';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../services/companyService';
import {
    fetchJobsListPageData,
    driversAvailableForAssignment,
    passengerAssistantsAvailableForAssignment,
    updateJobAssignedDriver,
    updateJobAssignedPa,
} from '../../../../services/jobService';

const ActiveJobs = () => {
    const navigate = useNavigate();
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [showAssignPA, setShowAssignPA] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [driverQuery, setDriverQuery] = useState('');
    const [paQuery, setPaQuery] = useState('');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [jobsMinimal, setJobsMinimal] = useState([]);
    const [driversCatalog, setDriversCatalog] = useState([]);
    const [pasCatalog, setPasCatalog] = useState([]);

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

    const loadPageData = useCallback(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) throw new Error('Not authenticated.');
        const admin = await getCompanyAdminById(uid);
        const companyId = admin?.company_id;
        if (!companyId) throw new Error('No company linked to your account.');
        return fetchJobsListPageData(companyId);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await loadPageData();
                if (cancelled) return;
                setJobs(data.jobs);
                setJobsMinimal(data.jobsMinimal);
                setDriversCatalog(data.drivers);
                setPasCatalog(data.passengerAssistants);
            } catch (e) {
                if (!cancelled) {
                    setToasts((prev) => [
                        ...prev,
                        {
                            id: `${Date.now()}-${Math.random()}`,
                            type: 'error',
                            message: e?.message || 'Could not load jobs.',
                            autoClose: true,
                            duration: 5000,
                        },
                    ]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadPageData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const data = await loadPageData();
            setJobs(data.jobs);
            setJobsMinimal(data.jobsMinimal);
            setDriversCatalog(data.drivers);
            setPasCatalog(data.passengerAssistants);
        } catch (e) {
            setToasts((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: 'error',
                    message: e?.message || 'Could not refresh.',
                    autoClose: true,
                    duration: 5000,
                },
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 },
        ]);
    };

    const toggleRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter((r) => r !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleAssignDriver = (job) => {
        setSelectedJob(job);
        setDriverQuery('');
        setShowAssignDriver(true);
        setActiveMenu(null);
        setActionMenuAnchor(null);
    };

    const handleAssignPA = (job) => {
        setSelectedJob(job);
        setPaQuery('');
        setShowAssignPA(true);
        setActiveMenu(null);
        setActionMenuAnchor(null);
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
        try {
            await updateJobAssignedDriver(jobId, driverRow.id);
            pushToast('success', `Driver assigned to ${formatShortJobLabel(jobId)}.`);
            setShowAssignDriver(false);
            const data = await loadPageData();
            setJobs(data.jobs);
            setJobsMinimal(data.jobsMinimal);
            setDriversCatalog(data.drivers);
            setPasCatalog(data.passengerAssistants);
        } catch (e) {
            pushToast('error', e?.message || 'Could not assign driver.');
        }
    };

    const assignPaToJob = async (jobId, paRow) => {
        try {
            await updateJobAssignedPa(jobId, paRow.id);
            pushToast('success', `Passenger assistant assigned to ${formatShortJobLabel(jobId)}.`);
            setShowAssignPA(false);
            const data = await loadPageData();
            setJobs(data.jobs);
            setJobsMinimal(data.jobsMinimal);
            setDriversCatalog(data.drivers);
            setPasCatalog(data.passengerAssistants);
        } catch (e) {
            pushToast('error', e?.message || 'Could not assign PA.');
        }
    };

    function formatShortJobLabel(jobId) {
        return `#J-${String(jobId).replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    }

    const filteredDriverRows = useMemo(() => {
        if (!selectedJob || !showAssignDriver) return [];
        const list = driversAvailableForAssignment(driversCatalog, jobsMinimal, selectedJob.id);
        const q = driverQuery.trim().toLowerCase();
        return list
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
                tag: 'Available',
                tagColor: 'text-gray-500 bg-gray-100',
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
                tag: 'Available',
                tagColor: 'text-gray-500 bg-gray-100',
                avatar: p.profile_picture_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.id)}`,
            }));
    }, [selectedJob, showAssignPA, pasCatalog, jobsMinimal, paQuery]);

    const totalJobs = jobs.length;
    const footerLabel =
        totalJobs === 0 ? '0' : `1–${totalJobs}`;

    return (
        <div className="space-y-6">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900">Active Jobs</h1>
                    <p className="text-[14px] text-gray-500 mt-0.5">Manage and monitor all ongoing jobs for today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/jobs/calendar')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                    >
                        <MdEventNote size={18} />
                        View Calendar
                    </button>
                    <button
                        onClick={() => navigate('/admin/jobs/create-step1')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                    >
                        <MdAdd size={20} />
                        Create New Job
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all">
                            <MdFilterList size={18} className="text-gray-400" />
                            All Statuses
                            <MdKeyboardArrowDown size={18} className="text-gray-400 ml-1" />
                        </button>
                    </div>

                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all">
                            <MdDirectionsCar size={18} className="text-gray-400" />
                            All Vehicles
                            <MdKeyboardArrowDown size={18} className="text-gray-400 ml-1" />
                        </button>
                    </div>

                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all">
                            <MdPerson size={18} className="text-gray-400" />
                            All Drivers
                            <MdKeyboardArrowDown size={18} className="text-gray-400 ml-1" />
                        </button>
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
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button className="p-2.5 bg-[#F4F9FF] text-[#004D6D] hover:bg-blue-50 transition-all border-r border-gray-200">
                            <MdViewList size={20} />
                        </button>
                        <button className="p-2.5 bg-white text-gray-400 hover:bg-gray-50 transition-all">
                            <MdViewModule size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#F9FAFB] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#004D6D] focus:ring-[#004D6D] cursor-pointer" />
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Job ID / Route</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Schedule</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Driver & Vehicle</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Passengers</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-[14px] text-gray-500 font-medium">
                                        Loading jobs…
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                jobs.map((job, idx) => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 transition-all">
                                        <td className="px-6 py-5">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(job.id)}
                                                onChange={() => toggleRow(job.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#004D6D] focus:ring-[#004D6D] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-[14px] font-bold text-gray-900">{job.displayId}</p>
                                                <p className="text-[12px] text-gray-400 mt-0.5 font-medium">{job.route}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div>
                                                <p className="text-[13px] font-bold text-gray-800">
                                                    {job.startTime} - {job.endTime}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{job.duration}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {job.driver ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <img
                                                        src={job.driver.avatar}
                                                        className="w-9 h-9 rounded-full object-cover border border-gray-100"
                                                        alt=""
                                                    />
                                                    <div className="text-left">
                                                        <p className="text-[13px] font-bold text-gray-800">{job.driver.name}</p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium uppercase tracking-wider">
                                                            {job.vehicle || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAssignDriver(job)}
                                                    className="mx-auto px-4 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[11px] font-bold border border-orange-100 hover:bg-orange-100 transition-all"
                                                >
                                                    Assign Driver
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-gray-600">
                                                <MdPeopleAlt size={16} />
                                                <span className="text-[13px] font-bold">{job.passengers}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border ${job.statusColor}`}
                                            >
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
                            {!loading && jobs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-[14px] text-gray-500 font-medium">
                                        No jobs yet. Create one to get started.
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
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignDriver(false)}></div>
                    <div className="relative w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign Driver to Job</h2>
                            <button
                                onClick={() => setShowAssignDriver(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Job ID: {selectedJob?.displayId}
                                    </p>
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
                                    placeholder="Search driver by name or license..."
                                    value={driverQuery}
                                    onChange={(e) => setDriverQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10 focus:border-[#004D6D] transition-all"
                                />
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>

                            <div className="space-y-3">
                                {filteredDriverRows.length === 0 && (
                                    <div className="px-4 py-6 text-center text-[13px] text-gray-500 font-medium border border-dashed border-gray-200 rounded-2xl">
                                        No drivers available (all are assigned to other jobs) or no match search.
                                    </div>
                                )}
                                {filteredDriverRows.map((driver) => {
                                    const isCurrent = selectedJob?.assigned_driver_id === driver.id;
                                    return (
                                        <div
                                            key={driver.id}
                                            className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${
                                                isCurrent
                                                    ? 'bg-[#F4F9FF] border-[#004D6D]/20'
                                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={driver.avatar}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="text-[14px] font-bold text-gray-900">{driver.name}</p>
                                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">
                                                        {driver.vehicleLabel} • {driver.vehicleCode}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${driver.tagColor}`}
                                                >
                                                    {driver.tag}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        if (!selectedJob) return;
                                                        if (isCurrent) return;
                                                        assignDriverToJob(selectedJob.id, driver);
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                            <button
                                onClick={() => setShowAssignDriver(false)}
                                className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/10"
                            >
                                <MdPersonAddAlt1 size={20} />
                                Invite Driver
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignPA && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignPA(false)}></div>
                    <div className="relative w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-[20px] font-bold text-gray-900">Assign PA to Job</h2>
                            <button
                                onClick={() => setShowAssignPA(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Job ID: {selectedJob?.displayId}
                                    </p>
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

                            <div className="space-y-3">
                                {filteredPaRows.length === 0 && (
                                    <div className="px-4 py-6 text-center text-[13px] text-gray-500 font-medium border border-dashed border-gray-200 rounded-2xl">
                                        No passenger assistants available (all assigned to other jobs) or no match search.
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
                                                <img
                                                    src={pa.avatar}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="text-[14px] font-bold text-gray-900">{pa.name}</p>
                                                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">Passenger Assistant</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${pa.tagColor}`}
                                                >
                                                    {pa.tag}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        if (!selectedJob) return;
                                                        if (isCurrent) return;
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                            <button
                                onClick={() => setShowAssignPA(false)}
                                className="px-6 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#004D6D] text-white rounded-xl text-[14px] font-bold hover:bg-[#003c55] transition-all shadow-lg shadow-[#004D6D]/10"
                            >
                                <MdPersonAddAlt1 size={20} />
                                Invite PA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeMenu !== null &&
                actionMenuAnchor &&
                jobs[activeMenu] &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        className="fixed z-[300] w-48 min-w-[12rem] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
                        style={{ top: actionMenuAnchor.top, right: actionMenuAnchor.right }}
                    >
                        <div className="py-1">
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    const job = jobs[activeMenu];
                                    setActiveMenu(null);
                                    setActionMenuAnchor(null);
                                    navigate(`/admin/jobs/${job.id}`);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium border-b border-gray-50"
                            >
                                View Details
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    const job = jobs[activeMenu];
                                    handleAssignDriver(job);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium"
                            >
                                {jobs[activeMenu].driver ? 'Reassign Driver' : 'Add Driver'}
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    const job = jobs[activeMenu];
                                    handleAssignPA(job);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 text-left font-medium border-t border-gray-50"
                            >
                                {jobs[activeMenu].pa ? 'Reassign PA' : 'Add PA'}
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ActiveJobs;
