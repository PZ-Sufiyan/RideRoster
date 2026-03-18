import React, { useState } from 'react';
import {
    MdCheckCircle,
    MdCancel,
    MdInfo,
    MdArrowBack,
    MdBusiness,
    MdLocationOn,
    MdPerson,
    MdDescription,
    MdVisibility,
    MdErrorOutline,
    MdSend,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANY_TYPE_LABELS = {
    sole_trader: 'Sole Trader',
    partnership: 'Partnership',
    ltd:         'Limited Company (Ltd)',
    plc:         'Public Limited Company (PLC)',
    llp:         'Limited Liability Partnership (LLP)',
};

const FLEET_SIZE_LABELS = {
    '1-5':    '1–5 vehicles (Micro)',
    '6-15':   '6–15 vehicles (Small)',
    '16-50':  '16–50 vehicles (Medium)',
    '51-100': '51–100 vehicles (Large)',
    '100+':   '100+ vehicles (Enterprise)',
};

// All documents that must be present before submission
const REQUIRED_DOCS = [
    { key: 'operator_license',                 label: 'Operator License' },
    { key: 'public_liability_insurance',       label: 'Public Liability Insurance' },
    { key: 'certificate_of_incorporation',     label: 'Certificate of Incorporation' },
    { key: 'commercial_insurance_certificate', label: 'Commercial Insurance Certificate' },
];

const OPTIONAL_DOCS = [
    { key: 'vat_certificate',  label: 'VAT Certificate' },
    { key: 'primary_admin_id', label: 'Primary Admin ID' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Section header with icon + title — matches the lock-icon style from original */
const SectionTitle = ({ icon, children }) => (
    <h3 className="text-[15px] font-bold text-[#1e293b] flex items-center gap-2 mb-6">
        <span className="w-5 h-5 bg-[#2f6b8f]/10 text-[#2f6b8f] rounded flex items-center justify-center shrink-0">
            {React.createElement(icon, { size: 13 })}
        </span>
        {children}
    </h3>
);

/** Read-only display field */
const ReviewField = ({ label, value, missing = false, colSpan = 1 }) => (
    <div className={`space-y-1 ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        {missing || !value ? (
            <p className="text-[13px] font-bold text-amber-500 flex items-center gap-1">
                <MdErrorOutline size={14} /> Not provided
            </p>
        ) : (
            <p className="text-[13px] font-semibold text-[#1e293b] wrap-break-word">{value}</p>
        )}
    </div>
);

/** Document status row */
const DocStatusRow = ({ label, doc, required = true }) => {
    const uploaded = !!doc;

    return (
        <div className={[
            'flex items-center justify-between p-3.5 rounded-xl border',
            uploaded
                ? 'bg-green-50/50 border-green-200'
                : required
                    ? 'bg-red-50/30 border-red-200'
                    : 'bg-gray-50 border-gray-200',
        ].join(' ')}>
            <div className="flex items-center gap-3 min-w-0">
                <div className={[
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    uploaded ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400',
                ].join(' ')}>
                    {uploaded
                        ? <MdCheckCircle size={18} />
                        : <MdCancel size={18} />
                    }
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1e293b]">
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </p>
                    {uploaded && (
                        <p className="text-[11px] text-gray-400 truncate">{doc.file_name}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
                {uploaded ? (
                    <>
                        <span className="text-[11px] font-bold text-green-600">Uploaded</span>
                        <button
                            type="button"
                            onClick={() => window.open(doc.file_url, '_blank', 'noopener,noreferrer')}
                            className="p-1.5 text-gray-400 hover:text-[#2f6b8f] hover:bg-blue-50 rounded-lg transition-colors"
                            title="View document"
                        >
                            <MdVisibility size={16} />
                        </button>
                    </>
                ) : (
                    <span className={`text-[11px] font-bold ${required ? 'text-red-500' : 'text-gray-400'}`}>
                        {required ? 'Missing' : 'Not provided'}
                    </span>
                )}
            </div>
        </div>
    );
};

/** Vertical stepper shown beside each review section */
const VerticalStepper = ({ currentStep }) => {
    const steps = [
        { id: 1, label: 'Company Info',    sub: 'Basic & Contact Details' },
        { id: 2, label: 'Admin & Scale',   sub: 'Administrator & Fleet' },
        { id: 3, label: 'Compliance',      sub: 'Documents & Verification' },
        { id: 4, label: 'Review & Submit', sub: 'Final Confirmation' },
    ];

    return (
        <div className="w-full lg:w-65 shrink-0 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm h-fit">
            <div className="relative pl-6 space-y-5">
            <div className="absolute top-2 bottom-4 left-2.5 w-0.5 bg-gray-100 z-0" />
                {steps.map((s) => (
                    <div key={s.id} className="relative z-10 flex items-start bg-white">
                        <div className="absolute -left-6 top-0 bg-white rounded-full">
                            {currentStep > s.id ? (
                                <MdCheckCircle size={20} className="text-green-500" />
                            ) : currentStep === s.id ? (
                                <div className="w-5 h-5 rounded-full border-2 border-[#2f6b8f] flex items-center justify-center text-[9px] text-[#2f6b8f] bg-blue-50 font-bold">
                                    {s.id}
                                </div>
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center text-[9px] text-gray-300 bg-white font-bold">
                                    {s.id}
                                </div>
                            )}
                        </div>
                        <div className="pl-1">
                            <p className={`text-[12px] font-bold leading-tight ${
                                currentStep > s.id ? 'text-green-500'
                                : currentStep === s.id ? 'text-[#2f6b8f]'
                                : 'text-gray-400'
                            }`}>
                                {s.label}
                            </p>
                            <p className={`text-[10px] font-medium mt-0.5 ${
                                currentStep === s.id ? 'text-[#2f6b8f]/70' : 'text-gray-400'
                            }`}>
                                {s.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Admin_Register_Review ────────────────────────────────────────────────────

const Admin_Register_Review = ({ value, onPrev }) => {
    const [submitting, setSubmitting]   = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted]     = useState(false);

    const company   = value?.company   ?? {};
    const admin     = value?.admin     ?? {};
    const documents = value?.documents ?? {};

    // ── Readiness checks ──
    const missingRequiredDocs = REQUIRED_DOCS.filter((d) => !documents[d.key]);
    const isReadyToSubmit = missingRequiredDocs.length === 0
        && company.company_name
        && company.company_registration_number
        && admin.full_name
        && admin.email;

    // ── Submit handler ──
    // Replace the body of this function with your real API call
    // e.g. POST /api/companies with the full `value` payload
    const handleSubmit = async () => {
        if (!isReadyToSubmit) return;
        setSubmitError('');
        setSubmitting(true);
        try {
            // ── TODO: replace with real API call ──────────────────────────────
            // const { data, error } = await supabase
            //   .from('companies')
            //   .insert({ ...company, admin, documents })
            // if (error) throw error
            // ─────────────────────────────────────────────────────────────────
            await new Promise((r) => setTimeout(r, 1500)); // simulate network
            setSubmitted(true);
        } catch (err) {
            setSubmitError(err.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success state ──
    if (submitted) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto">
                    <MdCheckCircle size={40} className="text-green-500" />
                </div>
                <div>
                    <h2 className="text-[24px] font-bold text-[#1e293b]">Registration Submitted!</h2>
                    <p className="text-[15px] text-gray-500 mt-2 leading-relaxed">
                        Your company registration for{' '}
                        <span className="font-bold text-[#1e293b]">{company.company_name}</span> has
                        been submitted for review. You'll receive a confirmation email at{' '}
                        <span className="font-bold text-[#1e293b]">{admin.email || company.company_email}</span>{' '}
                        within 24–48 hours.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#2f6b8f] rounded-xl text-[13px] font-bold">
                    <MdInfo size={16} /> Reference: {Date.now().toString(36).toUpperCase()}
                </div>
            </div>
        );
    }

    // ── Render ──
    return (
        <div className="space-y-6">

            {/* Sub-header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[20px] font-bold text-[#1e293b] tracking-tight">
                        Company Registration Request
                    </h2>
                    <p className="text-[14px] text-gray-500 mt-1">
                        Review all details carefully before submitting.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isReadyToSubmit || submitting}
                    title={!isReadyToSubmit ? 'Complete all required fields and upload all documents first' : undefined}
                    className={[
                        'flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-[14px] font-bold transition-all shadow-sm',
                        isReadyToSubmit && !submitting ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed',
                    ].join(' ')}
                    style={{ backgroundColor: '#45818e' }}
                >
                    {submitting
                        ? <><AiOutlineLoading3Quarters size={16} className="animate-spin" /> Submitting…</>
                        : <><MdSend size={16} /> Submit for Review</>
                    }
                </button>
            </div>

            {/* Global readiness warning */}
            {!isReadyToSubmit && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <MdErrorOutline size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[13px] font-bold text-amber-700 mb-1">
                            Cannot submit yet — the following are missing:
                        </p>
                        <ul className="space-y-0.5">
                            {!company.company_name && (
                                <li className="text-[12px] text-amber-600">• Company name (Step 1)</li>
                            )}
                            {!company.company_registration_number && (
                                <li className="text-[12px] text-amber-600">• Company registration number (Step 1)</li>
                            )}
                            {!admin.full_name && (
                                <li className="text-[12px] text-amber-600">• Primary admin name (Step 3)</li>
                            )}
                            {!admin.email && (
                                <li className="text-[12px] text-amber-600">• Primary admin email (Step 3)</li>
                            )}
                            {missingRequiredDocs.map((d) => (
                                <li key={d.key} className="text-[12px] text-amber-600">• {d.label} (Step 1 or 4)</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Submit error */}
            {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <MdErrorOutline size={18} className="text-red-500 shrink-0" />
                    <p className="text-[13px] font-bold text-red-600">{submitError}</p>
                </div>
            )}

            {/* ─── Review Sections ─── */}
            <div className="space-y-10">

                {/* ── SECTION 1: Company Info ── */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <VerticalStepper currentStep={1} />
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm space-y-8">

                        {/* Basic Info */}
                        <div>
                            <SectionTitle icon={MdBusiness}>Basic Company Information</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                <ReviewField label="Company Name"               value={company.company_name} />
                                <ReviewField label="Registration Number"        value={company.company_registration_number} />
                                <ReviewField label="Company Type"               value={COMPANY_TYPE_LABELS[company.company_type] || company.company_type} />
                                <ReviewField label="VAT Number"                 value={company.vat_number || '—'} />
                                <ReviewField label="Primary Business Activity"  value={company.primary_business_activity} colSpan={2} />
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Contact */}
                        <div>
                            <SectionTitle icon={MdLocationOn}>Contact & Address</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                <ReviewField label="Main Email"        value={company.company_email} />
                                <ReviewField label="Main Phone"        value={company.company_phone} />
                                <ReviewField label="Website"           value={company.company_website || '—'} />
                                <ReviewField label="Preferred Language" value={company.company_preferred_language || 'English (UK)'} />
                                <ReviewField label="Registered Address" value={company.company_address} colSpan={2} />
                                <ReviewField label="Operating Address"  value={company.company_operating_address} colSpan={2} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 2: Admin & Scale ── */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <VerticalStepper currentStep={2} />
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                        <SectionTitle icon={MdPerson}>Primary Admin & Fleet Size</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                            <ReviewField label="Admin Full Name"  value={admin.full_name} />
                            <ReviewField label="Admin Email"      value={admin.email} />
                            <ReviewField label="Admin Phone"      value={admin.phone} />
                            <ReviewField label="Fleet Size"       value={FLEET_SIZE_LABELS[company.driver_estimate] || company.driver_estimate} />
                        </div>
                    </div>
                </div>

                {/* ── SECTION 3: Compliance Documents ── */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <VerticalStepper currentStep={3} />
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                        <SectionTitle icon={MdDescription}>Compliance & Legal Documents</SectionTitle>

                        {/* Compliance metadata summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-6">
                            <ReviewField label="Operator Licence No."       value={company.operator_licence_number} />
                            <ReviewField label="Issuing Authority"          value={company.operator_licence_issuing_authority} />
                            <ReviewField label="Corp. Registration No."     value={company.coioe_registration_number} />
                            <ReviewField label="Incorporation Date"         value={company.coioe_issue_date} />
                            <ReviewField label="Insurance Policy No."       value={company.cic_policy_number} />
                            <ReviewField label="Coverage Amount"            value={company.cic_coverage_amount} />
                            <ReviewField label="Insurance Expiry"           value={company.cic_expiry_date} />
                        </div>

                        <div className="h-px bg-gray-100 mb-6" />

                        {/* Required docs */}
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                            Required Documents
                        </p>
                        <div className="space-y-2 mb-6">
                            {REQUIRED_DOCS.map((d) => (
                                <DocStatusRow
                                    key={d.key}
                                    label={d.label}
                                    doc={documents[d.key]}
                                    required
                                />
                            ))}
                        </div>

                        {/* Optional docs — only show if at least one was uploaded */}
                        {OPTIONAL_DOCS.some((d) => documents[d.key]) && (
                            <>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                                    Optional Documents
                                </p>
                                <div className="space-y-2">
                                    {OPTIONAL_DOCS.filter((d) => documents[d.key]).map((d) => (
                                        <DocStatusRow
                                            key={d.key}
                                            label={d.label}
                                            doc={documents[d.key]}
                                            required={false}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── SECTION 4: Final Submit ── */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <VerticalStepper currentStep={4} />
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                        <h2 className="text-[15px] font-bold text-[#1e293b] mb-6">Final Confirmation</h2>

                        {/* Quick summary table */}
                        <div className="space-y-0 divide-y divide-gray-100 mb-6">
                            {[
                                { label: 'Company Name',     value: company.company_name },
                                { label: 'Registration No.', value: company.company_registration_number },
                                { label: 'Primary Admin',    value: admin.full_name },
                                { label: 'Admin Email',      value: admin.email },
                                { label: 'Fleet Size',       value: FLEET_SIZE_LABELS[company.driver_estimate] || company.driver_estimate },
                                { label: 'Docs Uploaded',    value: `${REQUIRED_DOCS.filter((d) => documents[d.key]).length} / ${REQUIRED_DOCS.length} required` },
                            ].map(({ label, value: v }) => (
                                <div key={label} className="flex items-center justify-between py-3">
                                    <span className="text-[12px] font-bold text-gray-400">{label}</span>
                                    <span className={`text-[13px] font-bold ${v ? 'text-[#1e293b]' : 'text-amber-500'}`}>
                                        {v || 'Not provided'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Info alert */}
                        <div className="p-4 bg-blue-50/60 rounded-xl flex items-start gap-2 border border-blue-100 mb-8">
                            <MdInfo size={16} className="text-[#45818e] shrink-0 mt-0.5" />
                            <p className="text-[12px] text-[#45818e] font-bold leading-relaxed">
                                Once submitted, your registration will be reviewed within 24–48 hours.
                                You cannot edit this submission after it is sent. Make sure all information
                                is accurate before proceeding.
                            </p>
                        </div>

                        {/* Footer actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
                                onClick={handleSubmit}
                                disabled={!isReadyToSubmit || submitting}
                                title={!isReadyToSubmit ? 'Complete all required steps first' : undefined}
                                className={[
                                    'flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-[14px] font-bold transition-all shadow-sm',
                                    isReadyToSubmit && !submitting ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed',
                                ].join(' ')}
                                style={{ backgroundColor: '#45818e' }}
                            >
                                {submitting
                                    ? <><AiOutlineLoading3Quarters size={16} className="animate-spin" /> Submitting…</>
                                    : <><MdSend size={16} /> Submit to Approval</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Admin_Register_Review;
