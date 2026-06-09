import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack,
    MdCloudUpload,
    MdVisibility,
    MdDeleteOutline,
    MdFileUpload,
    MdOpenInNew,
    MdCheckCircle,
    MdPersonOutline,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { getDriverEditData, updateDriverWithRecords } from '../../../../../services/driverEditService';
import { ToastStack } from '../../../../../utils/Toast';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';

// ─── Reusable: Text Input ─────────────────────────────────────
const FormField = ({
    label, required, placeholder, value, onChange,
    type = 'text', className = '', showError = false,
    errorText = 'This field is required.', disabled = false,
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
            disabled={disabled}
            className={`w-full px-3.5 py-3 border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 bg-white transition-colors
                ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : ''}
                ${showError && !disabled
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-[#005580] focus:ring-[#005580]'
                }`}
        />
        {showError && !disabled && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Upload Box (edit-aware) ──────────────────────────────────
// Shows existing file URL as a "currently uploaded" state.
// If a new file is selected it shows the local preview instead.
const UploadBox = ({
    label, required, hint,
    file,           // new local File | null
    existingUrl,    // string | null  – currently saved URL
    onFileChange,
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

    const handleDrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    };

    const handleViewNew = (e) => {
        e.stopPropagation();
        if (previewUrl) window.open(previewUrl, '_blank', 'noopener,noreferrer');
        else if (file instanceof File) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleViewExisting = (e) => {
        e.stopPropagation();
        window.open(existingUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
        if (inputRef.current) inputRef.current.value = '';
        onFileChange && onFileChange(null);
    };

    const handleReupload = (e) => {
        e.stopPropagation();
        inputRef.current?.click();
    };

    useEffect(() => {
        if (!file) {
            setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
        }
        return () => setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
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
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 px-5 cursor-pointer transition-colors min-h-[120px]
                    ${showError && !hasExisting && !hasNew
                        ? 'border-red-300 bg-red-50/20 hover:border-red-400'
                        : hasExisting
                            ? 'border-green-200 bg-green-50/20 hover:border-[#005580] hover:bg-blue-50/30'
                            : 'border-gray-200 hover:border-[#005580] hover:bg-blue-50/30'
                    }`}
            >
                {hasNew ? (
                    // New local file selected
                    <>
                        <MdCheckCircle size={22} className="text-green-500 mb-1.5" />
                        <span className="text-xs text-green-600 font-medium text-center break-all">{file.name}</span>
                        <span className="text-[10px] text-green-500 mt-0.5">New file — will replace existing</span>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                            <button type="button" onClick={handleViewNew}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-[11px] font-medium text-[#005580] hover:bg-blue-100">
                                <MdVisibility size={13} /> View
                            </button>
                            <button type="button" onClick={handleReupload}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-[11px] font-medium text-gray-700 hover:bg-gray-100">
                                <MdFileUpload size={13} /> Change
                            </button>
                            <button type="button" onClick={handleDelete}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-[11px] font-medium text-red-600 hover:bg-red-100">
                                <MdDeleteOutline size={13} /> Remove
                            </button>
                        </div>
                    </>
                ) : hasExisting ? (
                    // Existing saved file
                    <>
                        <MdCheckCircle size={22} className="text-green-500 mb-1.5" />
                        <span className="text-xs text-green-600 font-medium text-center">Document uploaded</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Click to replace with a new file</span>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                            <button type="button" onClick={handleViewExisting}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-[11px] font-medium text-[#005580] hover:bg-blue-100">
                                <MdOpenInNew size={13} /> View Current
                            </button>
                            <button type="button" onClick={handleReupload}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-[11px] font-medium text-gray-700 hover:bg-gray-100">
                                <MdFileUpload size={13} /> Replace
                            </button>
                        </div>
                    </>
                ) : (
                    // Nothing uploaded
                    <>
                        <MdCloudUpload size={26} className="text-gray-400 mb-1.5" />
                        <span className="text-xs text-gray-400 text-center">Click to upload or drag and drop</span>
                        {hint && <span className="text-[10px] text-gray-400 mt-1 text-center">{hint}</span>}
                    </>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
            />
            {showError && !hasExisting && !hasNew && (
                <p className="text-xs text-red-600 font-medium">{errorText}</p>
            )}
        </div>
    );
};

// ─── Expiry Date Field ────────────────────────────────────────
const ExpiryDateField = ({ value, onChange, className = '', showError = false, errorText = 'Expiry date is required.' }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <span className="text-xs font-semibold text-gray-700">Expiry date</span>
        <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 bg-white
                ${showError ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 text-gray-700 focus:border-[#005580] focus:ring-[#005580]'}`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Section Heading ──────────────────────────────────────────
const SectionHeading = ({ title }) => (
    <h2 className="text-lg font-bold text-gray-900 mb-5">{title}</h2>
);

const VEHICLE_TYPES = [
    { value: 'People Carrier - 6 passenger', seats: '6', wheelchairAccessible: false },
    { value: 'People Carrier - 7 passenger', seats: '7', wheelchairAccessible: false },
    { value: 'Minibus - 8 passenger', seats: '8', wheelchairAccessible: false },
    { value: 'Minibus - Wheelchair ramp', seats: '8', wheelchairAccessible: true },
    { value: 'Minibus - Wheelchair tail lift', seats: '8', wheelchairAccessible: true },
    { value: 'Hackney - 5 passenger', seats: '5', wheelchairAccessible: false },
    { value: 'Hackney - 6 passenger', seats: '6', wheelchairAccessible: false },
    { value: 'Hackney - Wheelchair', seats: '5', wheelchairAccessible: true },
];

const initialFilesState = {
    passport: null,
    driving_license_front: null,
    driving_license_back: null,
    taxi_badge_front: null,
    taxi_badge_back: null,
    dbs_certificate_front: null,
    dbs_certificate_back: null,
    safeguarding_certificate: null,
    v5_front: null,
    v5_inside: null,
    mot_certificate: null,
    taxi_license_plate: null,
    insurance_certificate: null,
    vehicle_photo: null,
};

// ─── Main Component ───────────────────────────────────────────
const EditDriver = () => {
    const navigate = useNavigate();
    const { driverId } = useParams();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [missingKeys, setMissingKeys] = useState([]);
    const [toasts, setToasts] = useState([]);

    // Existing DB rows for documents (for update/replace logic)
    const [existingDriverDocs, setExistingDriverDocs] = useState({});
    const [existingVehicleDocs, setExistingVehicleDocs] = useState({});
    const [vehicleId, setVehicleId] = useState(null);

    // Existing URLs (shown in UploadBox as "already uploaded")
    const [existingUrls, setExistingUrls] = useState({});
    const [existingVehiclePhotoUrl, setExistingVehiclePhotoUrl] = useState(null);
    const [existingAvatarUrl, setExistingAvatarUrl] = useState(null);

    const avatarRef = useRef();
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        address: '', emergencyName: '', emergencyPhone: '',
        passport: '', rightToWork: '', nationality: '',
        isBritish: false,
        licenseNo: '',
        licenseExpiry: '',
        taxiBadgeExpiry: '',
        dbsExpiry: '',
        safeguardingExpiry: '',
        motExpiry: '',
        taxiPlateExpiry: '',
        insuranceExpiry: '',
        seatingCapacity: '',
        dbsUpdateId: '',
        taxiLicensePlate: '',
        registrationNumber: '',
        taxiPlateNumber: '',
        make: '',
        model: '',
        vehicleColour: '',
        yearOfFirstRegistration: '',
        licensingType: '',
        bodyStyle: '',
        wheelchairAccessible: false,
    });

    const [files, setFiles] = useState(() => ({ ...initialFilesState }));
    const [otherCertificates, setOtherCertificates] = useState([]);

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
    const setExpiry = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
    const setFile = (key) => (f) => setFiles((prev) => ({ ...prev, [key]: f }));

    const handleAvatarChange = (file) => {
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    const avatarBlobRef = useRef(null);
    useLayoutEffect(() => { avatarBlobRef.current = avatarPreview; });
    useEffect(() => {
        return () => {
            if (avatarBlobRef.current) URL.revokeObjectURL(avatarBlobRef.current);
        };
    }, []);

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 },
        ]);
    };

    // ── Load existing data ────────────────────────────────────
    useEffect(() => {
        if (!driverId) return;

        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const { driver, vehicle, driverDocsByType, vehicleDocsByType } =
                    await getDriverEditData(driverId);

                setVehicleId(vehicle?.id || null);
                setExistingDriverDocs(driverDocsByType);
                setExistingVehicleDocs(vehicleDocsByType);

                // Build existing URL map for UploadBoxes
                const urls = {};
                for (const [type, doc] of Object.entries(driverDocsByType)) {
                    if (doc?.file_url) urls[type] = doc.file_url;
                }
                for (const [type, doc] of Object.entries(vehicleDocsByType)) {
                    if (doc?.file_url) urls[type] = doc.file_url;
                }
                setExistingUrls(urls);
                setExistingVehiclePhotoUrl(vehicle?.vehicle_photo_url || null);
                setExistingAvatarUrl(driver.profile_picture_url || null);

                // Helper: get expiry from a doc type (prefer front side)
                const driverExp = (type) => driverDocsByType[type]?.expiry_date?.slice(0, 10) || '';
                const vehicleExp = (type) => vehicleDocsByType[type]?.expiry_date?.slice(0, 10) || '';

                setForm({
                    firstName: driver.first_name || '',
                    lastName: driver.last_name || '',
                    email: driver.email || '',
                    phone: driver.phone?.replace(/^\+\d{1,3}/, '') || driver.phone || '',
                    address: driver.residential_address || '',
                    emergencyName: driver.emergency_contact_name || '',
                    emergencyPhone: driver.emergency_contact_phone || '',
                    passport: driver.passport_number || '',
                    rightToWork: driver.right_to_work_code || '',
                    nationality: driver.nationality || '',
                    isBritish: driver.nationality === 'British',
                    licenseNo: driver.license_no || '',
                    dbsUpdateId: driver.dbs_service_update_id || '',
                    licenseExpiry: driverExp('driving_license_front'),
                    taxiBadgeExpiry: driverExp('taxi_badge_front'),
                    dbsExpiry: driverExp('dbs_certificate_front'),
                    safeguardingExpiry: driverExp('safeguarding_certificate'),
                    motExpiry: vehicleExp('mot_certificate'),
                    taxiPlateExpiry: vehicleExp('taxi_license_plate'),
                    insuranceExpiry: vehicleExp('insurance_certificate'),
                    taxiLicensePlate: vehicle?.taxi_license_plate_number || '',
                    registrationNumber: vehicle?.registration_number || '',
                    taxiPlateNumber: vehicle?.taxi_license_plate_number || '',
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
                setLoadError(err?.message || 'Failed to load driver data.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [driverId]);

    // ── Validation ────────────────────────────────────────────
    // For edit: documents are valid if there's an existing URL OR a new file selected
    const hasDoc = useCallback((key) => {
        return !!(files[key] instanceof File || existingUrls[key]);
    }, [files, existingUrls]);

    const validateRequired = useCallback(() => {
        setSubmitAttempted(true);
        const missing = [];

        if (!form.firstName?.trim()) missing.push('firstName');
        if (!form.lastName?.trim()) missing.push('lastName');
        if (!form.phone?.trim()) missing.push('phone');
        if (!form.address?.trim()) missing.push('address');
        if (!form.emergencyName?.trim()) missing.push('emergencyName');
        if (!form.emergencyPhone?.trim()) missing.push('emergencyPhone');
        if (!form.nationality?.trim()) missing.push('nationality');
        if (!avatarFile && !existingAvatarUrl) missing.push('avatarFile');
        if (form.passport?.trim() && !hasDoc('passport')) missing.push('passport');
        if (!form.licenseNo?.trim()) missing.push('licenseNo');
        if (!form.licenseExpiry) missing.push('licenseExpiry');
        if (!form.taxiBadgeExpiry) missing.push('taxiBadgeExpiry');
        if (!form.dbsExpiry) missing.push('dbsExpiry');
        if (!form.motExpiry) missing.push('motExpiry');
        if (!form.taxiPlateExpiry) missing.push('taxiPlateExpiry');
        if (!form.insuranceExpiry) missing.push('insuranceExpiry');
        if (!form.dbsUpdateId?.trim()) missing.push('dbsUpdateId');
        if (!form.taxiLicensePlate?.trim()) missing.push('taxiLicensePlate');
        if (!form.registrationNumber?.trim()) missing.push('registrationNumber');
        if (!form.taxiPlateNumber?.trim()) missing.push('taxiPlateNumber');
        if (!form.make?.trim()) missing.push('make');
        if (!form.model?.trim()) missing.push('model');
        if (!form.vehicleColour?.trim()) missing.push('vehicleColour');
        if (!form.yearOfFirstRegistration) missing.push('yearOfFirstRegistration');
        if (!form.licensingType?.trim()) missing.push('licensingType');
        if (!form.bodyStyle?.trim()) missing.push('bodyStyle');

        const requiredDocs = [
            'driving_license_front', 'driving_license_back',
            'taxi_badge_front', 'taxi_badge_back',
            'dbs_certificate_front', 'dbs_certificate_back',
            'v5_front', 'v5_inside',
            'mot_certificate', 'taxi_license_plate',
            'insurance_certificate', 'vehicle_photo',
        ];
        for (const key of requiredDocs) {
            if (!hasDoc(key)) missing.push(key);
        }

        setMissingKeys(missing);
        if (missing.length) {
            pushToast('warning', 'Please fill in all required fields and documents before saving.');
            return false;
        }
        return true;
    }, [form, hasDoc, avatarFile, existingAvatarUrl]);

    const showMissing = (key) => submitAttempted && missingKeys.includes(key);

    // ── Submit ────────────────────────────────────────────────
    const handleSave = async () => {
        setSubmitError('');
        if (!validateRequired()) return;

        setSubmitting(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');

            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) throw new Error('No company linked to your account.');

            await updateDriverWithRecords({
                driverId,
                companyId: admin.company_id,
                vehicleId,
                avatarFile: avatarFile || null,
                existingAvatarUrl,
                personal: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    address: form.address,
                    emergencyName: form.emergencyName,
                    emergencyPhone: form.emergencyPhone,
                    passport: form.passport,
                    nationality: form.nationality,
                    rightToWork: form.isBritish ? '' : form.rightToWork,
                    licenseNo: form.licenseNo,
                    dbsUpdateId: form.dbsUpdateId,
                },
                expiry: {
                    license: form.licenseExpiry,
                    taxiBadge: form.taxiBadgeExpiry,
                    dbs: form.dbsExpiry,
                    safeguarding: form.safeguardingExpiry,
                    mot: form.motExpiry,
                    taxiPlate: form.taxiPlateExpiry,
                    insurance: form.insuranceExpiry,
                },
                driverFiles: {
                    passport: files.passport,
                    driving_license_front: files.driving_license_front,
                    driving_license_back: files.driving_license_back,
                    taxi_badge_front: files.taxi_badge_front,
                    taxi_badge_back: files.taxi_badge_back,
                    dbs_certificate_front: files.dbs_certificate_front,
                    dbs_certificate_back: files.dbs_certificate_back,
                    safeguarding_certificate: files.safeguarding_certificate,
                    other_certificates: otherCertificates,
                },
                vehicleFiles: {
                    v5_front: files.v5_front,
                    v5_inside: files.v5_inside,
                    mot_certificate: files.mot_certificate,
                    taxi_license_plate: files.taxi_license_plate,
                    insurance_certificate: files.insurance_certificate,
                    vehicle_photo: files.vehicle_photo,
                },
                vehicle: {
                    taxiLicensePlate: form.taxiLicensePlate,
                    seatingCapacity: form.seatingCapacity,
                    registrationNumber: form.registrationNumber,
                    taxiPlateNumber: form.taxiPlateNumber,
                    make: form.make,
                    model: form.model,
                    vehicleColour: form.vehicleColour,
                    yearOfFirstRegistration: form.yearOfFirstRegistration,
                    licensingType: form.licensingType,
                    bodyStyle: form.bodyStyle,
                    wheelchairAccessible: form.wheelchairAccessible,
                    _existingPhotoUrl: existingVehiclePhotoUrl,
                },
                existingDriverDocs,
                existingVehicleDocs,
            });

            pushToast('success', 'Driver details updated successfully.');
            setTimeout(() => navigate('/portal/users/drivers'), 1200);
        } catch (e) {
            const msg = e?.message || 'Could not save changes.';
            setSubmitError(msg);
            pushToast('error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading / Error states ────────────────────────────────
    if (loading) {
        return (
            <LoadingStatus label="Loading driver edit form" className="space-y-6">
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Driver</h1>
                    <p className="text-sm text-gray-500">Update driver details, documents, and vehicle information.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 lg:p-8 space-y-8">
                    <ShimmerBlock className="h-8 w-56 rounded-lg" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <ShimmerBlock className="h-12 rounded-xl" />
                        <ShimmerBlock className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <ShimmerBlock className="h-28 rounded-xl" />
                        <ShimmerBlock className="h-28 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <ShimmerBlock className="h-44 rounded-xl" />
                        <ShimmerBlock className="h-44 rounded-xl" />
                        <ShimmerBlock className="h-44 rounded-xl" />
                    </div>
                </div>
            </LoadingStatus>
        );
    }

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{loadError}</p>
                <button
                    type="button"
                    onClick={() => navigate('/portal/users/drivers')}
                    className="text-sm text-[#005580] underline"
                >
                    Back to drivers
                </button>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="mx-auto space-y-0 pb-10">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            {/* Page heading */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Driver</h1>
                <p className="text-sm text-gray-500 mt-2">
                    Update driver details, documents, and vehicle information.
                </p>
            </div>

            {/* ── Card ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] space-y-10 my-5">

                {/* ── Personal Information ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Personal Information" />
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="First Name" required placeholder="Enter first name" value={form.firstName} onChange={set('firstName')} showError={showMissing('firstName')} />
                            <FormField label="Last Name" required placeholder="Enter last name" value={form.lastName} onChange={set('lastName')} showError={showMissing('lastName')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField
                                label="Email Address"
                                type="email"
                                placeholder="Email address"
                                value={form.email}
                                disabled
                                // Email changes must go through Supabase auth flow separately
                            />
                            <FormField label="Phone Number" required type="tel" placeholder="Enter phone number" value={form.phone} onChange={set('phone')} showError={showMissing('phone')} />
                        </div>
                        <FormField label="Residential Address" required placeholder="Enter full residential address" value={form.address} onChange={set('address')} showError={showMissing('address')} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="Emergency Contact Name" required placeholder="Enter emergency contact name" value={form.emergencyName} onChange={set('emergencyName')} showError={showMissing('emergencyName')} />
                            <FormField label="Emergency Contact Phone" required placeholder="Enter emergency contact phone" value={form.emergencyPhone} onChange={set('emergencyPhone')} showError={showMissing('emergencyPhone')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex items-end">
                                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={form.isBritish}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setForm((prev) => ({
                                                ...prev,
                                                isBritish: checked,
                                                nationality: checked ? 'British' : '',
                                                rightToWork: checked ? '' : prev.rightToWork,
                                            }));
                                        }}
                                    />
                                    British (no right to work code)
                                </label>
                            </div>
                            <div />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="Nationality" required placeholder="e.g. British, Pakistani" value={form.nationality} onChange={set('nationality')} showError={showMissing('nationality')} />
                            {!form.isBritish ? (
                                <FormField label="Right to Work Code" placeholder="Enter right to work code" value={form.rightToWork} onChange={set('rightToWork')} />
                            ) : <div />}
                        </div>
                    </div>
                </div>

                {/* ── Profile Picture ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Profile Picture" />
                    <p className="text-sm text-gray-500 mb-4 -mt-3">Upload a clear, professional headshot.</p>
                    <div className={`flex items-stretch gap-4 border rounded-xl overflow-hidden ${
                        showMissing('avatarFile') ? 'border-red-300' : 'border-gray-200'
                    }`}>
                        <div className="w-24 shrink-0 bg-gray-100 flex items-center justify-center border-r border-gray-200">
                            {(avatarPreview || existingAvatarUrl) ? (
                                <img src={avatarPreview || existingAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <MdPersonOutline size={36} className="text-gray-400" />
                            )}
                        </div>
                        <div
                            className="flex-1 flex flex-col items-center justify-center py-8 px-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
                            onClick={() => avatarRef.current.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handleAvatarChange(e.dataTransfer.files[0]); }}
                        >
                            <MdCloudUpload size={32} className="text-[#005580] mb-2" />
                            <p className="text-sm text-center">
                                <span className="text-[#005580] font-semibold cursor-pointer hover:underline">Click to upload</span>
                                {' '}or drag and drop
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {existingAvatarUrl && !avatarPreview ? 'A profile photo is already on file — upload to replace it.' : 'SVG, PNG, JPG or GIF (max. 800×800px)'}
                            </p>
                        </div>
                        <input
                            ref={avatarRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                handleAvatarChange(e.target.files[0]);
                                e.target.value = '';
                            }}
                        />
                    </div>
                    {showMissing('avatarFile') && (
                        <p className="text-xs text-red-600 font-medium mt-2">Profile picture is required.</p>
                    )}
                </div>

                {/* ── Document Uploads ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Document Uploads" />
                    <p className="text-xs text-gray-500 mb-5 -mt-3">
                        Documents with a green checkmark are already on file. Click <strong>Replace</strong> to upload a new version.
                    </p>
                    <div className="space-y-6">

                        {/* Passport (optional — document required if number provided) */}
                        <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white">
                            <p className="text-sm font-semibold text-gray-800">Passport (optional)</p>
                            <p className="text-xs text-gray-500">If you enter a passport number, you must also have a passport document on file.</p>
                            <FormField
                                label="Passport Number"
                                placeholder="e.g. AB1234567"
                                value={form.passport}
                                onChange={set('passport')}
                            />
                            <UploadBox
                                label="Passport copy"
                                hint="PDF or image"
                                file={files.passport}
                                existingUrl={existingUrls.passport}
                                onFileChange={setFile('passport')}
                                showError={showMissing('passport')}
                                errorText="Passport document is required when a passport number is provided."
                            />
                        </div>

                        {/* Driving License */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <UploadBox label="Driving License (Front)" required
                                file={files.driving_license_front} existingUrl={existingUrls.driving_license_front}
                                onFileChange={setFile('driving_license_front')} showError={showMissing('driving_license_front')} />
                            <UploadBox label="Driving License (Back)" required
                                file={files.driving_license_back} existingUrl={existingUrls.driving_license_back}
                                onFileChange={setFile('driving_license_back')} showError={showMissing('driving_license_back')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                            <FormField label="License Number" required placeholder="License Number" value={form.licenseNo} onChange={set('licenseNo')} showError={showMissing('licenseNo')} />
                            <ExpiryDateField value={form.licenseExpiry} onChange={setExpiry('licenseExpiry')} showError={showMissing('licenseExpiry')} />
                        </div>

                        {/* Taxi Badge */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <UploadBox label="Taxi Badge (Front)" required
                                file={files.taxi_badge_front} existingUrl={existingUrls.taxi_badge_front}
                                onFileChange={setFile('taxi_badge_front')} showError={showMissing('taxi_badge_front')} />
                            <UploadBox label="Taxi Badge (Back)" required
                                file={files.taxi_badge_back} existingUrl={existingUrls.taxi_badge_back}
                                onFileChange={setFile('taxi_badge_back')} showError={showMissing('taxi_badge_back')} />
                        </div>
                        <ExpiryDateField value={form.taxiBadgeExpiry} onChange={setExpiry('taxiBadgeExpiry')} showError={showMissing('taxiBadgeExpiry')} />

                        {/* DBS Certificate */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <UploadBox label="DBS Certificate (Front)" required
                                file={files.dbs_certificate_front} existingUrl={existingUrls.dbs_certificate_front}
                                onFileChange={setFile('dbs_certificate_front')} showError={showMissing('dbs_certificate_front')} />
                            <UploadBox label="DBS Certificate (Back)" required
                                file={files.dbs_certificate_back} existingUrl={existingUrls.dbs_certificate_back}
                                onFileChange={setFile('dbs_certificate_back')} showError={showMissing('dbs_certificate_back')} />
                        </div>
                        <ExpiryDateField value={form.dbsExpiry} onChange={setExpiry('dbsExpiry')} showError={showMissing('dbsExpiry')} />

                        {/* DBS Update ID + Safeguarding */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="DBS Service Update ID Number" required placeholder="Enter DBS service update ID"
                                value={form.dbsUpdateId} onChange={set('dbsUpdateId')} showError={showMissing('dbsUpdateId')} />
                            <UploadBox label="Derby City Safeguarding Certificate" hint="Must be less than 3 years old"
                                file={files.safeguarding_certificate} existingUrl={existingUrls.safeguarding_certificate}
                                onFileChange={setFile('safeguarding_certificate')} />
                        </div>
                        <ExpiryDateField value={form.safeguardingExpiry} onChange={setExpiry('safeguardingExpiry')} />
                    </div>
                </div>

                {/* ── Other Certificates ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Other Certificates" />
                    <div className="space-y-3 rounded-xl border border-dashed border-gray-200 bg-white p-4">
                        <label className="text-xs font-semibold text-gray-600">Add New Certificate (optional)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input id="otherCertLabel" type="text" placeholder="Certificate label"
                                className="px-3.5 py-3 border border-gray-200 rounded-xl text-sm" />
                            <input id="otherCertFile" type="file" accept="application/pdf,image/jpeg,image/png"
                                className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white" />
                            <button
                                type="button"
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                                onClick={() => {
                                    const labelEl = document.getElementById('otherCertLabel');
                                    const fileEl = document.getElementById('otherCertFile');
                                    const label = labelEl?.value?.trim();
                                    const file = fileEl?.files?.[0];
                                    if (!label || !file) return;
                                    setOtherCertificates((prev) => [...prev, { label, file }]);
                                    labelEl.value = '';
                                    fileEl.value = '';
                                }}
                            >
                                Add Certificate
                            </button>
                        </div>
                        {otherCertificates.map((cert, idx) => (
                            <div key={`${cert.label}-${idx}`} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg text-sm">
                                <span>{cert.label} — {cert.file?.name}</span>
                                <button type="button" className="text-red-600"
                                    onClick={() => setOtherCertificates((prev) => prev.filter((_, i) => i !== idx))}>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Vehicle Information ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Vehicle Information" />
                    <div className="space-y-6">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <UploadBox label="V5 Document (Front)" required
                                file={files.v5_front} existingUrl={existingUrls.v5_front}
                                onFileChange={setFile('v5_front')} showError={showMissing('v5_front')} />
                            <UploadBox label="V5 Document (Inside)" required
                                file={files.v5_inside} existingUrl={existingUrls.v5_inside}
                                onFileChange={setFile('v5_inside')} showError={showMissing('v5_inside')} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <FormField label="Registration Number (Plate)" required placeholder="e.g. ABC 1234"
                                value={form.registrationNumber} onChange={set('registrationNumber')} showError={showMissing('registrationNumber')} />
                            <FormField label="Vehicle Taxi Plate Number" required placeholder="e.g. ABC 1234"
                                value={form.taxiPlateNumber} onChange={set('taxiPlateNumber')} showError={showMissing('taxiPlateNumber')} />
                            <FormField label="Make" required placeholder="e.g. Toyota"
                                value={form.make} onChange={set('make')} showError={showMissing('make')} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <FormField label="Model" required placeholder="e.g. Prius"
                                value={form.model} onChange={set('model')} showError={showMissing('model')} />
                            <FormField label="Vehicle Colour" required placeholder="e.g. Black"
                                value={form.vehicleColour} onChange={set('vehicleColour')} showError={showMissing('vehicleColour')} />
                            <FormField label="Year of First Registration" required type="date"
                                value={form.yearOfFirstRegistration} onChange={set('yearOfFirstRegistration')} showError={showMissing('yearOfFirstRegistration')} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <FormField label="Licensing Type" required placeholder="e.g. Nottingham City Council"
                                value={form.licensingType} onChange={set('licensingType')} showError={showMissing('licensingType')} />
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-600">
                                    Vehicle Type<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <select
                                    value={form.bodyStyle}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        const meta = VEHICLE_TYPES.find((x) => x.value === next);
                                        setForm((prev) => ({
                                            ...prev,
                                            bodyStyle: next,
                                            seatingCapacity: meta?.seats || '',
                                            wheelchairAccessible: !!meta?.wheelchairAccessible,
                                        }));
                                    }}
                                    className={`w-full px-3.5 py-3 border rounded-xl text-sm bg-white ${showMissing('bodyStyle') ? 'border-red-400' : 'border-gray-200'}`}
                                >
                                    <option value="">Select vehicle type</option>
                                    {VEHICLE_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.value}</option>
                                    ))}
                                </select>
                                {showMissing('bodyStyle') && <p className="text-xs text-red-600 font-medium">This field is required.</p>}
                            </div>
                            <div className="flex items-end">
                                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={form.wheelchairAccessible}
                                        onChange={(e) => setForm((prev) => ({ ...prev, wheelchairAccessible: e.target.checked }))}
                                    />
                                    Wheelchair Accessible
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <UploadBox label="MOT Certificate" required
                                    file={files.mot_certificate} existingUrl={existingUrls.mot_certificate}
                                    onFileChange={setFile('mot_certificate')} showError={showMissing('mot_certificate')} />
                                <ExpiryDateField className="mt-2" value={form.motExpiry} onChange={setExpiry('motExpiry')} showError={showMissing('motExpiry')} />
                            </div>
                            <div>
                                <UploadBox label="Taxi License Plate" required
                                    file={files.taxi_license_plate} existingUrl={existingUrls.taxi_license_plate}
                                    onFileChange={setFile('taxi_license_plate')} showError={showMissing('taxi_license_plate')} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                                    <FormField label="Taxi License Plate Number" required placeholder="Taxi License Plate Number"
                                        value={form.taxiLicensePlate} onChange={set('taxiLicensePlate')} showError={showMissing('taxiLicensePlate')} />
                                    <ExpiryDateField value={form.taxiPlateExpiry} onChange={setExpiry('taxiPlateExpiry')} showError={showMissing('taxiPlateExpiry')} />
                                </div>
                            </div>
                            <div>
                                <UploadBox label="Insurance Certificate" required
                                    file={files.insurance_certificate} existingUrl={existingUrls.insurance_certificate}
                                    onFileChange={setFile('insurance_certificate')} showError={showMissing('insurance_certificate')} />
                                <ExpiryDateField className="mt-2" value={form.insuranceExpiry} onChange={setExpiry('insuranceExpiry')} showError={showMissing('insuranceExpiry')} />
                            </div>
                        </div>

                        <UploadBox label="Vehicle Photo" required accept="image/jpeg,image/png"
                            file={files.vehicle_photo}
                            existingUrl={existingVehiclePhotoUrl}
                            onFileChange={setFile('vehicle_photo')}
                            showError={showMissing('vehicle_photo')} />

                        {/* Seating Capacity — read-only, driven by vehicle type selection */}
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

            {/* ── Footer Actions ── */}
            <div className="space-y-3 pt-6 pb-2">
                {submitError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {submitError}
                    </p>
                )}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/portal/users/drivers')}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <MdArrowBack size={16} />
                        Back to Drivers
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditDriver;