import React, { useEffect, useState } from 'react';
import { ToastStack } from '../../../../utils/Toast';
import {
    getCurrentSuperAdminSettings,
    updateCurrentSuperAdminProfile,
} from '../../../../services/settingServices';

const Settings = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('Super Admin');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialData, setInitialData] = useState({
        fullName: '',
        email: '',
        phone: '',
    });
    const [toasts, setToasts] = useState([]);

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
                const loadedRole =
                    authUser?.app_metadata?.role === 'superadmin' ? 'Super Admin' : 'Super Admin';

                setFullName(loadedFullName);
                setEmail(loadedEmail);
                setPhone(loadedPhone);
                setRole(loadedRole);
                setInitialData({
                    fullName: loadedFullName,
                    email: loadedEmail,
                    phone: loadedPhone,
                });
            } catch (error) {
                pushToast('error', error?.message || 'Failed to load settings.');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            await updateCurrentSuperAdminProfile({
                full_name: fullName.trim(),
                phone: phone.trim(),
            });

            setInitialData((prev) => ({
                ...prev,
                fullName: fullName.trim(),
                phone: phone.trim(),
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
    };

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
                    <button className="border-[#3B8097] text-[#3B8097] whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Profile
                    </button>
                    {/* Other tabs implied by screenshot context but not shown as active/present in detail. 
                        Usually there would be Password, Notifications etc. 
                        But detailed instruction says "Follow screenshot strictly".
                        Screenshot only shows "Profile" active. 
                        I will leave it as just Profile or maybe add invisible spacers if needed, 
                        but strictly speaking only "Profile" is visible tab text.
                    */}
                </nav>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-8">

                {/* Card Header */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                    <p className="text-sm text-gray-500 mt-1">Update your personal details here.</p>
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
                        onClick={handleCancel}
                        disabled={loading || saving}
                        className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveChanges}
                        disabled={loading || saving}
                        className="px-6 py-2.5 bg-[#407B90] rounded-lg text-sm font-semibold text-white hover:bg-[#356a7d] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Settings;
