import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastStack } from '../../../../../utils/Toast';
import { PERMISSIONS_CATEGORIES, allPermKeys } from './permissionsConstants';

// ─── Reusable: Form Field ─────────────────────────────────────
const FormField = ({ label, required, placeholder, value, onChange, type = 'text', className = '', showError = false, errorText = 'This field is required.' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-sm font-semibold text-gray-800">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors bg-gray-50/50 ${
                showError
                    ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-[#005580] focus:ring-[#005580]'
            }`}
        />
        {showError && <p className="text-xs text-red-600 font-medium">{errorText}</p>}
    </div>
);

// ─── Main Component ───────────────────────────────────────────
const AddSubAdmin = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
    });
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // permissions state: array of keys
    const [permissions, setPermissions] = useState([]);

    const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleCheckboxChange = (key) => {
        setPermissions(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const isAllSelected = permissions.length === allPermKeys.length && allPermKeys.length > 0;

    const toggleAll = () => {
        if (isAllSelected) {
            setPermissions([]);
        } else {
            setPermissions([...allPermKeys]);
        }
    };

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
            !form.fullName?.trim() ||
            !form.email?.trim() ||
            !form.password?.trim();

        if (missing) {
            pushToast('warning', 'Please fill in all required fields before creating a sub-admin.');
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        if (!validateRequired()) {
            return;
        }
        // Implementation
        navigate('/admin/users/subadmins');
    };

    const showRequired = (v) => submitAttempted && !String(v || '').trim();

    return (
        <div className="space-y-6 max-w-[1400px]">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Sub-Admin</h1>
                    <p className="text-sm text-gray-500 mt-1">Create a new sub-admin account and configure their access permissions.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => navigate('/admin/users/subadmins')}
                        className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2.5 bg-[#005580] text-white rounded-lg text-sm font-medium hover:bg-sky-900 transition-colors shadow-sm"
                    >
                        Create Sub-Admin
                    </button>
                </div>
            </div>

            {/* ── Content Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── Left Column (Form & Permissions) ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Basic Information Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                        <h2 className="text-lg font-bold text-gray-900 mb-5">Basic Information</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <FormField label="Full Name" required placeholder="e.g. Jane Doe" value={form.fullName} onChange={setField('fullName')} showError={showRequired(form.fullName)} />
                                <FormField label="Email Address" required type="email" placeholder="e.g. jane.doe@example.com" value={form.email} onChange={setField('email')} showError={showRequired(form.email)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <FormField label="Phone Number" placeholder="e.g. (123) 456-7890" value={form.phone} onChange={setField('phone')} />
                                <FormField label="Create Password" required type="password" placeholder="••••••••" value={form.password} onChange={setField('password')} showError={showRequired(form.password)} />
                            </div>
                        </div>
                    </div>

                    {/* Permissions Card */}
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)]">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                            <h2 className="text-lg font-bold text-gray-900">Permissions</h2>

                            <div className="flex items-center gap-2.5">
                                <span className="text-sm text-gray-500 font-medium">Select All</span>
                                <button
                                    onClick={toggleAll}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#005580] focus:ring-offset-2 ${isAllSelected ? 'bg-gray-300' : 'bg-gray-200'}`}
                                >
                                    <span className="sr-only">Select All Permissions</span>
                                    <span
                                        className={`pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${isAllSelected ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {PERMISSIONS_CATEGORIES.map((category) => (
                                <div key={category.name}>
                                    <h3 className="text-base text-gray-900 font-bold mb-4">{category.name}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {category.keys.map((key, index) => (
                                            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-4 w-4 shrink-0 rounded border-gray-300 text-gray-400 focus:ring-gray-300 transition-all appearance-none border checked:bg-white checked:border-gray-300"
                                                        checked={permissions.includes(key)}
                                                        onChange={() => handleCheckboxChange(key)}
                                                    />
                                                    {/* Custom checkmark indicator since default relies on form plugin */}
                                                    <svg
                                                        className={`absolute w-4 h-4 text-gray-500 pointer-events-none opacity-0 peer-checked:opacity-100 p-0.5`}
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                                                    {category.labels[index]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-5 border-b border-gray-100 last:border-0 last:hidden" />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Right Column (Summary) ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] sticky top-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Summary</h2>

                        <div className="space-y-3">
                            <div className="flex justify-between items-start gap-3">
                                <span className="text-sm font-medium text-gray-500">Name:</span>
                                <span className="text-sm font-medium text-gray-900 text-right w-full wrap-break-word">{form.fullName || '-'}</span>
                            </div>
                            <div className="flex justify-between items-start gap-3">
                                <span className="text-sm font-medium text-gray-500">Email:</span>
                                <span className="text-sm font-medium text-gray-900 text-right break-all">{form.email || '-'}</span>
                            </div>
                        </div>

                        <div className="my-4 border-t border-gray-100"></div>

                        <div className="space-y-1.5">
                            <p className="text-sm font-bold text-gray-900">Assigned Role</p>
                            <p className="text-base font-bold text-[#005580]">Sub-Admin</p>
                        </div>

                        <div className="my-4 border-t border-gray-100"></div>

                        <div className="space-y-2">
                            <p className="text-sm font-bold text-gray-900">Key Permissions</p>
                            {permissions.length === 0 ? (
                                <p className="text-xs font-semibold text-gray-500">No permissions granted</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {permissions.slice(0, 5).map(key => {
                                        const cat = PERMISSIONS_CATEGORIES.find(c => c.keys.includes(key));
                                        const label = cat.labels[cat.keys.indexOf(key)];
                                        return (
                                            <span key={key} className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold">
                                                {label}
                                            </span>
                                        );
                                    })}
                                    {permissions.length > 5 && (
                                        <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold">
                                            +{permissions.length - 5} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default AddSubAdmin;
