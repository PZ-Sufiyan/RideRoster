import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCloudUpload, MdVisibility, MdDeleteOutline, MdFileUpload } from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { registerVehicleWithRecords } from '../../../../../services/vehicleRegistrationService';
import { getVehicleTypeOptions } from '../../../../../services/vehicleCategoriesService';
import { invalidateVehiclesListCache } from '../../../../../hooks/useVehiclesList';
import { ToastStack } from '../../../../../utils/Toast';

const FormField = ({ label, required, placeholder, value, onChange, type = 'text', className = '', showError = false, errorText = 'This field is required.' }) => (
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

const UploadBox = ({ label, required, hint, file, onFileChange, accept = 'application/pdf,image/jpeg,image/png', showError = false, errorText = 'Please upload this required document.' }) => {
    const inputRef = useRef();
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileName = file?.name;

    const handleFile = (f) => {
        if (!f) return;
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(f);
        });
        onFileChange && onFileChange(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    };

    const handleView = (e) => {
        e.stopPropagation();
        if (!previewUrl && file instanceof File) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        if (previewUrl) window.open(previewUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        if (inputRef.current) inputRef.current.value = '';
        onFileChange && onFileChange(null);
    };

    const handleReuploadClick = (e) => {
        e.stopPropagation();
        inputRef.current?.click();
    };

    useEffect(() => {
        if (!file) {
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        }
        return () => {
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 px-5 cursor-pointer transition-colors min-h-[120px] ${
                    showError
                        ? 'border-red-300 bg-red-50/20 hover:border-red-400'
                        : 'border-gray-200 hover:border-[#005580] hover:bg-blue-50/30'
                }`}
            >
                <MdCloudUpload size={26} className="text-gray-400 mb-1.5" />
                {fileName ? (
                    <>
                        <span className="text-xs text-green-600 font-medium text-center break-all">{fileName}</span>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                            <button type="button" onClick={handleView} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-[11px] font-medium text-[#005580] hover:bg-blue-100">
                                <MdVisibility size={13} /> View
                            </button>
                            <button type="button" onClick={handleReuploadClick} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-[11px] font-medium text-gray-700 hover:bg-gray-100">
                                <MdFileUpload size={13} /> Change
                            </button>
                            <button type="button" onClick={handleDelete} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-[11px] font-medium text-red-600 hover:bg-red-100">
                                <MdDeleteOutline size={13} /> Delete
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <span className="text-xs text-gray-400 text-center">Click to upload or drag and drop</span>
                        {hint && <span className="text-[10px] text-gray-400 mt-1 text-center">{hint}</span>}
                    </>
                )}
            </div>
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
        </div>
    );
};

const ExpiryDateField = ({ value, onChange, className = '', showError = false, errorText = 'Expiry date is required.' }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <span className="text-xs font-semibold text-gray-700">Expiry date</span>
        <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 bg-white ${
                showError
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 text-gray-700 focus:border-[#005580] focus:ring-[#005580]'
            }`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

const SectionHeading = ({ title }) => (
    <h2 className="text-lg font-bold text-gray-900 mb-5">{title}</h2>
);

const AddNewVehicle = ({ basePath = '/portal' }) => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [missingKeys, setMissingKeys] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [vehicleTypesLoading, setVehicleTypesLoading] = useState(true);
    const [vehicleTypesError, setVehicleTypesError] = useState('');
    const [form, setForm] = useState({
        seatingCapacity: '',
        motExpiry: '',
        taxiPlateExpiry: '',
        insuranceExpiry: '',
        taxiLicensePlate: '',
        registrationNumber: '',
        make: '',
        model: '',
        vehicleColour: '',
        yearOfFirstRegistration: '',
        licensingType: '',
        bodyStyle: '',
        wheelchairAccessible: false,
    });
    const [files, setFiles] = useState({
        v5_front: null,
        v5_inside: null,
        mot_certificate: null,
        taxi_license_plate: null,
        insurance_certificate: null,
        vehicle_photo: null,
    });

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
    const setExpiry = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
    const setFile = (key) => (f) => setFiles((prev) => ({ ...prev, [key]: f }));
    const showMissing = (key) => submitAttempted && missingKeys.includes(key);

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 },
        ]);
    };

    useEffect(() => {
        let cancelled = false;
        const loadVehicleTypes = async () => {
            setVehicleTypesLoading(true);
            setVehicleTypesError('');
            try {
                const options = await getVehicleTypeOptions();
                if (!cancelled) setVehicleTypes(options);
            } catch (_) {
                if (!cancelled) {
                    setVehicleTypes([]);
                    setVehicleTypesError('Could not load vehicle types.');
                }
            } finally {
                if (!cancelled) setVehicleTypesLoading(false);
            }
        };
        loadVehicleTypes();
        return () => { cancelled = true; };
    }, []);

    const validateRequired = () => {
        setSubmitAttempted(true);
        const missingFields = [];
        if (!form.motExpiry) missingFields.push('motExpiry');
        if (!form.taxiPlateExpiry) missingFields.push('taxiPlateExpiry');
        if (!form.insuranceExpiry) missingFields.push('insuranceExpiry');
        if (!form.taxiLicensePlate?.trim()) missingFields.push('taxiLicensePlate');
        if (!form.registrationNumber?.trim()) missingFields.push('registrationNumber');
        if (!form.make?.trim()) missingFields.push('make');
        if (!form.model?.trim()) missingFields.push('model');
        if (!form.vehicleColour?.trim()) missingFields.push('vehicleColour');
        if (!form.yearOfFirstRegistration) missingFields.push('yearOfFirstRegistration');
        if (!form.licensingType?.trim()) missingFields.push('licensingType');
        if (!form.bodyStyle?.trim()) missingFields.push('bodyStyle');
        if (!files.v5_front) missingFields.push('v5_front');
        if (!files.v5_inside) missingFields.push('v5_inside');
        if (!files.mot_certificate) missingFields.push('mot_certificate');
        if (!files.taxi_license_plate) missingFields.push('taxi_license_plate');
        if (!files.insurance_certificate) missingFields.push('insurance_certificate');
        if (!files.vehicle_photo) missingFields.push('vehicle_photo');
        setMissingKeys(missingFields);
        if (missingFields.length) {
            pushToast('warning', 'Please fill in all required fields and documents before registering the vehicle.');
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        setSubmitError('');
        if (!validateRequired()) return;
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) throw new Error('No company linked to your account.');
            await registerVehicleWithRecords({
                companyId: admin.company_id,
                expiry: {
                    mot: form.motExpiry,
                    taxiPlate: form.taxiPlateExpiry,
                    insurance: form.insuranceExpiry,
                },
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
                    wheelchairAccessible:
                        !!vehicleTypes.find((t) => t.value === form.bodyStyle)?.wheelchairAccessible,
                },
            });
            invalidateVehiclesListCache();
            navigate(`${basePath}/users/vehicles`);
        } catch (e) {
            const msg = e?.message || 'Could not register vehicle.';
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto space-y-0 pb-10">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Vehicle</h1>
                <p className="text-sm text-gray-500 mt-2">Add a company vehicle. You can assign a driver afterwards.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] space-y-10 my-5">
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Vehicle Information" />
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <UploadBox label="V5 Document (Front)" required file={files.v5_front} onFileChange={setFile('v5_front')} showError={showMissing('v5_front')} />
                            <UploadBox label="V5 Document (Inside)" required file={files.v5_inside} onFileChange={setFile('v5_inside')} showError={showMissing('v5_inside')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <FormField label="Registration Number (Plate)" required placeholder="e.g. ABC 1234" value={form.registrationNumber} onChange={set('registrationNumber')} showError={showMissing('registrationNumber')} />
                            <FormField label="Taxi License Plate Number" required placeholder="e.g. ABC 1234" value={form.taxiLicensePlate} onChange={set('taxiLicensePlate')} showError={showMissing('taxiLicensePlate')} />
                            <FormField label="Make" required placeholder="e.g. Toyota" value={form.make} onChange={set('make')} showError={showMissing('make')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <FormField label="Model" required placeholder="e.g. Prius" value={form.model} onChange={set('model')} showError={showMissing('model')} />
                            <FormField label="Vehicle Colour" required placeholder="e.g. Black" value={form.vehicleColour} onChange={set('vehicleColour')} showError={showMissing('vehicleColour')} />
                            <FormField label="Year of First Registration" required type="date" value={form.yearOfFirstRegistration} onChange={set('yearOfFirstRegistration')} showError={showMissing('yearOfFirstRegistration')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="Licensing Type" required placeholder="e.g. Nottingham City Council" value={form.licensingType} onChange={set('licensingType')} showError={showMissing('licensingType')} />
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-600">Vehicle Type<span className="text-red-500 ml-0.5">*</span></label>
                                <select
                                    value={form.bodyStyle}
                                    disabled={vehicleTypesLoading}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        const meta = vehicleTypes.find((x) => x.value === next);
                                        setForm((prev) => ({
                                            ...prev,
                                            bodyStyle: next,
                                            seatingCapacity: meta?.seats || '',
                                            wheelchairAccessible: !!meta?.wheelchairAccessible,
                                        }));
                                    }}
                                    className={`w-full px-3.5 py-3 border rounded-xl text-sm bg-white ${showMissing('bodyStyle') ? 'border-red-400' : 'border-gray-200'}`}
                                >
                                    <option value="">{vehicleTypesLoading ? 'Loading vehicle types...' : 'Select vehicle type'}</option>
                                    {vehicleTypes.map((t) => (
                                        <option key={t.value} value={t.value}>{t.value}</option>
                                    ))}
                                </select>
                                {showMissing('bodyStyle') && <p className="text-xs text-red-600 font-medium">This field is required.</p>}
                                {vehicleTypesError && <p className="text-xs text-red-600 font-medium">{vehicleTypesError}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <UploadBox label="MOT Certificate" required file={files.mot_certificate} onFileChange={setFile('mot_certificate')} showError={showMissing('mot_certificate')} />
                                <ExpiryDateField className="mt-2" value={form.motExpiry} onChange={setExpiry('motExpiry')} showError={showMissing('motExpiry')} />
                            </div>
                            <div>
                                <UploadBox label="Taxi License Plate" required file={files.taxi_license_plate} onFileChange={setFile('taxi_license_plate')} showError={showMissing('taxi_license_plate')} />
                                <ExpiryDateField className="mt-2" value={form.taxiPlateExpiry} onChange={setExpiry('taxiPlateExpiry')} showError={showMissing('taxiPlateExpiry')} />
                            </div>
                            <div>
                                <UploadBox label="Insurance Certificate" required file={files.insurance_certificate} onFileChange={setFile('insurance_certificate')} showError={showMissing('insurance_certificate')} />
                                <ExpiryDateField className="mt-2" value={form.insuranceExpiry} onChange={setExpiry('insuranceExpiry')} showError={showMissing('insuranceExpiry')} />
                            </div>
                        </div>
                        <UploadBox label="Vehicle Photo" required file={files.vehicle_photo} onFileChange={setFile('vehicle_photo')} accept="image/jpeg,image/png" showError={showMissing('vehicle_photo')} />
                        {form.seatingCapacity && (
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-700">Seating Capacity</label>
                                <p className="text-sm text-gray-600 px-3.5 py-3 border border-gray-100 rounded-xl bg-gray-50">
                                    {form.seatingCapacity} Passengers
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-6 pb-2">
                {submitError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{submitError}</p>
                )}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(`${basePath}/users/vehicles`)}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <MdArrowBack size={16} />
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleRegister}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Registering…' : 'Register Vehicle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewVehicle;
