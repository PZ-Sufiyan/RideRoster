import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdEdit, MdVisibility } from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { getVehicleByIdWithDriver, getVehicleDocuments, updateVehicleStatus } from '../../../../../services/driverVehicleService';
import { useVehicleDriverAssignment } from '../../../../../hooks/useVehicleDriverAssignment';
import { AlertDialog, AssignDriverPickerModal, ConfirmDialog } from '../../../../../components/AssignDriverDialogs';
import { VehicleOffRoadDialogs } from '../../../../../components/OffRoadDialogs';
import FleetBadge from '../../../../../components/FleetBadge';
import VehicleStatusBadge from '../../../../../components/VehicleStatusBadge';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';
import { isPrivateFleet } from '../../../../../utils/fleet';
import { ToastStack } from '../../../../../utils/Toast';
import { useVehicleOffRoad } from '../../../../../hooks/useVehicleOffRoad';
import {
    formatVehicleStatusLabel,
    isVehicleOffRoad,
    VEHICLE_STATUS,
} from '../../../../../utils/vehicleStatus';

const VEHICLE_DOCUMENT_LABELS = {
    v5_front: 'V5 Front',
    v5_inside: 'V5 Inside',
    mot_certificate: 'MOT Certificate',
    taxi_license_plate: 'Taxi License Plate',
    insurance_certificate: 'Insurance Certificate',
};

const VEHICLE_DOC_ORDER = ['v5_front', 'v5_inside', 'mot_certificate', 'taxi_license_plate', 'insurance_certificate'];

function formatDate(isoOrDate) {
    if (!isoOrDate) return '—';
    try {
        const d =
            typeof isoOrDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)
                ? new Date(`${isoOrDate}T12:00:00`)
                : new Date(isoOrDate);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return '—';
    }
}

function isExpiredDate(expiryDate) {
    if (!expiryDate) return false;
    const dt = new Date(`${String(expiryDate).slice(0, 10)}T23:59:59`);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
}

function vehicleLabel(v) {
    const name = [v?.make, v?.model].filter(Boolean).join(' ').trim();
    return name || v?.taxi_license_plate_number || v?.registration_number || 'Vehicle';
}

function driverDisplayName(d) {
    if (!d) return null;
    return [d.first_name, d.last_name].filter(Boolean).join(' ').trim() || null;
}

const VehicleDetail = ({ basePath = '/portal' }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [vehicle, setVehicle] = useState(null);
    const [docs, setDocs] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [statusBusy, setStatusBusy] = useState(false);

    const pushToast = (type, message) => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 }]);
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) throw new Error('No company linked to your account.');
            const row = await getVehicleByIdWithDriver(id);
            if (!row || row.company_id !== admin.company_id) {
                setVehicle(null);
                setDocs([]);
                setLoading(false);
                return;
            }
            const vDocs = await getVehicleDocuments({ vehicleId: row.id });
            setVehicle(row);
            setDocs(vDocs || []);
        } catch (e) {
            setError(e?.message || 'Failed to load vehicle.');
            setVehicle(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const assignment = useVehicleDriverAssignment({
        onAssigned: () => { pushToast('success', 'Driver assigned.'); load(); },
        onUnassigned: () => { pushToast('success', 'Driver unassigned.'); load(); },
    });

    const offRoad = useVehicleOffRoad({
        onComplete: ({ vehicle: updated, message }) => {
            if (updated) setVehicle((prev) => (prev ? { ...prev, ...updated, driver: updated.driver_id ? prev.driver : null } : prev));
            pushToast('success', message || 'Vehicle marked as Off Road.');
            load();
        },
    });

    const handleStatusToggle = async () => {
        if (!vehicle?.id || statusBusy || offRoad.busy) return;
        if (!isVehicleOffRoad(vehicle.status)) {
            await offRoad.request(vehicle);
            return;
        }
        setStatusBusy(true);
        try {
            const updated = await updateVehicleStatus(vehicle.id, VEHICLE_STATUS.ACTIVE);
            setVehicle((prev) => (prev ? { ...prev, ...updated } : prev));
            pushToast('success', `Vehicle marked as ${formatVehicleStatusLabel(VEHICLE_STATUS.ACTIVE)}.`);
        } catch (e) {
            pushToast('error', e?.message || 'Could not update vehicle status.');
        } finally {
            setStatusBusy(false);
        }
    };

    const docByType = useMemo(() => Object.fromEntries((docs || []).map((d) => [d.document_type, d])), [docs]);
    const hasExpired = useMemo(() => docs.some((d) => d?.expiry_date && isExpiredDate(d.expiry_date)), [docs]);
    const privateVehicle = isPrivateFleet(vehicle?.fleet);
    const assignedName = driverDisplayName(vehicle?.driver);

    const openInNewTab = (url) => {
        const cleaned = String(url || '').trim();
        if (!cleaned) return;
        window.open(cleaned, '_blank', 'noopener,noreferrer');
    };

    const DocumentThumb = ({ doc, label }) => {
        const uploaded = Boolean(doc?.file_url);
        const expired = uploaded && doc?.expiry_date && isExpiredDate(doc.expiry_date);
        const subLabel = !uploaded ? '—' : expired ? 'Expired' : 'Uploaded';
        const subLabelClass = !uploaded ? 'text-gray-400' : expired ? 'text-red-600' : 'text-emerald-600';
        return (
            <div className="border border-gray-200 rounded-lg px-3 py-3 bg-gray-50/50 min-h-[78px] flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] text-gray-600 truncate">{label}</p>
                    <p className={`text-[11px] mt-0.5 ${subLabelClass}`}>{subLabel}</p>
                    {uploaded && doc?.expiry_date ? (
                        <p className="text-[10px] text-gray-500 mt-0.5">Expiry: {formatDate(doc.expiry_date)}</p>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => openInNewTab(doc?.file_url)}
                    disabled={!doc?.file_url}
                    className="p-1.5 rounded text-gray-500 hover:text-[#005580] hover:bg-[#005580]/10 disabled:opacity-30"
                >
                    <MdVisibility size={16} />
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <LoadingStatus label="Loading vehicle" className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <ShimmerBlock className="h-14 w-14 rounded-xl shrink-0" rounded="rounded-xl" />
                        <div className="space-y-2 min-w-0 flex-1">
                            <ShimmerBlock className="h-6 w-56 max-w-full rounded-md" />
                            <ShimmerBlock className="h-4 w-32 rounded-md" />
                        </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <ShimmerBlock className="h-9 w-32 rounded-lg" />
                        <ShimmerBlock className="h-9 w-28 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                        <ShimmerBlock className="h-6 w-40 rounded-md" />
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex justify-between gap-4">
                                <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                                <ShimmerBlock className="h-3.5 w-32 rounded-md" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                        <ShimmerBlock className="h-6 w-40 rounded-md" />
                        <div className="flex items-center gap-3">
                            <ShimmerBlock className="h-12 w-12 rounded-full shrink-0" rounded="rounded-full" />
                            <div className="space-y-2 flex-1">
                                <ShimmerBlock className="h-4 w-40 rounded-md" />
                                <ShimmerBlock className="h-3.5 w-48 rounded-md" />
                                <ShimmerBlock className="h-3.5 w-28 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <ShimmerBlock className="h-6 w-32 rounded-md" />
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <ShimmerBlock key={i} className="h-[78px] rounded-lg" rounded="rounded-lg" />
                        ))}
                    </div>
                </div>
            </LoadingStatus>
        );
    }

    if (error) {
        return <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>;
    }

    if (!vehicle) {
        return <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-[14px] text-gray-600">Vehicle not found.</div>;
    }

    return (
        <div className="space-y-6 pb-10">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <img
                        src={vehicle.vehicle_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(vehicleLabel(vehicle))}&background=e5e7eb&color=374151&size=128`}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-[24px] font-bold text-gray-900 truncate">{vehicleLabel(vehicle)}</h1>
                            <FleetBadge fleet={vehicle.fleet} />
                            <VehicleStatusBadge status={vehicle.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{vehicle.taxi_license_plate_number || vehicle.registration_number || '—'}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleStatusToggle}
                        disabled={statusBusy || offRoad.busy}
                        className={`px-4 py-2 border rounded-lg text-xs font-semibold disabled:opacity-50 ${
                            isVehicleOffRoad(vehicle.status)
                                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                    >
                        {statusBusy || offRoad.busy
                            ? 'Updating…'
                            : isVehicleOffRoad(vehicle.status)
                                ? 'Mark as Active'
                                : 'Mark as Off Road'}
                    </button>
                    {!privateVehicle && !vehicle.driver_id && !isVehicleOffRoad(vehicle.status) && (
                        <button type="button" onClick={() => assignment.openAssign(vehicle)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                            Assign driver
                        </button>
                    )}
                    {!privateVehicle && vehicle.driver_id && (
                        <>
                            {!isVehicleOffRoad(vehicle.status) && (
                                <button type="button" onClick={() => assignment.openAssign(vehicle)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                    Change driver
                                </button>
                            )}
                            <button type="button" onClick={() => assignment.requestUnassign(vehicle)} className="px-4 py-2 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50">
                                Unassign
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate(`${basePath}/users/vehicles/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#005580] text-white rounded-lg text-xs font-semibold hover:bg-[#004663]"
                    >
                        <MdEdit size={14} />
                        Edit vehicle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h2 className="text-[22px] font-bold text-gray-900 mb-4">Vehicle details</h2>
                    <div className="space-y-2.5 text-sm">
                        {[
                            { label: 'Registration', value: vehicle.registration_number },
                            { label: 'Taxi plate', value: vehicle.taxi_license_plate_number },
                            { label: 'Make / Model', value: [vehicle.make, vehicle.model].filter(Boolean).join(' ') },
                            { label: 'Colour', value: vehicle.vehicle_colour },
                            { label: 'Type', value: vehicle.body_style },
                            { label: 'Licensing type', value: vehicle.licensing_type },
                            { label: 'First registered', value: formatDate(vehicle.year_of_first_registration) },
                            { label: 'Seats', value: vehicle.seating_capacity != null ? `${vehicle.seating_capacity}` : '—' },
                            { label: 'Wheelchair accessible', value: vehicle.wheelchair_accessible ? 'Yes' : 'No' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-start gap-4">
                                <span className="text-gray-500 text-[13px]">{label}</span>
                                <span className="text-gray-800 text-[13px] font-medium text-right">{value || '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h2 className="text-[22px] font-bold text-gray-900 mb-4">Assigned driver</h2>
                    {assignedName ? (
                        <button
                            type="button"
                            onClick={() => navigate(`${basePath}/users/drivers/${vehicle.driver_id}`)}
                            className="w-full text-left rounded-xl border border-gray-100 p-4 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <img
                                src={
                                    vehicle.driver?.profile_picture_url
                                    || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedName)}&background=e5e7eb&color=374151&size=128`
                                }
                                alt=""
                                className="w-12 h-12 rounded-full object-cover bg-gray-100 shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{assignedName}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{vehicle.driver?.email || '—'}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {vehicle.driver?.license_no ? `License ${vehicle.driver.license_no}` : 'View driver profile'}
                                </p>
                            </div>
                        </button>
                    ) : (
                        <p className="text-sm text-gray-500">No driver assigned yet.</p>
                    )}
                    {privateVehicle && (
                        <p className="text-xs text-violet-700 mt-3">Private vehicles cannot be reassigned from the portal.</p>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[22px] font-bold text-gray-900">Documents</h2>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${hasExpired ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {hasExpired ? 'Expired' : 'Complete'}
                    </span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {VEHICLE_DOC_ORDER.map((type) => (
                        <DocumentThumb key={type} doc={docByType[type]} label={VEHICLE_DOCUMENT_LABELS[type]} />
                    ))}
                    <DocumentThumb doc={vehicle.vehicle_photo_url ? { file_url: vehicle.vehicle_photo_url } : null} label="Vehicle Photo" />
                </div>
            </div>

            <AssignDriverPickerModal
                open={assignment.pickerOpen}
                title={vehicle.driver_id ? 'Change driver' : 'Assign driver'}
                query={assignment.query}
                onQueryChange={assignment.setQuery}
                rows={assignment.mappedRows}
                loadingId={assignment.loadingId}
                onPick={assignment.pickDriver}
                onClose={assignment.closePicker}
            />
            <AlertDialog open={Boolean(assignment.alert)} title={assignment.alert?.title} message={assignment.alert?.message} onClose={() => assignment.setAlert(null)} />
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

export default VehicleDetail;
