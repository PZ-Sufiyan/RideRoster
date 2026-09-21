import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdBusiness,
    MdCancel,
    MdCheckCircle,
    MdCloudUpload,
    MdDeleteOutline,
    MdDescription,
    MdErrorOutline,
    MdInfo,
    MdKeyboardArrowDown,
    MdLocationOn,
    MdPerson,
    MdSend,
    MdVisibility,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { supabase } from '../../../../lib/supabaseClient';
import { getCompanyById } from '../../../../services/companyService';
import { getCompanyAdminAccess } from '../../../../services/companyAccessService';
import {
    COMPANY_DOCUMENT_TYPES,
    resubmitCompanyRegistration,
} from '../../../../services/registrationService';
import { uploadCompanyDocument } from '../../../../services/storageService';
import PhoneNumberField, { toE164Value } from '../../../../components/PhoneNumberField';
import {
    ADDRESS_MAX,
    AUTHORITY_MAX,
    COMPANY_NAME_MAX,
    EMAIL_MAX,
    IDENTIFIER_MAX,
    LANGUAGE_MAX,
    PERSON_NAME_MAX,
    WEBSITE_MAX,
    getCompanyRegistrationErrors,
    getCountryNameOptions,
    todayIsoDate,
} from '../../../../utils/companyRegistrationValidation';

const COMPANY_TYPES = [
    { value: 'small', label: 'Small company' },
    { value: 'medium', label: 'Medium company' },
    { value: 'large', label: 'Large company' },
];

const ACTIVITIES = [
    'General Private Hire',
    'School / SEND Transport',
    'Wheelchair Accessible (WAV)',
    'Corporate / Contract Services',
];

const FLEET_SIZES = [
    { value: '1', label: '1–5 vehicles (Micro)' },
    { value: '6', label: '6–15 vehicles (Small)' },
    { value: '16', label: '16–50 vehicles (Medium)' },
    { value: '51', label: '51–100 vehicles (Large)' },
    { value: '100', label: '100+ vehicles (Enterprise)' },
];

const DOC_SLOTS = [
    { key: 'certificate_of_incorporation', label: 'Certificate of Incorporation', required: true },
    { key: 'operator_license', label: 'Operator License', required: false },
    { key: 'public_liability_insurance', label: 'Public Liability Insurance', required: false },
    { key: 'commercial_insurance_certificate', label: 'Commercial Insurance Certificate', required: false },
    { key: 'vat_certificate', label: 'VAT Certificate', required: false },
    { key: 'primary_admin_id', label: 'Primary Admin ID', required: false },
];

const toDateInput = (v) => (v ? String(v).slice(0, 10) : '');
const normalizeAddress = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, ADDRESS_MAX);

function mapDocuments(rows = []) {
    const latest = {};
    [...rows]
        .sort((a, b) => String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || '')))
        .forEach((row) => {
            if (!row?.document_type || latest[row.document_type]) return;
            latest[row.document_type] = {
                id: row.id,
                file_name: row.file_name,
                file_path: row.file_path,
                file_url: row.file_url,
                bucket: row.bucket,
            };
        });
    return latest;
}

function emptyDocuments() {
    return Object.fromEntries(COMPANY_DOCUMENT_TYPES.map((key) => [key, null]));
}

const SectionTitle = ({ icon, children }) => (
    <h3 className="text-[15px] font-bold text-[#1e293b] flex items-center gap-2 mb-5">
        <span className="w-5 h-5 bg-[#2f6b8f]/10 text-[#2f6b8f] rounded flex items-center justify-center shrink-0">
            {React.createElement(icon, { size: 13 })}
        </span>
        {children}
    </h3>
);

function Field({
    label,
    error,
    required,
    colSpan = 1,
    children,
}) {
    return (
        <div className={`space-y-1.5 ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                {label}
                {required ? <span className="text-red-500 ml-0.5">*</span> : null}
            </label>
            {children}
            {error ? (
                <p className="flex items-center gap-1 text-[12px] text-red-500 font-bold">
                    <MdErrorOutline size={13} /> {error}
                </p>
            ) : null}
        </div>
    );
}

function controlClass(error) {
    return [
        'w-full px-3.5 py-2.5 bg-white border rounded-xl text-[13px] text-gray-900',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all',
        error
            ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
            : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
    ].join(' ');
}

function DocRow({ label, required, doc, error, disabled, onUpload, onRemove }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploadError('');
        setBusy(true);
        try {
            await onUpload(file);
        } catch (err) {
            setUploadError(err.message || 'Upload failed.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-1">
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={handleFile}
            />
            <div className={[
                'flex items-center justify-between p-3 rounded-xl border',
                doc ? 'bg-green-50/50 border-green-200' : required ? 'bg-red-50/30 border-red-200' : 'bg-gray-50 border-gray-200',
            ].join(' ')}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className={[
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        doc ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400',
                    ].join(' ')}>
                        {doc ? <MdCheckCircle size={18} /> : <MdCancel size={18} />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#1e293b]">
                            {label}
                            {required ? <span className="text-red-500 ml-0.5">*</span> : null}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                            {busy ? 'Uploading…' : doc?.file_name || (required ? 'Required' : 'Optional')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                    {doc?.file_url ? (
                        <button
                            type="button"
                            title="View"
                            onClick={() => window.open(doc.file_url, '_blank', 'noopener,noreferrer')}
                            className="p-1.5 text-gray-400 hover:text-[#2f6b8f] hover:bg-blue-50 rounded-lg"
                        >
                            <MdVisibility size={16} />
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={disabled || busy}
                        title={doc ? 'Replace' : 'Upload'}
                        onClick={() => inputRef.current?.click()}
                        className="p-1.5 text-gray-400 hover:text-[#2f6b8f] hover:bg-blue-50 rounded-lg disabled:opacity-40"
                    >
                        {busy ? <AiOutlineLoading3Quarters size={16} className="animate-spin" /> : <MdCloudUpload size={16} />}
                    </button>
                    {doc && !required ? (
                        <button
                            type="button"
                            disabled={disabled || busy}
                            title="Remove"
                            onClick={onRemove}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                        >
                            <MdDeleteOutline size={16} />
                        </button>
                    ) : null}
                </div>
            </div>
            {(uploadError || error) ? (
                <p className="flex items-center gap-1 text-[12px] text-red-500 font-bold pl-1">
                    <MdErrorOutline size={13} /> {uploadError || error}
                </p>
            ) : null}
        </div>
    );
}

const RejectedResubmit = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [companyId, setCompanyId] = useState(null);
    const [notes, setNotes] = useState('');
    const [form, setForm] = useState(null);
    const [sameAddress, setSameAddress] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const originalDocsRef = useRef({});
    const countryOptions = useMemo(() => getCountryNameOptions(), []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { access, company } = await getCompanyAdminAccess();
                if (cancelled) return;
                if (access !== 'rejected' || !company?.id) {
                    setLoadError('This application is not waiting for a resubmit.');
                    return;
                }
                const full = await getCompanyById(company.id);
                if (cancelled) return;
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                const adminRow =
                    (full.company_admins || []).find((row) => row.id === user?.id)
                    || (full.company_admins || [])[0]
                    || {};
                const docs = { ...emptyDocuments(), ...mapDocuments(full.company_documents) };
                originalDocsRef.current = docs;
                const nextCompany = {
                    company_name: full.company_name || '',
                    company_registration_number: full.company_registration_number || '',
                    company_type: full.company_type || '',
                    vat_number: full.vat_number || '',
                    primary_business_activity: full.primary_business_activity || '',
                    company_address: full.company_address || '',
                    company_operating_address: full.company_operating_address || '',
                    company_country: full.company_country || 'United Kingdom',
                    company_phone: toE164Value(full.company_phone),
                    company_email: full.company_email || '',
                    company_website: full.company_website || '',
                    company_preferred_language: full.company_preferred_language || 'English (UK)',
                    driver_estimate: full.driver_estimate ?? '',
                    operator_licence_number: full.operator_licence_number || '',
                    operator_licence_issuing_authority: full.operator_licence_issuing_authority || '',
                    coioe_registration_number: full.coioe_registration_number || '',
                    coioe_issue_date: toDateInput(full.coioe_issue_date),
                    cic_policy_number: full.cic_policy_number || '',
                    cic_coverage_amount: full.cic_coverage_amount || '',
                    cic_expiry_date: toDateInput(full.cic_expiry_date),
                };
                setCompanyId(full.id);
                setNotes(full.notes || '');
                setSameAddress(
                    Boolean(nextCompany.company_address)
                    && nextCompany.company_address === nextCompany.company_operating_address,
                );
                setForm({
                    company: nextCompany,
                    admin: {
                        full_name: adminRow.full_name || '',
                        email: adminRow.email || '',
                        phone: toE164Value(adminRow.phone),
                    },
                    documents: docs,
                });
            } catch (err) {
                if (!cancelled) setLoadError(err.message || 'Could not load your application.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const company = form?.company || {};
    const admin = form?.admin || {};
    const documents = form?.documents || {};

    const setCompanyField = (field, value) => {
        setForm((prev) => ({ ...prev, company: { ...prev.company, [field]: value } }));
    };
    const setAdminField = (field, value) => {
        setForm((prev) => ({ ...prev, admin: { ...prev.admin, [field]: value } }));
    };
    const setDoc = (key, value) => {
        setForm((prev) => ({ ...prev, documents: { ...prev.documents, [key]: value } }));
    };

    const errors = useMemo(
        () => (form ? getCompanyRegistrationErrors(form) : {}),
        [form],
    );
    const show = (key) => submitAttempted && errors[key];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/home');
    };

    const handleResubmit = async () => {
        setSubmitAttempted(true);
        setSubmitError('');
        if (Object.keys(errors).length) return;
        setSubmitting(true);
        try {
            await resubmitCompanyRegistration(companyId, form, originalDocsRef.current);
            navigate('/portal/pending', { replace: true });
        } catch (err) {
            setSubmitError(err.message || 'Resubmit failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-gray-600 text-sm">
                Loading application…
            </div>
        );
    }

    if (loadError || !form) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <div className="max-w-md text-center space-y-4">
                    <p className="text-[15px] font-bold text-red-600">{loadError || 'Application not found.'}</p>
                    <button type="button" onClick={handleLogout} className="text-sm font-semibold text-[#2f6b8f]">
                        Log out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-bold text-[#1e293b] leading-tight">Application rejected</h1>
                        <p className="text-[14px] text-gray-500 mt-1 font-medium">
                            Update any details below and resubmit for Super Admin review.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="shrink-0 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold text-sm hover:bg-red-100"
                    >
                        Log out
                    </button>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                    <MdErrorOutline size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-red-700">Super Admin note</p>
                        <p className="text-[13px] text-red-700/90 mt-1 whitespace-pre-wrap">
                            {notes.trim() || 'No reason was provided.'}
                        </p>
                    </div>
                </div>

                {submitAttempted && Object.keys(errors).length > 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <MdInfo size={18} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[13px] font-bold text-amber-700">
                            Fix the highlighted fields before resubmitting.
                        </p>
                    </div>
                ) : null}

                {submitError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[13px] font-bold text-red-600">
                        {submitError}
                    </div>
                ) : null}

                <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                    <SectionTitle icon={MdBusiness}>Company details</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                        <Field label="Company name" required error={show('company_name')}>
                            <input
                                maxLength={COMPANY_NAME_MAX}
                                value={company.company_name}
                                onChange={(e) => setCompanyField('company_name', e.target.value)}
                                className={controlClass(show('company_name'))}
                            />
                        </Field>
                        <Field label="Registration number" required error={show('company_registration_number')}>
                            <input
                                maxLength={IDENTIFIER_MAX}
                                value={company.company_registration_number}
                                onChange={(e) => setCompanyField('company_registration_number', e.target.value)}
                                className={controlClass(show('company_registration_number'))}
                            />
                        </Field>
                        <Field label="Company type" required error={show('company_type')}>
                            <div className="relative">
                                <select
                                    value={company.company_type}
                                    onChange={(e) => setCompanyField('company_type', e.target.value)}
                                    className={`${controlClass(show('company_type'))} appearance-none`}
                                >
                                    <option value="">Select type</option>
                                    {COMPANY_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </Field>
                        <Field label="VAT number" error={show('vat_number')}>
                            <input
                                maxLength={IDENTIFIER_MAX}
                                value={company.vat_number}
                                onChange={(e) => setCompanyField('vat_number', e.target.value)}
                                className={controlClass(show('vat_number'))}
                            />
                        </Field>
                        <Field label="Primary business activity" required error={show('primary_business_activity')} colSpan={2}>
                            <div className="relative">
                                <select
                                    value={company.primary_business_activity}
                                    onChange={(e) => setCompanyField('primary_business_activity', e.target.value)}
                                    className={`${controlClass(show('primary_business_activity'))} appearance-none`}
                                >
                                    <option value="">Select activity</option>
                                    {ACTIVITIES.map((a) => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                                <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </Field>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                    <SectionTitle icon={MdLocationOn}>Contact & address</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                        <Field label="Registered address" required error={show('company_address')} colSpan={2}>
                            <input
                                maxLength={ADDRESS_MAX}
                                value={company.company_address}
                                onChange={(e) => {
                                    const next = normalizeAddress(e.target.value);
                                    setCompanyField('company_address', next);
                                    if (sameAddress) setCompanyField('company_operating_address', next);
                                }}
                                className={controlClass(show('company_address'))}
                            />
                        </Field>
                        <Field label="Country" required error={show('company_country')}>
                            <div className="relative">
                                <select
                                    value={company.company_country}
                                    onChange={(e) => setCompanyField('company_country', e.target.value)}
                                    className={`${controlClass(show('company_country'))} appearance-none`}
                                >
                                    {countryOptions.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </Field>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
                                <input
                                    type="checkbox"
                                    checked={sameAddress}
                                    onChange={(e) => {
                                        const on = e.target.checked;
                                        setSameAddress(on);
                                        if (on) setCompanyField('company_operating_address', company.company_address);
                                    }}
                                />
                                Same operating address
                            </label>
                        </div>
                        <Field label="Operating address" required error={show('company_operating_address')} colSpan={2}>
                            <input
                                maxLength={ADDRESS_MAX}
                                disabled={sameAddress}
                                value={company.company_operating_address}
                                onChange={(e) => setCompanyField('company_operating_address', normalizeAddress(e.target.value))}
                                className={`${controlClass(show('company_operating_address'))} ${sameAddress ? 'bg-gray-50 text-gray-400' : ''}`}
                            />
                        </Field>
                        <PhoneNumberField
                            label="Main contact phone"
                            required
                            variant="register"
                            value={company.company_phone}
                            onChange={(next) => setCompanyField('company_phone', next)}
                            showError={submitAttempted}
                        />
                        <Field label="Main contact email" required error={show('company_email')}>
                            <input
                                type="email"
                                maxLength={EMAIL_MAX}
                                value={company.company_email}
                                onChange={(e) => setCompanyField('company_email', e.target.value)}
                                className={controlClass(show('company_email'))}
                            />
                        </Field>
                        <Field label="Website" error={show('company_website')}>
                            <input
                                maxLength={WEBSITE_MAX}
                                value={company.company_website}
                                onChange={(e) => setCompanyField('company_website', e.target.value)}
                                className={controlClass(show('company_website'))}
                            />
                        </Field>
                        <Field label="Preferred language" error={show('company_preferred_language')}>
                            <input
                                maxLength={LANGUAGE_MAX}
                                value={company.company_preferred_language}
                                onChange={(e) => setCompanyField('company_preferred_language', e.target.value)}
                                className={controlClass(show('company_preferred_language'))}
                            />
                        </Field>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                    <SectionTitle icon={MdPerson}>Primary admin & fleet</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                        <Field label="Admin full name" required error={show('full_name')}>
                            <input
                                maxLength={PERSON_NAME_MAX}
                                value={admin.full_name}
                                onChange={(e) => setAdminField('full_name', e.target.value)}
                                className={controlClass(show('full_name'))}
                            />
                        </Field>
                        <Field label="Admin email" required error={show('email')}>
                            <input
                                type="email"
                                readOnly
                                value={admin.email}
                                className={`${controlClass(show('email'))} bg-gray-50 cursor-not-allowed`}
                            />
                        </Field>
                        <PhoneNumberField
                            label="Admin phone"
                            required
                            variant="register"
                            value={admin.phone}
                            onChange={(next) => setAdminField('phone', next)}
                            showError={submitAttempted}
                        />
                        <Field label="Fleet size" required error={show('driver_estimate')}>
                            <div className="relative">
                                <select
                                    value={company.driver_estimate ?? ''}
                                    onChange={(e) => setCompanyField('driver_estimate', e.target.value ? Number(e.target.value) : '')}
                                    className={`${controlClass(show('driver_estimate'))} appearance-none`}
                                >
                                    <option value="">Select size</option>
                                    {FLEET_SIZES.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </Field>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                    <SectionTitle icon={MdDescription}>Compliance</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5 mb-6">
                        <Field label="COI registration number" required error={show('coioe_registration_number')}>
                            <input
                                maxLength={IDENTIFIER_MAX}
                                value={company.coioe_registration_number}
                                onChange={(e) => setCompanyField('coioe_registration_number', e.target.value)}
                                className={controlClass(show('coioe_registration_number'))}
                            />
                        </Field>
                        <Field label="COI issue date" required error={show('coioe_issue_date')}>
                            <input
                                type="date"
                                max={todayIsoDate()}
                                value={company.coioe_issue_date}
                                onChange={(e) => setCompanyField('coioe_issue_date', e.target.value)}
                                className={controlClass(show('coioe_issue_date'))}
                            />
                        </Field>
                        <Field label="Insurance policy number" error={show('cic_policy_number')}>
                            <input
                                maxLength={IDENTIFIER_MAX}
                                value={company.cic_policy_number}
                                onChange={(e) => setCompanyField('cic_policy_number', e.target.value)}
                                className={controlClass(show('cic_policy_number'))}
                            />
                        </Field>
                        <Field label="Coverage amount" error={show('cic_coverage_amount')}>
                            <input
                                value={company.cic_coverage_amount}
                                onChange={(e) => setCompanyField('cic_coverage_amount', e.target.value)}
                                className={controlClass(show('cic_coverage_amount'))}
                            />
                        </Field>
                        <Field label="Insurance expiry" error={show('cic_expiry_date')}>
                            <input
                                type="date"
                                min={todayIsoDate()}
                                value={company.cic_expiry_date}
                                onChange={(e) => setCompanyField('cic_expiry_date', e.target.value)}
                                className={controlClass(show('cic_expiry_date'))}
                            />
                        </Field>
                        <Field label="Operator licence number" error={show('operator_licence_number')}>
                            <input
                                maxLength={IDENTIFIER_MAX}
                                value={company.operator_licence_number}
                                onChange={(e) => setCompanyField('operator_licence_number', e.target.value)}
                                className={controlClass(show('operator_licence_number'))}
                            />
                        </Field>
                        <Field label="Issuing authority" error={show('operator_licence_issuing_authority')} colSpan={2}>
                            <input
                                maxLength={AUTHORITY_MAX}
                                value={company.operator_licence_issuing_authority}
                                onChange={(e) => setCompanyField('operator_licence_issuing_authority', e.target.value)}
                                className={controlClass(show('operator_licence_issuing_authority'))}
                            />
                        </Field>
                    </div>
                    <div className="space-y-2">
                        {DOC_SLOTS.map((slot) => (
                            <DocRow
                                key={slot.key}
                                label={slot.label}
                                required={slot.required}
                                doc={documents[slot.key]}
                                error={show(slot.key)}
                                disabled={submitting}
                                onUpload={async (file) => {
                                    const uploaded = await uploadCompanyDocument({
                                        companyId,
                                        documentType: slot.key,
                                        file,
                                    });
                                    setDoc(slot.key, uploaded);
                                }}
                                onRemove={() => setDoc(slot.key, null)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end pb-8">
                    <button
                        type="button"
                        onClick={handleResubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-[14px] font-bold shadow-sm hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#45818e' }}
                    >
                        {submitting
                            ? <><AiOutlineLoading3Quarters size={16} className="animate-spin" /> Resubmitting…</>
                            : <><MdSend size={16} /> Resubmit for review</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectedResubmit;
