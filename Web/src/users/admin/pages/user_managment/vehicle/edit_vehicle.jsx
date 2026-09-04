import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack,
    MdCloudUpload,
    MdVisibility,
    MdDeleteOutline,
    MdFileUpload,
    MdOpenInNew,
    MdCheckCircle,
    MdAccessible,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { getVehicleEditData, updateVehicleWithRecords } from '../../../../../services/vehicleEditService';
import { getVehicleTypeOptions } from '../../../../../services/vehicleCategoriesService';
import { invalidateVehiclesListCache } from '../../../../../hooks/useVehiclesList';
import { ToastStack } from '../../../../../utils/Toast';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';

const FormField = ({
    label, required, placeholder, value, onChange,
    type = 'text', className = '', showError = false,
    errorText = 'This field is required.',
}) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <label className="text-xs font-semibold text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full px-3.5 py-3 border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 bg-white transition-colors ${
                showError
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-[#005580] focus:ring-[#005580]'
            }`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

const UploadBox = ({
    label, required, hint,
    file, existingUrl, onFileChange,
    accept = 'application/pdf,image/jpeg,image/png',
    showError = false,
    errorText = 'Please upload this required document.',
}) => {
    const inputRef = useRef();
    const [previewUrl, setPreviewUrl] = useState(null);
    const hasNew = file instanceof File;
    const hasExisting = !!existingUrl && !hasNew;

    const handleFile = (f) => {
        if (!f) return;
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(f);
        });
        onFileChange && onFileChange(f);
    };

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label className="text-xs font-semibold text-gray-700">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div
                onClick={() => inputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 px-5 cursor-pointer min-h-[120px] ${
                    showError && !hasExisting && !hasNew ? 'border-red-300 bg-red-50/20' : hasExisting ? 'border-green-200 bg-green-50/20' : 'border-gray-200 hover:border-[#005580]'
                }`}
            >
                {hasNew ? (
                    <>
                        <MdCheckCircle size={22} className="text-green-500 mb-1.5" />
                        <span className="text-xs text-green-600 font-medium text-center break-all">{file.name}</span>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                            <button type="button" onClick={(e) => { e.stopPropagation(); if (previewUrl) window.open(previewUrl, '_blank', 'noopener,noreferrer'); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-[11px] font-medium text-[#005580]"><MdVisibility size={13} /> View</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onFileChange(null); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-[11px] font-medium text-red-600"><MdDeleteOutline size={13} /> Remove</button>
                        </div>
                    </>
                ) : hasExisting ? (
                    <>
                        <MdCheckCircle size={22} className="text-green-500 mb-1.5" />
                        <span className="text-xs text-green-600 font-medium">Document uploaded</span>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                            <button type="button" onClick={(e) => { e.stopPropagation(); window.open(existingUrl, '_blank', 'noopener,noreferrer'); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-[11px] font-medium text-[#005580]"><MdOpenInNew size={13} /> View Current</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-[11px] font-medium text-gray-700"><MdFileUpload size={13} /> Replace</button>
                        </div>
                    </>
                ) : (
                    <>
                        <MdCloudUpload size={26} className="text-gray-400 mb-1.5" />
                        <span className="text-xs text-gray-400">{hint || 'Click to upload or drag and drop'}</span>
                    </>
                )}
            </div>
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            {showError && !hasExisting && !hasNew && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
        </div>
    );
};

const ExpiryDateField = ({ value, onChange, className = '', showError = false }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <span className="text-xs font-semibold text-gray-700">Expiry date</span>
        <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-3 border rounded-xl text-sm ${showError ? 'border-red-400' : 'border-gray-200'}`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">Expiry date is required.</p>}
    </div>
);

const EditVehicle = ({ basePath = '/portal' }) => {
    const navigate = useNavigate();
    const { vehicleId } = useParams();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [missingKeys, setMissingKeys] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [vehicleTypesLoading, setVehicleTypesLoading] = useState(true);
    const [vehicleTypesError, setVehicleTypesError] = useState('');
    const [existingVehicleDocs, setExistingVehicleDocs] = useState({});
    const [existingUrls, setExistingUrls] = useState({});
    const [existingVehiclePhotoUrl, setExistingVehiclePhotoUrl] = useState(null);
    const [form, setForm] = useState({
        seatingCapacity: '', motExpiry: '', taxiPlateExpiry: '', insuranceExpiry: '',
        taxiLicensePlate: '', registrationNumber: '',
        make: '', model: '', vehicleColour: '', yearOfFirstRegistration: '',
        licensingType: '', bodyStyle: '', wheelchairAccessible: false,
    });
    const [files, setFiles] = useState({
        v5_front: null, v5_inside: null, mot_certificate: null,
        taxi_license_plate: null, insurance_certificate: null, vehicle_photo: null,
    });

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
    const setExpiry = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
    const setFile = (key) => (f) => setFiles((prev) => ({ ...prev, [key]: f }));
    const hasDoc = useCallback((key) => !!(files[key] instanceof File || existingUrls[key] || (key === 'vehicle_photo' && existingVehiclePhotoUrl)), [files, existingUrls, existingVehiclePhotoUrl]);
    const showMissing = (key) => submitAttempted && missingKeys.includes(key);

    const pushToast = (type, message) => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 }]);
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const options = await getVehicleTypeOptions();
                if (!cancelled) setVehicleTypes(options);
            } catch (_) {
                if (!cancelled) setVehicleTypesError('Could not load vehicle types.');
            } finally {
                if (!cancelled) setVehicleTypesLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!vehicleId) return;
        (async () => {
            setLoading(true);
            setLoadError('');
            try {
                const { vehicle, vehicleDocsByType } = await getVehicleEditData(vehicleId);
                setExistingVehicleDocs(vehicleDocsByType);
                const urls = {};
                for (const [type, doc] of Object.entries(vehicleDocsByType)) {
                    if (doc?.file_url) urls[type] = doc.file_url;
                }
                setExistingUrls(urls);
                setExistingVehiclePhotoUrl(vehicle?.vehicle_photo_url || null);
                const vehicleExp = (type) => vehicleDocsByType[type]?.expiry_date?.slice(0, 10) || '';
                setForm({
                    motExpiry: vehicleExp('mot_certificate'),
                    taxiPlateExpiry: vehicleExp('taxi_license_plate'),
                    insuranceExpiry: vehicleExp('insurance_certificate'),
                    taxiLicensePlate: vehicle?.taxi_license_plate_number || '',
                    registrationNumber: vehicle?.registration_number || '',
                    make: vehicle?.make || '',
                    model: vehicle?.model || '',
                    vehicleColour: vehicle?.vehicle_colour || '',
                    yearOfFirstRegistration: vehicle?.year_of_first_registration?.slice(0, 10) || '',
                    licensingType: vehicle?.licensing_type || '',
                    bodyStyle: vehicle?.body_style || '',
                    wheelchairAccessible: vehicle?.wheelchair_accessible || false,
                    seatingCapacity: vehicle?.seating_capacity ? String(vehicle.seating_capacity) : '',
                });
            } catch (err) {
                setLoadError(err?.message || 'Failed to load vehicle data.');
            } finally {
                setLoading(false);
            }
        })();
    }, [vehicleId]);

    const validateRequired = () => {
        setSubmitAttempted(true);
        const missing = [];
        ['taxiLicensePlate', 'registrationNumber', 'make', 'model', 'vehicleColour', 'licensingType', 'bodyStyle'].forEach((k) => {
            if (!form[k]?.trim()) missing.push(k);
        });
        if (!form.yearOfFirstRegistration) missing.push('yearOfFirstRegistration');
        if (!form.motExpiry) missing.push('motExpiry');
        if (!form.taxiPlateExpiry) missing.push('taxiPlateExpiry');
        if (!form.insuranceExpiry) missing.push('insuranceExpiry');
        ['v5_front', 'v5_inside', 'mot_certificate', 'taxi_license_plate', 'insurance_certificate', 'vehicle_photo'].forEach((k) => {
            if (!hasDoc(k)) missing.push(k);
        });
        setMissingKeys(missing);
        if (missing.length) {
            pushToast('warning', 'Please fill in all required fields and documents before saving.');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        setSubmitError('');
        if (!validateRequired()) return;
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) throw new Error('No company linked to your account.');
            await updateVehicleWithRecords({
                vehicleId,
                companyId: admin.company_id,
                expiry: { mot: form.motExpiry, taxiPlate: form.taxiPlateExpiry, insurance: form.insuranceExpiry },
                vehicleFiles: files,
                vehicle: {
                    taxiLicensePlate: form.taxiLicensePlate,
                    seatingCapacity: form.seatingCapacity,
                    registrationNumber: form.registrationNumber,
                    taxiPlateNumber: form.taxiLicensePlate,
                    make: form.make,
                    model: form.model,
                    vehicleColour: form.vehicleColour,
                    yearOfFirstRegistration: form.yearOfFirstRegistration,
                    licensingType: form.licensingType,
                    bodyStyle: form.bodyStyle,
                    wheelchairAccessible: vehicleTypes.find((t) => t.value === form.bodyStyle)?.wheelchairAccessible ?? form.wheelchairAccessible,
                    _existingPhotoUrl: existingVehiclePhotoUrl,
                },
                existingVehicleDocs,
            });
            invalidateVehiclesListCache();
            pushToast('success', 'Vehicle details updated successfully.');
            setTimeout(() => navigate(`${basePath}/users/vehicles`), 1200);
        } catch (e) {
            const msg = e?.message || 'Could not save changes.';
            setSubmitError(msg);
            pushToast('error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <LoadingStatus label="Loading vehicle edit form" className="space-y-6">
                <div className="space-y-2">
                    <ShimmerBlock className="h-8 w-56 rounded-lg" />
                    <ShimmerBlock className="h-4 w-72 rounded-md" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 lg:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <ShimmerBlock className="h-28 rounded-xl" rounded="rounded-xl" />
                        <ShimmerBlock className="h-28 rounded-xl" rounded="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <ShimmerBlock className="h-12 rounded-xl" />
                        <ShimmerBlock className="h-12 rounded-xl" />
                        <ShimmerBlock className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <ShimmerBlock className="h-12 rounded-xl" />
                        <ShimmerBlock className="h-12 rounded-xl" />
                        <ShimmerBlock className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <ShimmerBlock className="h-12 rounded-xl" />
                        <ShimmerBlock className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <ShimmerBlock className="h-44 rounded-xl" rounded="rounded-xl" />
                        <ShimmerBlock className="h-44 rounded-xl" rounded="rounded-xl" />
                        <ShimmerBlock className="h-44 rounded-xl" rounded="rounded-xl" />
                    </div>
                    <ShimmerBlock className="h-28 rounded-xl" rounded="rounded-xl" />
                    <div className="flex justify-end gap-3">
                        <ShimmerBlock className="h-10 w-28 rounded-lg" />
                        <ShimmerBlock className="h-10 w-36 rounded-lg" />
                    </div>
                </div>
            </LoadingStatus>
        );
    }

    if (loadError) {
        return <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{loadError}</div>;
    }

    return (
        <div className="mx-auto space-y-0 pb-10">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Vehicle</h1>
                <p className="text-sm text-gray-500 mt-2">Update vehicle details and documents.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] my-5">
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <UploadBox label="V5 Document (Front)" required file={files.v5_front} existingUrl={existingUrls.v5_front} onFileChange={setFile('v5_front')} showError={showMissing('v5_front')} />
                        <UploadBox label="V5 Document (Inside)" required file={files.v5_inside} existingUrl={existingUrls.v5_inside} onFileChange={setFile('v5_inside')} showError={showMissing('v5_inside')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <FormField label="Registration Number (Plate)" required value={form.registrationNumber} onChange={set('registrationNumber')} showError={showMissing('registrationNumber')} />
                        <FormField label="Taxi License Plate Number" required value={form.taxiLicensePlate} onChange={set('taxiLicensePlate')} showError={showMissing('taxiLicensePlate')} />
                        <FormField label="Make" required value={form.make} onChange={set('make')} showError={showMissing('make')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <FormField label="Model" required value={form.model} onChange={set('model')} showError={showMissing('model')} />
                        <FormField label="Vehicle Colour" required value={form.vehicleColour} onChange={set('vehicleColour')} showError={showMissing('vehicleColour')} />
                        <FormField label="Year of First Registration" required type="date" value={form.yearOfFirstRegistration} onChange={set('yearOfFirstRegistration')} showError={showMissing('yearOfFirstRegistration')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField label="Licensing Type" required value={form.licensingType} onChange={set('licensingType')} showError={showMissing('licensingType')} />
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-600 flex items-center gap-2 flex-wrap">
                                <span>Vehicle Type<span className="text-red-500 ml-0.5">*</span></span>
                                {form.bodyStyle ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        form.wheelchairAccessible
                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                    }`}>
                                        <MdAccessible size={12} />
                                        Wheelchair Included: {form.wheelchairAccessible ? 'Yes' : 'No'}
                                    </span>
                                ) : null}
                            </label>
                            <select
                                value={form.bodyStyle}
                                disabled={vehicleTypesLoading}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    const meta = vehicleTypes.find((x) => x.value === next);
                                    setForm((prev) => ({ ...prev, bodyStyle: next, seatingCapacity: meta?.seats || prev.seatingCapacity, wheelchairAccessible: meta ? !!meta.wheelchairAccessible : prev.wheelchairAccessible }));
                                }}
                                className={`w-full px-3.5 py-3 border rounded-xl text-sm bg-white ${showMissing('bodyStyle') ? 'border-red-400' : 'border-gray-200'}`}
                            >
                                <option value="">{vehicleTypesLoading ? 'Loading...' : 'Select vehicle type'}</option>
                                {form.bodyStyle && !vehicleTypes.some((t) => t.value === form.bodyStyle) && <option value={form.bodyStyle}>{form.bodyStyle}</option>}
                                {vehicleTypes.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
                            </select>
                            {showMissing('bodyStyle') && <p className="text-xs text-red-600 font-medium">This field is required.</p>}
                            {vehicleTypesError && <p className="text-xs text-red-600 font-medium">{vehicleTypesError}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <UploadBox label="MOT Certificate" required file={files.mot_certificate} existingUrl={existingUrls.mot_certificate} onFileChange={setFile('mot_certificate')} showError={showMissing('mot_certificate')} />
                            <ExpiryDateField className="mt-2" value={form.motExpiry} onChange={setExpiry('motExpiry')} showError={showMissing('motExpiry')} />
                        </div>
                        <div>
                            <UploadBox label="Taxi License Plate" required file={files.taxi_license_plate} existingUrl={existingUrls.taxi_license_plate} onFileChange={setFile('taxi_license_plate')} showError={showMissing('taxi_license_plate')} />
                            <ExpiryDateField className="mt-2" value={form.taxiPlateExpiry} onChange={setExpiry('taxiPlateExpiry')} showError={showMissing('taxiPlateExpiry')} />
                        </div>
                        <div>
                            <UploadBox label="Insurance Certificate" required file={files.insurance_certificate} existingUrl={existingUrls.insurance_certificate} onFileChange={setFile('insurance_certificate')} showError={showMissing('insurance_certificate')} />
                            <ExpiryDateField className="mt-2" value={form.insuranceExpiry} onChange={setExpiry('insuranceExpiry')} showError={showMissing('insuranceExpiry')} />
                        </div>
                    </div>
                    <UploadBox label="Vehicle Photo" required accept="image/jpeg,image/png" file={files.vehicle_photo} existingUrl={existingVehiclePhotoUrl} onFileChange={setFile('vehicle_photo')} showError={showMissing('vehicle_photo')} />
                    {form.seatingCapacity && (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-700">Seating Capacity</label>
                            <p className="text-sm text-gray-600 px-3.5 py-3 border border-gray-100 rounded-xl bg-gray-50">{form.seatingCapacity} Passengers</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-3 pt-6 pb-2">
                {submitError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{submitError}</p>}
                <div className="flex items-center justify-between">
                    <button type="button" onClick={() => navigate(`${basePath}/users/vehicles`)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
                        <MdArrowBack size={16} /> Back
                    </button>
                    <button type="button" onClick={handleSave} disabled={submitting} className="px-5 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 disabled:opacity-60">
                        {submitting ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditVehicle;
