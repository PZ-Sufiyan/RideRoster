import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCloudUpload, MdVisibility, MdDeleteOutline, MdFileUpload } from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { registerDriverWithAuthAndRecords } from '../../../../../services/driverRegistrationService';
import { ToastStack } from '../../../../../utils/Toast';

// ─── Reusable: Text Input ─────────────────────────────────────
const FormField = ({ label, required, placeholder, value, onChange, type = 'text', className = '', showError = false, errorText = 'This field is required.' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-xs font-semibold text-gray-600">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 bg-white transition-colors ${
                showError
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-[#005580] focus:ring-[#005580]'
            }`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Reusable: Upload Box ─────────────────────────────────────
const UploadBox = ({ label, required, hint, file, onFileChange, accept = 'application/pdf,image/jpeg,image/png', showError = false, errorText = 'Please upload this required document.' }) => {
    const inputRef = useRef();
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileName = file?.name;

    const handleFile = (f) => {
        if (!f) return;
        // Revoke any previous preview URL before creating a new one
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
        if (previewUrl) {
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onFileChange && onFileChange(null);
    };

    const handleReuploadClick = (e) => {
        e.stopPropagation();
        inputRef.current?.click();
    };

    // Cleanup preview URL on unmount or when external `file` is cleared
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
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-xs font-semibold text-gray-600">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div
                onClick={() => inputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-6 px-4 cursor-pointer transition-colors min-h-[96px] ${
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
                            <button
                                type="button"
                                onClick={handleView}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-[11px] font-medium text-[#005580] hover:bg-blue-100"
                            >
                                <MdVisibility size={13} />
                                View
                            </button>
                            <button
                                type="button"
                                onClick={handleReuploadClick}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
                            >
                                <MdFileUpload size={13} />
                                Change
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-[11px] font-medium text-red-600 hover:bg-red-100"
                            >
                                <MdDeleteOutline size={13} />
                                Delete
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <span className="text-xs text-gray-400 text-center">
                            Click to upload or drag and drop
                        </span>
                        {hint && (
                            <span className="text-[10px] text-gray-400 mt-1 text-center">{hint}</span>
                        )}
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
            {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
        </div>
    );
};

// ─── Expiry date (stored as YYYY-MM-DD for Postgres `date`) ────
const ExpiryDateField = ({ value, onChange, className = '', showError = false, errorText = 'Expiry date is required.' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <span className="text-xs font-semibold text-gray-600">Expiry date</span>
        <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 bg-white ${
                showError
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 text-gray-700 focus:border-[#005580] focus:ring-[#005580]'
            }`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Seating Capacity Dropdown ────────────────────────────────
const SeatingCapacity = ({ value, onChange, showError = false, errorText = 'Seating capacity is required.' }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Seating Capacity</label>
        <select
            value={value}
            onChange={onChange}
            className={`w-40 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 bg-white appearance-none cursor-pointer ${
                showError
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 text-gray-600 focus:border-[#005580] focus:ring-[#005580]'
            }`}
        >
            <option value="">Seating Capacity</option>
            {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((n) => (
                <option key={n} value={n}>{n} Passengers</option>
            ))}
        </select>
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Section Heading ──────────────────────────────────────────
const SectionHeading = ({ title }) => (
    <h2 className="text-base font-bold text-gray-800 mb-4">{title}</h2>
);

// ─── Main Component ───────────────────────────────────────────
const initialFilesState = {
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

const AddNewDriver = () => {
    const navigate = useNavigate();
    const [currentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        password: '', confirmPassword: '',
        address: '', emergencyName: '', emergencyPhone: '',
        passport: '', rightToWork: '',
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
    });
    const [files, setFiles] = useState(() => ({ ...initialFilesState }));
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [missingKeys, setMissingKeys] = useState([]);

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
    const setExpiry = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
    const setFile = (key) => (f) => setFiles((prev) => ({ ...prev, [key]: f }));

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                type,
                message,
                autoClose: true,
                duration: 3500,
            },
        ]);
    };

    const validateRequired = () => {
        setSubmitAttempted(true);
        const missingFields = [];

        if (!form.firstName?.trim()) missingFields.push('firstName');
        if (!form.lastName?.trim()) missingFields.push('lastName');
        if (!form.email?.trim()) missingFields.push('email');
        if (!form.phone?.trim()) missingFields.push('phone');
        if (!form.password) missingFields.push('password');
        if (!form.confirmPassword) missingFields.push('confirmPassword');
        if (!form.address?.trim()) missingFields.push('address');
        if (!form.emergencyName?.trim()) missingFields.push('emergencyName');
        if (!form.emergencyPhone?.trim()) missingFields.push('emergencyPhone');
        if (!form.licenseNo?.trim()) missingFields.push('licenseNo');
        if (!form.licenseExpiry) missingFields.push('licenseExpiry');
        if (!form.taxiBadgeExpiry) missingFields.push('taxiBadgeExpiry');
        if (!form.dbsExpiry) missingFields.push('dbsExpiry');
        if (!form.safeguardingExpiry) missingFields.push('safeguardingExpiry');
        if (!form.motExpiry) missingFields.push('motExpiry');
        if (!form.taxiPlateExpiry) missingFields.push('taxiPlateExpiry');
        if (!form.insuranceExpiry) missingFields.push('insuranceExpiry');
        if (!form.dbsUpdateId?.trim()) missingFields.push('dbsUpdateId');
        if (!form.taxiLicensePlate?.trim()) missingFields.push('taxiLicensePlate');
        if (!form.seatingCapacity) missingFields.push('seatingCapacity');

        if (!files.driving_license_front) missingFields.push('driving_license_front');
        if (!files.driving_license_back) missingFields.push('driving_license_back');
        if (!files.taxi_badge_front) missingFields.push('taxi_badge_front');
        if (!files.taxi_badge_back) missingFields.push('taxi_badge_back');
        if (!files.dbs_certificate_front) missingFields.push('dbs_certificate_front');
        if (!files.dbs_certificate_back) missingFields.push('dbs_certificate_back');
        if (!files.v5_front) missingFields.push('v5_front');
        if (!files.v5_inside) missingFields.push('v5_inside');
        if (!files.mot_certificate) missingFields.push('mot_certificate');
        if (!files.taxi_license_plate) missingFields.push('taxi_license_plate');
        if (!files.insurance_certificate) missingFields.push('insurance_certificate');
        if (!files.vehicle_photo) missingFields.push('vehicle_photo');

        setMissingKeys(missingFields);

        if (missingFields.length) {
            pushToast('warning', 'Please fill in all required fields and documents before registering the driver.');
            return false;
        }
        return true;
    };
    const showMissing = (key) => submitAttempted && missingKeys.includes(key);

    const handleRegister = async () => {
        setSubmitError('');
        if (!validateRequired()) {
            return;
        }
        if (form.password !== form.confirmPassword) {
            setSubmitError('Passwords do not match.');
            pushToast('error', 'Passwords do not match.');
            return;
        }
        setSubmitting(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) {
                throw new Error('Not authenticated.');
            }
            const admin = await getCompanyAdminById(uid);
            if (!admin?.company_id) {
                throw new Error('No company linked to your account.');
            }
            await registerDriverWithAuthAndRecords({
                companyId: admin.company_id,
                personal: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    address: form.address,
                    emergencyName: form.emergencyName,
                    emergencyPhone: form.emergencyPhone,
                    passport: form.passport,
                    rightToWork: form.rightToWork,
                    licenseNo: form.licenseNo,
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
                    driving_license_front: files.driving_license_front,
                    driving_license_back: files.driving_license_back,
                    taxi_badge_front: files.taxi_badge_front,
                    taxi_badge_back: files.taxi_badge_back,
                    dbs_certificate_front: files.dbs_certificate_front,
                    dbs_certificate_back: files.dbs_certificate_back,
                    ...(files.safeguarding_certificate
                        ? { safeguarding_certificate: files.safeguarding_certificate }
                        : {}),
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
                },
            });
            navigate('/subadmin/users/drivers');
        } catch (e) {
            const msg = e?.message || 'Could not register driver.';
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto space-y-0">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />
            {/* Page heading */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Add New Driver</h1>
                <p className="text-sm text-gray-500 mt-1">Add a new driver to your company's roster.</p>
            </div>

            {/* ── Card ── */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] space-y-8 my-5">

                {/* ── Personal Information ── */}
                <div>
                    <SectionHeading title="Personal Information" />
                    <div className="space-y-4">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="First Name" required placeholder="Enter first name" value={form.firstName} onChange={set('firstName')} showError={showMissing('firstName')} />
                            <FormField label="Last Name" required placeholder="Enter last name" value={form.lastName} onChange={set('lastName')} showError={showMissing('lastName')} />
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Email Address" required type="email" placeholder="Enter email address" value={form.email} onChange={set('email')} showError={showMissing('email')} />
                            <FormField label="Phone Number" required type="tel" placeholder="Enter phone number" value={form.phone} onChange={set('phone')} showError={showMissing('phone')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                label="Password"
                                required
                                type="password"
                                placeholder="Enter password"
                                value={form.password}
                                onChange={set('password')}
                                showError={showMissing('password')}
                            />

                            <FormField
                                label="Confirm Password"
                                required
                                type="password"
                                placeholder="Confirm password"
                                value={form.confirmPassword}
                                onChange={set('confirmPassword')}
                                showError={showMissing('confirmPassword')}
                            />
                        </div>
                        {/* Row 3 */}
                        <FormField label="Residential Address" required placeholder="Enter full residential address" value={form.address} onChange={set('address')} showError={showMissing('address')} />
                        {/* Row 4 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Emergency Contact Name" required placeholder="Enter emergency contact name" value={form.emergencyName} onChange={set('emergencyName')} showError={showMissing('emergencyName')} />
                            <FormField label="Emergency Contact Phone" required placeholder="Enter emergency contact phone" value={form.emergencyPhone} onChange={set('emergencyPhone')} showError={showMissing('emergencyPhone')} />
                        </div>
                        {/* Row 5 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Passport Number" placeholder="Enter passport number" value={form.passport} onChange={set('passport')} />
                            <FormField label="Right to Work Code" placeholder="Enter right to work code" value={form.rightToWork} onChange={set('rightToWork')} />
                        </div>
                    </div>
                </div>

                {/* ── Document Uploads ── */}
                <div>
                    <SectionHeading title="Document Uploads" />
                    <div className="space-y-5">

                        {/* Driving License */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UploadBox
                                label="Driving License (Front)"
                                required
                                file={files.driving_license_front}
                                onFileChange={setFile('driving_license_front')}
                                showError={showMissing('driving_license_front')}
                            />
                            <UploadBox
                                label="Driving License (Back)"
                                required
                                file={files.driving_license_back}
                                onFileChange={setFile('driving_license_back')}
                                showError={showMissing('driving_license_back')}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <FormField
                                label="License Number"
                                required
                                placeholder="License Number"
                                value={form.licenseNo}
                                onChange={set('licenseNo')}
                                showError={showMissing('licenseNo')}
                            />
                            <ExpiryDateField value={form.licenseExpiry} onChange={setExpiry('licenseExpiry')} showError={showMissing('licenseExpiry')} />
                        </div>

                        {/* Taxi Badge */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UploadBox
                                label="Taxi Badge (Front)"
                                required
                                file={files.taxi_badge_front}
                                onFileChange={setFile('taxi_badge_front')}
                                showError={showMissing('taxi_badge_front')}
                            />
                            <UploadBox
                                label="Taxi Badge (Back)"
                                required
                                file={files.taxi_badge_back}
                                onFileChange={setFile('taxi_badge_back')}
                                showError={showMissing('taxi_badge_back')}
                            />
                        </div>
                        <ExpiryDateField value={form.taxiBadgeExpiry} onChange={setExpiry('taxiBadgeExpiry')} showError={showMissing('taxiBadgeExpiry')} />

                        {/* DBS Certificate */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UploadBox
                                label="DBS Certificate (Front)"
                                required
                                file={files.dbs_certificate_front}
                                onFileChange={setFile('dbs_certificate_front')}
                                showError={showMissing('dbs_certificate_front')}
                            />
                            <UploadBox
                                label="DBS Certificate (Back)"
                                required
                                file={files.dbs_certificate_back}
                                onFileChange={setFile('dbs_certificate_back')}
                                showError={showMissing('dbs_certificate_back')}
                            />
                        </div>
                        <ExpiryDateField value={form.dbsExpiry} onChange={setExpiry('dbsExpiry')} showError={showMissing('dbsExpiry')} />

                        {/* DBS Update ID + Derby City Safeguarding */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                label="DBS Service Update ID Number"
                                required
                                placeholder="Enter DBS service update ID"
                                value={form.dbsUpdateId}
                                onChange={set('dbsUpdateId')}
                                showError={showMissing('dbsUpdateId')}
                            />
                            <UploadBox
                                label="Derby City Safeguarding Certificate"
                                hint="Must be less than 3 years old"
                                file={files.safeguarding_certificate}
                                onFileChange={setFile('safeguarding_certificate')}
                            />
                        </div>
                        <ExpiryDateField value={form.safeguardingExpiry} onChange={setExpiry('safeguardingExpiry')} showError={showMissing('safeguardingExpiry')} />
                    </div>
                </div>

                {/* ── Vehicle Information ── */}
                <div>
                    <SectionHeading title="Vehicle Information" />
                    <div className="space-y-5">

                        {/* V5 Document */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UploadBox
                                label="V5 Document (Front)"
                                required
                                file={files.v5_front}
                                onFileChange={setFile('v5_front')}
                                showError={showMissing('v5_front')}
                            />
                            <UploadBox
                                label="V5 Document (Inside)"
                                required
                                file={files.v5_inside}
                                onFileChange={setFile('v5_inside')}
                                showError={showMissing('v5_inside')}
                            />
                        </div>

                        {/* MOT + Taxi License Plate + Insurance */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <UploadBox
                                    label="MOT Certificate"
                                    required
                                    file={files.mot_certificate}
                                    onFileChange={setFile('mot_certificate')}
                                    showError={showMissing('mot_certificate')}
                                />
                                <ExpiryDateField
                                    className="mt-2"
                                    value={form.motExpiry}
                                    onChange={setExpiry('motExpiry')}
                                    showError={showMissing('motExpiry')}
                                />
                            </div>
                            <div>
                                <UploadBox
                                    label="Taxi License Plate"
                                    required
                                    file={files.taxi_license_plate}
                                    onFileChange={setFile('taxi_license_plate')}
                                    showError={showMissing('taxi_license_plate')}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    <FormField
                                        label="Taxi License Plate Number"
                                        required
                                        placeholder="Taxi License Plate Number"
                                        value={form.taxiLicensePlate}
                                        onChange={set('taxiLicensePlate')}
                                        showError={showMissing('taxiLicensePlate')}
                                    />
                                    <ExpiryDateField
                                        value={form.taxiPlateExpiry}
                                        onChange={setExpiry('taxiPlateExpiry')}
                                        showError={showMissing('taxiPlateExpiry')}
                                    />
                                </div>
                            </div>
                            <div>
                                <UploadBox
                                    label="Insurance Certificate"
                                    required
                                    file={files.insurance_certificate}
                                    onFileChange={setFile('insurance_certificate')}
                                    showError={showMissing('insurance_certificate')}
                                />
                                <ExpiryDateField
                                    className="mt-2"
                                    value={form.insuranceExpiry}
                                    onChange={setExpiry('insuranceExpiry')}
                                    showError={showMissing('insuranceExpiry')}
                                />
                            </div>
                        </div>

                        {/* Vehicle Photo */}
                        <UploadBox
                            label="Vehicle Photo"
                            required
                            file={files.vehicle_photo}
                            onFileChange={setFile('vehicle_photo')}
                            accept="image/jpeg,image/png"
                            showError={showMissing('vehicle_photo')}
                        />

                        {/* Seating Capacity */}
                        <SeatingCapacity
                            value={form.seatingCapacity}
                            onChange={set('seatingCapacity')}
                            showError={showMissing('seatingCapacity')}
                        />
                    </div>
                </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="space-y-3 pt-5 pb-2">
                {submitError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {submitError}
                    </p>
                )}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/subadmin/users/drivers')}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-0"
                        disabled={currentStep === 1}
                    >
                        <MdArrowBack size={16} />
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={handleRegister}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Registering…' : 'Register Driver'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewDriver;
