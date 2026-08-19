import { useCallback, useMemo, useState } from 'react';
import {
    assignDriverToVehicle,
    getAssignableCompanyDrivers,
    getBlockingJobsForDriver,
    getCurrentCompanyId,
    unassignDriverFromVehicle,
} from '../services/vehicleAssignmentService';
import { isPrivateFleet } from '../utils/fleet';
import { isVehicleOffRoad } from '../utils/vehicleStatus';
import { invalidateDriversListCache } from './useDriversList';
import { invalidateVehiclesListCache } from './useVehiclesList';

function driverDisplayName(d) {
    return [d?.first_name, d?.last_name].filter(Boolean).join(' ').trim() || 'Driver';
}

function avatarFor(d) {
    const name = driverDisplayName(d);
    return d?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f3f4f6&color=374151&size=64`;
}

export function canManageVehicleAssignment(vehicle) {
    return Boolean(vehicle) && !isPrivateFleet(vehicle.fleet);
}

export function useVehicleDriverAssignment({ onAssigned, onUnassigned } = {}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerVehicle, setPickerVehicle] = useState(null);
    const [query, setQuery] = useState('');
    const [rows, setRows] = useState([]);
    const [loadingId, setLoadingId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmUnassign, setConfirmUnassign] = useState(null);

    const mappedRows = useMemo(() => {
        const q = String(query || '').trim().toLowerCase();
        return rows
            .filter((d) => {
                if (!q) return true;
                const name = driverDisplayName(d).toLowerCase();
                const lic = String(d.license_no || '').toLowerCase();
                return name.includes(q) || lic.includes(q);
            })
            .map((d) => ({
                id: d.id,
                name: driverDisplayName(d),
                sub: d.license_no ? `License ${d.license_no}` : 'Approved company driver',
                avatar: avatarFor(d),
            }));
    }, [rows, query]);

    const closePicker = useCallback(() => {
        setPickerOpen(false);
        setPickerVehicle(null);
        setQuery('');
        setRows([]);
        setLoadingId(null);
    }, []);

    const openAssign = useCallback(async (vehicle) => {
        if (!canManageVehicleAssignment(vehicle)) {
            setAlert({
                title: 'Cannot assign driver',
                message: 'Private vehicles cannot be assigned from the portal.',
            });
            return;
        }
        if (isVehicleOffRoad(vehicle.status)) {
            setAlert({
                title: 'Vehicle is Off Road',
                message: 'This vehicle is broken down. Set it to Active before assigning a driver.',
            });
            return;
        }
        try {
            setBusy(true);
            const companyId = await getCurrentCompanyId();
            if (vehicle.driver_id) {
                const jobs = await getBlockingJobsForDriver(companyId, vehicle.driver_id);
                if (jobs.length) {
                    const name = jobs[0]?.job_name || 'a job';
                    setAlert({
                        title: 'Driver is assigned to a job',
                        message: `This driver is assigned to "${name}". Remove them from the job first before you change the assigned driver.`,
                    });
                    return;
                }
            }
            const drivers = await getAssignableCompanyDrivers(companyId);
            setPickerVehicle(vehicle);
            setRows(drivers);
            setQuery('');
            setPickerOpen(true);
        } catch (e) {
            setAlert({ title: 'Could not open assign driver', message: e?.message || 'Please try again.' });
        } finally {
            setBusy(false);
        }
    }, []);

    const pickDriver = useCallback(async (row) => {
        if (!pickerVehicle) return;
        try {
            setLoadingId(row.id);
            const companyId = await getCurrentCompanyId();
            await assignDriverToVehicle({
                companyId,
                vehicleId: pickerVehicle.id,
                driverId: row.id,
            });
            invalidateDriversListCache();
            invalidateVehiclesListCache();
            closePicker();
            onAssigned?.({ vehicleId: pickerVehicle.id, driverId: row.id, driverName: row.name });
        } catch (e) {
            setAlert({ title: 'Could not assign driver', message: e?.message || 'Please try again.' });
        } finally {
            setLoadingId(null);
        }
    }, [pickerVehicle, closePicker, onAssigned]);

    const requestUnassign = useCallback(async (vehicle) => {
        if (!canManageVehicleAssignment(vehicle)) {
            setAlert({
                title: 'Cannot unassign driver',
                message: 'Private vehicles cannot be unassigned from the portal.',
            });
            return;
        }
        if (!vehicle.driver_id) return;
        try {
            setBusy(true);
            const companyId = await getCurrentCompanyId();
            const jobs = await getBlockingJobsForDriver(companyId, vehicle.driver_id);
            if (jobs.length) {
                const name = jobs[0]?.job_name || 'a job';
                setAlert({
                    title: 'Driver is assigned to a job',
                    message: `This driver is assigned to "${name}". Remove them from the job first before you unassign this driver.`,
                });
                return;
            }
            setConfirmUnassign(vehicle);
        } catch (e) {
            setAlert({ title: 'Could not unassign driver', message: e?.message || 'Please try again.' });
        } finally {
            setBusy(false);
        }
    }, []);

    const confirmUnassignDriver = useCallback(async () => {
        if (!confirmUnassign) return;
        try {
            setBusy(true);
            const companyId = await getCurrentCompanyId();
            await unassignDriverFromVehicle({ companyId, vehicleId: confirmUnassign.id });
            invalidateDriversListCache();
            invalidateVehiclesListCache();
            setConfirmUnassign(null);
            onUnassigned?.({ vehicleId: confirmUnassign.id });
        } catch (e) {
            setConfirmUnassign(null);
            setAlert({ title: 'Could not unassign driver', message: e?.message || 'Please try again.' });
        } finally {
            setBusy(false);
        }
    }, [confirmUnassign, onUnassigned]);

    return {
        pickerOpen,
        pickerVehicle,
        query,
        setQuery,
        mappedRows,
        loadingId,
        busy,
        alert,
        setAlert,
        confirmUnassign,
        setConfirmUnassign,
        openAssign,
        closePicker,
        pickDriver,
        requestUnassign,
        confirmUnassignDriver,
    };
}
