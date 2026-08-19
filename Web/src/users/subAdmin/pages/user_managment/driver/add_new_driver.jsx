import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdCloudUpload, MdVisibility, MdDeleteOutline, MdFileUpload, MdPersonOutline } from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { registerDriverWithAuthAndRecords } from '../../../../../services/driverRegistrationService';
import { invalidateDriversListCache } from '../../../../../hooks/useDriversList';
import { ToastStack } from '../../../../../utils/Toast';

// ─── Reusable: Text Input ─────────────────────────────────────
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

// ─── Section Heading ──────────────────────────────────────────
const SectionHeading = ({ title }) => (
    <h2 className="text-lg font-bold text-gray-900 mb-5">{title}</h2>
);

// ─── Main Component ───────────────────────────────────────────
const initialFilesState = {
    passport: null,
    driving_license_front: null,
    driving_license_back: null,
    taxi_badge_front: null,
    taxi_badge_back: null,
    dbs_certificate_front: null,
    dbs_certificate_back: null,
    safeguarding_certificate: null,
};

const AddNewDriver = () => {
    const navigate = useNavigate();
    const avatarRef = useRef();
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [currentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        countryCode: '+44',
        password: '', confirmPassword: '',
        address: '', emergencyName: '', emergencyPhone: '',
        passport: '', rightToWork: '', nationality: '',
        isBritish: false,
        licenseNo: '',
        licenseExpiry: '',
        taxiBadgeExpiry: '',
        dbsExpiry: '',
        safeguardingExpiry: '',
        dbsUpdateId: '',
    });
    const [otherCertificates, setOtherCertificates] = useState([]);
    const [files, setFiles] = useState(() => ({ ...initialFilesState }));
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [missingKeys, setMissingKeys] = useState([]);

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
        if (!form.nationality?.trim()) missingFields.push('nationality');
        if (!avatarFile) missingFields.push('avatarFile');
        if (form.passport?.trim() && !files.passport) missingFields.push('passport');
        if (!form.licenseNo?.trim()) missingFields.push('licenseNo');
        if (!form.licenseExpiry) missingFields.push('licenseExpiry');
        if (!form.taxiBadgeExpiry) missingFields.push('taxiBadgeExpiry');
        if (!form.dbsExpiry) missingFields.push('dbsExpiry');
        if (!form.dbsUpdateId?.trim()) missingFields.push('dbsUpdateId');

        if (!files.driving_license_front) missingFields.push('driving_license_front');
        if (!files.driving_license_back) missingFields.push('driving_license_back');
        if (!files.taxi_badge_front) missingFields.push('taxi_badge_front');
        if (!files.taxi_badge_back) missingFields.push('taxi_badge_back');
        if (!files.dbs_certificate_front) missingFields.push('dbs_certificate_front');
        if (!files.dbs_certificate_back) missingFields.push('dbs_certificate_back');

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
                avatarFile,
                personal: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: `${form.countryCode}${form.phone}`,
                    password: form.password,
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
                },
                driverFiles: {
                    ...(files.passport ? { passport: files.passport } : {}),
                    driving_license_front: files.driving_license_front,
                    driving_license_back: files.driving_license_back,
                    taxi_badge_front: files.taxi_badge_front,
                    taxi_badge_back: files.taxi_badge_back,
                    dbs_certificate_front: files.dbs_certificate_front,
                    dbs_certificate_back: files.dbs_certificate_back,
                    ...(files.safeguarding_certificate
                        ? { safeguarding_certificate: files.safeguarding_certificate }
                        : {}),
                    other_certificates: otherCertificates,
                },
            });
            invalidateDriversListCache();
            navigate('/team/users/drivers');
        } catch (e) {
            const msg = e?.message || 'Could not register driver.';
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto space-y-0 pb-10">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />
            {/* Page heading */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Driver</h1>
                <p className="text-sm text-gray-500 mt-2">Add a company driver. Assign a vehicle from the Vehicles page afterwards.</p>
            </div>

            {/* ── Card ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] space-y-10 my-5">

                {/* ── Personal Information ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Personal Information" />
                    <div className="space-y-5">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="First Name" required placeholder="Enter first name" value={form.firstName} onChange={set('firstName')} showError={showMissing('firstName')} />
                            <FormField label="Last Name" required placeholder="Enter last name" value={form.lastName} onChange={set('lastName')} showError={showMissing('lastName')} />
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="Email Address" required type="email" placeholder="Enter email address" value={form.email} onChange={set('email')} showError={showMissing('email')} />
                            <div className="grid grid-cols-3 gap-3">
                                <FormField label="Country Code" required placeholder="+44" value={form.countryCode} onChange={set('countryCode')} />
                                <FormField label="Phone Number" required type="tel" placeholder="Enter phone number" value={form.phone} onChange={set('phone')} className="col-span-2" showError={showMissing('phone')} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="Emergency Contact Name" required placeholder="Enter emergency contact name" value={form.emergencyName} onChange={set('emergencyName')} showError={showMissing('emergencyName')} />
                            <FormField label="Emergency Contact Phone" required placeholder="Enter emergency contact phone" value={form.emergencyPhone} onChange={set('emergencyPhone')} showError={showMissing('emergencyPhone')} />
                        </div>
                        {/* Row 5 */}
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
                    <p className="text-sm text-gray-500 mb-4">Upload a clear, professional headshot.</p>
                    <div className={`flex items-stretch gap-4 border rounded-xl overflow-hidden ${
                        showMissing('avatarFile') ? 'border-red-300' : 'border-gray-200'
                    }`}>
                        <div className="w-24 shrink-0 bg-gray-100 flex items-center justify-center border-r border-gray-200">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
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
                            <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 800×800px)</p>
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
                    <div className="space-y-6">

                        {/* Passport (optional — document required if number provided) */}
                        <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white">
                            <p className="text-sm font-semibold text-gray-800">Passport (optional)</p>
                            <p className="text-xs text-gray-500">If you enter a passport number, you must also upload a copy of the passport.</p>
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
                                onFileChange={setFile('passport')}
                                showError={showMissing('passport')}
                                errorText="Passport document is required when a passport number is provided."
                            />
                        </div>

                        {/* Driving License */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        <ExpiryDateField value={form.safeguardingExpiry} onChange={setExpiry('safeguardingExpiry')} />

                    </div>
                </div>

                {/* ── Other Certificates ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5 lg:p-6">
                    <SectionHeading title="Other Certificates" />
                    <div className="space-y-3 rounded-xl border border-dashed border-gray-200 bg-white p-4">
                        <label className="text-xs font-semibold text-gray-600">Other Certificates (optional)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input id="otherCertLabel" type="text" placeholder="Certificate label" className="px-3.5 py-3 border border-gray-200 rounded-xl text-sm" />
                            <input id="otherCertFile" type="file" accept="application/pdf,image/jpeg,image/png" className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white" />
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
                                <span>{cert.label} - {cert.file?.name}</span>
                                <button type="button" className="text-red-600" onClick={() => setOtherCertificates((prev) => prev.filter((_, i) => i !== idx))}>Remove</button>
                            </div>
                        ))}
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
                        onClick={() => navigate('/team/users/drivers')}
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
