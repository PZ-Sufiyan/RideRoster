import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdPerson,
    MdHome,
    MdSchool,
    MdAccessible,
    MdOutlineNotes,
    MdAccessTime,
    MdSettings,
    MdInfo,
    MdArrowDropDown,
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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const geocodeAddress = async (address, postcode) => {
    const query = `${address}, ${postcode}, UK`;
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'RideRoster' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
    };
};

function DraggableMarker({ position, onDragEnd }) {
    return (
        <Marker
            position={position}
            draggable
            eventHandlers={{
                dragend: (e) => onDragEnd(e.target.getLatLng()),
            }}
        />
    );
}

const AddNewPassenger = () => {
    const navigate = useNavigate();
    const countryNameDisplay = useMemo(() => new Intl.DisplayNames(['en'], { type: 'region' }), []);
    const phoneCountries = useMemo(
        () =>
            getCountries()
                .map((countryCode) => ({
                    code: countryCode,
                    callingCode: `+${getCountryCallingCode(countryCode)}`,
                    name: countryNameDisplay.of(countryCode) || countryCode,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [countryNameDisplay]
    );

    const [form, setForm] = useState({
        firstName: '',
        surname: '',
        email: '',
        contact1: '',
        contact2: '',
        homeAddress: '',
        homePostcode: '',
        pickupTime: '',
        schoolAddress: '',
        schoolPostcode: '',
        returnTime: '',
        wheelchair: 'no',
        notes: '',
        pickupLat: null,
        pickupLng: null,
        dropoffLat: null,
        dropoffLng: null,
        pickupLocationConfirmed: false,
        dropoffLocationConfirmed: false,
    });
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pickupGeoError, setPickupGeoError] = useState(false);
    const [dropoffGeoError, setDropoffGeoError] = useState(false);
    const [pickupGeocoding, setPickupGeocoding] = useState(false);
    const [dropoffGeocoding, setDropoffGeocoding] = useState(false);
    const [phoneCountriesByField, setPhoneCountriesByField] = useState({
        contact1: 'GB',
        contact2: 'GB',
    });
    const [phoneTouched, setPhoneTouched] = useState({ contact1: false, contact2: false });
    const [openCountryDropdown, setOpenCountryDropdown] = useState({ contact1: false, contact2: false });
    const contact1CountryWrapRef = useRef(null);
    const contact2CountryWrapRef = useRef(null);

    const handleChange = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const runGeocode = async (type, address, postcode) => {
        const setGeocoding = type === 'pickup' ? setPickupGeocoding : setDropoffGeocoding;
        const setGeoError = type === 'pickup' ? setPickupGeoError : setDropoffGeoError;
        const latKey = type === 'pickup' ? 'pickupLat' : 'dropoffLat';
        const lngKey = type === 'pickup' ? 'pickupLng' : 'dropoffLng';
        const confirmedKey = type === 'pickup' ? 'pickupLocationConfirmed' : 'dropoffLocationConfirmed';

        setGeocoding(true);
        setGeoError(false);
        try {
            const result = await geocodeAddress(address, postcode);
            if (result) {
                setForm((prev) => ({
                    ...prev,
                    [latKey]: result.lat,
                    [lngKey]: result.lng,
                    [confirmedKey]: true,
                }));
            } else {
                setGeoError(true);
                setForm((prev) => ({ ...prev, [confirmedKey]: false }));
            }
        } catch {
            setGeoError(true);
            setForm((prev) => ({ ...prev, [confirmedKey]: false }));
        } finally {
            setGeocoding(false);
        }
    };

    const noteMax = 500;

    const goBack = () => navigate('/admin/users/passengers');

    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                type,
                message,
                autoClose: true,
                duration: 3500,
            },
        ]);
    };

    const requiredKeys = [
        'firstName',
        'surname',
        'email',
        'contact1',
        'homeAddress',
        'homePostcode',
        'pickupTime',
        'schoolAddress',
        'schoolPostcode',
        'returnTime',
    ];

    const clearForm = () => {
        setForm({
          firstName: '',
          surname: '',
          email: '',
          contact1: '',
          contact2: '',
          homeAddress: '',
          homePostcode: '',
          pickupTime: '',
          schoolAddress: '',
          schoolPostcode: '',
          returnTime: '',
          wheelchair: 'no',
          notes: '',
          pickupLat: null,
          pickupLng: null,
          dropoffLat: null,
          dropoffLng: null,
          pickupLocationConfirmed: false,
          dropoffLocationConfirmed: false,
        });
        setPickupGeoError(false);
        setDropoffGeoError(false);
        setSubmitAttempted(false);
    };

    const isMissing = (key) => !String(form[key] || '').trim();
    const showRequiredError = (key) => submitAttempted && isMissing(key);

    const inputClass = (key) =>
        `w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${
            showRequiredError(key)
                ? 'border-red-400 text-red-700 focus:ring-red-500'
                : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'
        }`;

    const textareaClass = (key) =>
        `w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 resize-none ${
            showRequiredError(key)
                ? 'border-red-400 text-red-700 focus:ring-red-500'
                : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'
        }`;

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (
                contact1CountryWrapRef.current &&
                !contact1CountryWrapRef.current.contains(event.target)
            ) {
                setOpenCountryDropdown((prev) => ({ ...prev, contact1: false }));
            }

            if (
                contact2CountryWrapRef.current &&
                !contact2CountryWrapRef.current.contains(event.target)
            ) {
                setOpenCountryDropdown((prev) => ({ ...prev, contact2: false }));
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    const validateAndFormatPhone = (value, selectedCountry, { required = false, fieldLabel = 'Contact number' } = {}) => {
        const trimmed = String(value || '').trim();
        if (!trimmed) {
            return required ? { error: `${fieldLabel} is required.`, e164: '' } : { error: '', e164: '' };
        }

        try {
            const parsed = parsePhoneNumberFromString(trimmed, selectedCountry);
            if (!parsed || !parsed.isValid()) {
                return {
                    error: `${fieldLabel} is not valid for the selected country code.`,
                    e164: '',
                };
            }

            if (parsed.country && parsed.country !== selectedCountry) {
                return {
                    error: `${fieldLabel} does not match the selected country code.`,
                    e164: '',
                };
            }

            return { error: '', e164: parsed.number };
        } catch {
            return {
                error: `${fieldLabel} has an invalid format.`,
                e164: '',
            };
        }
    };

    const contact1Phone = validateAndFormatPhone(form.contact1, phoneCountriesByField.contact1, {
        required: true,
        fieldLabel: 'Contact Number 1',
    });
    const contact2Phone = validateAndFormatPhone(form.contact2, phoneCountriesByField.contact2, {
        required: false,
        fieldLabel: 'Contact Number 2',
    });
    const showContact1Error = (submitAttempted || phoneTouched.contact1) && !!contact1Phone.error;
    const showContact2Error = (submitAttempted || phoneTouched.contact2) && !!contact2Phone.error;
    const phoneWrapClass = (key, hasError) =>
        `flex items-center border rounded-lg focus-within:ring-1 ${
            hasError || showRequiredError(key)
                ? 'border-red-400 focus-within:ring-red-500'
                : 'border-gray-200 focus-within:ring-[#004D6D]'
        }`;

    const validateForm = () => {
        setSubmitAttempted(true);
        
        const missing = requiredKeys.some((key) => isMissing(key));
        if (missing) {
            pushToast('warning', 'Please fill in all required fields before saving passenger.');
            return false;
        }

        if (!form.pickupLocationConfirmed) {
            pushToast('warning', 'Please confirm the pickup location on the map.');
            return false;
        }
        if (!form.dropoffLocationConfirmed) {
            pushToast('warning', 'Please confirm the drop-off location on the map.');
            return false;
        }

        if (contact1Phone.error || contact2Phone.error) {
            pushToast('warning', 'Please fix invalid contact number format.');
            return false;
        }

        pushToast('success', 'Passenger details are valid and ready to save.');
        return true;
    };

    const savePassenger = async (navigateAfterSave) => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
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
                },
            });

            pushToast('success', 'Passenger registered successfully.');
            if (navigateAfterSave) {
                navigate('/admin/users/passengers');
                return;
            }
            clearForm();
        } catch (err) {
            pushToast('error', err?.message || 'Could not register passenger.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-5 pb-20">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Add New Passenger</h1>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* ── LEFT: main form (2/3 width) ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── PASSENGER DETAILS ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <MdPerson size={20} className="text-[#004D6D]" />
                            <h2 className="text-[14px] font-bold text-gray-900">Passenger Details</h2>
                        </div>

                        {/* First Name + Surname */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    First Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. John"
                                    value={form.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    className={inputClass('firstName')}
                                />
                                {showRequiredError('firstName') && <p className="text-[11px] font-semibold text-red-600">First Name is required.</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Surname<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Doe"
                                    value={form.surname}
                                    onChange={(e) => handleChange('surname', e.target.value)}
                                    className={inputClass('surname')}
                                />
                                {showRequiredError('surname') && <p className="text-[11px] font-semibold text-red-600">Surname is required.</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5 mb-4">
                            <label className="text-[12px] font-semibold text-gray-700">Email ID<span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                placeholder="passenger@example.com"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                            />
                            {showRequiredError('email') && <p className="text-[11px] font-semibold text-red-600">Email ID is required.</p>}
                        </div>

                        {/* Contact Number 1 + 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Contact Number 1<span className="text-red-500">*</span>
                                </label>
                                <div className={phoneWrapClass('contact1', showContact1Error)}>
                                    <div ref={contact1CountryWrapRef} className="relative border-r border-gray-200 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setOpenCountryDropdown((prev) => ({ ...prev, contact1: !prev.contact1 }))}
                                            className="flex items-center gap-1 px-2 py-2.5 bg-gray-50 text-[13px] text-gray-500 font-medium hover:bg-gray-100"
                                        >
                                            <span>
                                                +{getCountryCallingCode(phoneCountriesByField.contact1)}
                                            </span>
                                            <MdArrowDropDown size={16} />
                                        </button>
                                        {openCountryDropdown.contact1 && (
                                            <div className="absolute left-0 top-full mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                                                {phoneCountries.map((country) => (
                                                    <button
                                                        key={`contact1-${country.code}`}
                                                        type="button"
                                                        onClick={() => {
                                                            setPhoneCountriesByField((prev) => ({ ...prev, contact1: country.code }));
                                                            setOpenCountryDropdown((prev) => ({ ...prev, contact1: false }));
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                                                    >
                                                        {country.name} ({country.callingCode})
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Enter phone number"
                                        value={form.contact1}
                                        onChange={(e) => handleChange('contact1', e.target.value)}
                                        onBlur={() => setPhoneTouched((prev) => ({ ...prev, contact1: true }))}
                                        className="flex-1 px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white"
                                    />
                                </div>
                                {showRequiredError('contact1') && <p className="text-[11px] font-semibold text-red-600">Contact Number 1 is required.</p>}
                                {showContact1Error && <p className="text-[11px] font-semibold text-red-600">{contact1Phone.error}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">Contact Number 2 (Optional)</label>
                                <div className={phoneWrapClass('contact2', showContact2Error)}>
                                    <div ref={contact2CountryWrapRef} className="relative border-r border-gray-200 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setOpenCountryDropdown((prev) => ({ ...prev, contact2: !prev.contact2 }))}
                                            className="flex items-center gap-1 px-2 py-2.5 bg-gray-50 text-[13px] text-gray-500 font-medium hover:bg-gray-100"
                                        >
                                            <span>
                                                +{getCountryCallingCode(phoneCountriesByField.contact2)}
                                            </span>
                                            <MdArrowDropDown size={16} />
                                        </button>
                                        {openCountryDropdown.contact2 && (
                                            <div className="absolute left-0 top-full mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                                                {phoneCountries.map((country) => (
                                                    <button
                                                        key={`contact2-${country.code}`}
                                                        type="button"
                                                        onClick={() => {
                                                            setPhoneCountriesByField((prev) => ({ ...prev, contact2: country.code }));
                                                            setOpenCountryDropdown((prev) => ({ ...prev, contact2: false }));
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                                                    >
                                                        {country.name} ({country.callingCode})
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Enter phone number"
                                        value={form.contact2}
                                        onChange={(e) => handleChange('contact2', e.target.value)}
                                        onBlur={() => setPhoneTouched((prev) => ({ ...prev, contact2: true }))}
                                        className="flex-1 px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white"
                                    />
                                </div>
                                {showContact2Error && <p className="text-[11px] font-semibold text-red-600">{contact2Phone.error}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── PICKUP + DROP-OFF ADDRESS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Pickup Address (Home) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdHome size={18} className="text-[#004D6D]" />
                                <h2 className="text-[13px] font-bold text-gray-900">Pickup Address (Home)</h2>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Home Address<span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter full address..."
                                    value={form.homeAddress}
                                    onChange={(e) => handleChange('homeAddress', e.target.value)}
                                    className={textareaClass('homeAddress')}
                                />
                                {showRequiredError('homeAddress') && <p className="text-[11px] font-semibold text-red-600">Home Address is required.</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Post Code<span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={form.homePostcode}
                                            onChange={(e) => handleChange('homePostcode', e.target.value)}
                                            onBlur={() => {
                                                if (form.homeAddress.trim() && form.homePostcode.trim()) {
                                                    runGeocode('pickup', form.homeAddress, form.homePostcode);
                                                }
                                            }}
                                            className={inputClass('homePostcode')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (form.homeAddress.trim() && form.homePostcode.trim()) {
                                                    runGeocode('pickup', form.homeAddress, form.homePostcode);
                                                }
                                            }}
                                            disabled={pickupGeocoding}
                                            className="shrink-0 text-[11px] border border-gray-200 px-2 py-1 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {pickupGeocoding ? '...' : 'Re-locate'}
                                        </button>
                                    </div>
                                    {showRequiredError('homePostcode') && <p className="text-[11px] font-semibold text-red-600">Post Code is required.</p>}
                                    {pickupGeoError && <p className="text-[11px] font-semibold text-red-600">Could not locate address. Please check and try again.</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Pick-up Time<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={form.pickupTime}
                                            onChange={(e) => handleChange('pickupTime', e.target.value)}
                                            className={`w-full px-3 py-2.5 border rounded-lg text-[13px] pr-9 focus:outline-none focus:ring-1 ${
                                                showRequiredError('pickupTime')
                                                    ? 'border-red-400 text-red-700 focus:ring-red-500'
                                                    : 'border-gray-200 text-gray-500 focus:ring-[#004D6D]'
                                            }`}
                                        />
                                    </div>
                                    {showRequiredError('pickupTime') && <p className="text-[11px] font-semibold text-red-600">Pick-up Time is required.</p>}
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 italic">
                                "This is the default morning pickup location."
                            </p>

                            {form.pickupLocationConfirmed && (
                                <div className="mt-3">
                                    <p className="text-[11px] font-semibold text-green-600 mb-1">📍 Location confirmed</p>
                                    <div className="mt-1 rounded-lg overflow-hidden border border-gray-200" style={{ height: 200 }}>
                                        <MapContainer
                                            center={[form.pickupLat, form.pickupLng]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <DraggableMarker
                                                position={[form.pickupLat, form.pickupLng]}
                                                onDragEnd={(latlng) =>
                                                    setForm((prev) => ({ ...prev, pickupLat: latlng.lat, pickupLng: latlng.lng }))
                                                }
                                            />
                                        </MapContainer>
                                    </div>
                                    <p className="text-[11px] text-amber-600 font-semibold mt-1">⚠ Drag pin to adjust if needed</p>
                                </div>
                            )}
                        </div>

                        {/* Drop-Off Address (School) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdSchool size={18} className="text-orange-500" />
                                <h2 className="text-[13px] font-bold text-gray-900">Drop-Off Address (School)</h2>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Drop-Off Address<span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="School name and address..."
                                    value={form.schoolAddress}
                                    onChange={(e) => handleChange('schoolAddress', e.target.value)}
                                    className={textareaClass('schoolAddress')}
                                />
                                {showRequiredError('schoolAddress') && <p className="text-[11px] font-semibold text-red-600">Drop-Off Address is required.</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Post Code<span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={form.schoolPostcode}
                                            onChange={(e) => handleChange('schoolPostcode', e.target.value)}
                                            onBlur={() => {
                                                if (form.schoolAddress.trim() && form.schoolPostcode.trim()) {
                                                    runGeocode('dropoff', form.schoolAddress, form.schoolPostcode);
                                                }
                                            }}
                                            className={inputClass('schoolPostcode')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (form.schoolAddress.trim() && form.schoolPostcode.trim()) {
                                                    runGeocode('dropoff', form.schoolAddress, form.schoolPostcode);
                                                }
                                            }}
                                            disabled={dropoffGeocoding}
                                            className="shrink-0 text-[11px] border border-gray-200 px-2 py-1 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {dropoffGeocoding ? '...' : 'Re-locate'}
                                        </button>
                                    </div>
                                    {showRequiredError('schoolPostcode') && <p className="text-[11px] font-semibold text-red-600">Post Code is required.</p>}
                                    {dropoffGeoError && <p className="text-[11px] font-semibold text-red-600">Could not locate address. Please check and try again.</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Drop-off Time<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={form.returnTime}
                                            onChange={(e) => handleChange('returnTime', e.target.value)}
                                            className={`w-full px-3 py-2.5 border rounded-lg text-[13px] pr-9 focus:outline-none focus:ring-1 ${
                                                showRequiredError('returnTime')
                                                    ? 'border-red-400 text-red-700 focus:ring-red-500'
                                                    : 'border-gray-200 text-gray-500 focus:ring-[#004D6D]'
                                            }`}
                                        />
                                    </div>
                                    {showRequiredError('returnTime') && <p className="text-[11px] font-semibold text-red-600">Drop-off Time is required.</p>}
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 italic">
                                "Used for drop-off journey scheduling."
                            </p>

                            {form.dropoffLocationConfirmed && (
                                <div className="mt-3">
                                    <p className="text-[11px] font-semibold text-green-600 mb-1">📍 Location confirmed</p>
                                    <div className="mt-1 rounded-lg overflow-hidden border border-gray-200" style={{ height: 200 }}>
                                        <MapContainer
                                            center={[form.dropoffLat, form.dropoffLng]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <DraggableMarker
                                                position={[form.dropoffLat, form.dropoffLng]}
                                                onDragEnd={(latlng) =>
                                                    setForm((prev) => ({ ...prev, dropoffLat: latlng.lat, dropoffLng: latlng.lng }))
                                                }
                                            />
                                        </MapContainer>
                                    </div>
                                    <p className="text-[11px] text-amber-600 font-semibold mt-1">⚠ Drag pin to adjust if needed</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ACCESSIBILITY + NOTES ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Accessibility */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdAccessible size={18} className="text-blue-500" />
                                <h2 className="text-[13px] font-bold text-gray-900">Accessibility</h2>
                            </div>

                            <p className="text-[12px] font-semibold text-gray-700 mb-3">Wheelchair Requirement</p>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="wheelchair"
                                        value="yes"
                                        checked={form.wheelchair === 'yes'}
                                        onChange={() => handleChange('wheelchair', 'yes')}
                                        className="w-4 h-4 accent-[#004D6D]"
                                    />
                                    <span className="text-[13px] text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="wheelchair"
                                        value="no"
                                        checked={form.wheelchair === 'no'}
                                        onChange={() => handleChange('wheelchair', 'no')}
                                        className="w-4 h-4 accent-[#004D6D]"
                                    />
                                    <span className="text-[13px] text-gray-700">No</span>
                                </label>
                            </div>
                        </div>

                        {/* Notes (Optional) */}
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
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                {form.notes.length} / {noteMax} characters
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Schedule Summary ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
                        {/* Teal header */}
                        <div className="bg-[#004D6D] px-5 py-4">
                            <h3 className="text-[14px] font-bold text-white">Schedule Summary</h3>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Morning Pickup */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <MdSettings size={18} className="text-gray-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">Morning Pickup</div>
                                    <div className="text-[15px] font-bold text-gray-800 mt-0.5">
                                        {form.pickupTime
                                            ? form.pickupTime
                                            : <span className="text-gray-400 font-bold">-- : --</span>
                                        }
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
                                        {form.returnTime
                                            ? form.returnTime
                                            : <span className="text-gray-400 font-bold">-- : --</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                {/* Wheelchair Access */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Wheelchair Access</span>
                                    <span className={`text-[12px] font-semibold ${form.wheelchair === 'yes' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {form.wheelchair === 'yes' ? 'Required' : 'Not Required'}
                                    </span>
                                </div>

                                {/* Form Completion */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[12px] text-gray-600">Form Completion</span>
                                        <span className="text-[12px] font-bold text-[#004D6D]">45%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#004D6D] rounded-full" style={{ width: '45%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Info note */}
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
                {/* Left: validation note */}
                <div className="flex items-center gap-2">
                    <HiExclamationCircle size={16} className="text-red-500 shrink-0" />
                    <span className="text-[12px] text-red-500">Please fill in all required fields marked with <span className="font-bold">*</span></span>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={goBack}
                        className="px-5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => savePassenger(false)}
                        disabled={submitting}
                        className="px-5 py-2 border border-gray-300 rounded-lg text-[13px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                    >
                        {submitting ? 'Saving...' : 'Save & Add Another'}
                    </button>
                    <button
                        type="button"
                        onClick={() => savePassenger(true)}
                        disabled={submitting}
                        className="px-5 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                        {submitting ? 'Saving...' : 'Save Passenger'}
                    </button>
                </div>
            </div>

        </div>
    );
};

export default AddNewPassenger;
