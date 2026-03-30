import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCloudUpload,
    MdDeleteOutline,
    MdPeople,
    MdPersonOutline,
    MdFileUpload,
    MdCheck,
    MdVisibility,
    MdInfoOutline,
} from 'react-icons/md';
import { ToastStack } from '../../../../../utils/Toast';

// ─── Reusable: Form Field ─────────────────────────────────────
const FormField = ({ label, required, placeholder, value, onChange, type = 'text', className = '', showError = false, errorText = 'This field is required.' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-sm font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors bg-white ${
                showError
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-[#005580] focus:ring-[#005580]'
            }`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Section Wrapper ──────────────────────────────────────────
const Section = ({ title, subtitle, children }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="px-6 py-5">
            {children}
        </div>
    </div>
);

/** Local-only file preview: no upload. View opens blob URL; delete/revoke clears. */
const LocalDocumentSlot = ({ label, hint, value, onFile, onRemove }) => {
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        onFile(file);
    };

    const handleView = () => {
        if (value?.objectUrl) {
            window.open(value.objectUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="space-y-1.5">
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            {!value ? (
                <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            inputRef.current?.click();
                        }
                    }}
                    onClick={() => inputRef.current?.click()}
                    className="border border-dashed border-gray-300 rounded-2xl p-5 flex items-center justify-between transition-colors hover:bg-gray-50 cursor-pointer group"
                >
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white border border-gray-100 shrink-0">
                            <MdFileUpload size={20} className="text-[#005580]" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-gray-800">{label}</h3>
                            <p className="text-[12px] text-gray-400 font-medium mt-0.5">{hint}</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#005580] bg-blue-50/50 shrink-0">
                        <MdCloudUpload size={20} />
                    </div>
                </div>
            ) : (
                <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-500 flex items-center justify-center border border-green-100 shrink-0">
                            <MdCheck size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-gray-800">{label}</h3>
                            <p className="text-[12px] text-gray-400 font-medium mt-0.5 truncate">{value.fileName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={handleView}
                            title="View document"
                            className="p-1.5 text-gray-400 hover:text-[#005580] transition-colors rounded-lg hover:bg-blue-50"
                        >
                            <MdVisibility size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            title="Upload other file"
                            className="px-2 py-1.5 text-[12px] font-semibold text-[#005580] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                             <MdCloudUpload size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={onRemove}
                            title="Remove document"
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        >
                            <MdDeleteOutline size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────
const AddNewPA = () => {
    const navigate = useNavigate();
    const avatarRef = useRef();
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        address: '', contactName: '', contactPhone: '',
    });

    const [passportExpiry, setPassportExpiry] = useState('');
    const [safeguardingExpiry, setSafeguardingExpiry] = useState('');
    const [passportDoc, setPassportDoc] = useState(null);
    const [safeguardingDoc, setSafeguardingDoc] = useState(null);
    const [backgroundCheckDoc, setBackgroundCheckDoc] = useState(null);
    const [firstAidDoc, setFirstAidDoc] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const revokeIfUrl = useCallback((prev) => {
        if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
    }, []);

    const setLocalDoc = useCallback((setter, file) => {
        setter((prev) => {
            revokeIfUrl(prev);
            if (!file) return null;
            return { fileName: file.name, objectUrl: URL.createObjectURL(file) };
        });
    }, [revokeIfUrl]);

    const clearLocalDoc = useCallback((setter) => {
        setter((prev) => {
            revokeIfUrl(prev);
            return null;
        });
    }, [revokeIfUrl]);

    const handleAvatarChange = (file) => {
        if (!file) return;
        setAvatarPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    const blobsRef = useRef({
        avatar: null,
        passport: null,
        safeguarding: null,
        background: null,
        firstAid: null,
    });

    useLayoutEffect(() => {
        blobsRef.current = {
            avatar: avatarPreview,
            passport: passportDoc,
            safeguarding: safeguardingDoc,
            background: backgroundCheckDoc,
            firstAid: firstAidDoc,
        };
    });

    useEffect(() => {
        return () => {
            const b = blobsRef.current;
            if (b.avatar) URL.revokeObjectURL(b.avatar);
            [b.passport, b.safeguarding, b.background, b.firstAid].forEach((doc) => {
                if (doc?.objectUrl) URL.revokeObjectURL(doc.objectUrl);
            });
        };
    }, []);

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

    const validateRequired = () => {
        setSubmitAttempted(true);
        const missing =
            !form.firstName?.trim() ||
            !form.lastName?.trim() ||
            !form.email?.trim() ||
            !form.phone?.trim() ||
            !form.contactName?.trim() ||
            !form.contactPhone?.trim();
        if (missing) {
            pushToast('warning', 'Please fill in all required fields before adding a passenger assistant.');
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        if (!validateRequired()) {
            return;
        }
        navigate('/admin/users/pa');
    };

    const dateInputClass =
        'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] transition-colors bg-white';
    const showRequired = (value) => submitAttempted && !String(value || '').trim();

    return (
        <div className="space-y-5">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />
            {/* ── Page Title ── */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Passenger Assistant</h1>
            </div>

            {/* ── Section 1: Personal Information ── */}
            <Section
                title="Personal Information"
                subtitle="Enter the basic details of the new passenger assistant."
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="First Name" required placeholder="e.g. Jane" value={form.firstName} onChange={set('firstName')} showError={showRequired(form.firstName)} />
                        <FormField label="Last Name" required placeholder="e.g. Doe" value={form.lastName} onChange={set('lastName')} showError={showRequired(form.lastName)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Email Address" required type="email" placeholder="e.g. jane.doe@example.com" value={form.email} onChange={set('email')} showError={showRequired(form.email)} />
                        <FormField label="Phone Number" required type="tel" placeholder="e.g. (123) 456-7890" value={form.phone} onChange={set('phone')} showError={showRequired(form.phone)} />
                    </div>
                    <FormField label="Residential Address" placeholder="e.g. 123 Main Street, Anytown, USA" value={form.address} onChange={set('address')} />
                </div>
            </Section>

            {/* ── Section 2: Profile Picture ── */}
            <Section
                title="Profile Picture"
                subtitle="Upload a clear, professional headshot."
            >
                <div className="flex items-stretch gap-4 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="w-24 shrink-0 bg-gray-100 flex items-center justify-center border-r border-gray-200">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <MdPersonOutline size={36} className="text-gray-400" />
                        )}
                    </div>

                    <div
                        className="flex-1 flex flex-col items-center justify-center py-8 px-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
                        onClick={() => avatarRef.current.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleAvatarChange(e.dataTransfer.files[0]); }}
                    >
                        <MdCloudUpload size={32} className="text-[#005580] mb-2" />
                        <p className="text-sm text-center">
                            <span className="text-[#005580] font-semibold cursor-pointer hover:underline">Click to upload</span>
                            {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 800x800px)</p>
                    </div>
                    <input
                        ref={avatarRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            handleAvatarChange(e.target.files[0]);
                            e.target.value = '';
                        }}
                    />
                </div>
            </Section>

            {/* ── Section 3: Documents & Certifications ── */}
            <Section title="Documents &amp; Certifications">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Upload required documents. Accepted: PDF, JPG, PNG — preview opens in a new tab. Nothing is saved to the server; leaving this page clears uploads.
                    </p>

                    {/* Passport number — document + manual expiry */}
                    <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white">
                        <p className="text-sm font-semibold text-gray-800">Passport number</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Document</label>
                                <LocalDocumentSlot
                                    label="Passport copy"
                                    hint="PDF or image — local preview only"
                                    value={passportDoc}
                                    onFile={(f) => setLocalDoc(setPassportDoc, f)}
                                    onRemove={() => clearLocalDoc(setPassportDoc)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Expiry date</label>
                                <input
                                    type="date"
                                    value={passportExpiry}
                                    onChange={(e) => setPassportExpiry(e.target.value)}
                                    className={dateInputClass}
                                />
                                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MdInfoOutline size={12} className="shrink-0 opacity-70" />
                                    Enter expiry manually; it is not read from the file.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Safeguarding Certificate — document + manual expiry */}
                    <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white">
                        <p className="text-sm font-semibold text-gray-800">Safeguarding Certificate</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Document</label>
                                <LocalDocumentSlot
                                    label="Safeguarding certificate"
                                    hint="PDF or image — local preview only"
                                    value={safeguardingDoc}
                                    onFile={(f) => setLocalDoc(setSafeguardingDoc, f)}
                                    onRemove={() => clearLocalDoc(setSafeguardingDoc)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-600">Expiry date</label>
                                <input
                                    type="date"
                                    value={safeguardingExpiry}
                                    onChange={(e) => setSafeguardingExpiry(e.target.value)}
                                    className={dateInputClass}
                                />
                                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MdInfoOutline size={12} className="shrink-0 opacity-70" />
                                    Enter expiry manually; it is not read from the file.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                        <div className="px-4 py-4 space-y-2">
                            <p className="text-sm font-medium text-gray-800">Background Check Certificate</p>
                            <LocalDocumentSlot
                                label="Upload certificate"
                                hint="PDF or image"
                                value={backgroundCheckDoc}
                                onFile={(f) => setLocalDoc(setBackgroundCheckDoc, f)}
                                onRemove={() => clearLocalDoc(setBackgroundCheckDoc)}
                            />
                        </div>
                        <div className="px-4 py-4 space-y-2">
                            <p className="text-sm font-medium text-gray-800">First Aid Certification</p>
                            <LocalDocumentSlot
                                label="Upload certification"
                                hint="PDF or image"
                                value={firstAidDoc}
                                onFile={(f) => setLocalDoc(setFirstAidDoc, f)}
                                onRemove={() => clearLocalDoc(setFirstAidDoc)}
                            />
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Section 4: Emergency Contact ── */}
            <Section
                title="Emergency Contact"
                subtitle="Provide an emergency contact for the assistant."
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        label="Contact Full Name"
                        required
                        placeholder="e.g. John Smith"
                        value={form.contactName}
                        onChange={set('contactName')}
                        showError={showRequired(form.contactName)}
                    />
                    <FormField
                        label="Contact Phone Number"
                        required
                        type="tel"
                        placeholder="e.g. (123) 555-0123"
                        value={form.contactPhone}
                        onChange={set('contactPhone')}
                        showError={showRequired(form.contactPhone)}
                    />
                </div>
            </Section>

            {/* ── Footer Actions ── */}
            <div className="flex items-center gap-3 pb-2">
                <button
                    type="button"
                    onClick={() => navigate('/admin/users/pa')}
                    className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm"
                >
                    <MdPeople size={18} />
                    Add Passenger Assistant
                </button>
            </div>
        </div>
    );
};

export default AddNewPA;
