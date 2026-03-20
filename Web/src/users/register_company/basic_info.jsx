import React, { useMemo, useRef, useState } from 'react';
import {
    MdInfoOutline,
    MdFileUpload,
    MdCheck,
    MdVisibility,
    MdDeleteOutline,
    MdKeyboardArrowDown,
    MdErrorOutline,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import {
    uploadCompanyDocument,
    removeCompanyDocument,
} from '../../services/storageService';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANY_TYPES = [
    { value: 'small', label: 'Small company' },
    { value: 'medium', label: 'Medium company' },
    { value: 'large',         label: 'Large company' },
];

const ACTIVITIES = [
    'General Private Hire',
    'School / SEND Transport',
    'Wheelchair Accessible (WAV)',
    'Corporate / Contract Services',
];

/**
 * ─── BUCKET NAME ──────────────────────────────────────────────────────────────
 * Open Supabase Studio → Storage → and copy the exact bucket name you created.
 * Common mistakes: spaces, capitalisation, hyphens vs underscores.
 * Examples:  'company-documents'  /  'company_documents'  /  'documents'
 *
 * This constant is the single place to fix it.
 */
const EMPTY_COMPANY = Object.freeze({});

// ─── DocumentUploadSlot ───────────────────────────────────────────────────────
/**
 * Self-contained upload row with three visual states:
 *   Idle      → dashed clickable card
 *   Uploading → spinner, card disabled
 *   Uploaded  → solid card with filename + View / Delete actions
 *
 * Stored doc shape: { file_name, file_path, file_url, bucket }
 */
const DocumentUploadSlot = ({
    label,
    hint,
    docKey,
    documentType,
    value,
    onChange,
    tempCompanyId,
    required = false,
    showError = false,   // controlled by parent — show "required" error after submit attempt
}) => {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const doc = value?.documents?.[docKey] ?? null;

    const setDoc = (docData) =>
        onChange((prev) => ({
            ...prev,
            documents: { ...prev.documents, [docKey]: docData },
        }));

    // ── Upload ──
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selection of same file after delete
        if (!file) return;

        setUploadError('');
        setUploading(true);
        try {
            const result = await uploadCompanyDocument({
                companyId: tempCompanyId,
                documentType,
                file,
            });
            setDoc(result);
        } catch (err) {
            // Surface the raw error so the developer can see the exact bucket/permission message
            setUploadError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!doc) return;
        setUploadError('');
        setUploading(true);
        try {
            await removeCompanyDocument({ filePath: doc.file_path, bucket: doc.bucket });
            setDoc(null);
        } catch (err) {
            setUploadError(err.message || 'Could not remove file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // ── View ──
    const handleView = () => {
        if (doc?.file_url) window.open(doc.file_url, '_blank', 'noopener,noreferrer');
    };

    // Show "required" nudge when parent triggers validation and doc is missing
    const showRequiredError = showError && required && !doc && !uploading;

    return (
        <div className="space-y-1.5">
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
            />

            {!doc ? (
                // ── Idle / not uploaded ──
                <div
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={[
                        'border border-dashed rounded-2xl p-5 flex items-center justify-between transition-colors',
                        showRequiredError ? 'border-red-300 bg-red-50/30' : 'border-gray-300',
                        uploading
                            ? 'opacity-60 cursor-wait'
                            : 'hover:bg-gray-50 cursor-pointer group',
                    ].join(' ')}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white border border-gray-100 shrink-0">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-[#1e293b]">
                                {label}
                                {required && <span className="text-red-500 ml-0.5">*</span>}
                            </h3>
                            <p className="text-[12px] text-gray-400 font-medium mt-0.5">{hint}</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#2f6b8f] bg-blue-50/50 shrink-0">
                        {uploading
                            ? <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                            : <MdFileUpload size={20} />
                        }
                    </div>
                </div>
            ) : (
                // ── Uploaded ──
                <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-500 flex items-center justify-center border border-green-100 shrink-0">
                            {uploading
                                ? <AiOutlineLoading3Quarters size={18} className="animate-spin text-gray-400" />
                                : <MdCheck size={20} />
                            }
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-[#1e293b]">
                                {label}
                                {required && <span className="text-red-500 ml-0.5">*</span>}
                            </h3>
                            <p className="text-[12px] text-gray-400 font-medium mt-0.5 truncate">
                                {doc.file_name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 shrink-0 ml-3">
                        <button
                            type="button"
                            onClick={handleView}
                            disabled={uploading}
                            title="View document"
                            className="p-1.5 hover:text-[#2f6b8f] transition-colors disabled:opacity-40 rounded-lg hover:bg-blue-50"
                        >
                            <MdVisibility size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={uploading}
                            title="Remove document"
                            className="p-1.5 hover:text-red-500 transition-colors disabled:opacity-40 rounded-lg hover:bg-red-50"
                        >
                            {uploading
                                ? <AiOutlineLoading3Quarters size={18} className="animate-spin" />
                                : <MdDeleteOutline size={20} />
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* Upload / delete error */}
            {uploadError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500 font-bold pl-1 pt-0.5">
                    <MdErrorOutline size={13} /> {uploadError}
                </p>
            )}

            {/* Required-but-missing error (triggered by parent on submit attempt) */}
            {showRequiredError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500 font-bold pl-1 pt-0.5">
                    <MdErrorOutline size={13} /> This document is required before continuing.
                </p>
            )}
        </div>
    );
};

// ─── Admin_Register_BasicInfo ─────────────────────────────────────────────────

const Admin_Register_BasicInfo = ({ value, onChange, onNext, tempCompanyId }) => {
    const [touched, setTouched] = useState({});
    // Tracks whether user has attempted to proceed (triggers doc-required errors)
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const company = useMemo(() => value?.company ?? EMPTY_COMPANY, [value?.company]);
    const documents = value?.documents ?? {};

    // ── Field validation ──
    const fieldErrors = useMemo(() => {
        const e = {};
        if (!company.company_name?.trim())
            e.company_name = 'Company name is required';
        if (!company.company_registration_number?.trim())
            e.company_registration_number = 'Registration number is required';
        if (!company.company_type?.trim())
            e.company_type = 'Company type is required';
        if (!company.primary_business_activity?.trim())
            e.primary_business_activity = 'Primary business activity is required';
        return e;
    }, [company]);

    // ── Document validation ──
    // Both docs are required before the user can proceed
    const docsValid =
        documents.operator_license != null &&
        documents.public_liability_insurance != null;

    const canContinue = Object.keys(fieldErrors).length === 0 && docsValid;

    // ── Helpers ──
    const setCompanyField = (field, v) =>
        onChange((prev) => ({ ...prev, company: { ...prev.company, [field]: v } }));

    const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

    const touchAll = () =>
        setTouched({
            company_name: true,
            company_registration_number: true,
            company_type: true,
            primary_business_activity: true,
        });

    const onContinue = () => {
        touchAll();
        setSubmitAttempted(true);
        if (canContinue) onNext();
    };

    // ── Dynamic class builders ──
    const inputClass = (key) =>
        [
            'w-full px-4 py-3 bg-white border rounded-xl text-[14px] text-gray-900',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all',
            touched[key] && fieldErrors[key]
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
        ].join(' ');

    const selectClass = (key) =>
        [
            'w-full px-4 py-3 bg-white border rounded-xl text-[14px] text-gray-900',
            'focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer',
            touched[key] && fieldErrors[key]
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
        ].join(' ');

    const fieldError = (key) =>
        touched[key] && fieldErrors[key] ? (
            <p className="flex items-center gap-1 text-[12px] text-red-500 font-bold mt-1">
                <MdErrorOutline size={13} /> {fieldErrors[key]}
            </p>
        ) : null;

    // ── Render ──
    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left Column ── */}
            <div className="flex-1 space-y-6 min-w-0">

                {/* Basic Company Information */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[20px] font-bold text-[#1e293b]">Basic Company Information</h2>
                        <span className="px-3 py-1 bg-blue-50 text-[#2f6b8f] rounded-lg text-[12px] font-bold">
                            Step 1 of 5
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">

                        {/* Company Name */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Legal trading name"
                                value={company.company_name || ''}
                                onChange={(e) => setCompanyField('company_name', e.target.value)}
                                onBlur={() => touch('company_name')}
                                className={inputClass('company_name')}
                            />
                            {fieldError('company_name')}
                            <p className="text-[12px] text-gray-400 font-medium">
                                Official name as registered with regulatory bodies.
                            </p>
                        </div>

                        {/* Registration Number */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Company Registration Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 12345678"
                                value={company.company_registration_number || ''}
                                onChange={(e) => setCompanyField('company_registration_number', e.target.value)}
                                onBlur={() => touch('company_registration_number')}
                                className={inputClass('company_registration_number')}
                            />
                            {fieldError('company_registration_number')}
                            <p className="text-[12px] text-gray-400 font-medium">
                                UK Companies House number or equivalent.
                            </p>
                        </div>

                        {/* Company Type */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Company Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={company.company_type || ''}
                                    onChange={(e) => setCompanyField('company_type', e.target.value)}
                                    onBlur={() => touch('company_type')}
                                    className={selectClass('company_type')}
                                >
                                    <option value="">Select Type</option>
                                    {COMPANY_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                            </div>
                            {fieldError('company_type')}
                        </div>

                        {/* VAT Number */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                VAT Number{' '}
                                <span className="text-gray-400 font-normal text-[13px]">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="GB 123 4567 89"
                                value={company.vat_number || ''}
                                onChange={(e) => setCompanyField('vat_number', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f] transition-all"
                            />
                        </div>

                        {/* Primary Business Activity */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Business Activity <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={company.primary_business_activity || ''}
                                    onChange={(e) => setCompanyField('primary_business_activity', e.target.value)}
                                    onBlur={() => touch('primary_business_activity')}
                                    className={selectClass('primary_business_activity')}
                                >
                                    <option value="">Select Activity</option>
                                    {ACTIVITIES.map((a) => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                                <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                            </div>
                            {fieldError('primary_business_activity')}
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="mt-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#2f6b8f] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <MdInfoOutline size={14} />
                        </div>
                        <p className="text-[13px] text-[#2f6b8f] font-medium leading-relaxed">
                            Selecting "School / SEND Transport" will trigger mandatory enhanced DBS and
                            safeguarding document requirements in Step 4.
                        </p>
                    </div>
                </div>

                {/* Document Verification */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-[20px] font-bold text-[#1e293b] mb-1">
                        Initial Document Verification
                    </h2>
                    <p className="text-[13px] text-gray-400 font-medium mb-6">
                        Both documents are required before continuing. Accepted: PDF, JPG, PNG — max 10 MB.
                    </p>

                    <div className="space-y-4">
                        <DocumentUploadSlot
                            label="Operator License"
                            hint="Upload valid O-License copy (PDF, JPG)"
                            docKey="operator_license"
                            documentType="operator_license"
                            value={value}
                            onChange={onChange}
                                tempCompanyId={tempCompanyId}
                            required
                            showError={submitAttempted}
                        />
                        <DocumentUploadSlot
                            label="Public Liability Insurance"
                            hint="Current year insurance certificate (PDF, JPG)"
                            docKey="public_liability_insurance"
                            documentType="public_liability_insurance"
                            value={value}
                            onChange={onChange}
                                tempCompanyId={tempCompanyId}
                            required
                            showError={submitAttempted}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-end pt-4 pb-10">
                    <button
                        onClick={onContinue}
                        disabled={!canContinue}
                        title={!canContinue ? 'Please complete all required fields and upload both documents' : undefined}
                        className={[
                            'px-6 py-3 text-white rounded-xl text-[14px] font-bold transition-all shadow-sm',
                            canContinue ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed',
                        ].join(' ')}
                        style={{ backgroundColor: '#2f6b8f' }}
                    >
                        Next: Contact & Address →
                    </button>
                </div>
            </div>

            {/* ── Right Column: Sidebar ── */}
            <div className="w-full lg:w-[320px] shrink-0">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                        Onboarding Progress
                    </h3>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[13px] text-gray-500 font-medium">Profile Completion</span>
                            <span className="text-[13px] font-bold text-[#1e293b]">20%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-[#2f6b8f] h-2 rounded-full" style={{ width: '20%' }} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                                <MdCheck size={12} />
                            </div>
                            <span className="text-[13px] font-bold text-[#22c55e]">Basic Info Started</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
                            <span className="text-[13px] font-medium text-gray-400">Contact Details Pending</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
                            <span className="text-[13px] font-medium text-gray-400">Compliance Documents</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Register_BasicInfo;