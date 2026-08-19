import { useCallback, useMemo, useState } from 'react';
import {
    cancelJobsAndMarkOffRoad,
    getCurrentCompanyId,
    getReplacementDrivers,
    getReplacementVehicles,
    reassignJobsAndMarkOffRoad,
    requestVehicleOffRoad,
    swapReplacementAndMarkOffRoad,
    vehicleLabel,
} from '../services/vehicleOffRoadService';
import { invalidateDriversListCache } from './useDriversList';
import { refreshVehiclesListInBackground } from './useVehiclesList';

function driverDisplayName(d) {
    return [d?.first_name, d?.last_name].filter(Boolean).join(' ').trim() || 'Driver';
}

function avatarForDriver(d) {
    const name = driverDisplayName(d);
    return d?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f3f4f6&color=374151&size=64`;
}

function avatarForVehicle(v) {
    const name = vehicleLabel(v);
    return v?.vehicle_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f3f4f6&color=374151&size=64`;
}

const TOAST_BY_ACTION = {
    marked: 'Vehicle marked as Off Road.',
    swapped: 'Replacement vehicle assigned. This vehicle is now Off Road.',
    reassigned: 'Job reassigned. This vehicle is now Off Road.',
    cancelled: 'Job cancelled. This vehicle is now Off Road.',
};

export function useVehicleOffRoad({ onComplete } = {}) {
    const [choiceOpen, setChoiceOpen] = useState(false);
    const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);
    const [driverPickerOpen, setDriverPickerOpen] = useState(false);
    const [confirmStop, setConfirmStop] = useState(false);
    const [vehicle, setVehicle] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [query, setQuery] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loadingId, setLoadingId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [alert, setAlert] = useState(null);

    const finish = useCallback((result) => {
        invalidateDriversListCache();
        refreshVehiclesListInBackground();
        setChoiceOpen(false);
        setVehiclePickerOpen(false);
        setDriverPickerOpen(false);
        setConfirmStop(false);
        setVehicle(null);
        setJobs([]);
        setQuery('');
        setVehicles([]);
        setDrivers([]);
        onComplete?.({
            ...result,
            message: TOAST_BY_ACTION[result.action] || TOAST_BY_ACTION.marked,
        });
    }, [onComplete]);

    const closeAll = useCallback(() => {
        if (busy) return;
        setChoiceOpen(false);
        setVehiclePickerOpen(false);
        setDriverPickerOpen(false);
        setConfirmStop(false);
        setVehicle(null);
        setJobs([]);
        setQuery('');
        setVehicles([]);
        setDrivers([]);
        setLoadingId(null);
    }, [busy]);

    const closePickers = useCallback(() => {
        setVehiclePickerOpen(false);
        setDriverPickerOpen(false);
        setQuery('');
        setLoadingId(null);
        setChoiceOpen(true);
    }, []);

    const request = useCallback(async (targetVehicle) => {
        if (!targetVehicle?.id) return;
        try {
            setBusy(true);
            const companyId = await getCurrentCompanyId();
            const result = await requestVehicleOffRoad({
                companyId,
                vehicleId: targetVehicle.id,
            });
            if (result.blocked) {
                setVehicle(targetVehicle);
                setJobs(result.jobs || []);
                setChoiceOpen(true);
                return;
            }
            finish(result);
        } catch (e) {
            setAlert({ title: 'Could not mark Off Road', message: e?.message || 'Please try again.' });
        } finally {
            setBusy(false);
        }
    }, [finish]);

    const openSwap = useCallback(async () => {
        if (!vehicle?.id) return;
        try {
            setBusy(true);
            const companyId = await getCurrentCompanyId();
            const rows = await getReplacementVehicles({
                companyId,
                excludeVehicleId: vehicle.id,
            });
            setVehicles(rows);
            setQuery('');
            setChoiceOpen(false);
            setVehiclePickerOpen(true);
        } catch (e) {
            setAlert({ title: 'Could not load vehicles', message: e?.message || 'Please try again.' });
        } finally {
            setBusy(false);
        }
    }, [vehicle]);

    const openReassign = useCallback(async () => {
        if (!vehicle?.id) return;
        try {
            setBusy(true);
            const companyId = await getCurrentCompanyId();
            const rows = await getReplacementDrivers({
                companyId,
                excludeDriverId: vehicle.driver_id,
            });
            setDrivers(rows);
            setQuery('');
            setChoiceOpen(false);
            setDriverPickerOpen(true);
        } catch (e) {
            setAlert({ title: 'Could not load drivers', message: e?.message || 'Please try again.' });
        } finally {
            setBusy(false);
        }
    }, [vehicle]);

    const requestStop = useCallback(() => {
        setChoiceOpen(false);
        setConfirmStop(true);
    }, []);

    const cancelStop = useCallback(() => {
        setConfirmStop(false);
        setChoiceOpen(true);
    }, []);

    const pickReplacementVehicle = useCallback(async (row) => {
        if (!vehicle?.id) return;
        try {
            setLoadingId(row.id);
            const companyId = await getCurrentCompanyId();
            const result = await swapReplacementAndMarkOffRoad({
                companyId,
                brokenVehicleId: vehicle.id,
                replacementVehicleId: row.id,
            });
            finish(result);
        } catch (e) {
            setAlert({ title: 'Could not swap vehicle', message: e?.message || 'Please try again.' });
        } finally {
            setLoadingId(null);
        }
    }, [vehicle, finish]);

    const pickReplacementDriver = useCallback(async (row) => {
        if (!vehicle?.id) return;
        try {
            setLoadingId(row.id);
            const companyId = await getCurrentCompanyId();
            const result = await reassignJobsAndMarkOffRoad({
                companyId,
                vehicleId: vehicle.id,
                newDriverId: row.id,
            });
            finish(result);
        } catch (e) {
            setAlert({ title: 'Could not reassign job', message: e?.message || 'Please try again.' });
        } finally {
            setLoadingId(null);
        }
    }, [vehicle, finish]);

    const confirmStopJobs = useCallback(async () => {
        if (!vehicle?.id) return;
        try {
            setBusy(true);
            const companyId = await getCurrentCompanyId();
            const result = await cancelJobsAndMarkOffRoad({
                companyId,
                vehicleId: vehicle.id,
            });
            finish(result);
        } catch (e) {
            setConfirmStop(false);
            setAlert({ title: 'Could not cancel job', message: e?.message || 'Please try again.' });
        } finally {
            setBusy(false);
        }
    }, [vehicle, finish]);

    const mappedVehicles = useMemo(() => {
        const q = String(query || '').trim().toLowerCase();
        return vehicles
            .filter((v) => {
                if (!q) return true;
                const label = vehicleLabel(v).toLowerCase();
                const plate = String(v.taxi_license_plate_number || '').toLowerCase();
                const reg = String(v.registration_number || '').toLowerCase();
                return label.includes(q) || plate.includes(q) || reg.includes(q);
            })
            .map((v) => ({
                id: v.id,
                name: vehicleLabel(v),
                sub: v.taxi_license_plate_number || v.registration_number || 'Company vehicle',
                avatar: avatarForVehicle(v),
            }));
    }, [vehicles, query]);

    const mappedDrivers = useMemo(() => {
        const q = String(query || '').trim().toLowerCase();
        return drivers
            .filter((d) => {
                if (!q) return true;
                const name = driverDisplayName(d).toLowerCase();
                const lic = String(d.license_no || '').toLowerCase();
                return name.includes(q) || lic.includes(q);
            })
            .map((d) => ({
                id: d.id,
                name: driverDisplayName(d),
                sub: d.vehicle
                    ? `${vehicleLabel(d.vehicle)}${d.vehicle.taxi_license_plate_number ? ` · ${d.vehicle.taxi_license_plate_number}` : ''}`
                    : (d.license_no ? `License ${d.license_no}` : 'Active vehicle assigned'),
                avatar: avatarForDriver(d),
            }));
    }, [drivers, query]);

    return {
        request,
        busy,
        choiceOpen,
        vehiclePickerOpen,
        driverPickerOpen,
        confirmStop,
        setConfirmStop,
        vehicle,
        jobs,
        query,
        setQuery,
        mappedVehicles,
        mappedDrivers,
        loadingId,
        alert,
        setAlert,
        openSwap,
        openReassign,
        requestStop,
        cancelStop,
        pickReplacementVehicle,
        pickReplacementDriver,
        confirmStopJobs,
        closeAll,
        closePickers,
    };
}
