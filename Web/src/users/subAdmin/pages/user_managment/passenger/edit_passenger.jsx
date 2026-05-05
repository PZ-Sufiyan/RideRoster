import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import {
    getPassengerWithLocations,
    updatePassenger,
    upsertPassengerLocation,
    syncPassengerSchedules,
} from '../../../../../services/passengerService';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { ShimmerBlock } from '../../../../../utils/Shimmer';
import { useSubAdminPermissions } from '../../../../../context/subAdminPermissionsContext';

// ── Phone hydration helper ────────────────────────────────────────────────────
// Given a stored E.164 string (e.g. "+923060657065"), returns the detected
// country code (e.g. "PK") and the national number (e.g. "3060657065")
// so the country selector and input field are both correct on load.
function hydratePhone(e164) {
    if (!e164) return { country: 'GB', nationalNumber: '' };
    try {
        const parsed = parsePhoneNumberFromString(e164);
        if (parsed && parsed.isValid()) {
            return {
                country: parsed.country || 'GB',
                nationalNumber: parsed.nationalNumber || e164,
            };
        }
    } catch {
        // fall through
    }
    return { country: 'GB', nationalNumber: e164 };
}

// ── Leaflet setup ─────────────────────────────────────────────────────────────

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS = [
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' },
    { key: 'sun', label: 'S' },
];

const EMPTY_LOCATION = { address: '', postcode: '', lat: null, lng: null, locationConfirmed: false };

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── LocationCard (edit-capable) ───────────────────────────────────────────────

const LocationCard = ({
    title, icon, iconColor, badgeLabel, badgeColor,
    location, geoError, geocoding,
    onAddressChange, onPostcodeChange, onPostcodeBlur, onRelocate, onPinDrag,
    required = false, hint,
    addressError, postcodeError,
    children, // time field slot
}) => {
    const baseInput = 'w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1';
    const normalBorder = 'border-gray-200 text-gray-700 focus:ring-[#004D6D]';
    const errorBorder = 'border-red-400 text-red-700 focus:ring-red-500';

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
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

            <div className="space-y-1.5 mb-3">
                <label className="text-[12px] font-semibold text-gray-700">
                    Address{required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                    rows={3}
                    placeholder="Enter full address..."
                    value={location.address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    className={`${baseInput} resize-none ${addressError ? errorBorder : normalBorder}`}
                />
                {addressError && <p className="text-[11px] font-semibold text-red-600">Address is required.</p>}
            </div>

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
                            className={`${baseInput} ${postcodeError ? errorBorder : normalBorder}`}
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
                    {postcodeError && <p className="text-[11px] font-semibold text-red-600">Post Code is required.</p>}
                    {geoError && <p className="text-[11px] font-semibold text-red-600">Could not locate address. Check and try again.</p>}
                </div>
                {children && <div className="space-y-1.5">{children}</div>}
            </div>

            {hint && <p className="text-[11px] text-gray-400 italic mb-1">{hint}</p>}

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

const EditPassenger = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can } = useSubAdminPermissions();
    const canEditProfiles = can('edit_profiles');

    if (!canEditProfiles) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You do not have permission to edit user profiles.
            </div>
        );
    }

    // ── Loading state ────────────────────────────────────────────────────────
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    // ── Phone country selector ───────────────────────────────────────────────
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
    const [phoneCountriesByField, setPhoneCountriesByField] = useState({ contact1: 'GB', contact2: 'GB' });
    const [phoneTouched, setPhoneTouched] = useState({ contact1: false, contact2: false });
    const [openCountryDropdown, setOpenCountryDropdown] = useState({ contact1: false, contact2: false });
    const contact1Ref = useRef(null);
    const contact2Ref = useRef(null);

    // ── Form state ───────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        firstName: '', surname: '', email: '',
        contact1: '', contact2: '',
        pickupTime: '', returnTime: '',
        wheelchair: 'no', harness: 'no',
        notes: '',
        weeklySchedule: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
    });

    const [primaryLocation, setPrimaryLocation] = useState({ ...EMPTY_LOCATION });
    const [secondaryLocation, setSecondaryLocation] = useState({ ...EMPTY_LOCATION });
    const [educationalLocation, setEducationalLocation] = useState({ ...EMPTY_LOCATION });
    const [respiteLocation, setRespiteLocation] = useState({ ...EMPTY_LOCATION });

    const [geoState, setGeoState] = useState({
        primary: { loading: false, error: false },
        secondary: { loading: false, error: false },
        educational: { loading: false, error: false },
        respite: { loading: false, error: false },
    });

    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ── Load existing data ───────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            setPageLoading(true);
            setPageError('');
            try {
                const { passenger: p, locations } = await getPassengerWithLocations(id);
                if (cancelled) return;
                if (!p) { setPageError('Passenger not found.'); return; }

                // Parse stored E.164 numbers to detect country + national number
                const c1 = hydratePhone(p.contact_number_1);
                const c2 = hydratePhone(p.contact_number_2);

                // Populate form with renamed columns (fallback to old names for safety)
                setForm({
                    firstName: p.first_name || '',
                    surname: p.surname || '',
                    email: p.email || '',
                    contact1: c1.nationalNumber,
                    contact2: c2.nationalNumber,
                    pickupTime: String(p.primary_pickup_time ?? p.pickup_time ?? '').slice(0, 5),
                    returnTime: String(p.educational_site_dropoff_time ?? p.dropoff_time ?? '').slice(0, 5),
                    wheelchair: p.wheelchair_required ? 'yes' : 'no',
                    harness: p.harness_required ? 'yes' : 'no',
                    notes: p.notes || '',
                    weeklySchedule: p.weekly_schedule || { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
                });

                // Set correct country codes for both phone fields
                setPhoneCountriesByField({
                    contact1: c1.country,
                    contact2: c2.country,
                });

                // Primary address
                const primAddr = p.primary_pickup_address ?? p.pickup_address ?? '';
                const primPost = p.primary_pickup_postcode ?? p.pickup_postal_code ?? '';
                const primLat = parseFloat(p.primary_pickup_latitude ?? p.pickup_latitude) || null;
                const primLng = parseFloat(p.primary_pickup_longitude ?? p.pickup_longitude) || null;
                setPrimaryLocation({ address: primAddr, postcode: primPost, lat: primLat, lng: primLng, locationConfirmed: Boolean(primLat && primLng) });

                // Educational site
                const eduAddr = p.educational_site_address ?? p.dropoff_address ?? '';
                const eduPost = p.educational_site_postcode ?? p.dropoff_postal_code ?? '';
                const eduLat = parseFloat(p.educational_site_latitude ?? p.dropoff_latitude) || null;
                const eduLng = parseFloat(p.educational_site_longitude ?? p.dropoff_longitude) || null;
                setEducationalLocation({ address: eduAddr, postcode: eduPost, lat: eduLat, lng: eduLng, locationConfirmed: Boolean(eduLat && eduLng) });

                // Optional locations from passenger_locations
                const secondary = locations.find((l) => l.location_type === 'secondary_pickup');
                if (secondary) {
                    setSecondaryLocation({
                        address: secondary.address || '', postcode: secondary.postcode || '',
                        lat: parseFloat(secondary.latitude) || null, lng: parseFloat(secondary.longitude) || null,
                        locationConfirmed: Boolean(secondary.latitude && secondary.longitude),
                    });
                }

                const respite = locations.find((l) => l.location_type === 'respite');
                if (respite) {
                    setRespiteLocation({
                        address: respite.address || '', postcode: respite.postcode || '',
                        lat: parseFloat(respite.latitude) || null, lng: parseFloat(respite.longitude) || null,
                        locationConfirmed: Boolean(respite.latitude && respite.longitude),
                    });
                }
            } catch (err) {
                if (!cancelled) setPageError(err?.message || 'Failed to load passenger.');
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    // ── Outside click for phone dropdowns ────────────────────────────────────
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

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
    const toggleDay = (day) => setForm((prev) => ({
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

    // ── Phone validation ─────────────────────────────────────────────────────
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
    const contact2Phone = validatePhone(form.contact2, phoneCountriesByField.contact2, { label: 'Contact Number 2' });
    const showContact1Error = (submitAttempted || phoneTouched.contact1) && !!contact1Phone.error;
    const showContact2Error = (submitAttempted || phoneTouched.contact2) && !!contact2Phone.error;

    // ── Required field validation ─────────────────────────────────────────────
    const noteMax = 500;
    const fieldValues = useMemo(() => ({
        firstName: form.firstName, surname: form.surname, email: form.email,
        contact1: form.contact1, pickupTime: form.pickupTime, returnTime: form.returnTime,
        primaryAddress: primaryLocation.address, primaryPostcode: primaryLocation.postcode,
        educationalAddress: educationalLocation.address, educationalPostcode: educationalLocation.postcode,
    }), [form, primaryLocation, educationalLocation]);

    const requiredKeys = ['firstName', 'surname', 'contact1', 'primaryAddress', 'primaryPostcode', 'pickupTime', 'educationalAddress', 'educationalPostcode', 'returnTime'];
    const isMissing = (key) => !String(fieldValues[key] || '').trim();
    const showRequiredError = (key) => submitAttempted && isMissing(key);

    // ── Completion % ─────────────────────────────────────────────────────────
    const completion = useMemo(() => {
        const filled = requiredKeys.filter((k) => !isMissing(k)).length;
        const activeDays = Object.values(form.weeklySchedule).filter(Boolean).length;
        return Math.round(((filled + (activeDays > 0 ? 1 : 0)) / (requiredKeys.length + 1)) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldValues, form.weeklySchedule]);

    const activeDayCount = Object.values(form.weeklySchedule).filter(Boolean).length;
    const pushToast = (type, message) =>
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, autoClose: true, duration: 3500 }]);

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSubmitAttempted(true);

        if (requiredKeys.some((k) => isMissing(k))) {
            pushToast('warning', 'Please fill in all required fields before saving.');
            return;
        }
        if (activeDayCount === 0) {
            pushToast('warning', 'Please select at least one active day in the weekly schedule.');
            return;
        }
        if (!primaryLocation.locationConfirmed) {
            pushToast('warning', 'Please confirm the Primary Address location on the map.');
            return;
        }
        if (!educationalLocation.locationConfirmed) {
            pushToast('warning', 'Please confirm the Educational Site location on the map.');
            return;
        }
        if (contact1Phone.error || contact2Phone.error) {
            pushToast('warning', 'Please fix invalid contact number format.');
            return;
        }

        setSubmitting(true);
        try {
            const updates = {
                first_name: form.firstName.trim(),
                surname: form.surname.trim(),
                email: form.email.trim().toLowerCase() || null,
                contact_number_1: contact1Phone.e164 || form.contact1.trim(),
                contact_number_2: contact2Phone.e164 || form.contact2.trim() || null,
                primary_pickup_address: primaryLocation.address.trim(),
                primary_pickup_postcode: primaryLocation.postcode.trim(),
                primary_pickup_time: form.pickupTime,
                primary_pickup_latitude: primaryLocation.lat ?? null,
                primary_pickup_longitude: primaryLocation.lng ?? null,
                educational_site_address: educationalLocation.address.trim(),
                educational_site_postcode: educationalLocation.postcode.trim(),
                educational_site_dropoff_time: form.returnTime,
                educational_site_latitude: educationalLocation.lat ?? null,
                educational_site_longitude: educationalLocation.lng ?? null,
                wheelchair_required: form.wheelchair === 'yes',
                harness_required: form.harness === 'yes',
                notes: form.notes.trim() || null,
                weekly_schedule: form.weeklySchedule,
            };

            // 1. Update the passenger profile row
            const updatedPassenger = await updatePassenger(id, updates);

            // 2. Upsert optional locations only if address is filled
            const optionals = [
                { type: 'secondary_pickup', loc: secondaryLocation },
                { type: 'respite', loc: respiteLocation },
            ];
            await Promise.all(
                optionals
                    .filter(({ loc }) => loc.address.trim())
                    .map(({ type, loc }) =>
                        upsertPassengerLocation(id, type, {
                            address: loc.address,
                            postcode: loc.postcode,
                            lat: loc.lat,
                            lng: loc.lng,
                        })
                    )
            );

            // 3. Sync passenger_schedules — regenerate base rows for all assigned jobs
            // This picks up changes to weekly_schedule, addresses, and times
            await syncPassengerSchedules(updatedPassenger);

            // Stay on this page after save; just show success feedback
            pushToast('success', 'Passenger updated successfully. Schedules synced.');
        } catch (err) {
            pushToast('error', err?.message || 'Could not save changes.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Phone field renderer ──────────────────────────────────────────────────
    const renderPhoneField = (fieldKey, label, required, ref) => {
        const hasError = fieldKey === 'contact1' ? showContact1Error : showContact2Error;
        const phoneResult = fieldKey === 'contact1' ? contact1Phone : contact2Phone;
        const borderClass = hasError
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
                {required && showRequiredError(fieldKey) && <p className="text-[11px] font-semibold text-red-600">{label} is required.</p>}
                {hasError && <p className="text-[11px] font-semibold text-red-600">{phoneResult.error}</p>}
            </div>
        );
    };

    const timeClass = (key) =>
        `w-full px-3 py-2.5 border rounded-lg text-[13px] focus:outline-none focus:ring-1 ${
            showRequiredError(key)
                ? 'border-red-400 text-red-700 focus:ring-red-500'
                : 'border-gray-200 text-gray-500 focus:ring-[#004D6D]'
        }`;

    // ── Loading / error states ────────────────────────────────────────────────
    if (pageLoading) {
        return (
            <div className="space-y-5 pb-20">
                <ShimmerBlock className="h-7 w-40 rounded-md" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                                <ShimmerBlock className="h-4 w-40 rounded-md" />
                                <div className="grid grid-cols-2 gap-4">
                                    {[...Array(4)].map((_, j) => <ShimmerBlock key={j} className="h-10 rounded-lg" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <ShimmerBlock className="h-64 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {pageError}
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-20">
            <ToastStack toasts={toasts} onClose={(tid) => setToasts((prev) => prev.filter((t) => t.id !== tid))} />

            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Edit Passenger</h1>
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
                                <input type="text" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${showRequiredError('firstName') ? 'border-red-400 text-red-700 focus:ring-red-500' : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'}`} />
                                {showRequiredError('firstName') && <p className="text-[11px] font-semibold text-red-600">First Name is required.</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">Surname<span className="text-red-500">*</span></label>
                                <input type="text" value={form.surname} onChange={(e) => handleChange('surname', e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${showRequiredError('surname') ? 'border-red-400 text-red-700 focus:ring-red-500' : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'}`} />
                                {showRequiredError('surname') && <p className="text-[11px] font-semibold text-red-600">Surname is required.</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                            <label className="text-[12px] font-semibold text-gray-700">Email ID</label>
                            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D]" />
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
                        <p className="text-[12px] text-gray-500 mb-4">Select the days this passenger travels each week.</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {WEEKDAYS.map((day) => {
                                const active = form.weeklySchedule[day.key];
                                return (
                                    <button
                                        key={day.key}
                                        type="button"
                                        onClick={() => toggleDay(day.key)}
                                        className={`w-11 h-11 rounded-xl text-[13px] font-bold transition-all select-none ${
                                            active
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
                            <p className="text-[11px] font-semibold text-red-600 mt-2">Please select at least one active day.</p>
                        )}
                        {activeDayCount > 0 && (
                            <p className="text-[11px] text-[#004D6D] font-semibold mt-3">
                                {activeDayCount} day{activeDayCount !== 1 ? 's' : ''} selected per week
                            </p>
                        )}
                    </div>

                    {/* ── PRIMARY + EDUCATIONAL (row 1) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <LocationCard
                            title="Primary Address"
                            icon={<MdHome size={16} className="text-[#004D6D]" />}
                            iconColor="bg-blue-50"
                            badgeLabel="Required"
                            badgeColor="bg-blue-50 text-[#004D6D]"
                            location={primaryLocation}
                            geoError={geoState.primary.error}
                            geocoding={geoState.primary.loading}
                            onAddressChange={(v) => updateLocation(setPrimaryLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setPrimaryLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('primary', primaryLocation.address, primaryLocation.postcode)}
                            onRelocate={() => triggerGeocode('primary', primaryLocation.address, primaryLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setPrimaryLocation, { lat: latlng.lat, lng: latlng.lng })}
                            required
                            addressError={showRequiredError('primaryAddress')}
                            postcodeError={showRequiredError('primaryPostcode')}
                            hint="Default morning pickup location."
                        >
                            <label className="text-[12px] font-semibold text-gray-700">
                                Pick-up Time<span className="text-red-500">*</span>
                            </label>
                            <input type="time" value={form.pickupTime} onChange={(e) => handleChange('pickupTime', e.target.value)} className={timeClass('pickupTime')} />
                            {showRequiredError('pickupTime') && <p className="text-[11px] font-semibold text-red-600">Pick-up Time is required.</p>}
                        </LocationCard>

                        <LocationCard
                            title="Educational Site Address 1"
                            icon={<MdSchool size={16} className="text-orange-500" />}
                            iconColor="bg-orange-50"
                            badgeLabel="Required"
                            badgeColor="bg-orange-50 text-orange-600"
                            location={educationalLocation}
                            geoError={geoState.educational.error}
                            geocoding={geoState.educational.loading}
                            onAddressChange={(v) => updateLocation(setEducationalLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setEducationalLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('educational', educationalLocation.address, educationalLocation.postcode)}
                            onRelocate={() => triggerGeocode('educational', educationalLocation.address, educationalLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setEducationalLocation, { lat: latlng.lat, lng: latlng.lng })}
                            required
                            addressError={showRequiredError('educationalAddress')}
                            postcodeError={showRequiredError('educationalPostcode')}
                            hint="Used for drop-off journey scheduling."
                        >
                            <label className="text-[12px] font-semibold text-gray-700">
                                Drop-off Time<span className="text-red-500">*</span>
                            </label>
                            <input type="time" value={form.returnTime} onChange={(e) => handleChange('returnTime', e.target.value)} className={timeClass('returnTime')} />
                            {showRequiredError('returnTime') && <p className="text-[11px] font-semibold text-red-600">Drop-off Time is required.</p>}
                        </LocationCard>
                    </div>

                    {/* ── SECONDARY + RESPITE (row 2) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <LocationCard
                            title="Secondary Address"
                            icon={<MdLocationOn size={16} className="text-purple-500" />}
                            iconColor="bg-purple-50"
                            badgeLabel="Optional"
                            badgeColor="bg-gray-100 text-gray-500"
                            location={secondaryLocation}
                            geoError={geoState.secondary.error}
                            geocoding={geoState.secondary.loading}
                            onAddressChange={(v) => updateLocation(setSecondaryLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setSecondaryLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('secondary', secondaryLocation.address, secondaryLocation.postcode)}
                            onRelocate={() => triggerGeocode('secondary', secondaryLocation.address, secondaryLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setSecondaryLocation, { lat: latlng.lat, lng: latlng.lng })}
                            addressError={false}
                            postcodeError={false}
                            hint="Alternative pickup location if needed."
                        />

                        <LocationCard
                            title="Respite Address"
                            icon={<MdHotel size={16} className="text-teal-500" />}
                            iconColor="bg-teal-50"
                            badgeLabel="Optional"
                            badgeColor="bg-gray-100 text-gray-500"
                            location={respiteLocation}
                            geoError={geoState.respite.error}
                            geocoding={geoState.respite.loading}
                            onAddressChange={(v) => updateLocation(setRespiteLocation, { address: v, locationConfirmed: false })}
                            onPostcodeChange={(v) => updateLocation(setRespiteLocation, { postcode: v })}
                            onPostcodeBlur={() => triggerGeocode('respite', respiteLocation.address, respiteLocation.postcode)}
                            onRelocate={() => triggerGeocode('respite', respiteLocation.address, respiteLocation.postcode)}
                            onPinDrag={(latlng) => updateLocation(setRespiteLocation, { lat: latlng.lat, lng: latlng.lng })}
                            addressError={false}
                            postcodeError={false}
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
                            <div className="flex items-center gap-6 mb-4">
                                {['yes', 'no'].map((v) => (
                                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="wheelchair" value={v} checked={form.wheelchair === v}
                                            onChange={() => handleChange('wheelchair', v)} className="w-4 h-4 accent-[#004D6D]" />
                                        <span className="text-[13px] text-gray-700">{v === 'yes' ? 'Yes' : 'No'}</span>
                                    </label>
                                ))}
                            </div>

                            <p className="text-[12px] font-semibold text-gray-700 mb-3">Harness Requirement</p>
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

                            {/* Active days mini display */}
                            <div>
                                <div className="text-[11px] text-gray-500 font-medium mb-2">Active Days</div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {WEEKDAYS.map((day) => (
                                        <span key={day.key}
                                            className={`w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                                                form.weeklySchedule[day.key] ? 'bg-[#004D6D] text-white' : 'bg-gray-100 text-gray-400'
                                            }`}
                                        >
                                            {day.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Pickup time */}
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

                            {/* Drop-off time */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                    <MdSchool size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">School Drop-Off</div>
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
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Secondary Address</span>
                                    <span className={`text-[12px] font-semibold ${secondaryLocation.address ? 'text-[#004D6D]' : 'text-gray-400'}`}>
                                        {secondaryLocation.address ? 'Set' : 'Not set'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Respite Address</span>
                                    <span className={`text-[12px] font-semibold ${respiteLocation.address ? 'text-[#004D6D]' : 'text-gray-400'}`}>
                                        {respiteLocation.address ? 'Set' : 'Not set'}
                                    </span>
                                </div>

                                {/* Completion */}
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
                                    Saving will update the passenger profile and all optional locations immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sticky Footer ── */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                    <HiExclamationCircle size={16} className="text-red-500 shrink-0" />
                    <span className="text-[12px] text-red-500">
                        Please fill in all required fields marked with <span className="font-bold">*</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/subadmin/users/passengers/${id}`)}
                        className="px-5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={submitting}
                        className="px-5 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPassenger;