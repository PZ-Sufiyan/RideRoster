import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdPerson,
    MdHome,
    MdSchool,
    MdAccessible,
    MdOutlineNotes,
    MdSettings,
    MdInfo,
    MdArrowDropDown,
    MdLocationOn,
    MdHotel,
    MdCalendarToday,
} from 'react-icons/md';
import { HiExclamationCircle } from 'react-icons/hi';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { ToastStack } from '../../../../../utils/Toast';
import { supabase } from '../../../../../lib/supabaseClient';
import { getCompanyAdminById } from '../../../../../services/companyService';
import { registerPassengerWithAuthAndRecord } from '../../../../../services/passengerService';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { useSubAdminPermissions } from '../../../../../context/subAdminPermissionsContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// ── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = [
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' },
    { key: 'sun', label: 'S' },
];

const EMPTY_LOCATION = {
    address: '',
    postcode: '',
    lat: null,
    lng: null,
    locationConfirmed: false,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const geocodeAddress = async (address, postcode) => {
    const query = `${address}, ${postcode}, UK`;
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'RideRoster' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
};

function DraggableMarker({ position, onDragEnd }) {
    return (
        <Marker
            position={position}
            draggable
            eventHandlers={{ dragend: (e) => onDragEnd(e.target.getLatLng()) }}
        />
    );
}

// ── LocationCard ─────────────────────────────────────────────────────────────
// Reusable card for Primary, Secondary, Educational Site, Respite
// No time field — times live on the primary + educational site only (passed via children)

const LocationCard = ({
    title,
    icon,
    iconColor,
    badgeLabel,
    badgeColor,
    addressKey,
    postcodeKey,
    location,
    geoError,
    geocoding,
    onAddressChange,
    onPostcodeChange,
    onPostcodeBlur,
    onRelocate,
    onPinDrag,
    showRequiredError,
    required = false,
    hint,
    children, // slot for time fields
}) => {
    const borderColor = geoError ? 'border-red-400' : 'border-gray-200';
    const ringColor = geoError ? 'focus:ring-red-500' : 'focus:ring-[#004D6D]';

    const textareaClass = `w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 resize-none ${
        showRequiredError(addressKey)
            ? 'border-red-400 text-red-700 focus:ring-red-500'
            : `border-gray-200 text-gray-700 focus:ring-[#004D6D]`
    }`;

    const inputClass = `w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${
        showRequiredError(postcodeKey)
            ? 'border-red-400 text-red-700 focus:ring-red-500'
            : `${borderColor} text-gray-700 ${ringColor}`
    }`;

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                        {icon}
                    </div>
                    <h2 className="text-[13px] font-bold text-gray-900">{title}</h2>
                </div>
                {badgeLabel && (
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {badgeLabel}
                    </span>
                )}
            </div>

            {/* Address */}
            <div className="space-y-1.5 mb-3">
                <label className="text-[12px] font-semibold text-gray-700">
                    Address{required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                    rows={3}
                    placeholder="Enter full address..."
                    value={location.address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    className={textareaClass}
                />
                {showRequiredError(addressKey) && (
                    <p className="text-[11px] font-semibold text-red-600">Address is required.</p>
                )}
            </div>

            {/* Postcode row + optional time slot */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-gray-700">
                        Post Code{required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="e.g. LS1 4AP"
                            value={location.postcode}
                            onChange={(e) => onPostcodeChange(e.target.value)}
                            onBlur={onPostcodeBlur}
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={onRelocate}
                            disabled={geocoding}
                            className="shrink-0 text-[11px] border border-gray-200 px-2 py-1 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {geocoding ? '...' : 'Re-locate'}
                        </button>
                    </div>
                    {showRequiredError(postcodeKey) && (
                        <p className="text-[11px] font-semibold text-red-600">Post Code is required.</p>
                    )}
                    {geoError && (
                        <p className="text-[11px] font-semibold text-red-600">
                            Could not locate address. Please check and try again.
                        </p>
                    )}
                </div>

                {/* Time field slot — only Primary and Educational Site pass this */}
                {children && <div className="space-y-1.5">{children}</div>}
            </div>

            {hint && <p className="text-[11px] text-gray-400 italic mb-1">{hint}</p>}

            {/* Map */}
            {location.locationConfirmed && location.lat && location.lng && (
                <div className="mt-3">
                    <p className="text-[11px] font-semibold text-green-600 mb-1">📍 Location confirmed</p>
                    <div className="mt-1 rounded-lg overflow-hidden border border-gray-200" style={{ height: 180 }}>
                        <MapContainer
                            center={[location.lat, location.lng]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <DraggableMarker
                                position={[location.lat, location.lng]}
                                onDragEnd={onPinDrag}
                            />
                        </MapContainer>
                    </div>
                    <p className="text-[11px] text-amber-600 font-semibold mt-1">⚠ Drag pin to adjust if needed</p>
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const AddNewPassenger = () => {
    const navigate = useNavigate();
    const { can } = useSubAdminPermissions();
    const canAddUsers = can('add_users');

    if (!canAddUsers) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You do not have permission to add users.
            </div>
        );
    }

    const countryNameDisplay = useMemo(() => new Intl.DisplayNames(['en'], { type: 'region' }), []);
    const phoneCountries = useMemo(
        () =>
            getCountries()
                .map((code) => ({
                    code,
                    callingCode: `+${getCountryCallingCode(code)}`,
                    name: countryNameDisplay.of(code) || code,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [countryNameDisplay]
    );

    // ── Form state ──────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        firstName: '',
        surname: '',
        email: '',
        contact1: '',
        contact2: '',
        pickupTime: '',
        returnTime: '',
        wheelchair: 'no',
        harness: 'no',
        notes: '',
        weeklySchedule: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
    });

    // Location state — each location is an independent object
    const [primaryLocation, setPrimaryLocation] = useState({ ...EMPTY_LOCATION });
    const [secondaryLocation, setSecondaryLocation] = useState({ ...EMPTY_LOCATION });
    const [educationalLocation, setEducationalLocation] = useState({ ...EMPTY_LOCATION });
    const [respiteLocation, setRespiteLocation] = useState({ ...EMPTY_LOCATION });

    // Geocoding loading/error per location type
    const [geoState, setGeoState] = useState({
        primary: { loading: false, error: false },
        secondary: { loading: false, error: false },
        educational: { loading: false, error: false },
        respite: { loading: false, error: false },
    });

    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [phoneCountriesByField, setPhoneCountriesByField] = useState({ contact1: 'GB', contact2: 'GB' });
    const [phoneTouched, setPhoneTouched] = useState({ contact1: false, contact2: false });
    const [openCountryDropdown, setOpenCountryDropdown] = useState({ contact1: false, contact2: false });
    const contact1Ref = useRef(null);
    const contact2Ref = useRef(null);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const toggleDay = (day) =>
        setForm((prev) => ({
            ...prev,
            weeklySchedule: { ...prev.weeklySchedule, [day]: !prev.weeklySchedule[day] },
        }));

    const updateLocation = (setter, patch) => setter((prev) => ({ ...prev, ...patch }));

    const runGeocode = async (type, address, postcode) => {
        const setterMap = { primary: setPrimaryLocation, secondary: setSecondaryLocation, educational: setEducationalLocation, respite: setRespiteLocation };
        const setter = setterMap[type];

        setGeoState((prev) => ({ ...prev, [type]: { loading: true, error: false } }));
        try {
            const result = await geocodeAddress(address, postcode);
            if (result) {
                setter((prev) => ({ ...prev, lat: result.lat, lng: result.lng, locationConfirmed: true }));
                setGeoState((prev) => ({ ...prev, [type]: { loading: false, error: false } }));
            } else {
                setter((prev) => ({ ...prev, locationConfirmed: false }));
                setGeoState((prev) => ({ ...prev, [type]: { loading: false, error: true } }));
            }
        } catch {
            setter((prev) => ({ ...prev, locationConfirmed: false }));
            setGeoState((prev) => ({ ...prev, [type]: { loading: false, error: true } }));
        }
    };

    const triggerGeocode = (type, address, postcode) => {
        if (address.trim() && postcode.trim()) runGeocode(type, address, postcode);
    };

    // ── Outside click for phone dropdowns ───────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (contact1Ref.current && !contact1Ref.current.contains(e.target))
                setOpenCountryDropdown((prev) => ({ ...prev, contact1: false }));
            if (contact2Ref.current && !contact2Ref.current.contains(e.target))
                setOpenCountryDropdown((prev) => ({ ...prev, contact2: false }));
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Phone validation ────────────────────────────────────────────────────
    const validatePhone = (value, country, { required = false, label = 'Contact number' } = {}) => {
        const trimmed = String(value || '').trim();
        if (!trimmed) return required ? { error: `${label} is required.`, e164: '' } : { error: '', e164: '' };
        try {
            const parsed = parsePhoneNumberFromString(trimmed, country);
            if (!parsed || !parsed.isValid()) return { error: `${label} is not valid for the selected country.`, e164: '' };
            if (parsed.country && parsed.country !== country) return { error: `${label} does not match the selected country code.`, e164: '' };
            return { error: '', e164: parsed.number };
        } catch {
            return { error: `${label} has an invalid format.`, e164: '' };
        }
    };

    const contact1Phone = validatePhone(form.contact1, phoneCountriesByField.contact1, { required: true, label: 'Contact Number 1' });
    const contact2Phone = validatePhone(form.contact2, phoneCountriesByField.contact2, { required: false, label: 'Contact Number 2' });
    const showContact1Error = (submitAttempted || phoneTouched.contact1) && !!contact1Phone.error;
    const showContact2Error = (submitAttempted || phoneTouched.contact2) && !!contact2Phone.error;

    // ── Validation helpers ──────────────────────────────────────────────────
    const noteMax = 500;

    // Flat lookup for required field errors (covers form + location fields)
    const fieldValues = useMemo(() => ({
        firstName: form.firstName,
        surname: form.surname,
        email: form.email,
        contact1: form.contact1,
        pickupTime: form.pickupTime,
        returnTime: form.returnTime,
        primaryAddress: primaryLocation.address,
        primaryPostcode: primaryLocation.postcode,
        educationalAddress: educationalLocation.address,
        educationalPostcode: educationalLocation.postcode,
    }), [form, primaryLocation, educationalLocation]);

    const isMissing = (key) => !String(fieldValues[key] || '').trim();
    const showRequiredError = (key) => submitAttempted && isMissing(key);

    const requiredKeys = ['firstName', 'surname', 'email', 'contact1', 'primaryAddress', 'primaryPostcode', 'pickupTime', 'educationalAddress', 'educationalPostcode', 'returnTime'];

    // ── Completion % ────────────────────────────────────────────────────────
    const completion = useMemo(() => {
        const filled = requiredKeys.filter((k) => !isMissing(k)).length;
        const activeDays = Object.values(form.weeklySchedule).filter(Boolean).length;
        const scheduleScore = activeDays > 0 ? 1 : 0;
        return Math.round(((filled + scheduleScore) / (requiredKeys.length + 1)) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldValues, form.weeklySchedule]);

    const activeDayCount = Object.values(form.weeklySchedule).filter(Boolean).length;

    // ── Toast ───────────────────────────────────────────────────────────────
    const pushToast = (type, message) =>
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 }]);

    // ── Clear ───────────────────────────────────────────────────────────────
    const clearForm = () => {
        setForm({ firstName: '', surname: '', email: '', contact1: '', contact2: '', pickupTime: '', returnTime: '', wheelchair: 'no', harness: 'no', notes: '', weeklySchedule: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false } });
        setPrimaryLocation({ ...EMPTY_LOCATION });
        setSecondaryLocation({ ...EMPTY_LOCATION });
        setEducationalLocation({ ...EMPTY_LOCATION });
        setRespiteLocation({ ...EMPTY_LOCATION });
        setGeoState({ primary: { loading: false, error: false }, secondary: { loading: false, error: false }, educational: { loading: false, error: false }, respite: { loading: false, error: false } });
        setSubmitAttempted(false);
    };

    // ── Validate ─────────────────────────────────────────────────────────────
    const validateForm = () => {
        setSubmitAttempted(true);

        if (requiredKeys.some((k) => isMissing(k))) {
            pushToast('warning', 'Please fill in all required fields before saving passenger.');
            return false;
        }
        if (activeDayCount === 0) {
            pushToast('warning', 'Please select at least one active day in the weekly schedule.');
            return false;
        }
        if (!primaryLocation.locationConfirmed) {
            pushToast('warning', 'Please confirm the Primary Address location on the map.');
            return false;
        }
        if (!educationalLocation.locationConfirmed) {
            pushToast('warning', 'Please confirm the Educational Site location on the map.');
            return false;
        }
        if (contact1Phone.error || contact2Phone.error) {
            pushToast('warning', 'Please fix invalid contact number format.');
            return false;
        }
        return true;
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const savePassenger = async (navigateAfterSave) => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(userId);
            if (!admin?.company_id) throw new Error('No company linked to your account.');

            await registerPassengerWithAuthAndRecord({
                companyId: admin.company_id,
                form: {
                    ...form,
                    contact1: contact1Phone.e164,
                    contact2: contact2Phone.e164,
                    primaryLocation,
                    secondaryLocation,
                    educationalLocation,
                    respiteLocation,
                },
            });

            pushToast('success', 'Passenger registered successfully.');
            if (navigateAfterSave) { navigate('/team/users/passengers'); return; }
            clearForm();
        } catch (err) {
            pushToast('error', err?.message || 'Could not register passenger.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Phone field reusable renderer ─────────────────────────────────────
    const renderPhoneField = (fieldKey, label, required, ref) => {
        const hasError = fieldKey === 'contact1' ? showContact1Error : showContact2Error;
        const phoneResult = fieldKey === 'contact1' ? contact1Phone : contact2Phone;
        const showMissingRequired = required && showRequiredError(fieldKey);
        const borderClass = hasError || showMissingRequired
            ? 'border-red-400 focus-within:ring-red-500'
            : 'border-gray-200 focus-within:ring-[#004D6D]';

        return (
            <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-gray-700">
                    {label}{required && <span className="text-red-500">*</span>}
                </label>
                <div className={`flex items-center border rounded-lg focus-within:ring-1 ${borderClass}`}>
                    <div ref={ref} className="relative border-r border-gray-200 shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpenCountryDropdown((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }))}
                            className="flex items-center gap-1 px-2 py-2.5 bg-gray-50 text-[13px] text-gray-500 font-medium hover:bg-gray-100"
                        >
                            <span>+{getCountryCallingCode(phoneCountriesByField[fieldKey])}</span>
                            <MdArrowDropDown size={16} />
                        </button>
                        {openCountryDropdown[fieldKey] && (
                            <div className="absolute left-0 top-full mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                                {phoneCountries.map((c) => (
                                    <button key={`${fieldKey}-${c.code}`} type="button"
                                        onClick={() => { setPhoneCountriesByField((prev) => ({ ...prev, [fieldKey]: c.code })); setOpenCountryDropdown((prev) => ({ ...prev, [fieldKey]: false })); }}
                                        className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                                    >
                                        {c.name} ({c.callingCode})
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={form[fieldKey]}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                        onBlur={() => setPhoneTouched((prev) => ({ ...prev, [fieldKey]: true }))}
                        className="flex-1 px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white"
                    />
                </div>
                {showMissingRequired && <p className="text-[11px] font-semibold text-red-600">{label} is required.</p>}
                {hasError && <p className="text-[11px] font-semibold text-red-600">{phoneResult.error}</p>}
            </div>
        );
    };

    // ── Time input class ──────────────────────────────────────────────────
    const timeClass = (key) =>
        `w-full px-3 py-2.5 border rounded-lg text-[13px] focus:outline-none focus:ring-1 ${
            showRequiredError(key)
                ? 'border-red-400 text-red-700 focus:ring-red-500'
                : 'border-gray-200 text-gray-500 focus:ring-[#004D6D]'
        }`;

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-20">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Add New Passenger</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* ── LEFT: main form ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── PASSENGER DETAILS ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <MdPerson size={20} className="text-[#004D6D]" />
                            <h2 className="text-[14px] font-bold text-gray-900">Passenger Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">First Name<span className="text-red-500">*</span></label>
                                <input type="text" placeholder="e.g. John" value={form.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${showRequiredError('firstName') ? 'border-red-400 text-red-700 focus:ring-red-500' : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'}`}
                                />
                                {showRequiredError('firstName') && <p className="text-[11px] font-semibold text-red-600">First Name is required.</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">Surname<span className="text-red-500">*</span></label>
                                <input type="text" placeholder="e.g. Doe" value={form.surname}
                                    onChange={(e) => handleChange('surname', e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${showRequiredError('surname') ? 'border-red-400 text-red-700 focus:ring-red-500' : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'}`}
                                />
                                {showRequiredError('surname') && <p className="text-[11px] font-semibold text-red-600">Surname is required.</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                            <label className="text-[12px] font-semibold text-gray-700">Email ID<span className="text-red-500">*</span></label>
                            <input type="email" placeholder="passenger@example.com" value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className={`w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${showRequiredError('email') ? 'border-red-400 text-red-700 focus:ring-red-500' : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'}`}
                            />
                            {showRequiredError('email') && <p className="text-[11px] font-semibold text-red-600">Email ID is required.</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderPhoneField('contact1', 'Contact Number 1', true, contact1Ref)}
                            {renderPhoneField('contact2', 'Contact Number 2 (Optional)', false, contact2Ref)}
                        </div>
                    </div>

                    {/* ── WEEKLY SCHEDULE ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <MdCalendarToday size={18} className="text-[#004D6D]" />
                            <h2 className="text-[14px] font-bold text-gray-900">Weekly Schedule</h2>
                            <span className="text-[11px] text-red-500 font-semibold ml-1">*</span>
                        </div>
                        <p className="text-[12px] text-gray-500 mb-4">
                            Select the days this passenger is active each week.
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                            {WEEKDAYS.map((day) => {
                                const active = form.weeklySchedule[day.key];
                                return (
                                    <button
                                        key={day.key}
                                        type="button"
                                        onClick={() => toggleDay(day.key)}
                                        className={`w-11 h-11 rounded-xl text-[13px] font-bold transition-all select-none
                                            ${active
                                                ? 'bg-[#004D6D] text-white shadow-sm'
                                                : 'bg-white text-gray-400 border border-gray-200 hover:border-[#004D6D] hover:text-[#004D6D]'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>

                        {submitAttempted && activeDayCount === 0 && (
                            <p className="text-[11px] font-semibold text-red-600 mt-2">
                                Please select at least one active day.
                            </p>
                        )}

                        {activeDayCount > 0 && (
                            <p className="text-[11px] text-[#004D6D] font-semibold mt-3">
                                {activeDayCount} day{activeDayCount !== 1 ? 's' : ''} selected per week
                            </p>
                        )}
                    </div>

                    {/* ── PRIMARY + EDUCATIONAL SITE (row 1) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Primary Address */}
                        <LocationCard
                            title="Primary Address"
                            icon={<MdHome size={16} className="text-[#004D6D]" />}
                            iconColor="bg-blue-50"
                            badgeLabel="Required"
                            badgeColor="bg-blue-50 text-[#004D6D]"
                            addressKey="primaryAddress"
                            postcodeKey="primaryPostcode"
                            location={primaryLocation}
                            geoError={geoState.primary.error}
                            geocoding={geoState.primary.loading}
                            onAddressChange={(v) => updateLocation(setPrimaryLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setPrimaryLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('primary', primaryLocation.address, primaryLocation.postcode)}
                            onRelocate={() => triggerGeocode('primary', primaryLocation.address, primaryLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setPrimaryLocation, { lat: latlng.lat, lng: latlng.lng })}
                            showRequiredError={showRequiredError}
                            required
                            hint="Default morning pickup location."
                        >
                            {/* Pick-up time lives here */}
                            <label className="text-[12px] font-semibold text-gray-700">
                                Pick-up Time<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={form.pickupTime}
                                onChange={(e) => handleChange('pickupTime', e.target.value)}
                                className={timeClass('pickupTime')}
                            />
                            {showRequiredError('pickupTime') && (
                                <p className="text-[11px] font-semibold text-red-600">Pick-up Time is required.</p>
                            )}
                        </LocationCard>

                        {/* Educational Site Address 1 */}
                        <LocationCard
                            title="Educational Site Address 1"
                            icon={<MdSchool size={16} className="text-orange-500" />}
                            iconColor="bg-orange-50"
                            badgeLabel="Required"
                            badgeColor="bg-orange-50 text-orange-600"
                            addressKey="educationalAddress"
                            postcodeKey="educationalPostcode"
                            location={educationalLocation}
                            geoError={geoState.educational.error}
                            geocoding={geoState.educational.loading}
                            onAddressChange={(v) => updateLocation(setEducationalLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setEducationalLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('educational', educationalLocation.address, educationalLocation.postcode)}
                            onRelocate={() => triggerGeocode('educational', educationalLocation.address, educationalLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setEducationalLocation, { lat: latlng.lat, lng: latlng.lng })}
                            showRequiredError={showRequiredError}
                            required
                            hint="Used for drop-off journey scheduling."
                        >
                            {/* Drop-off time lives here */}
                            <label className="text-[12px] font-semibold text-gray-700">
                                Drop-off Time<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={form.returnTime}
                                onChange={(e) => handleChange('returnTime', e.target.value)}
                                className={timeClass('returnTime')}
                            />
                            {showRequiredError('returnTime') && (
                                <p className="text-[11px] font-semibold text-red-600">Drop-off Time is required.</p>
                            )}
                        </LocationCard>
                    </div>

                    {/* ── SECONDARY + RESPITE (row 2, optional) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Secondary Address */}
                        <LocationCard
                            title="Secondary Address"
                            icon={<MdLocationOn size={16} className="text-purple-500" />}
                            iconColor="bg-purple-50"
                            badgeLabel="Optional"
                            badgeColor="bg-gray-100 text-gray-500"
                            addressKey="_secondary_unused"
                            postcodeKey="_secondary_postcode_unused"
                            location={secondaryLocation}
                            geoError={geoState.secondary.error}
                            geocoding={geoState.secondary.loading}
                            onAddressChange={(v) => updateLocation(setSecondaryLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setSecondaryLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('secondary', secondaryLocation.address, secondaryLocation.postcode)}
                            onRelocate={() => triggerGeocode('secondary', secondaryLocation.address, secondaryLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setSecondaryLocation, { lat: latlng.lat, lng: latlng.lng })}
                            showRequiredError={() => false}
                            required={false}
                            hint="Alternative pickup location if needed."
                        />

                        {/* Respite Address */}
                        <LocationCard
                            title="Respite Address"
                            icon={<MdHotel size={16} className="text-teal-500" />}
                            iconColor="bg-teal-50"
                            badgeLabel="Optional"
                            badgeColor="bg-gray-100 text-gray-500"
                            addressKey="_respite_unused"
                            postcodeKey="_respite_postcode_unused"
                            location={respiteLocation}
                            geoError={geoState.respite.error}
                            geocoding={geoState.respite.loading}
                            onAddressChange={(v) => updateLocation(setRespiteLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setRespiteLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('respite', respiteLocation.address, respiteLocation.postcode)}
                            onRelocate={() => triggerGeocode('respite', respiteLocation.address, respiteLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setRespiteLocation, { lat: latlng.lat, lng: latlng.lng })}
                            showRequiredError={() => false}
                            required={false}
                            hint="Used for occasional respite pickups or drop-offs."
                        />
                    </div>

                    {/* ── ACCESSIBILITY + NOTES ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdAccessible size={18} className="text-blue-500" />
                                <h2 className="text-[13px] font-bold text-gray-900">Accessibility</h2>
                            </div>

                            <p className="text-[12px] font-semibold text-gray-700 mb-3">Wheelchair Requirement</p>
                            <div className="flex items-center gap-6">
                                {['yes', 'no'].map((v) => (
                                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="wheelchair" value={v} checked={form.wheelchair === v}
                                            onChange={() => handleChange('wheelchair', v)} className="w-4 h-4 accent-[#004D6D]" />
                                        <span className="text-[13px] text-gray-700">{v === 'yes' ? 'Yes' : 'No'}</span>
                                    </label>
                                ))}
                            </div>

                            <p className="text-[12px] font-semibold text-gray-700 mt-4 mb-3">Harness Requirement</p>
                            <div className="flex items-center gap-6">
                                {['yes', 'no'].map((v) => (
                                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="harness" value={v} checked={form.harness === v}
                                            onChange={() => handleChange('harness', v)} className="w-4 h-4 accent-[#004D6D]" />
                                        <span className="text-[13px] text-gray-700">{v === 'yes' ? 'Yes' : 'No'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdOutlineNotes size={18} className="text-[#004D6D]" />
                                <h2 className="text-[13px] font-bold text-gray-900">Notes (Optional)</h2>
                            </div>
                            <textarea
                                rows={4}
                                placeholder="Medical notes, behavior instructions..."
                                maxLength={noteMax}
                                value={form.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D] resize-none"
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">{form.notes.length} / {noteMax} characters</p>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Schedule Summary ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
                        <div className="bg-[#004D6D] px-5 py-4">
                            <h3 className="text-[14px] font-bold text-white">Schedule Summary</h3>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Active days */}
                            <div>
                                <div className="text-[11px] text-gray-500 font-medium mb-2">Active Days</div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {WEEKDAYS.map((day) => (
                                        <span key={day.key}
                                            className={`w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center
                                                ${form.weeklySchedule[day.key]
                                                    ? 'bg-[#004D6D] text-white'
                                                    : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {day.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Morning Pickup */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <MdSettings size={18} className="text-gray-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">Morning Pickup</div>
                                    <div className="text-[15px] font-bold text-gray-800 mt-0.5">
                                        {form.pickupTime || <span className="text-gray-400 font-bold">-- : --</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Drop-Off */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                    <MdSchool size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">Drop-Off</div>
                                    <div className="text-[15px] font-bold text-gray-800 mt-0.5">
                                        {form.returnTime || <span className="text-gray-400 font-bold">-- : --</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Wheelchair Access</span>
                                    <span className={`text-[12px] font-semibold ${form.wheelchair === 'yes' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {form.wheelchair === 'yes' ? 'Required' : 'Not Required'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Harness</span>
                                    <span className={`text-[12px] font-semibold ${form.harness === 'yes' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {form.harness === 'yes' ? 'Required' : 'Not Required'}
                                    </span>
                                </div>

                                {/* Optional locations status */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Secondary Address</span>
                                    <span className={`text-[12px] font-semibold ${secondaryLocation.address ? 'text-[#004D6D]' : 'text-gray-400'}`}>
                                        {secondaryLocation.address ? 'Added' : 'Not set'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Respite Address</span>
                                    <span className={`text-[12px] font-semibold ${respiteLocation.address ? 'text-[#004D6D]' : 'text-gray-400'}`}>
                                        {respiteLocation.address ? 'Added' : 'Not set'}
                                    </span>
                                </div>

                                {/* Form Completion */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[12px] text-gray-600">Form Completion</span>
                                        <span className="text-[12px] font-bold text-[#004D6D]">{completion}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#004D6D] rounded-full transition-all duration-300" style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 pt-2">
                                <MdInfo size={15} className="text-gray-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    Summary updates live as you fill in the details. Please ensure all mandatory fields are accurate.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sticky Bottom Footer ── */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                    <HiExclamationCircle size={16} className="text-red-500 shrink-0" />
                    <span className="text-[12px] text-red-500">
                        Please fill in all required fields marked with <span className="font-bold">*</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/team/users/passengers')}
                        className="px-5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all rounded-lg">
                        Cancel
                    </button>
                    <button type="button" onClick={() => savePassenger(false)} disabled={submitting}
                        className="px-5 py-2 border border-gray-300 rounded-lg text-[13px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        {submitting ? 'Saving...' : 'Save & Add Another'}
                    </button>
                    <button type="button" onClick={() => savePassenger(true)} disabled={submitting}
                        className="px-5 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm opacity-80 disabled:opacity-60 disabled:cursor-not-allowed">
                        {submitting ? 'Saving...' : 'Save Passenger'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewPassenger;