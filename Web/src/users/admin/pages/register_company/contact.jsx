import React, { useMemo, useState } from 'react';
import {
    MdLocationOn,
    MdSearch,
    MdContactPage,
    MdPhone,
    MdEmail,
    MdLanguage,
    MdArrowBack,
    MdArrowForward,
    MdErrorOutline,
} from 'react-icons/md';

// ─── Validators ───────────────────────────────────────────────────────────────

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[\d\s\-().]{7,20}$/.test(v);
const isValidUrl   = (v) => {
    if (!v?.trim()) return true; // optional field
    try { new URL(v); return true; } catch { return false; }
};

const EMPTY_COMPANY = Object.freeze({});

// ─── Admin_Register_Contact ───────────────────────────────────────────────────

const Admin_Register_Contact = ({ value, onChange, onNext, onPrev }) => {
    const [touched, setTouched]                = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [sameAddress, setSameAddress]         = useState(false);

    const company = useMemo(() => value?.company ?? EMPTY_COMPANY, [value?.company]);

    // ── Field setter ──
    const setField = (field, v) =>
        onChange((prev) => ({ ...prev, company: { ...prev.company, [field]: v } }));

    // ── Same-address toggle ──
    const handleSameAddressToggle = () => {
        const next = !sameAddress;
        setSameAddress(next);
        if (next) {
            // Mirror registered address into operating address immediately
            setField('company_operating_address', company.company_address || '');
        }
    };

    // ── Validation (derived) ──
    const errors = useMemo(() => {
        const e = {};
        if (!company.company_address?.trim())
            e.company_address = 'Registered office address is required';
        if (!company.company_operating_address?.trim())
            e.company_operating_address = 'Operating address is required';
        if (!company.company_phone?.trim())
            e.company_phone = 'Phone number is required';
        else if (!isValidPhone(company.company_phone))
            e.company_phone = 'Enter a valid phone number';
        if (!company.company_email?.trim())
            e.company_email = 'Email address is required';
        else if (!isValidEmail(company.company_email))
            e.company_email = 'Enter a valid email address';
        if (!isValidUrl(company.company_website))
            e.company_website = 'Enter a valid URL (e.g. https://example.com)';
        return e;
    }, [company]);

    const canContinue = Object.keys(errors).length === 0;

    // ── Touch helpers ──
    const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

    const touchAll = () =>
        setTouched({
            company_address: true,
            company_operating_address: true,
            company_phone: true,
            company_email: true,
            company_website: true,
        });

    const onContinue = () => {
        touchAll();
        setSubmitAttempted(true);
        if (canContinue) onNext();
    };

    // ── Whether to show error for a given field ──
    const showErr = (key) => (touched[key] || submitAttempted) && errors[key];

    // ── Class builders ──
    const baseInput = 'placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all';

    const textareaClass = (key) =>
        [
            'w-full px-4 py-3 bg-white border rounded-xl text-[14px] text-gray-900 resize-none',
            baseInput,
            showErr(key)
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
        ].join(' ');

    const inputClass = (key) =>
        [
            'w-full px-4 py-3 bg-white border rounded-xl text-[14px] text-gray-900',
            baseInput,
            showErr(key)
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#2f6b8f]/20 focus:border-[#2f6b8f]',
        ].join(' ');

    const iconInputClass = (key) =>
        [
            'w-full pl-11 pr-4 py-3 bg-white border rounded-xl text-[14px] text-gray-900 font-medium',
            baseInput,
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

    // ── Render ──
    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 shadow-sm max-w-4xl mx-auto">

            {/* Header */}
            <div className="mb-10">
                <h2 className="text-[22px] font-bold text-[#1e293b]">Contact & Address Details</h2>
                <p className="text-[15px] text-gray-500 mt-1">
                    Please provide the registered office and operational contact points for the company.
                </p>
            </div>

            {/* ── Section 1: Registered Office Address ── */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <MdLocationOn size={22} className="text-[#2f6b8f]" />
                    <h3 className="text-[18px] font-bold text-[#1e293b]">Registered Office Address</h3>
                </div>

                {/* Registered address */}
                <div className="space-y-1.5">
                    <label className="block text-[14px] font-bold text-[#1e293b]">
                        Registered Office Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <textarea
                            value={company.company_address || ''}
                            onChange={(e) => {
                                setField('company_address', e.target.value);
                                // Keep operating address mirrored while toggle is active
                                if (sameAddress) setField('company_operating_address', e.target.value);
                            }}
                            onBlur={() => touch('company_address')}
                            placeholder="Street, City, County, Postcode"
                            className={`${textareaClass('company_address')} h-28 pt-4 pb-10`}
                        />
                        {/* Postcode lookup — wire to a real API (e.g. postcodes.io) when ready */}
                        <button
                            type="button"
                            className="absolute right-3 top-3 flex items-center gap-1.5 text-[13px] font-bold text-[#2f6b8f] hover:text-[#1a3f55] transition-colors p-2 bg-white rounded-lg"
                        >
                            <MdSearch size={18} />
                            Postcode Lookup
                        </button>
                    </div>
                    {renderFieldError('company_address')}
                </div>

                {/* Same-address toggle */}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="button"
                        onClick={handleSameAddressToggle}
                        className={[
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-[#2f6b8f] focus:ring-offset-2',
                            sameAddress ? 'bg-[#2f6b8f]' : 'bg-[#E2E8F0]',
                        ].join(' ')}
                        aria-label="Same as registered office"
                    >
                        <span
                            className={[
                                'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                                sameAddress ? 'translate-x-5' : 'translate-x-1',
                            ].join(' ')}
                        />
                    </button>
                    <span className="text-[14px] text-gray-500 font-medium select-none">
                        Operating address is the same as registered office
                    </span>
                </div>

                {/* Operating address */}
                <div className="space-y-1.5 pt-1">
                    <label className="block text-[14px] font-bold text-[#1e293b]">
                        Operating Address / Depot Location <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={company.company_operating_address || ''}
                        onChange={(e) => setField('company_operating_address', e.target.value)}
                        onBlur={() => touch('company_operating_address')}
                        disabled={sameAddress}
                        placeholder="Street, City, County, Postcode"
                        className={[
                            textareaClass('company_operating_address'),
                            'h-24',
                            sameAddress ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-70' : '',
                        ].join(' ')}
                    />
                    {renderFieldError('company_operating_address')}
                </div>
            </div>

            <div className="h-px bg-gray-100 my-10" />

            {/* ── Section 2: Communication Channels ── */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <MdContactPage size={22} className="text-[#2f6b8f]" />
                    <h3 className="text-[18px] font-bold text-[#1e293b]">Communication Channels</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="block text-[14px] font-bold text-[#1e293b]">
                            Main Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <MdPhone size={20} />
                            </div>
                            <input
                                type="tel"
                                placeholder="+44 20 7946 0000"
                                value={company.company_phone || ''}
                                onChange={(e) => setField('company_phone', e.target.value)}
                                onBlur={() => touch('company_phone')}
                                className={iconInputClass('company_phone')}
                            />
                        </div>
                        {renderFieldError('company_phone')}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="block text-[14px] font-bold text-[#1e293b]">
                            Main Contact Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <MdEmail size={20} />
                            </div>
                            <input
                                type="email"
                                placeholder="admin@company.com"
                                value={company.company_email || ''}
                                onChange={(e) => setField('company_email', e.target.value)}
                                onBlur={() => touch('company_email')}
                                className={iconInputClass('company_email')}
                            />
                        </div>
                        {renderFieldError('company_email')}
                        <p className="text-[12px] text-gray-400 font-medium pt-0.5">
                            Used for all system notifications and approval updates.
                        </p>
                    </div>

                    {/* Website */}
                    <div className="space-y-1.5">
                        <label className="block text-[14px] font-bold text-[#1e293b]">
                            Website{' '}
                            <span className="text-gray-400 font-normal text-[13px]">(Optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <MdLanguage size={20} />
                            </div>
                            <input
                                type="url"
                                placeholder="https://www.company.com"
                                value={company.company_website || ''}
                                onChange={(e) => setField('company_website', e.target.value)}
                                onBlur={() => touch('company_website')}
                                className={iconInputClass('company_website')}
                            />
                        </div>
                        {renderFieldError('company_website')}
                    </div>

                    {/* Preferred Language */}
                    <div className="space-y-1.5">
                        <label className="block text-[14px] font-bold text-[#1e293b]">
                            Preferred Language{' '}
                            <span className="text-gray-400 font-normal text-[13px]">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="English (UK)"
                            value={company.company_preferred_language || ''}
                            onChange={(e) => setField('company_preferred_language', e.target.value)}
                            className={inputClass('company_preferred_language')}
                        />
                    </div>
                </div>
            </div>

            {/* ── Navigation ── */}
            <div className="mt-12 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onPrev}
                    className="flex items-center gap-2 px-5 py-3 text-[14px] font-bold text-[#2f6b8f] hover:text-[#1a3f55] hover:bg-blue-50 transition-colors rounded-xl"
                >
                    <MdArrowBack size={18} />
                    Back
                </button>
                <button
                    type="button"
                    onClick={onContinue}
                    disabled={!canContinue}
                    title={!canContinue ? 'Please fill in all required fields' : undefined}
                    className={[
                        'flex items-center gap-2 px-5 py-3 text-[14px] font-bold text-white rounded-xl transition-all shadow-sm',
                        canContinue ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed',
                    ].join(' ')}
                    style={{ backgroundColor: '#2f6b8f' }}
                >
                    Next: Admin & Scale
                    <MdArrowForward size={18} />
                </button>
            </div>
        </div>
    );
};

export default Admin_Register_Contact;