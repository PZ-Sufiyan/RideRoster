import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    MdCloudUpload,
    MdCalendarToday,
    MdCheckCircle,
    MdDeleteOutline,
    MdUpload,
    MdPeople,
    MdPersonOutline,
} from 'react-icons/md';

// ─── Reusable: Form Field ─────────────────────────────────────
const FormField = ({ label, required, placeholder, value, onChange, type = 'text', className = '' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-sm font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] transition-colors bg-white"
        />
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

// ─── Main Component ───────────────────────────────────────────
const AddNewPA = () => {
    const navigate = useNavigate();
    const avatarRef = useRef();
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        address: '', contactName: '', contactPhone: '',
    });

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleAvatarChange = (file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setAvatarPreview(url);
    };

    const handleSubmit = () => {
        // placeholder submit logic
        navigate('/admin/users/pa');
    };

    return (
        <div className="space-y-5">
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
                        <FormField label="First Name" required placeholder="e.g. Jane" value={form.firstName} onChange={set('firstName')} />
                        <FormField label="Last Name" required placeholder="e.g. Doe" value={form.lastName} onChange={set('lastName')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Email Address" required type="email" placeholder="e.g. jane.doe@example.com" value={form.email} onChange={set('email')} />
                        <FormField label="Phone Number" required type="tel" placeholder="e.g. (123) 456-7890" value={form.phone} onChange={set('phone')} />
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
                    {/* Left preview */}
                    <div className="w-24 shrink-0 bg-gray-100 flex items-center justify-center border-r border-gray-200">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <MdPersonOutline size={36} className="text-gray-400" />
                        )}
                    </div>

                    {/* Right upload area */}
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
                        onChange={(e) => handleAvatarChange(e.target.files[0])}
                    />
                </div>
            </Section>

            {/* ── Section 3: Documents & Certifications ── */}
            <Section title="Documents &amp; Certifications">
                <div className="space-y-4">
                    {/* Existing verified documents list */}
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                        {[
                            { name: 'Passport number', detail: 'Verified • Expires: Dec 2026' },
                            { name: 'Safeguarding Certificate', detail: 'Verified • Expires: Jan 2026' },
                        ].map((doc) => (
                            <div key={doc.name} className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                                    <p className="text-xs text-green-600 mt-0.5">{doc.detail}</p>
                                </div>
                                <MdCheckCircle size={22} className="text-green-500 shrink-0" />
                            </div>
                        ))}
                    </div>

                    {/* Upload instructions + Expiry Date */}
                    <p className="text-sm text-gray-500">
                        Upload required documents like background check and first aid certification.
                    </p>
                    <div>
                        <button className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                            <MdCalendarToday size={14} className="text-gray-500" />
                            Expiry Date
                        </button>
                    </div>

                    {/* Uploaded file rows */}
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                        {/* Background Check Certificate - uploaded */}
                        <div className="flex items-center justify-between px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-gray-800">Background Check Certificate.pdf</p>
                                <p className="text-xs text-gray-400 mt-0.5">Uploaded on 2025-10-22</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                                    Verified
                                </span>
                                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <MdDeleteOutline size={18} />
                                </button>
                            </div>
                        </div>

                        {/* First Aid Certification - not uploaded */}
                        <div className="flex items-center justify-between px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-gray-800">First Aid Certification</p>
                                <p className="text-xs text-gray-400 mt-0.5">No file uploaded</p>
                            </div>
                            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors shrink-0">
                                <MdUpload size={16} />
                                Upload File
                            </button>
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
                        placeholder="e.g. John Smith"
                        value={form.contactName}
                        onChange={set('contactName')}
                    />
                    <FormField
                        label="Contact Phone Number"
                        type="tel"
                        placeholder="e.g. (123) 555-0123"
                        value={form.contactPhone}
                        onChange={set('contactPhone')}
                    />
                </div>
            </Section>

            {/* ── Footer Actions ── */}
            <div className="flex items-center gap-3 pb-2">
                <button
                    onClick={() => navigate('/admin/users/pa')}
                    className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
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
