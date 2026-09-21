import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    MdLocationOn,
    MdSearch,
    MdContactPage,
    MdEmail,
    MdLanguage,
    MdPublic,
    MdArrowBack,
    MdArrowForward,
    MdErrorOutline,
    MdKeyboardArrowDown,
} from 'react-icons/md';
import PhoneNumberField, { getPhoneValidationError } from '../../../../components/PhoneNumberField';
import {
    ADDRESS_MAX,
    EMAIL_MAX,
    LANGUAGE_MAX,
    WEBSITE_MAX,
    getCountryNameOptions,
    validateAddress,
    validateCountry,
    validateEmail,
    validatePreferredLanguage,
    validateWebsite,
} from '../../../../utils/companyRegistrationValidation';

const EMPTY_COMPANY = Object.freeze({});

const normalizeAddress = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, ADDRESS_MAX);

// ─── Admin_Register_Contact ───────────────────────────────────────────────────

const Admin_Register_Contact = ({ value, onChange, onNext, onPrev }) => {
    const [touched, setTouched]                = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [sameAddress, setSameAddress]         = useState(false);
    const [countryOpen, setCountryOpen]         = useState(false);
    const countryRef = useRef(null);

    const company = useMemo(() => value?.company ?? EMPTY_COMPANY, [value?.company]);
    const countryOptions = useMemo(() => getCountryNameOptions(), []);

    const filteredCountries = useMemo(() => {
        const q = (company.company_country || '').trim().toLowerCase();
        if (!q) return countryOptions;
        return countryOptions.filter((name) => name.toLowerCase().includes(q));
    }, [company.company_country, countryOptions]);

    // Close country dropdown on outside click
    useEffect(() => {
        if (!countryOpen) return;
        const onDocClick = (e) => {
            if (countryRef.current && !countryRef.current.contains(e.target)) {
                setCountryOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [countryOpen]);

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
        const addressError = validateAddress(company.company_address, {
            label: 'Registered office address',
        });
        if (addressError) e.company_address = addressError;
        const operatingError = validateAddress(company.company_operating_address, {
            label: 'Operating address',
        });
        if (operatingError) e.company_operating_address = operatingError;
        const countryError = validateCountry(company.company_country);
        if (countryError) e.company_country = countryError;
        const phoneError = getPhoneValidationError(company.company_phone, {
            required: true,
            label: 'Phone number',
        });
        if (phoneError) e.company_phone = phoneError;
        const emailError = validateEmail(company.company_email);
        if (emailError) e.company_email = emailError;
        const websiteError = validateWebsite(company.company_website);
        if (websiteError) e.company_website = websiteError;
        const languageError = validatePreferredLanguage(company.company_preferred_language);
        if (languageError) e.company_preferred_language = languageError;
        return e;
    }, [company]);

    const canContinue = Object.keys(errors).length === 0;

    // ── Touch helpers ──
    const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

    const touchAll = () =>
        setTouched({
            company_address: true,
            company_operating_address: true,
            company_country: true,
            company_phone: true,
            company_email: true,
            company_website: true,
            company_preferred_language: true,
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
                            maxLength={ADDRESS_MAX}
                            onChange={(e) => {
                                const next = normalizeAddress(e.target.value);
                                setField('company_address', next);
                                if (sameAddress) setField('company_operating_address', next);
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

                {/* Country — searchable select + free-text */}
                <div className="space-y-1.5" ref={countryRef}>
                    <label className="block text-[14px] font-bold text-[#1e293b]">
                        Country <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <MdPublic size={20} />
                        </div>
                        <input
                            type="text"
                            role="combobox"
                            aria-expanded={countryOpen}
                            aria-autocomplete="list"
                            aria-controls="country-options"
                            placeholder="Search a country (e.g. United Kingdom)"
                            value={company.company_country || ''}
                            onChange={(e) => {
                                setField('company_country', e.target.value);
                                setCountryOpen(true);
                            }}
                            onFocus={() => setCountryOpen(true)}
                            onBlur={() => touch('company_country')}
                            className={`${iconInputClass('company_country')} pr-10`}
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setCountryOpen((o) => !o)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            aria-label="Toggle country list"
                        >
                            <MdKeyboardArrowDown
                                size={22}
                                className={`transition-transform ${countryOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {countryOpen && (
                            <ul
                                id="country-options"
                                role="listbox"
                                className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1"
                            >
                                {filteredCountries.length === 0 ? (
                                    <li className="px-4 py-3 text-[13px] text-gray-500">
                                        No matching country. Select a name from the list.
                                    </li>
                                ) : (
                                    filteredCountries.map((name) => (
                                        <li key={name} role="option">
                                            <button
                                                type="button"
                                                className={[
                                                    'w-full text-left px-4 py-2.5 text-[14px] transition-colors',
                                                    'hover:bg-[#2f6b8f]/8 hover:text-[#1a3f55]',
                                                    company.company_country === name
                                                        ? 'bg-[#2f6b8f]/10 text-[#2f6b8f] font-semibold'
                                                        : 'text-gray-800',
                                                ].join(' ')}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setField('company_country', name);
                                                    setCountryOpen(false);
                                                    touch('company_country');
                                                }}
                                            >
                                                {name}
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                    {renderFieldError('company_country')}
                    <p className="text-[12px] text-gray-400 font-medium pt-0.5">
                        Select a country from the list.
                    </p>
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
                        maxLength={ADDRESS_MAX}
                        onChange={(e) => setField('company_operating_address', normalizeAddress(e.target.value))}
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
                    <PhoneNumberField
                        label="Main Contact Phone"
                        required
                        variant="register"
                        value={company.company_phone || ''}
                        onChange={(next) => setField('company_phone', next)}
                        onBlur={() => touch('company_phone')}
                        showError={submitAttempted || touched.company_phone}
                    />

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
                                maxLength={EMAIL_MAX}
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
                                maxLength={WEBSITE_MAX}
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
                            maxLength={LANGUAGE_MAX}
                            value={company.company_preferred_language || ''}
                            onChange={(e) => setField('company_preferred_language', e.target.value)}
                            onBlur={() => touch('company_preferred_language')}
                            className={inputClass('company_preferred_language')}
                        />
                        {renderFieldError('company_preferred_language')}
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
