import React, {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdCloudUpload,
    MdDeleteOutline,
    MdPeople,
    MdPersonOutline,
    MdFileUpload,
    MdCheck,
    MdVisibility,
    MdInfoOutline,
} from 'react-icons/md';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { PA_DOCUMENT_TYPES } from '../../../../../services/passengerAsssistantService';
import {
    getPAEditData,
    updatePAWithRecords,
    deleteOtherCertificate,
} from '../../../../../services/paEditService';
import { ToastStack } from '../../../../../utils/Toast';
import { ShimmerBlock, LoadingStatus } from '../../../../../utils/Shimmer';

// ─── Reusable: Form Field ─────────────────────────────────────
const FormField = ({
    label, required, placeholder, value, onChange,
    type = 'text', className = '', showError = false,
    errorText = 'This field is required.', disabled = false,
}) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-sm font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors bg-white
                ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : ''}
                ${showError && !disabled
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-[#005580] focus:ring-[#005580]'
                }`}
        />
        {showError && !disabled && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Section Wrapper ──────────────────────────────────────────
const Section = ({ title, subtitle, children }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="px-6 py-5">{children}</div>
    </div>
);

// ─── Document Slot (edit-aware) ───────────────────────────────
// Three states:
//   1. existingUrl only  → green check, "View Current" + "Replace"
//   2. newFile selected  → green check with file name, "View" + "Change" + "Revert"
//   3. neither           → empty dashed upload prompt
const DocumentSlot = ({ label, hint, newFile, existingUrl, onFile, onRemove }) => {
    const inputRef = useRef(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

    const hasNew = newFile instanceof File;
    const hasExisting = !!existingUrl && !hasNew;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setLocalPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        onFile(file);
    };

    const handleViewNew = () => {
        if (localPreviewUrl) window.open(localPreviewUrl, '_blank', 'noopener,noreferrer');
        else if (newFile instanceof File) {
            const url = URL.createObjectURL(newFile);
            setLocalPreviewUrl(url);
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleRemove = () => {
        setLocalPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
        onRemove();
    };

    useEffect(() => {
        if (!newFile) {
            setLocalPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
        }
        return () => setLocalPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-1.5">
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            {hasNew ? (
                // New local file selected
                <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-500 flex items-center justify-center border border-green-100 shrink-0">
                            <MdCheck size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-gray-800">{label}</h3>
                            <p className="text-[12px] text-green-600 font-medium mt-0.5 truncate">{newFile.name}</p>
                            <p className="text-[11px] text-gray-400">Will replace existing on save</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={handleViewNew} title="Preview new file"
                            className="p-1.5 text-gray-400 hover:text-[#005580] transition-colors rounded-lg hover:bg-blue-50">
                            <MdVisibility size={20} />
                        </button>
                        <button type="button" onClick={() => inputRef.current?.click()} title="Choose different file"
                            className="p-1.5 text-gray-400 hover:text-[#005580] transition-colors rounded-lg hover:bg-blue-50">
                            <MdCloudUpload size={20} />
                        </button>
                        <button type="button" onClick={handleRemove} title="Revert to existing"
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <MdDeleteOutline size={20} />
                        </button>
                    </div>
                </div>
            ) : hasExisting ? (
                // Existing saved file
                <div className="border border-green-100 bg-green-50/30 rounded-2xl p-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-500 flex items-center justify-center border border-green-100 shrink-0">
                            <MdCheck size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-gray-800">{label}</h3>
                            <p className="text-[12px] text-gray-400 font-medium mt-0.5">Document on file — click Replace to upload new</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => window.open(existingUrl, '_blank', 'noopener,noreferrer')}
                            title="View current document"
                            className="p-1.5 text-gray-400 hover:text-[#005580] transition-colors rounded-lg hover:bg-blue-50">
                            <MdVisibility size={20} />
                        </button>
                        <button type="button" onClick={() => inputRef.current?.click()}
                            title="Replace document"
                            className="px-2.5 py-1.5 text-[12px] font-semibold text-[#005580] hover:bg-blue-50 rounded-lg transition-colors">
                            Replace
                        </button>
                    </div>
                </div>
            ) : (
                // No file at all
                <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
                    onClick={() => inputRef.current?.click()}
                    className="border border-dashed border-gray-300 rounded-2xl p-5 flex items-center justify-between transition-colors hover:bg-gray-50 cursor-pointer group"
                >
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white border border-gray-100 shrink-0">
                            <MdFileUpload size={20} className="text-[#005580]" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-gray-800">{label}</h3>
                            <p className="text-[12px] text-gray-400 font-medium mt-0.5">{hint}</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#005580] bg-blue-50/50 shrink-0">
                        <MdCloudUpload size={20} />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────
const EditPA = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Existing data from DB
    const [existingDocs, setExistingDocs] = useState({});
    const [existingAvatarUrl, setExistingAvatarUrl] = useState(null);
    const [existingOtherCerts, setExistingOtherCerts] = useState([]); // DB rows

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        phone: '', address: '', contactName: '', contactPhone: '',
        nationality: '', rightToWork: '', isBritish: false, passportNumber: '',
    });

    const [safeguardingExpiry, setSafeguardingExpiry] = useState('');

    // New files (null = keep existing)
    const [newFiles, setNewFiles] = useState({
        [PA_DOCUMENT_TYPES.PASSPORT]: null,
        [PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE]: null,
        [PA_DOCUMENT_TYPES.BACKGROUND_CHECK]: null,
        [PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE]: null,
    });

    // Avatar
    const avatarRef = useRef();
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    // New other certs to add on save
    const [newOtherCerts, setNewOtherCerts] = useState([]);
    const [otherCertLabel, setOtherCertLabel] = useState('');

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 },
        ]);
    };

    // Blob URL cleanup refs
    const blobsRef = useRef({ avatar: null });
    useLayoutEffect(() => { blobsRef.current.avatar = avatarPreview; });
    useEffect(() => {
        return () => { if (blobsRef.current.avatar) URL.revokeObjectURL(blobsRef.current.avatar); };
    }, []);

    // ── Load ──────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const { pa, docsByType } = await getPAEditData(id);

                setExistingDocs(docsByType);
                setExistingAvatarUrl(pa.profile_picture_url || null);
                setExistingOtherCerts(docsByType[PA_DOCUMENT_TYPES.OTHER_CERTIFICATE] || []);

                const safeguardingDoc = docsByType[PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE];
                setSafeguardingExpiry(safeguardingDoc?.expiry_date?.slice(0, 10) || '');

                setForm({
                    firstName: pa.first_name || '',
                    lastName: pa.surname || '',
                    email: pa.email || '',
                    phone: pa.phone || '',
                    address: pa.residential_address || '',
                    contactName: pa.emergency_contact_name || '',
                    contactPhone: pa.emergency_contact_phone || '',
                    nationality: pa.nationality || '',
                    rightToWork: pa.right_to_work_code || '',
                    isBritish: pa.nationality === 'British',
                    passportNumber: pa.passport_number || '',
                });
            } catch (err) {
                setLoadError(err?.message || 'Failed to load passenger assistant data.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // ── Avatar ────────────────────────────────────────────────
    const handleAvatarChange = (file) => {
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    // ── File helpers ──────────────────────────────────────────
    const setNewFile = (type) => (file) => {
        setNewFiles((prev) => ({ ...prev, [type]: file || null }));
    };

    const clearNewFile = (type) => () => {
        setNewFiles((prev) => ({ ...prev, [type]: null }));
    };

    // ── Validation ────────────────────────────────────────────
    const validateRequired = useCallback(() => {
        setSubmitAttempted(true);
        const missing =
            !form.firstName?.trim() ||
            !form.lastName?.trim() ||
            !form.phone?.trim() ||
            !form.contactName?.trim() ||
            !form.contactPhone?.trim() ||
            !form.nationality?.trim();

        if (missing) {
            pushToast('warning', 'Please fill in all required fields before saving.');
            return false;
        }
        const hasPassportDoc = !!existingDocs[PA_DOCUMENT_TYPES.PASSPORT]?.file_url
            || newFiles[PA_DOCUMENT_TYPES.PASSPORT] instanceof File;
        if (form.passportNumber?.trim() && !hasPassportDoc) {
            pushToast('warning', 'Passport document is required when a passport number is provided.');
            return false;
        }
        const safeguardingNewFile = newFiles[PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE];
        if (safeguardingNewFile && !safeguardingExpiry?.trim()) {
            pushToast('warning', 'Safeguarding expiry is required when uploading a safeguarding certificate.');
            return false;
        }
        if (!form.isBritish && !form.rightToWork?.trim()) {
            pushToast('warning', 'Right to Work is required for non-British passport holders.');
            return false;
        }
        return true;
    }, [form, newFiles, existingDocs, safeguardingExpiry]);

    const showRequired = (value) => submitAttempted && !String(value || '').trim();

    // ── Delete existing other cert ────────────────────────────
    const handleDeleteExistingOtherCert = async (doc) => {
        try {
            await deleteOtherCertificate({ docId: doc.id, fileUrl: doc.file_url });
            setExistingOtherCerts((prev) => prev.filter((d) => d.id !== doc.id));
            pushToast('success', 'Certificate removed.');
        } catch (err) {
            pushToast('error', err?.message || 'Could not remove certificate.');
        }
    };

    // ── Submit ────────────────────────────────────────────────
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

            await updatePAWithRecords({
                assistantId: id,
                companyId: admin.company_id,
                personal: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    address: form.address,
                    contactName: form.contactName,
                    contactPhone: form.contactPhone,
                    nationality: form.nationality,
                    rightToWork: form.isBritish ? '' : form.rightToWork,
                    isBritish: form.isBritish,
                    passportNumber: form.passportNumber,
                },
                expiry: {
                    safeguarding: safeguardingExpiry,
                },
                avatarFile: avatarFile || null,
                existingAvatarUrl,
                files: {
                    ...newFiles,
                    other_certificates: newOtherCerts,
                },
                existingDocs,
            });

            pushToast('success', 'Passenger assistant updated successfully.');
            setTimeout(() => navigate('/portal/users/pa'), 1200);
        } catch (e) {
            const msg = e?.message || 'Could not save changes.';
            setSubmitError(msg);
            pushToast('error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Shared date input classes ─────────────────────────────
    const dateInputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] transition-colors bg-white';
    const dateInputClassError = 'w-full px-3 py-2.5 border border-red-400 rounded-lg text-sm text-red-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors bg-white';

    const showPassportDocError = submitAttempted && form.passportNumber?.trim()
        && !existingDocs[PA_DOCUMENT_TYPES.PASSPORT]?.file_url
        && !(newFiles[PA_DOCUMENT_TYPES.PASSPORT] instanceof File);
    const showSafeguardingExpiryError = submitAttempted && !!newFiles[PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE] && !safeguardingExpiry?.trim();

    // ── Existing doc URLs (for DocumentSlot) ──────────────────
    const existingUrl = (type) => existingDocs[type]?.file_url || null;

    // ── Loading / Error states ────────────────────────────────
    if (loading) {
        return (
            <LoadingStatus label="Loading passenger assistant edit form" className="space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Passenger Assistant</h1>
                    <p className="text-sm text-gray-500 mt-1">Update profile, documents, and contact details.</p>
                </div>
                <div className="space-y-4">
                    <ShimmerBlock className="h-52 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                    <ShimmerBlock className="h-44 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                    <ShimmerBlock className="h-60 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                    <ShimmerBlock className="h-40 rounded-xl border border-gray-100/80" rounded="rounded-xl" />
                </div>
            </LoadingStatus>
        );
    }

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{loadError}</p>
                <button type="button" onClick={() => navigate('/portal/users/pa')} className="text-sm text-[#005580] underline">
                    Back to passenger assistants
                </button>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Passenger Assistant</h1>
                <p className="text-sm text-gray-500 mt-1">Update profile, documents, and contact details.</p>
            </div>

            {/* ── Section 1: Personal Information ── */}
            <Section title="Personal Information" subtitle="Update the basic details of the passenger assistant.">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="First Name" required placeholder="e.g. Jane" value={form.firstName} onChange={set('firstName')} showError={showRequired(form.firstName)} />
                        <FormField label="Last Name" required placeholder="e.g. Doe" value={form.lastName} onChange={set('lastName')} showError={showRequired(form.lastName)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Email Address" type="email" value={form.email} disabled
                            // Email changes require Supabase auth flow
                        />
                        <FormField label="Phone Number" required type="tel" placeholder="e.g. (123) 456-7890" value={form.phone} onChange={set('phone')} showError={showRequired(form.phone)} />
                    </div>
                    <FormField label="Residential Address" placeholder="e.g. 123 Main Street" value={form.address} onChange={set('address')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Nationality" required placeholder="e.g. British, Pakistani" value={form.nationality} onChange={set('nationality')} showError={showRequired(form.nationality)} />
                        <div className="flex items-end">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
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
                                    className="w-4 h-4 accent-[#005580]"
                                />
                                British passport holder (no right to work needed)
                            </label>
                        </div>
                    </div>
                    {!form.isBritish && (
                        <FormField label="Right to Work" required placeholder="Enter right to work code"
                            value={form.rightToWork} onChange={set('rightToWork')} showError={showRequired(form.rightToWork)} />
                    )}
                </div>
            </Section>

            {/* ── Section 2: Profile Picture ── */}
            <Section title="Profile Picture" subtitle="Upload a clear, professional headshot.">
                <div className="flex items-stretch gap-4 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="w-24 shrink-0 bg-gray-100 flex items-center justify-center border-r border-gray-200">
                        {(avatarPreview || existingAvatarUrl) ? (
                            <img
                                src={avatarPreview || existingAvatarUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
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
                        onChange={(e) => { handleAvatarChange(e.target.files[0]); e.target.value = ''; }}
                    />
                </div>
            </Section>

            {/* ── Section 3: Documents & Certifications ── */}
            <Section title="Documents &amp; Certifications"
                subtitle="Documents with a green border are already on file. Click Replace to upload a new version.">
                <div className="space-y-4">

                    {/* Passport — optional number + document (no expiry) */}
                    <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white">
                        <p className="text-sm font-semibold text-gray-800">Passport (optional)</p>
                        <p className="text-xs text-gray-500">If you enter a passport number, you must also have a passport document on file.</p>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Passport number</label>
                            <input
                                type="text"
                                value={form.passportNumber}
                                onChange={set('passportNumber')}
                                placeholder="e.g. AB1234567"
                                className={dateInputClass}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">Document</label>
                            <DocumentSlot
                                label="Passport copy"
                                hint="PDF or image"
                                newFile={newFiles[PA_DOCUMENT_TYPES.PASSPORT]}
                                existingUrl={existingUrl(PA_DOCUMENT_TYPES.PASSPORT)}
                                onFile={setNewFile(PA_DOCUMENT_TYPES.PASSPORT)}
                                onRemove={clearNewFile(PA_DOCUMENT_TYPES.PASSPORT)}
                            />
                            {showPassportDocError && (
                                <p className="text-xs text-red-600 font-medium">Passport document is required when a passport number is provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Safeguarding */}
                    <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white">
                        <p className="text-sm font-semibold text-gray-800">Safeguarding Certificate</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Document</label>
                                <DocumentSlot
                                    label="Safeguarding certificate"
                                    hint="PDF or image"
                                    newFile={newFiles[PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE]}
                                    existingUrl={existingUrl(PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE)}
                                    onFile={setNewFile(PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE)}
                                    onRemove={clearNewFile(PA_DOCUMENT_TYPES.SAFEGUARDING_CERTIFICATE)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Expiry date</label>
                                <input
                                    type="date"
                                    value={safeguardingExpiry}
                                    onChange={(e) => setSafeguardingExpiry(e.target.value)}
                                    className={showSafeguardingExpiryError ? dateInputClassError : dateInputClass}
                                />
                                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MdInfoOutline size={12} className="shrink-0 opacity-70" />
                                    You can update the expiry date without re-uploading the file.
                                </p>
                                {showSafeguardingExpiryError && (
                                    <p className="text-xs text-red-600 font-medium">Expiry date is required when uploading a new safeguarding certificate.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Background Check + First Aid */}
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                        <div className="px-4 py-4 space-y-2">
                            <p className="text-sm font-medium text-gray-800">Background Check Certificate</p>
                            <DocumentSlot
                                label="Upload certificate"
                                hint="PDF or image"
                                newFile={newFiles[PA_DOCUMENT_TYPES.BACKGROUND_CHECK]}
                                existingUrl={existingUrl(PA_DOCUMENT_TYPES.BACKGROUND_CHECK)}
                                onFile={setNewFile(PA_DOCUMENT_TYPES.BACKGROUND_CHECK)}
                                onRemove={clearNewFile(PA_DOCUMENT_TYPES.BACKGROUND_CHECK)}
                            />
                        </div>
                        <div className="px-4 py-4 space-y-2">
                            <p className="text-sm font-medium text-gray-800">First Aid Certification</p>
                            <DocumentSlot
                                label="Upload certification"
                                hint="PDF or image"
                                newFile={newFiles[PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE]}
                                existingUrl={existingUrl(PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE)}
                                onFile={setNewFile(PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE)}
                                onRemove={clearNewFile(PA_DOCUMENT_TYPES.FIRST_AID_CERTIFICATE)}
                            />
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Section 4: Other Certificates ── */}
            <Section title="Other Certificates" subtitle="Existing certificates are shown below. Add new ones or remove as needed.">
                <div className="space-y-3">

                    {/* Existing other certs */}
                    {existingOtherCerts.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Currently on file</p>
                            {existingOtherCerts.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-green-50/50 border border-green-100 rounded-xl">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <MdCheck size={16} className="text-green-500 shrink-0" />
                                        <span className="text-sm text-gray-700 truncate">{doc.file_name || 'Certificate'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button type="button"
                                            onClick={() => window.open(doc.file_url, '_blank', 'noopener,noreferrer')}
                                            className="p-1.5 text-gray-400 hover:text-[#005580] transition-colors rounded-lg hover:bg-blue-50">
                                            <MdVisibility size={16} />
                                        </button>
                                        <button type="button"
                                            onClick={() => handleDeleteExistingOtherCert(doc)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                                            <MdDeleteOutline size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New certs staged for upload */}
                    {newOtherCerts.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Staged for upload</p>
                            {newOtherCerts.map((cert, idx) => (
                                <div key={`${cert.label}-${idx}`} className="flex items-center justify-between gap-2 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                    <span className="text-sm text-gray-700 truncate">{cert.label} — {cert.file?.name}</span>
                                    <button type="button" className="text-xs font-medium text-red-600 hover:text-red-700 shrink-0"
                                        onClick={() => setNewOtherCerts((prev) => prev.filter((_, i) => i !== idx))}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new cert form */}
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 space-y-3">
                        <p className="text-xs font-semibold text-gray-600">Add New Certificate</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                value={otherCertLabel}
                                onChange={(e) => setOtherCertLabel(e.target.value)}
                                placeholder="Certificate name"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#005580]"
                            />
                            <input
                                id="paEditOtherCertFile"
                                type="file"
                                accept="application/pdf,image/jpeg,image/png,image/webp"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            />
                            <button
                                type="button"
                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                onClick={() => {
                                    const fileEl = document.getElementById('paEditOtherCertFile');
                                    const file = fileEl?.files?.[0];
                                    const label = otherCertLabel.trim();
                                    if (!file || !label) {
                                        pushToast('warning', 'Add certificate name and file before staging.');
                                        return;
                                    }
                                    setNewOtherCerts((prev) => [...prev, { label, file }]);
                                    setOtherCertLabel('');
                                    fileEl.value = '';
                                }}
                            >
                                Stage Certificate
                            </button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Section 5: Emergency Contact ── */}
            <Section title="Emergency Contact" subtitle="Update the emergency contact for this assistant.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Contact Full Name" required placeholder="e.g. John Smith"
                        value={form.contactName} onChange={set('contactName')} showError={showRequired(form.contactName)} />
                    <FormField label="Contact Phone Number" required type="tel" placeholder="e.g. (123) 555-0123"
                        value={form.contactPhone} onChange={set('contactPhone')} showError={showRequired(form.contactPhone)} />
                </div>
            </Section>

            {/* ── Footer Actions ── */}
            <div className="space-y-3 pb-2">
                {submitError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {submitError}
                    </p>
                )}
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/portal/users/pa')} disabled={submitting}
                        className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                        <MdPeople size={18} />
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPA;