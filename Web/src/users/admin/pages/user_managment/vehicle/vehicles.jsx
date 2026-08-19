import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    MdSearch,
    MdAdd,
    MdMoreVert,
    MdChevronLeft,
    MdChevronRight,
    MdKeyboardArrowDown,
} from 'react-icons/md';
import { useVehiclesList } from '../../../../../hooks/useVehiclesList';
import { useVehicleDriverAssignment } from '../../../../../hooks/useVehicleDriverAssignment';
import { AlertDialog, AssignDriverPickerModal, ConfirmDialog } from '../../../../../components/AssignDriverDialogs';
import FleetBadge from '../../../../../components/FleetBadge';
import VehicleStatusBadge from '../../../../../components/VehicleStatusBadge';
import { ShimmerBlock } from '../../../../../utils/Shimmer';
import { truncateText } from '../../../../../utils/truncateText';
import { isPrivateFleet } from '../../../../../utils/fleet';
import { ToastStack } from '../../../../../utils/Toast';
import { updateVehicleStatus } from '../../../../../services/driverVehicleService';
import { useVehicleOffRoad } from '../../../../../hooks/useVehicleOffRoad';
import { VehicleOffRoadDialogs } from '../../../../../components/OffRoadDialogs';
import {
    formatVehicleStatusLabel,
    isVehicleOffRoad,
    normalizeVehicleStatus,
    VEHICLE_STATUS,
    vehicleStatusFromAction,
} from '../../../../../utils/vehicleStatus';

const ITEMS_PER_PAGE = 5;

function formatDateAdded(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toISOString().slice(0, 10);
}

function vehicleLabel(v) {
    const name = [v.make, v.model].filter(Boolean).join(' ').trim();
    return name || v.taxi_license_plate_number || v.registration_number || 'Vehicle';
}

function driverName(v) {
    const d = v.driver;
    if (!d) return null;
    const n = [d.first_name, d.last_name].filter(Boolean).join(' ').trim();
    return n || null;
}

const VehiclesPage = ({ basePath = '/portal' }) => {
    const navigate = useNavigate();
    const { vehicles, loading, error: loadError, reload, setVehicles } = useVehiclesList();
    const [search, setSearch] = useState('');
    const [fleetFilter, setFleetFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFleetOpen, setIsFleetOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [openMenu, setOpenMenu] = useState(null);
    const [actionBusyId, setActionBusyId] = useState(null);
    const [toasts, setToasts] = useState([]);
    const menuRef = useRef(null);
    const fleetRef = useRef(null);
    const statusRef = useRef(null);

    const pushToast = (type, message) => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 }]);
    };

    const assignment = useVehicleDriverAssignment({
        onAssigned: ({ vehicleId, driverName: name }) => {
            setVehicles((prev) => prev.map((v) => (
                v.id === vehicleId
                    ? { ...v, driver_id: v.driver_id, driver: { ...(v.driver || {}), first_name: name } }
                    : v
            )));
            pushToast('success', `${name} assigned to this vehicle.`);
            reload();
        },
        onUnassigned: ({ vehicleId }) => {
            setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? { ...v, driver_id: null, driver: null } : v)));
            pushToast('success', 'Driver unassigned from this vehicle.');
            reload();
        },
    });

    const offRoad = useVehicleOffRoad({
        onComplete: ({ message, vehicle: updated, replacementVehicleId, driverId }) => {
            setVehicles((prev) => {
                const broken = updated ? prev.find((v) => v.id === updated.id) : null;
                const driver = broken?.driver || null;
                return prev.map((row) => {
                    if (updated && row.id === updated.id) {
                        return {
                            ...row,
                            ...updated,
                            driver: updated.driver_id ? (updated.driver || driver) : null,
                        };
                    }
                    if (replacementVehicleId && row.id === replacementVehicleId) {
                        return { ...row, driver_id: driverId || row.driver_id, driver };
                    }
                    return row;
                });
            });
            pushToast('success', message || 'Vehicle marked as Off Road.');
        },
    });

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current?.contains(e.target)) return;
            for (const el of document.querySelectorAll('[data-vehicle-action-trigger]')) {
                if (el.contains(e.target)) return;
            }
            setOpenMenu(null);
            if (fleetRef.current && !fleetRef.current.contains(e.target)) setIsFleetOpen(false);
            if (statusRef.current && !statusRef.current.contains(e.target)) setIsStatusOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return vehicles.filter((v) => {
            const label = vehicleLabel(v).toLowerCase();
            const plate = (v.taxi_license_plate_number || '').toLowerCase();
            const reg = (v.registration_number || '').toLowerCase();
            const assigned = (driverName(v) || '').toLowerCase();
            const matchSearch = !q || label.includes(q) || plate.includes(q) || reg.includes(q) || assigned.includes(q);
            const fleet = String(v.fleet || 'company').toLowerCase();
            const matchFleet = fleetFilter === 'All' || fleet === fleetFilter.toLowerCase();
            const status = normalizeVehicleStatus(v.status);
            const matchStatus =
                statusFilter === 'All' ||
                status === (statusFilter === 'Off Road' ? VEHICLE_STATUS.OFF_ROAD : VEHICLE_STATUS.ACTIVE);
            return matchSearch && matchFleet && matchStatus;
        });
    }, [vehicles, search, fleetFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, fleetFilter, statusFilter]);

    const handleStatusChange = async (action, targetVehicle) => {
        const nextStatus = vehicleStatusFromAction(action);
        if (!nextStatus || !targetVehicle?.id) return;
        setOpenMenu(null);
        if (nextStatus === VEHICLE_STATUS.OFF_ROAD) {
            await offRoad.request(targetVehicle);
            return;
        }
        setActionBusyId(targetVehicle.id);
        try {
            const updated = await updateVehicleStatus(targetVehicle.id, nextStatus);
            setVehicles((prev) => prev.map((row) => (row.id === targetVehicle.id ? { ...row, ...updated } : row)));
            pushToast('success', `Vehicle marked as ${formatVehicleStatusLabel(nextStatus)}.`);
        } catch (e) {
            pushToast('error', e?.message || 'Could not update vehicle status.');
        } finally {
            setActionBusyId(null);
        }
    };

    const toggleActionMenu = (e, vehicleId) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setOpenMenu((prev) => (prev?.vehicleId === vehicleId ? null : {
            vehicleId,
            top: rect.bottom + 6,
            left: Math.max(8, rect.right - 176),
        }));
    };

    const menuVehicle = openMenu ? vehicles.find((v) => v.id === openMenu.vehicleId) : null;
    const privateVehicle = menuVehicle ? isPrivateFleet(menuVehicle.fleet) : false;
    const hasDriver = Boolean(menuVehicle?.driver_id);
    const shimmerRows = Array.from({ length: 5 });

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [1];
        if (currentPage > 3) pages.push('...');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p += 1) pages.push(p);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="space-y-5">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
            {(loadError) && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
                    <span>{loadError}</span>
                    <button type="button" onClick={() => reload()} className="shrink-0 text-red-700 font-medium hover:underline">Retry</button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage company and private vehicles, and assign company drivers.</p>
                </div>
                <button
                    onClick={() => navigate(`${basePath}/users/vehicles/add`)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm shrink-0"
                >
                    <MdAdd size={18} />
                    Add New Vehicle
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-visible">
                <div className="border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdSearch className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by plate, make or driver"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-64"
                                />
                            </div>
                            <div className="relative" ref={fleetRef}>
                                <button
                                    onClick={() => setIsFleetOpen((o) => !o)}
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50"
                                >
                                    {fleetFilter === 'All' ? 'All fleets' : fleetFilter}
                                    <MdKeyboardArrowDown className="text-gray-400" size={16} />
                                </button>
                                {isFleetOpen && (
                                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                        {['All', 'Company', 'Private'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => { setFleetFilter(s); setIsFleetOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${fleetFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative" ref={statusRef}>
                                <button
                                    onClick={() => setIsStatusOpen((o) => !o)}
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50"
                                >
                                    {statusFilter === 'All' ? 'All statuses' : statusFilter}
                                    <MdKeyboardArrowDown className="text-gray-400" size={16} />
                                </button>
                                {isStatusOpen && (
                                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                        {['All', 'Active', 'Off Road'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => { setStatusFilter(s); setIsStatusOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${statusFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left table-fixed">
                        <thead className="border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[18%]">Vehicle</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[14%]">Plate</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[16%]">Assigned driver</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">Fleet</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[12%]">Status</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[12%]">Date added</th>
                                <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? shimmerRows.map((_, index) => (
                                <tr key={`veh-skel-${index}`}>
                                    <td className="px-4 py-3.5"><ShimmerBlock className="h-3.5 w-36 rounded-md" /></td>
                                    <td className="px-4 py-3.5"><ShimmerBlock className="h-3.5 w-24 rounded-md" /></td>
                                    <td className="px-4 py-3.5"><ShimmerBlock className="h-3.5 w-28 rounded-md" /></td>
                                    <td className="px-4 py-3.5"><ShimmerBlock className="h-6 w-20 rounded-full" rounded="rounded-full" /></td>
                                    <td className="px-4 py-3.5"><ShimmerBlock className="h-6 w-20 rounded-full" rounded="rounded-full" /></td>
                                    <td className="px-4 py-3.5"><ShimmerBlock className="h-3.5 w-24 rounded-md" /></td>
                                    <td className="px-4 py-3.5 text-right"><ShimmerBlock className="ml-auto h-8 w-8 rounded-lg" /></td>
                                </tr>
                            )) : paginated.length > 0 ? paginated.map((vehicle) => {
                                const assigned = driverName(vehicle);
                                return (
                                    <tr key={vehicle.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3.5 max-w-0">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer group min-w-0"
                                                onClick={() => navigate(`${basePath}/users/vehicles/${vehicle.id}`)}
                                            >
                                                <img
                                                    src={vehicle.vehicle_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(vehicleLabel(vehicle))}&background=f3f4f6&color=374151&size=64`}
                                                    alt=""
                                                    className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                                                />
                                                <span className="font-medium text-gray-900 truncate group-hover:text-blue-600" title={vehicleLabel(vehicle)}>
                                                    {truncateText(vehicleLabel(vehicle), 40)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">
                                            {truncateText(vehicle.taxi_license_plate_number || vehicle.registration_number || '—', 20)}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500">
                                            {assigned || <span className="text-gray-400">Unassigned</span>}
                                        </td>
                                        <td className="px-4 py-3.5"><FleetBadge fleet={vehicle.fleet} /></td>
                                        <td className="px-4 py-3.5"><VehicleStatusBadge status={vehicle.status} /></td>
                                        <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDateAdded(vehicle.created_at)}</td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                type="button"
                                                data-vehicle-action-trigger
                                                onClick={(e) => toggleActionMenu(e, vehicle.id)}
                                                disabled={actionBusyId === vehicle.id}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                                            >
                                                <MdMoreVert size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        No vehicles found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of{' '}
                        <span className="font-medium text-gray-900">{filtered.length}</span> results
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40">
                            <MdChevronLeft size={18} />
                        </button>
                        {getPageNumbers().map((page, i) =>
                            page === '...' ? (
                                <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`min-w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium border ${
                                        currentPage === page ? 'bg-[#005580] text-white border-[#005580]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            )
                        )}
                        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || filtered.length === 0} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-40">
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {openMenu && menuVehicle && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-100 w-44 bg-white border border-gray-100 rounded-lg shadow-lg py-0.5"
                    style={{ top: openMenu.top, left: openMenu.left }}
                    role="menu"
                >
                    <button type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => { setOpenMenu(null); navigate(`${basePath}/users/vehicles/${menuVehicle.id}`); }}>
                        View
                    </button>
                    <button type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => { setOpenMenu(null); navigate(`${basePath}/users/vehicles/${menuVehicle.id}/edit`); }}>
                        Edit
                    </button>
                    {isVehicleOffRoad(menuVehicle.status) ? (
                        <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50"
                            disabled={actionBusyId === menuVehicle.id || offRoad.busy}
                            onClick={() => handleStatusChange('Set Active', menuVehicle)}
                        >
                            Set Active
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm text-orange-700 hover:bg-orange-50"
                            disabled={actionBusyId === menuVehicle.id || offRoad.busy}
                            onClick={() => handleStatusChange('Set Off Road', menuVehicle)}
                        >
                            Set Off Road
                        </button>
                    )}
                    {!privateVehicle && !hasDriver && !isVehicleOffRoad(menuVehicle.status) && (
                        <button type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => { setOpenMenu(null); assignment.openAssign(menuVehicle); }}>
                            Assign driver
                        </button>
                    )}
                    {!privateVehicle && hasDriver && (
                        <>
                            {!isVehicleOffRoad(menuVehicle.status) && (
                                <button type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" onClick={() => { setOpenMenu(null); assignment.openAssign(menuVehicle); }}>
                                    Change driver
                                </button>
                            )}
                            <button type="button" className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50" onClick={() => { setOpenMenu(null); assignment.requestUnassign(menuVehicle); }}>
                                Unassign
                            </button>
                        </>
                    )}
                </div>,
                document.body
            )}

            <AssignDriverPickerModal
                open={assignment.pickerOpen}
                title={assignment.pickerVehicle?.driver_id ? 'Change driver' : 'Assign driver'}
                query={assignment.query}
                onQueryChange={assignment.setQuery}
                rows={assignment.mappedRows}
                loadingId={assignment.loadingId}
                onPick={assignment.pickDriver}
                onClose={assignment.closePicker}
            />
            <AlertDialog
                open={Boolean(assignment.alert)}
                title={assignment.alert?.title}
                message={assignment.alert?.message}
                onClose={() => assignment.setAlert(null)}
            />
            <ConfirmDialog
                open={Boolean(assignment.confirmUnassign)}
                title="Unassign driver"
                message="This driver will have no vehicle until you assign them again."
                confirmLabel="Unassign"
                danger
                busy={assignment.busy}
                onConfirm={assignment.confirmUnassignDriver}
                onClose={() => assignment.setConfirmUnassign(null)}
            />
            <VehicleOffRoadDialogs flow={offRoad} />
        </div>
    );
};

export default VehiclesPage;
