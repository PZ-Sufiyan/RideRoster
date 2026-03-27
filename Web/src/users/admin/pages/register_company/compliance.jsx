import React, { useMemo, useRef, useState } from 'react';
import {
    MdInfo,
    MdCheckCircle,
    MdVisibility,
    MdDeleteOutline,
    MdAccessTime,
    MdCloudUpload,
    MdCreditCard,
    MdAttachFile,
    MdAdd,
    MdDateRange,
    MdArrowBack,
    MdArrowForward,
    MdErrorOutline,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import {
    uploadCompanyDocument,
    removeCompanyDocument,
} from '../../../../services/storageService';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_COMPANY = Object.freeze({});
const EMPTY_DOCUMENTS = Object.freeze({});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a status badge from whether the doc file is uploaded + required fields filled */
function deriveStatus(docUploaded, requiredFieldsFilled) {
    if (docUploaded && requiredFieldsFilled) return 'verified';
    if (docUploaded && !requiredFieldsFilled) return 'pending';
    return 'incomplete';
}

const STATUS_BADGE = {
    verified: (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[11px] font-bold tracking-wide uppercase">
            <MdCheckCircle size={14} /> Verified
        </div>
    ),
    pending: (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-[11px] font-bold tracking-wide uppercase border border-yellow-100">
            <MdAccessTime size={14} /> Pending Review
        </div>
    ),
    incomplete: (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold tracking-wide uppercase">
            Incomplete
        </div>
    ),
    optional: (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[11px] font-bold tracking-wide uppercase border border-slate-100">
            Optional
        </div>
    ),
};

// ─── FileUploadZone ───────────────────────────────────────────────────────────
/**
 * Reusable upload zone used inside each document block.
 * Handles upload, delete, view — stores result shape { file_name, file_path, file_url, bucket }
 */
const FileUploadZone = ({
    docKey,
    documentType,
    value,
    onChange,
    showError = false,
    tempCompanyId,
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

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
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
            setUploadError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

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

    const handleView = () => {
        if (doc?.file_url) window.open(doc.file_url, '_blank', 'noopener,noreferrer');
    };

    const showRequiredError = showError && !doc && !uploading;

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
                // ── Upload zone ──
                <div
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={[
                        'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors',
                        uploading ? 'opacity-60 cursor-wait' : 'hover:bg-gray-50 cursor-pointer group',
                        showRequiredError ? 'border-red-300 bg-red-50/20' : 'border-gray-200',
                    ].join(' ')}
                >
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {uploading
                            ? <AiOutlineLoading3Quarters size={22} className="animate-spin" />
                            : <MdCloudUpload size={24} />
                        }
                    </div>
                    <h4 className="text-[14px] font-bold text-[#1e293b]">
                        {uploading ? 'Uploading…' : 'Click to upload or drag and drop'}
                    </h4>
                    <p className="text-[12px] text-gray-400 font-medium mt-1">PDF, JPG or PNG (max. 10 MB)</p>
                </div>
            ) : (
                // ── Uploaded file row ──
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-red-100 text-red-500 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {doc.file_name?.split('.').pop()?.toUpperCase().slice(0, 3) || 'DOC'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#1e293b] truncate">{doc.file_name}</p>
                            <p className="text-[12px] text-gray-500 font-medium">Uploaded successfully</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 shrink-0 ml-3">
                        <button
                            type="button"
                            onClick={handleView}
                            disabled={uploading}
                            title="View document"
                            className="p-1.5 hover:text-[#2f6b8f] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                            <MdVisibility size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={uploading}
                            title="Remove document"
                            className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                            {uploading
                                ? <AiOutlineLoading3Quarters size={16} className="animate-spin" />
                                : <MdDeleteOutline size={18} />
                            }
                        </button>
                    </div>
                </div>
            )}

            {uploadError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500 font-bold pl-1">
                    <MdErrorOutline size={13} /> {uploadError}
                </p>
            )}
            {showRequiredError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500 font-bold pl-1">
                    <MdErrorOutline size={13} /> Document upload is required before continuing.
                </p>
            )}
        </div>
    );
};

// ─── OptionalDocSlot ──────────────────────────────────────────────────────────
/**
 * Sidebar optional document — collapses to an upload zone when expanded.
 */
const OptionalDocSlot = ({
    label,
    description,
    docKey,
    documentType,
    value,
    onChange,
    tempCompanyId,
}) => {
    const [expanded, setExpanded] = useState(false);
    const doc = value?.documents?.[docKey] ?? null;

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden transition-all">
            <div
                className="p-4 flex items-start gap-4 hover:border-blue-300 cursor-pointer group"
                onClick={() => !doc && setExpanded((p) => !p)}
            >
                <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</h4>
                    <p className="text-[13px] text-gray-400">{description}</p>
                </div>
                {doc ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-500 shrink-0 mt-0.5">
                        <MdCheckCircle size={14} /> Uploaded
                    </span>
                ) : (
                    <button className="text-gray-400 group-hover:text-[#2f6b8f] transition-colors p-1 shrink-0">
                        <MdAdd size={20} />
                    </button>
                )}
            </div>

            {(expanded || doc) && (
                <div className="px-4 pb-4">
                    <FileUploadZone
                        docKey={docKey}
                        documentType={documentType}
                        value={value}
                        onChange={onChange}
                        tempCompanyId={tempCompanyId}
                    />
                </div>
            )}
        </div>
    );
};

// ─── Admin_Register_ComplianceDocs ────────────────────────────────────────────

const Admin_Register_ComplianceDocs = ({ value, onChange, onNext, onPrev, tempCompanyId }) => {
    const [touched, setTouched]                = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const company = useMemo(() => value?.company ?? EMPTY_COMPANY, [value?.company]);
    const documents = useMemo(() => value?.documents ?? EMPTY_DOCUMENTS, [value?.documents]);

    // ── Field setter ──
    const setField = (field, v) =>
        onChange((prev) => ({ ...prev, company: { ...prev.company, [field]: v } }));

    // ── Validation ──
    const errors = useMemo(() => {
        const e = {};
        // Company registration block
        if (!company.coioe_registration_number?.trim())
            e.coioe_registration_number = 'Registration number is required';
        if (!company.coioe_issue_date?.trim())
            e.coioe_issue_date = 'Issue date is required';
        if (!documents.certificate_of_incorporation)
            e.certificate_of_incorporation = 'Document upload required';
        return e;
    }, [company, documents]);

    const canContinue = Object.keys(errors).length === 0;

    // ── Touch helpers ──
    const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

    const touchAll = () =>
        setTouched({
            coioe_registration_number: true,
            coioe_issue_date: true,
            certificate_of_incorporation: true,
        });

    const onContinue = () => {
        touchAll();
        setSubmitAttempted(true);
        if (canContinue) onNext();
    };

    const showErr = (key) => (touched[key] || submitAttempted) && errors[key];

    // ── Class builders ──
    const inputClass = (key) =>
        [
            'w-full px-4 py-2.5 bg-white border rounded-xl text-[14px] text-gray-900',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all',
            showErr(key)
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
        ].join(' ');

    const renderFieldError = (k) =>
        showErr(k) ? (
            <p className="flex items-center gap-1 text-[11px] text-red-500 font-bold mt-1">
                <MdErrorOutline size={12} /> {errors[k]}
            </p>
        ) : null;

    // ── Derived doc counts for the header badge ──
    const requiredDocKeys = ['certificate_of_incorporation'];
    const uploadedCount = requiredDocKeys.filter((k) => documents[k]).length;
    const totalRequired = requiredDocKeys.length;

    // ── Per-block status ──
    const coioeStatus = deriveStatus(
        !!documents.certificate_of_incorporation,
        !!(company.coioe_registration_number && company.coioe_issue_date),
    );
    const cicStatus = useMemo(() => {
        const doc = !!documents.commercial_insurance_certificate;
        const policy = company.cic_policy_number?.trim();
        const coverage = company.cic_coverage_amount?.trim();
        const expiry = company.cic_expiry_date?.trim();
        const anyInput = !!(policy || coverage || expiry);
        if (!doc && !anyInput) return 'optional';
        return deriveStatus(doc, !!(policy && coverage && expiry));
    }, [company, documents]);

    const operatorStatus = useMemo(() => {
        const num = company.operator_licence_number?.trim();
        const auth = company.operator_licence_issuing_authority?.trim();
        if (!num && !auth) return 'optional';
        if (num && auth) return 'verified';
        return 'pending';
    }, [company]);

    // ── Render ──
    return (
        <div className="space-y-6">

            {/* Sub-header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[22px] font-bold text-[#1e293b]">Compliance & Legal Documents</h2>
                    <p className="text-[15px] text-gray-500 mt-1">Upload and verify mandatory business documentation.</p>
                </div>
                <div className={[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold',
                    uploadedCount === totalRequired
                        ? 'bg-green-50 text-green-600'
                        : 'bg-blue-50 text-[#2f6b8f]',
                ].join(' ')}>
                    <MdInfo size={16} />
                    {uploadedCount} of {totalRequired} Required Docs Uploaded
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* ── Left Column: Required Documents ── */}
                <div className="flex-1 space-y-6 min-w-0">

                    {/* ── 1. Company Registration ── */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2f6b8f] flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#1e293b]">Proof of Company Registration <span className="text-red-500">*</span></h3>
                                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">Certificate of Incorporation or equivalent</p>
                                </div>
                            </div>
                            {STATUS_BADGE[coioeStatus]}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Registration Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. UK-99281720"
                                    value={company.coioe_registration_number || ''}
                                    onChange={(e) => setField('coioe_registration_number', e.target.value)}
                                    onBlur={() => touch('coioe_registration_number')}
                                    className={inputClass('coioe_registration_number')}
                                />
                                {renderFieldError('coioe_registration_number')}
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Issue Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={company.coioe_issue_date || ''}
                                        onChange={(e) => setField('coioe_issue_date', e.target.value)}
                                        onBlur={() => touch('coioe_issue_date')}
                                        className={inputClass('coioe_issue_date')}
                                    />
                                    <MdDateRange className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                                {renderFieldError('coioe_issue_date')}
                            </div>
                        </div>

                        <FileUploadZone
                            docKey="certificate_of_incorporation"
                            documentType="certificate_of_incorporation"
                            value={value}
                            onChange={onChange}
                            showError={submitAttempted}
                            tempCompanyId={tempCompanyId}
                        />
                    </div>

                    {/* ── 2. Commercial Insurance Certificate ── */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-400 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#1e293b]">Commercial Insurance Certificate</h3>
                                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">Public liability & motor fleet coverage</p>
                                </div>
                            </div>
                            {STATUS_BADGE[cicStatus]}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Policy Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. POL-882190"
                                    value={company.cic_policy_number || ''}
                                    onChange={(e) => setField('cic_policy_number', e.target.value)}
                                    onBlur={() => touch('cic_policy_number')}
                                    className={inputClass('cic_policy_number')}
                                />
                                {renderFieldError('cic_policy_number')}
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Coverage Amount (£)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. £5,000,000"
                                    value={company.cic_coverage_amount || ''}
                                    onChange={(e) => setField('cic_coverage_amount', e.target.value)}
                                    onBlur={() => touch('cic_coverage_amount')}
                                    className={inputClass('cic_coverage_amount')}
                                />
                                {renderFieldError('cic_coverage_amount')}
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Expiry Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={company.cic_expiry_date || ''}
                                        onChange={(e) => setField('cic_expiry_date', e.target.value)}
                                        onBlur={() => touch('cic_expiry_date')}
                                        className={inputClass('cic_expiry_date')}
                                    />
                                    <MdDateRange className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                                {renderFieldError('cic_expiry_date')}
                            </div>
                        </div>

                        <FileUploadZone
                            docKey="commercial_insurance_certificate"
                            documentType="commercial_insurance_certificate"
                            value={value}
                            onChange={onChange}
                            tempCompanyId={tempCompanyId}
                        />
                    </div>

                    {/* ── 3. Operator Licence ── */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2f6b8f] flex items-center justify-center shrink-0">
                                    <MdCreditCard size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#1e293b]">Operator Licence Proof</h3>
                                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                                        Required to operate commercial transport legally
                                    </p>
                                </div>
                            </div>
                            {STATUS_BADGE[operatorStatus]}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Licence Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter licence ID"
                                    value={company.operator_licence_number || ''}
                                    onChange={(e) => setField('operator_licence_number', e.target.value)}
                                    onBlur={() => touch('operator_licence_number')}
                                    className={inputClass('operator_licence_number')}
                                />
                                {renderFieldError('operator_licence_number')}
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Issuing Authority
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. TfL / Local Council"
                                    value={company.operator_licence_issuing_authority || ''}
                                    onChange={(e) => setField('operator_licence_issuing_authority', e.target.value)}
                                    onBlur={() => touch('operator_licence_issuing_authority')}
                                    className={inputClass('operator_licence_issuing_authority')}
                                />
                                {renderFieldError('operator_licence_issuing_authority')}
                            </div>
                        </div>
                    </div>

                    {/* ── Navigation ── */}
                    <div className="flex items-center justify-between pt-4 pb-10">
                        <button
                            type="button"
                            onClick={onPrev}
                            className="flex items-center gap-2 text-[#2f6b8f] font-bold text-[14px] hover:text-[#1a3f55] hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
                        >
                            <MdArrowBack size={18} />
                            Previous Step
                        </button>
                        <button
                            type="button"
                            onClick={onContinue}
                            disabled={!canContinue}
                            title={!canContinue ? 'Please complete company registration details and upload the certificate of incorporation' : undefined}
                            className={[
                                'flex items-center gap-2 px-6 py-3 text-white rounded-xl text-[14px] font-bold transition-all shadow-sm',
                                canContinue ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed',
                            ].join(' ')}
                            style={{ backgroundColor: '#2f6b8f' }}
                        >
                            Next: Review
                            <MdArrowForward size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Right Column: Optional Documents ── */}
                <div className="w-full lg:w-90 shrink-0">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
                        <div className="flex items-center gap-2 mb-6 text-[#1e293b]">
                            <MdAttachFile size={20} />
                            <h3 className="text-[15px] font-bold">Optional Documents</h3>
                        </div>
                        <p className="text-[12px] text-gray-400 mb-4">
                            These are not required but may speed up your approval.
                        </p>

                        <div className="space-y-3">
                            <OptionalDocSlot
                                label="VAT Certificate"
                                description="Proof of HMRC registration for tax-exempt services."
                                docKey="vat_certificate"
                                documentType="vat_certificate"
                                value={value}
                                onChange={onChange}
                                tempCompanyId={tempCompanyId}
                            />
                            <OptionalDocSlot
                                label="Primary Admin ID"
                                description="Passport or Driving Licence for primary account verification."
                                docKey="primary_admin_id"
                                documentType="primary_admin_id"
                                value={value}
                                onChange={onChange}
                                tempCompanyId={tempCompanyId}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Register_ComplianceDocs;