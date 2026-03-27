import React, { useEffect, useState } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { ToastStack } from '../../../../components/Toast';
import {
    getCurrentSubAdminSettings,
    updateCurrentSubAdminNotificationPrefs,
    updateCurrentSubAdminPassword,
    updateCurrentSubAdminProfile,
    verifyCurrentSubAdminPassword,
} from '../../../../services/settingServices';

const SubAdmin_Settings = () => {
    // Profile State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Notification State
    const [jobUpdates, setJobUpdates] = useState(true);
    const [approvalRequests, setApprovalRequests] = useState(true);
    const [systemAlerts, setSystemAlerts] = useState(true);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [toasts, setToasts] = useState([]);

    const toggleClass = "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none";
    const thumbClass = "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out";
    const pushToast = (type, message) => {
        setToasts((prev) => [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, type, message },
        ]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const Toggle = ({ enabled, setEnabled }) => (
        <button
            type="button"
            className={`${toggleClass} ${enabled ? 'bg-[#005C7A]' : 'bg-gray-200'}`}
            onClick={() => setEnabled(!enabled)}
        >
            <span className={`${thumbClass} ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);

                const { authUser, profile } = await getCurrentSubAdminSettings();
                const prefs = authUser?.user_metadata?.notification_preferences || {};

                setFullName(profile?.name || '');
                setEmail(profile?.email || authUser?.email || '');
                setPhone(profile?.phone || '');
                setJobUpdates(prefs.jobUpdates ?? true);
                setApprovalRequests(prefs.approvalRequests ?? true);
                setSystemAlerts(prefs.systemAlerts ?? true);
            } catch (error) {
                pushToast('error', error?.message || 'Failed to load settings.');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleProfileSave = async () => {
        try {
            setProfileLoading(true);

            await updateCurrentSubAdminProfile({
                name: fullName.trim(),
                phone: phone.trim(),
            });

            pushToast('success', 'Profile updated successfully.');
        } catch (error) {
            pushToast('error', error?.message || 'Failed to update profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        try {
            if (!currentPassword || !newPassword || !confirmPassword) {
                pushToast('warning', 'Please enter current password, new password, and confirm password.');
                return;
            }

            if (newPassword !== confirmPassword) {
                pushToast('warning', 'New password and confirm password must match.');
                return;
            }

            if (newPassword === currentPassword) {
                pushToast('warning', 'New password must be different from your current password.');
                return;
            }

            setPasswordLoading(true);
            await verifyCurrentSubAdminPassword(currentPassword);
            await updateCurrentSubAdminPassword(newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            pushToast('success', 'Password updated successfully.');
        } catch (error) {
            const message = error?.message || 'Failed to update password.';
            if (message.toLowerCase().includes('invalid login credentials')) {
                pushToast('error', 'Wrong current password entered.');
            } else {
                pushToast('error', message);
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleNotificationsSave = async () => {
        try {
            setNotificationLoading(true);

            await updateCurrentSubAdminNotificationPrefs({
                jobUpdates,
                approvalRequests,
                systemAlerts,
            });

            pushToast('success', 'Notification preferences saved.');
        } catch (error) {
            pushToast('error', error?.message || 'Failed to save notification preferences.');
        } finally {
            setNotificationLoading(false);
        }
    };

    return (
        <div className="max-w-7xl space-y-8">
            <ToastStack toasts={toasts} onClose={removeToast} />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

            {loading && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                    Loading settings...
                </div>
            )}

            {/* Profile Settings */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Profile Settings</h2>
                    <p className="text-sm text-gray-500">Update your personal information and profile picture.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-6">
                        <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&h=128"
                            alt="Avatar"
                            className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                Upload New Picture
                            </button>
                            <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to 5MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                readOnly
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">Phone Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleProfileSave}
                        disabled={loading || profileLoading}
                        className="px-6 py-2.5 bg-[#005C7A] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Security</h2>
                    <p className="text-sm text-gray-500">Manage your password and two-factor authentication.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Change Password</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 pr-11 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                                    >
                                        {showCurrentPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 pr-11 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                    >
                                        {showNewPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 pr-11 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    >
                                        {showConfirmPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handlePasswordUpdate}
                        disabled={loading || passwordLoading}
                        className="px-6 py-2.5 bg-[#005C7A] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {passwordLoading ? 'Updating...' : 'Update Security Settings'}
                    </button>
                </div>
            </div>

            {/* Notifications Settings */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                    <p className="text-sm text-gray-500">Choose how you want to be notified.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Job Updates</h4>
                                <p className="text-xs text-gray-500">When a job you created is assigned, started, or completed.</p>
                            </div>
                            <Toggle enabled={jobUpdates} setEnabled={setJobUpdates} />
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Approval Requests</h4>
                                <p className="text-xs text-gray-500">When a job requires your approval.</p>
                            </div>
                            <Toggle enabled={approvalRequests} setEnabled={setApprovalRequests} />
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">System Alerts</h4>
                                <p className="text-xs text-gray-500">Important updates about the RideRoster platform.</p>
                            </div>
                            <Toggle enabled={systemAlerts} setEnabled={setSystemAlerts} />
                        </div>
                    </div>

                    <button
                        onClick={handleNotificationsSave}
                        disabled={loading || notificationLoading}
                        className="px-6 py-2.5 bg-[#005C7A] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {notificationLoading ? 'Saving...' : 'Save Notification Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubAdmin_Settings;
