import React from 'react';
import { MdClose, MdSearch, MdWarning } from 'react-icons/md';
import { AlertDialog, AssignDriverPickerModal, ConfirmDialog } from './AssignDriverDialogs';
import { isPrivateFleet } from '../utils/fleet';
import { summarizeBlockingJobs } from '../services/vehicleOffRoadService';

export function OffRoadChoiceDialog({
    open,
    vehicle,
    jobs,
    busy,
    onSwap,
    onReassign,
    onStop,
    onClose,
}) {
    if (!open) return null;
    const privateVehicle = isPrivateFleet(vehicle?.fleet);
    const jobLabel = summarizeBlockingJobs(jobs);
    const jobWord = (jobs || []).length > 1 ? 'jobs' : 'job';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !busy && onClose()} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center gap-2 mb-3">
                    <MdWarning className="text-orange-500 shrink-0" size={22} />
                    <h2 className="text-[18px] font-bold text-gray-900">Vehicle is on a {jobWord}</h2>
                </div>
                <p className="text-[13px] text-gray-600 mb-5">
                    This vehicle is assigned to a driver on {jobLabel}. Marking it Off Road means it is broken and cannot stay as the job vehicle. Choose one:
                </p>
                <div className="space-y-2">
                    <button
                        type="button"
                        disabled={busy || privateVehicle}
                        onClick={onSwap}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                    >
                        <p className="text-sm font-semibold text-gray-900">Swap vehicle</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                            {privateVehicle
                                ? 'Private vehicles cannot be swapped from the portal.'
                                : 'Give this driver another Active company vehicle so they can finish the job.'}
                        </p>
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onReassign}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <p className="text-sm font-semibold text-gray-900">Reassign {jobWord}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                            Move {jobWord === 'jobs' ? 'these jobs' : 'the job'} to another approved driver who already has an Active vehicle.
                        </p>
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onStop}
                        className="w-full text-left px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                        <p className="text-sm font-semibold text-red-600">Stop {jobWord}</p>
                        <p className="text-[12px] text-red-500/80 mt-0.5">
                            Cancel {jobWord === 'jobs' ? 'these jobs' : 'the job'} if it cannot continue.
                        </p>
                    </button>
                </div>
                <button
                    type="button"
                    disabled={busy}
                    onClick={onClose}
                    className="w-full mt-4 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export function AssignVehiclePickerModal({
    open,
    title = 'Swap vehicle',
    query,
    onQueryChange,
    rows,
    loadingId,
    onPick,
    onClose,
    emptyText = 'No spare Active company vehicles are available.',
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <h2 className="text-[20px] font-bold text-gray-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                    >
                        <MdClose size={24} />
                    </button>
                </div>
                <div className="p-8 space-y-5 overflow-y-auto">
                    <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-700">
                        Only unassigned Active company vehicles are shown. The current driver keeps the job.
                    </div>
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            placeholder="Search by plate, make or model..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#004D6D]/10"
                        />
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {rows.length === 0 && (
                            <div className="px-4 py-6 text-center text-[13px] text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                                {emptyText}
                            </div>
                        )}
                        {rows.map((row) => {
                            const isLoading = loadingId === row.id;
                            return (
                                <div
                                    key={row.id}
                                    className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={row.avatar}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{row.name}</p>
                                            <p className="text-[12px] text-gray-400 truncate">{row.sub}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => onPick(row)}
                                        className="shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Swapping…' : 'Use this vehicle'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function VehicleOffRoadDialogs({ flow }) {
    const jobLabel = summarizeBlockingJobs(flow.jobs);
    const jobWord = (flow.jobs || []).length > 1 ? 'jobs' : 'job';

    return (
        <>
            <OffRoadChoiceDialog
                open={flow.choiceOpen}
                vehicle={flow.vehicle}
                jobs={flow.jobs}
                busy={flow.busy}
                onSwap={flow.openSwap}
                onReassign={flow.openReassign}
                onStop={flow.requestStop}
                onClose={flow.closeAll}
            />
            <AssignVehiclePickerModal
                open={flow.vehiclePickerOpen}
                query={flow.query}
                onQueryChange={flow.setQuery}
                rows={flow.mappedVehicles}
                loadingId={flow.loadingId}
                onPick={flow.pickReplacementVehicle}
                onClose={flow.closePickers}
            />
            <AssignDriverPickerModal
                open={flow.driverPickerOpen}
                title="Reassign job"
                query={flow.query}
                onQueryChange={flow.setQuery}
                rows={flow.mappedDrivers}
                loadingId={flow.loadingId}
                onPick={flow.pickReplacementDriver}
                onClose={flow.closePickers}
                banner="Only approved company drivers with an Active vehicle, who are not already on a job, are shown."
                emptyText="No approved drivers with an Active vehicle are available."
                pickLabel="Reassign"
                pickingLabel="Reassigning…"
            />
            <ConfirmDialog
                open={flow.confirmStop}
                title={`Stop ${jobWord}`}
                message={`This will cancel ${jobLabel}. The vehicle will then be marked Off Road.`}
                confirmLabel={jobWord === 'jobs' ? 'Cancel jobs' : 'Cancel job'}
                danger
                busy={flow.busy}
                onConfirm={flow.confirmStopJobs}
                onClose={flow.cancelStop}
            />
            <AlertDialog
                open={Boolean(flow.alert)}
                title={flow.alert?.title}
                message={flow.alert?.message}
                onClose={() => flow.setAlert(null)}
            />
        </>
    );
}
