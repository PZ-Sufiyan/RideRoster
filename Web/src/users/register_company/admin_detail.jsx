import React, { useMemo, useState } from 'react';
import {
    MdArrowBack,
    MdCloudUpload,
    MdSecurity,
    MdOutlineErrorOutline,
    MdClose,
    MdKeyboardArrowDown,
    MdErrorOutline,
    MdCheckCircle,
    MdBusiness,
    MdLocationOn,
    MdEmail,
} from 'react-icons/md';

// ─── Constants ────────────────────────────────────────────────────────────────

const FLEET_SIZES = [
    { value: '1-5',    label: '1–5 vehicles (Micro)' },
    { value: '6-15',   label: '6–15 vehicles (Small)' },
    { value: '16-50',  label: '16–50 vehicles (Medium)' },
    { value: '51-100', label: '51–100 vehicles (Large)' },
    { value: '100+',   label: '100+ vehicles (Enterprise)' },
];

// ─── Validators ───────────────────────────────────────────────────────────────

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[\d\s\-().]{7,20}$/.test(v);

const EMPTY_COMPANY = Object.freeze({});
const EMPTY_ADMIN = Object.freeze({});
const EMPTY_DOCUMENTS = Object.freeze({});

// ─── SummaryRow ───────────────────────────────────────────────────────────────

const SummaryRow = ({ label, value, missing = false }) => (
    <div className="flex justify-between items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-[12px] text-gray-400 font-medium shrink-0">{label}</span>
        {missing || !value ? (
            <span className="text-[12px] text-amber-500 font-bold">Not provided</span>
        ) : (
            <span className="text-[12px] font-bold text-[#1e293b] text-right break-all">{value}</span>
        )}
    </div>
);

// ─── Admin_Register_AdminScale ────────────────────────────────────────────────

const Admin_Register_AdminScale = ({ value, onChange, onNext, onPrev }) => {
    const [touched, setTouched]                = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const company = useMemo(() => value?.company ?? EMPTY_COMPANY, [value?.company]);
    const admin = useMemo(() => value?.admin ?? EMPTY_ADMIN, [value?.admin]);
    const documents = useMemo(() => value?.documents ?? EMPTY_DOCUMENTS, [value?.documents]);

    // ── Field setters ──
    const setAdminField = (field, v) =>
        onChange((prev) => ({ ...prev, admin: { ...prev.admin, [field]: v } }));

    const setCompanyField = (field, v) =>
        onChange((prev) => ({ ...prev, company: { ...prev.company, [field]: v } }));

    // ── Validation ──
    const errors = useMemo(() => {
        const e = {};
        if (!admin.full_name?.trim())
            e.full_name = 'Admin name is required';
        if (!admin.email?.trim())
            e.email = 'Admin email is required';
        else if (!isValidEmail(admin.email))
            e.email = 'Enter a valid email address';
        if (!admin.phone?.trim())
            e.phone = 'Admin phone is required';
        else if (!isValidPhone(admin.phone))
            e.phone = 'Enter a valid phone number';
        if (!company.driver_estimate?.trim())
            e.driver_estimate = 'Fleet size is required';
        return e;
    }, [admin, company]);

    const canContinue = Object.keys(errors).length === 0;

    // ── Touch helpers ──
    const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

    const touchAll = () =>
        setTouched({ full_name: true, email: true, phone: true, driver_estimate: true });

    const onContinue = () => {
        touchAll();
        setSubmitAttempted(true);
        if (canContinue) onNext();
    };

    // ── Whether to show error for a field ──
    const showErr = (key) => (touched[key] || submitAttempted) && errors[key];

    // ── Class builders ──
    const inputClass = (key) =>
        [
            'w-full px-4 py-3 bg-white border rounded-xl text-[14px] text-gray-900',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all',
            showErr(key)
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
        ].join(' ');

    const selectClass = (key) =>
        [
            'w-full px-4 py-3 bg-white border rounded-xl text-[14px] text-gray-900',
            'focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer',
            showErr(key)
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
        ].join(' ');

    const renderFieldError = (k) =>
        showErr(k) ? (
            <p className="flex items-center gap-1 text-[12px] text-red-500 font-bold mt-1">
                <MdErrorOutline size={13} /> {errors[k]}
            </p>
        ) : null;

    // ── Sidebar: derive summary from previous steps ──
    const docsUploaded = [
        documents.operator_license,
        documents.public_liability_insurance,
    ].filter(Boolean).length;

    const docsTotal = 2;

    // Friendly label for company type
    const COMPANY_TYPE_LABELS = {
        sole_trader: 'Sole Trader',
        partnership: 'Partnership',
        ltd:         'Limited Company (Ltd)',
        plc:         'Public Limited Company (PLC)',
        llp:         'LLP',
    };

    // ── Render ──
    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left Column ── */}
            <div className="flex-1 space-y-6 min-w-0">

                {/* Primary Admin & Company Scale */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-[20px] font-bold text-[#1e293b]">Primary Admin & Company Scale</h2>
                        <p className="text-[13px] text-gray-500 mt-1">
                            Identify the master administrator and the operational capacity of the fleet.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

                        {/* Admin Name */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Admin Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. John Doe"
                                value={admin.full_name || ''}
                                onChange={(e) => setAdminField('full_name', e.target.value)}
                                onBlur={() => touch('full_name')}
                                className={inputClass('full_name')}
                            />
                            {renderFieldError('full_name')}
                        </div>

                        {/* Admin Email */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Admin Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                placeholder="admin@company.com"
                                value={admin.email || ''}
                                onChange={(e) => setAdminField('email', e.target.value)}
                                onBlur={() => touch('email')}
                                className={inputClass('email')}
                            />
                            {renderFieldError('email')}
                            <p className="text-[12px] text-gray-400 font-medium italic">
                                Login credentials will be sent to this address upon approval.
                            </p>
                        </div>

                        {/* Admin Phone */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Primary Admin Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="+44 20 7946 0000"
                                value={admin.phone || ''}
                                onChange={(e) => setAdminField('phone', e.target.value)}
                                onBlur={() => touch('phone')}
                                className={inputClass('phone')}
                            />
                            {renderFieldError('phone')}
                        </div>

                        {/* Fleet Size */}
                        <div className="space-y-1.5">
                            <label className="block text-[14px] font-bold text-[#1e293b]">
                                Fleet Size / Driver Estimate <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={company.driver_estimate || ''}
                                    onChange={(e) => setCompanyField('driver_estimate', e.target.value)}
                                    onBlur={() => touch('driver_estimate')}
                                    className={selectClass('driver_estimate')}
                                >
                                    <option value="">Select size</option>
                                    {FLEET_SIZES.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                            </div>
                            {renderFieldError('driver_estimate')}
                            <p className="text-[12px] text-gray-400 font-medium">
                                Used for capacity & onboarding configuration.
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 mt-8 mb-6" />

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
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
                            title={!canContinue ? 'Please fill in all required fields' : undefined}
                            className={[
                                'px-6 py-2.5 text-white rounded-xl text-[14px] font-bold transition-all shadow-sm',
                                canContinue ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed',
                            ].join(' ')}
                            style={{ backgroundColor: '#2f6b8f' }}
                        >
                            Continue to Documents
                        </button>
                    </div>
                </div>

                {/* Compliance Documents — upcoming preview (non-interactive) */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-[20px] font-bold text-[#1e293b]">Compliance Documents</h2>
                            <p className="text-[13px] text-gray-500 mt-1">
                                Upload verifiable business registration and insurance certificates.
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-bold tracking-widest uppercase">
                            Next Step
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-dashed border-gray-200 bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70 pointer-events-none select-none">
                            <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center mb-3">
                                <MdCloudUpload size={20} />
                            </div>
                            <h3 className="text-[14px] font-bold text-gray-400">Business License</h3>
                            <p className="text-[11px] text-gray-400 mt-1">PDF, JPG up to 10 MB</p>
                        </div>
                        <div className="border border-dashed border-gray-200 bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70 pointer-events-none select-none">
                            <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center mb-3">
                                <MdSecurity size={20} />
                            </div>
                            <h3 className="text-[14px] font-bold text-gray-400">Insurance Liability</h3>
                            <p className="text-[11px] text-gray-400 mt-1">Must be valid for current year</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Column: Live Summary Sidebar ── */}
            <div className="w-full lg:w-85 shrink-0">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6 space-y-6">

                    <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">
                        Registration Summary
                    </h3>

                    {/* ── Step 1: Company Info ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MdBusiness size={15} className="text-[#2f6b8f]" />
                            <span className="text-[11px] font-bold text-[#2f6b8f] uppercase tracking-wide">
                                Company Info
                            </span>
                        </div>
                        <div className="space-y-0">
                            <SummaryRow
                                label="Company Name"
                                value={company.company_name}
                            />
                            <SummaryRow
                                label="Reg. Number"
                                value={company.company_registration_number}
                            />
                            <SummaryRow
                                label="Type"
                                value={COMPANY_TYPE_LABELS[company.company_type] || company.company_type}
                            />
                            <SummaryRow
                                label="Activity"
                                value={company.primary_business_activity}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* ── Step 2: Contact ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MdLocationOn size={15} className="text-[#2f6b8f]" />
                            <span className="text-[11px] font-bold text-[#2f6b8f] uppercase tracking-wide">
                                Contact & Address
                            </span>
                        </div>
                        <div className="space-y-0">
                            <SummaryRow
                                label="Email"
                                value={company.company_email}
                            />
                            <SummaryRow
                                label="Phone"
                                value={company.company_phone}
                            />
                            <SummaryRow
                                label="Address"
                                value={
                                    company.company_address
                                        ? company.company_address.split('\n')[0] // first line only
                                        : null
                                }
                            />
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* ── Documents uploaded so far ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MdEmail size={15} className="text-[#2f6b8f]" />
                            <span className="text-[11px] font-bold text-[#2f6b8f] uppercase tracking-wide">
                                Documents
                            </span>
                        </div>

                        <div className="space-y-2">
                            {/* Operator License */}
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-gray-500">Operator License</span>
                                {documents.operator_license ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-500">
                                        <MdCheckCircle size={13} /> Uploaded
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                        <MdOutlineErrorOutline size={13} /> Missing
                                    </span>
                                )}
                            </div>
                            {/* Public Liability Insurance */}
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-gray-500">Public Liability</span>
                                {documents.public_liability_insurance ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-500">
                                        <MdCheckCircle size={13} /> Uploaded
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                        <MdOutlineErrorOutline size={13} /> Missing
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Progress pill */}
                        <div className="mt-4">
                            <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1.5">
                                <span>Docs uploaded</span>
                                <span>{docsUploaded}/{docsTotal}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="h-1.5 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(docsUploaded / docsTotal) * 100}%`,
                                        backgroundColor: docsUploaded === docsTotal ? '#22c55e' : '#2f6b8f',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Missing requirements warning ── */}
                    {(docsUploaded < docsTotal || !company.company_name) && (
                        <>
                            <div className="h-px bg-gray-100" />
                            <div>
                                <div className="flex items-center gap-1.5 mb-3 text-amber-500">
                                    <MdOutlineErrorOutline size={16} />
                                    <span className="text-[11px] font-bold uppercase tracking-wide">
                                        Incomplete Items
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {!company.company_name && (
                                        <div className="flex items-center gap-2">
                                            <MdClose size={14} className="text-red-400 shrink-0" />
                                            <span className="text-[12px] font-medium text-gray-500">Company name missing</span>
                                        </div>
                                    )}
                                    {!documents.operator_license && (
                                        <div className="flex items-center gap-2">
                                            <MdClose size={14} className="text-red-400 shrink-0" />
                                            <span className="text-[12px] font-medium text-gray-500">Operator license missing</span>
                                        </div>
                                    )}
                                    {!documents.public_liability_insurance && (
                                        <div className="flex items-center gap-2">
                                            <MdClose size={14} className="text-red-400 shrink-0" />
                                            <span className="text-[12px] font-medium text-gray-500">Public liability insurance missing</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Admin_Register_AdminScale;