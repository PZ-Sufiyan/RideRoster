import React, { useEffect, useState } from 'react';
import { ToastStack } from '../../../../utils/Toast';
import {
    getCurrentSuperAdminSettings,
    updateCurrentSuperAdminProfile,
    verifyCurrentPassword,
    updateCurrentPassword,
} from '../../../../services/settingServices';
import { ShimmerBlock, LoadingStatus } from '../../../../utils/Shimmer';

const Settings = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [secondaryEmail, setSecondaryEmail] = useState('');
    const [secondaryEmailError, setSecondaryEmailError] = useState('');
    const [role, setRole] = useState('Super Admin');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialData, setInitialData] = useState({
        fullName: '',
        email: '',
        phone: '',
        secondaryEmail: '',
    });
    const [toasts, setToasts] = useState([]);
    const [activeTab, setActiveTab] = useState('profile');
    const [previousPassword, setPreviousPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [showPreviousPassword, setShowPreviousPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [failedPasswordAttempts, setFailedPasswordAttempts] = useState(0);
    const [passwordLockoutUntil, setPasswordLockoutUntil] = useState(null);

    const tabButtonClass = (tab) =>
        [
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === tab
                ? 'border-[#3B8097] text-[#3B8097]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        ].join(' ');

    const clearPasswordFields = () => {
        setPreviousPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const MAX_PASSWORD_ATTEMPTS = 3;
    const PASSWORD_LOCKOUT_MS = 5 * 60 * 1000;

    const passwordAttemptStorageKey = email ? `rr_pw_attempts_${email}` : null;

    const isPasswordLocked = () => {
        if (!passwordLockoutUntil) return false;
        return Date.now() < passwordLockoutUntil;
    };

    const formatLockoutRemaining = () => {
        if (!passwordLockoutUntil) return '';
        const ms = Math.max(0, passwordLockoutUntil - Date.now());
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes <= 0) return `${seconds}s`;
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    };

    const pushToast = (type, message) => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const { authUser, profile } = await getCurrentSuperAdminSettings();

                const loadedFullName = profile?.full_name || '';
                const loadedEmail = profile?.email || authUser?.email || '';
                const loadedPhone = profile?.phone || '';
                const loadedSecondaryEmail = profile?.secondary_email || '';
                const loadedRole =
                    authUser?.app_metadata?.role === 'superadmin' ? 'Super Admin' : 'Super Admin';

                setFullName(loadedFullName);
                setEmail(loadedEmail);
                setPhone(loadedPhone);
                setSecondaryEmail(loadedSecondaryEmail);
                setRole(loadedRole);
                setInitialData({
                    fullName: loadedFullName,
                    email: loadedEmail,
                    phone: loadedPhone,
                    secondaryEmail: loadedSecondaryEmail,
                });
            } catch (error) {
                pushToast('error', error?.message || 'Failed to load settings.');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    useEffect(() => {
        if (!passwordAttemptStorageKey) return;

        try {
            const raw = localStorage.getItem(passwordAttemptStorageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const count = Number(parsed?.count || 0);
            const until = parsed?.lockoutUntil ? Number(parsed.lockoutUntil) : null;
            setFailedPasswordAttempts(Number.isFinite(count) ? count : 0);
            setPasswordLockoutUntil(Number.isFinite(until) ? until : null);
        } catch {
            // ignore
        }
    }, [passwordAttemptStorageKey]);

    useEffect(() => {
        if (!passwordAttemptStorageKey) return;

        try {
            localStorage.setItem(
                passwordAttemptStorageKey,
                JSON.stringify({
                    count: failedPasswordAttempts,
                    lockoutUntil: passwordLockoutUntil,
                }),
            );
        } catch {
            // ignore
        }
    }, [failedPasswordAttempts, passwordAttemptStorageKey, passwordLockoutUntil]);

    const isValidEmail = (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleSaveChanges = async () => {
        const trimmedSecondaryEmail = secondaryEmail.trim();

        if (trimmedSecondaryEmail && !isValidEmail(trimmedSecondaryEmail)) {
            setSecondaryEmailError('Please enter a valid email address.');
            return;
        }
        setSecondaryEmailError('');

        try {
            setSaving(true);
            await updateCurrentSuperAdminProfile({
                full_name: fullName.trim(),
                phone: phone.trim(),
                secondary_email: trimmedSecondaryEmail || null,
            });

            setInitialData((prev) => ({
                ...prev,
                fullName: fullName.trim(),
                phone: phone.trim(),
                secondaryEmail: trimmedSecondaryEmail,
            }));
            pushToast('success', 'Settings updated successfully.');
        } catch (error) {
            pushToast('error', error?.message || 'Failed to update settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFullName(initialData.fullName);
        setEmail(initialData.email);
        setPhone(initialData.phone);
        setSecondaryEmail(initialData.secondaryEmail);
        setSecondaryEmailError('');
    };

    const handleUpdatePassword = async () => {
        const prev = previousPassword;
        const next = newPassword;
        const confirm = confirmPassword;

        if (isPasswordLocked()) {
            pushToast(
                'error',
                `Too many incorrect attempts. Please try again in ${formatLockoutRemaining()}.`,
            );
            return;
        }

        if (!prev || !next || !confirm) {
            pushToast('error', 'Please fill in all password fields.');
            return;
        }
        if (next !== confirm) {
            pushToast('error', 'New password and confirmation do not match.');
            return;
        }

        try {
            setUpdatingPassword(true);
            await verifyCurrentPassword(prev);
            await updateCurrentPassword(next);
            clearPasswordFields();
            setFailedPasswordAttempts(0);
            setPasswordLockoutUntil(null);
            pushToast('success', 'Password updated successfully.');
        } catch (error) {
            const msg = error?.message || '';
            const invalid =
                /invalid login credentials|invalid/i.test(msg) ||
                error?.status === 400;
            if (invalid) {
                setFailedPasswordAttempts((curr) => {
                    const nextCount = curr + 1;
                    if (nextCount >= MAX_PASSWORD_ATTEMPTS) {
                        const until = Date.now() + PASSWORD_LOCKOUT_MS;
                        setPasswordLockoutUntil(until);
                        pushToast(
                            'error',
                            `Too many incorrect attempts. Try again in ${Math.ceil(
                                PASSWORD_LOCKOUT_MS / 60000,
                            )} minutes.`,
                        );
                    } else {
                        pushToast(
                            'error',
                            `Current password is incorrect. ${MAX_PASSWORD_ATTEMPTS - nextCount} attempt(s) left.`,
                        );
                    }
                    return nextCount;
                });
                return;
            }
            pushToast(
                'error',
                msg || 'Failed to update password.',
            );
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) {
        return (
            <LoadingStatus label="Loading settings" className="space-y-6">
                <div>
                    <ShimmerBlock className="h-8 w-40 rounded-md" />
                    <ShimmerBlock className="mt-3 h-4 w-80 max-w-full rounded-md" />
                </div>

                <div className="border-b border-gray-200 flex gap-8">
                    <ShimmerBlock className="h-10 w-24 rounded-t-lg" rounded="rounded-t-lg" />
                    <ShimmerBlock className="h-10 w-36 rounded-t-lg" rounded="rounded-t-lg" />
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-8 space-y-8">
                    <div className="space-y-3">
                        <ShimmerBlock className="h-6 w-56 max-w-full rounded-md" />
                        <ShimmerBlock className="h-4 w-72 max-w-full rounded-md" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-5xl">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={`settings-skeleton-${index}`} className="space-y-2">
                                <ShimmerBlock className="h-4 w-24 rounded-md" />
                                <ShimmerBlock className="h-12 rounded-lg" />
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <ShimmerBlock className="h-11 w-24 rounded-lg" />
                        <ShimmerBlock className="h-11 w-32 rounded-lg" />
                    </div>
                </div>
            </LoadingStatus>
        );
    }

    return (
        <div className="space-y-6">
            <ToastStack toasts={toasts} onClose={removeToast} />
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your profile, security, and platform settings.
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        type="button"
                        className={tabButtonClass('profile')}
                        onClick={() => {
                            setActiveTab('profile');
                            clearPasswordFields();
                        }}
                    >
                        Profile
                    </button>
                    <button
                        type="button"
                        className={tabButtonClass('password')}
                        onClick={() => setActiveTab('password')}
                    >
                        Change Password
                    </button>
                </nav>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
                {activeTab === 'profile' ? (
                    <>
                        {/* Card Header */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Update your personal details here.
                            </p>
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-5xl">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                                    disabled={loading}
                                />
                            </div>

                            {/* Email Address */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                                    disabled={loading}
                                />
                            </div>

                            {/* Secondary Email */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Secondary Email
                                </label>
                                <input
                                    type="email"
                                    value={secondaryEmail}
                                    onChange={(e) => {
                                        setSecondaryEmail(e.target.value);
                                        if (secondaryEmailError) setSecondaryEmailError('');
                                    }}
                                    placeholder="Optional"
                                    className={`block w-full px-4 py-3 text-sm border rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:bg-white transition-colors ${
                                        secondaryEmailError
                                            ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                                            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    disabled={loading}
                                />
                                {secondaryEmailError && (
                                    <p className="text-xs text-red-500 mt-1">{secondaryEmailError}</p>
                                )}
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    value={role}
                                    disabled
                                    className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-10 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={loading || saving}
                                className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveChanges}
                                disabled={loading || saving}
                                className="px-6 py-2.5 bg-[#407B90] rounded-lg text-sm font-semibold text-white hover:bg-[#356a7d] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Enter your current password and choose a new one.
                            </p>
                        </div>

                        {/* Prevent browser autofill: hidden fields + turn off autocomplete on visible fields */}
                        <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden>
                            <input type="text" name="prevent_autofill_username" autoComplete="off" tabIndex="-1" />
                            <input type="password" name="prevent_autofill_password" autoComplete="new-password" tabIndex="-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-5xl">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    autoComplete="off"
                                    className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Previous Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPreviousPassword ? 'text' : 'password'}
                                        name="rr_prev_password"
                                        value={previousPassword}
                                        onChange={(e) => setPreviousPassword(e.target.value)}
                                        autoComplete="off"
                                        className="block w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                                        disabled={updatingPassword || isPasswordLocked()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPreviousPassword((v) => !v)}
                                        disabled={updatingPassword || isPasswordLocked()}
                                        aria-label={
                                            showPreviousPassword
                                                ? 'Hide previous password'
                                                : 'Show previous password'
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {showPreviousPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-5 w-5"
                                            >
                                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                                <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                                                <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                                                <path d="M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-5 w-5"
                                            >
                                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="block w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                                        disabled={updatingPassword || isPasswordLocked()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((v) => !v)}
                                        disabled={updatingPassword || isPasswordLocked()}
                                        aria-label={
                                            showNewPassword ? 'Hide new password' : 'Show new password'
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {showNewPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-5 w-5"
                                            >
                                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                                <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                                                <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                                                <path d="M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-5 w-5"
                                            >
                                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="block w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                                        disabled={updatingPassword || isPasswordLocked()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        disabled={updatingPassword || isPasswordLocked()}
                                        aria-label={
                                            showConfirmPassword
                                                ? 'Hide confirm password'
                                                : 'Show confirm password'
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {showConfirmPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-5 w-5"
                                            >
                                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                                <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                                                <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                                                <path d="M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-5 w-5"
                                            >
                                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleUpdatePassword}
                                disabled={updatingPassword || isPasswordLocked()}
                                className="px-6 py-2.5 bg-[#407B90] rounded-lg text-sm font-semibold text-white hover:bg-[#356a7d] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {updatingPassword
                                    ? 'Updating...'
                                    : isPasswordLocked()
                                      ? `Try again in ${formatLockoutRemaining()}`
                                      : 'Update Password'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Settings;
