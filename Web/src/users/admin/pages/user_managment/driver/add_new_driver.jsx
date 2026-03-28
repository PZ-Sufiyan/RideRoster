import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCloudUpload } from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { registerDriverWithAuthAndRecords } from '../../../../../services/driverRegistrationService';

// ─── Step Indicator ──────────────────────────────────────────
const steps = [
    { number: 1, label: 'Personal Info' },
    { number: 2, label: 'Documents' },
    { number: 3, label: 'Vehicle' },
    { number: 4, label: 'Review' },
];

const StepIndicator = ({ currentStep }) => (
    <div className="flex items-center justify-center mb-8">
        {steps.map((step, i) => {
            const isActive = step.number === currentStep;
            const isDone = step.number < currentStep;
            return (
                <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                                ${isActive ? 'bg-[#005580] border-[#005580] text-white' : ''}
                                ${isDone ? 'bg-[#005580] border-[#005580] text-white' : ''}
                                ${!isActive && !isDone ? 'bg-white border-gray-300 text-gray-400' : ''}
                            `}
                        >
                            {step.number}
                        </div>
                        <span
                            className={`mt-1.5 text-xs font-medium whitespace-nowrap
                                ${isActive ? 'text-[#005580]' : 'text-gray-400'}
                            `}
                        >
                            {step.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-px flex-1 mx-3 mb-5 ${isDone ? 'bg-[#005580]' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─── Reusable: Text Input ─────────────────────────────────────
const FormField = ({ label, required, placeholder, value, onChange, type = 'text', className = '' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-xs font-semibold text-gray-600">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] bg-white transition-colors"
        />
    </div>
);

// ─── Reusable: Upload Box ─────────────────────────────────────
const UploadBox = ({ label, required, hint, file, onFileChange, accept = 'application/pdf,image/jpeg,image/png' }) => {
    const inputRef = useRef();
    const fileName = file?.name;

    const handleFile = (f) => {
        if (!f) return;
        onFileChange && onFileChange(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    };

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
                className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-6 px-4 cursor-pointer hover:border-[#005580] hover:bg-blue-50/30 transition-colors min-h-[96px]"
            >
                <MdCloudUpload size={26} className="text-gray-400 mb-1.5" />
                {fileName ? (
                    <span className="text-xs text-green-600 font-medium text-center break-all">{fileName}</span>
                ) : (
                    <span className="text-xs text-gray-400 text-center">
                        Click to upload or drag and drop
                    </span>
                )}
                {hint && !fileName && (
                    <span className="text-[10px] text-gray-400 mt-1 text-center">{hint}</span>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
            />
        </div>
    );
};

// ─── Expiry date (stored as YYYY-MM-DD for Postgres `date`) ────
const ExpiryDateField = ({ value, onChange, className = '' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <span className="text-xs font-semibold text-gray-600">Expiry date</span>
        <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] bg-white"
        />
    </div>
);

// ─── Seating Capacity Dropdown ────────────────────────────────
const SeatingCapacity = ({ value, onChange }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Seating Capacity</label>
        <select
            value={value}
            onChange={onChange}
            className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] bg-white appearance-none cursor-pointer"
        >
            <option value="">Seating Capacity</option>
            {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((n) => (
                <option key={n} value={n}>{n} Passengers</option>
            ))}
        </select>
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

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
    const setExpiry = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
    const setFile = (key) => (f) => setFiles((prev) => ({ ...prev, [key]: f }));

    const handleRegister = async () => {
        setSubmitError('');
        if (form.password !== form.confirmPassword) {
            setSubmitError('Passwords do not match.');
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
            navigate('/admin/users/drivers');
        } catch (e) {
            const msg = e?.message || 'Could not register driver.';
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto space-y-0">
            {/* Page heading */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Add New Driver</h1>
                <p className="text-sm text-gray-500 mt-1">Add a new driver to your company's roster.</p>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* ── Card ── */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] space-y-8 my-5">

                {/* ── Personal Information ── */}
                <div>
                    <SectionHeading title="Personal Information" />
                    <div className="space-y-4">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="First Name" required placeholder="Enter first name" value={form.firstName} onChange={set('firstName')} />
                            <FormField label="Last Name" required placeholder="Enter last name" value={form.lastName} onChange={set('lastName')} />
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Email Address" required type="email" placeholder="Enter email address" value={form.email} onChange={set('email')} />
                            <FormField label="Phone Number" required type="tel" placeholder="Enter phone number" value={form.phone} onChange={set('phone')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                label="Password"
                                required
                                type="password"
                                placeholder="Enter password"
                                value={form.password}
                                onChange={set('password')}
                            />

                            <FormField
                                label="Confirm Password"
                                required
                                type="password"
                                placeholder="Confirm password"
                                value={form.confirmPassword}
                                onChange={set('confirmPassword')}
                            />
                        </div>
                        {/* Row 3 */}
                        <FormField label="Residential Address" required placeholder="Enter full residential address" value={form.address} onChange={set('address')} />
                        {/* Row 4 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Emergency Contact Name" required placeholder="Enter emergency contact name" value={form.emergencyName} onChange={set('emergencyName')} />
                            <FormField label="Emergency Contact Phone" required placeholder="Enter emergency contact phone" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
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
                            />
                            <UploadBox
                                label="Driving License (Back)"
                                required
                                file={files.driving_license_back}
                                onFileChange={setFile('driving_license_back')}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <FormField
                                label="License Number"
                                required
                                placeholder="License Number"
                                value={form.licenseNo}
                                onChange={set('licenseNo')}
                            />
                            <ExpiryDateField value={form.licenseExpiry} onChange={setExpiry('licenseExpiry')} />
                        </div>

                        {/* Taxi Badge */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UploadBox
                                label="Taxi Badge (Front)"
                                required
                                file={files.taxi_badge_front}
                                onFileChange={setFile('taxi_badge_front')}
                            />
                            <UploadBox
                                label="Taxi Badge (Back)"
                                required
                                file={files.taxi_badge_back}
                                onFileChange={setFile('taxi_badge_back')}
                            />
                        </div>
                        <ExpiryDateField value={form.taxiBadgeExpiry} onChange={setExpiry('taxiBadgeExpiry')} />

                        {/* DBS Certificate */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UploadBox
                                label="DBS Certificate (Front)"
                                required
                                file={files.dbs_certificate_front}
                                onFileChange={setFile('dbs_certificate_front')}
                            />
                            <UploadBox
                                label="DBS Certificate (Back)"
                                required
                                file={files.dbs_certificate_back}
                                onFileChange={setFile('dbs_certificate_back')}
                            />
                        </div>
                        <ExpiryDateField value={form.dbsExpiry} onChange={setExpiry('dbsExpiry')} />

                        {/* DBS Update ID + Derby City Safeguarding */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                label="DBS Service Update ID Number"
                                required
                                placeholder="Enter DBS service update ID"
                                value={form.dbsUpdateId}
                                onChange={set('dbsUpdateId')}
                            />
                            <UploadBox
                                label="Derby City Safeguarding Certificate"
                                hint="Must be less than 3 years old"
                                file={files.safeguarding_certificate}
                                onFileChange={setFile('safeguarding_certificate')}
                            />
                        </div>
                        <ExpiryDateField value={form.safeguardingExpiry} onChange={setExpiry('safeguardingExpiry')} />
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
                            />
                            <UploadBox
                                label="V5 Document (Inside)"
                                required
                                file={files.v5_inside}
                                onFileChange={setFile('v5_inside')}
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
                                />
                                <ExpiryDateField
                                    className="mt-2"
                                    value={form.motExpiry}
                                    onChange={setExpiry('motExpiry')}
                                />
                            </div>
                            <div>
                                <UploadBox
                                    label="Taxi License Plate"
                                    required
                                    file={files.taxi_license_plate}
                                    onFileChange={setFile('taxi_license_plate')}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    <FormField
                                        label="Taxi License Plate Number"
                                        required
                                        placeholder="Taxi License Plate Number"
                                        value={form.taxiLicensePlate}
                                        onChange={set('taxiLicensePlate')}
                                    />
                                    <ExpiryDateField
                                        value={form.taxiPlateExpiry}
                                        onChange={setExpiry('taxiPlateExpiry')}
                                    />
                                </div>
                            </div>
                            <div>
                                <UploadBox
                                    label="Insurance Certificate"
                                    required
                                    file={files.insurance_certificate}
                                    onFileChange={setFile('insurance_certificate')}
                                />
                                <ExpiryDateField
                                    className="mt-2"
                                    value={form.insuranceExpiry}
                                    onChange={setExpiry('insuranceExpiry')}
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
                        />

                        {/* Seating Capacity */}
                        <SeatingCapacity
                            value={form.seatingCapacity}
                            onChange={set('seatingCapacity')}
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
                        onClick={() => navigate('/admin/users/drivers')}
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
