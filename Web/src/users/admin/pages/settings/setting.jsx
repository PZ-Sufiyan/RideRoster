import React, { useState, useRef, useEffect } from 'react';
import { ToastStack } from '../../../../utils/Toast';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import {
    getCurrentAuthUser,
    updateCurrentPassword,
    verifyCurrentPassword,
} from '../../../../services/settingServices';
import { getCompanyAdminById, getCompanyById, updateCompany } from '../../../../services/companyService';
import { ShimmerBlock, LoadingStatus } from '../../../../utils/Shimmer';

// ─── Reusable Toggle ─────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#005580] focus:ring-offset-2 ${checked ? 'bg-[#005580]' : 'bg-gray-200'}`}
        role="switch"
        aria-checked={checked}
    >
        <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

// ─── Reusable Input Field ─────────────────────────────────────
const InputField = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
    <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-500"
        />
    </div>
);

// ─── Toggle Row ───────────────────────────────────────────────
const ToggleRow = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-0">
        <div className="pr-8">
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <Toggle checked={checked} onChange={onChange} />
    </div>
);

const TABS = ['Company Profile', 'Notifications', 'Security'];

const CompanyProfileTabShimmer = () => (
    <LoadingStatus label="Loading company profile" className="space-y-5">
        {/* Logo row */}
        <div className="flex items-center gap-4 py-2">
            <ShimmerBlock className="w-14 h-14 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                    <ShimmerBlock className="h-9 w-32 rounded-lg" />
                    <ShimmerBlock className="h-9 w-24 rounded-lg" />
                </div>
                <ShimmerBlock className="h-3 max-w-xs rounded" />
            </div>
        </div>

        {/* Form fields */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <ShimmerBlock className="h-4 w-28 rounded" />
                    <ShimmerBlock className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                    <ShimmerBlock className="h-4 w-24 rounded" />
                    <ShimmerBlock className="h-10 w-full rounded-lg" />
                </div>
            </div>
            <div className="space-y-2">
                <ShimmerBlock className="h-4 w-36 rounded" />
                <ShimmerBlock className="h-10 w-full rounded-lg" />
            </div>
        </div>

        <div className="pt-1">
            <ShimmerBlock className="h-10 w-36 rounded-lg" />
        </div>
    </LoadingStatus>
);

// ─── Main Component ───────────────────────────────────────────
const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('Company Profile');
    const logoRef = useRef();
    const [logoPreview, setLogoPreview] = useState('');

    // Company Profile (synced with `companies` table)
    const [companyId, setCompanyId] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [companyAddr, setCompanyAddr] = useState('');

    // Notifications
    const [notifs, setNotifs] = useState({
        newJobAssignments: true,
        jobCancellations: true,
        driverDocExpiry: false,
        sosAlerts: true,
        newCounterOffers: true,
        vehicleCheckCompliance: true,
        systemUpdates: false,
    });
    const setNotif = (key) => (val) => setNotifs(prev => ({ ...prev, [key]: val }));

    // Security
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [toasts, setToasts] = useState([]);

    const pushToast = (type, message) => {
        setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setProfileLoading(true);
            try {
                const user = await getCurrentAuthUser();
                const admin = await getCompanyAdminById(user.id);
                if (!admin?.company_id) {
                    throw new Error('No company linked to your account.');
                }
                const company = await getCompanyById(admin.company_id);
                if (cancelled) return;
                setCompanyId(company.id);
                setCompanyName(company.company_name ?? '');
                setContactEmail(company.company_email ?? '');
                setCompanyAddr(company.company_address ?? '');
            } catch (error) {
                if (!cancelled) {
                    pushToast('error', error?.message || 'Failed to load company profile.');
                }
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSaveCompanyProfile = async () => {
        if (!companyId) {
            pushToast('error', 'Company not loaded. Please refresh the page.');
            return;
        }
        const name = companyName.trim();
        if (!name) {
            pushToast('warning', 'Please enter a company name.');
            return;
        }
        setProfileSaving(true);
        try {
            await updateCompany(companyId, {
                company_name: name,
                company_email: contactEmail.trim(),
                company_address: companyAddr.trim(),
            });
            pushToast('success', 'Company profile saved.');
        } catch (error) {
            pushToast('error', error?.message || 'Failed to save company profile.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleLogoChange = (file) => {
        if (!file) return;
        setLogoPreview(URL.createObjectURL(file));
    };

    const handlePasswordUpdate = async () => {
        try {
            if (!currentPwd || !newPwd || !confirmPwd) {
                pushToast('warning', 'Please enter current password, new password, and confirm password.');
                return;
            }

            if (newPwd !== confirmPwd) {
                pushToast('warning', 'New password and confirm password must match.');
                return;
            }

            if (newPwd === currentPwd) {
                pushToast('warning', 'New password must be different from your current password.');
                return;
            }

            setPasswordLoading(true);

            const authUser = await getCurrentAuthUser();
            if (!authUser?.email) {
                throw new Error('Authenticated user email not found.');
            }

            await verifyCurrentPassword(currentPwd);
            await updateCurrentPassword(newPwd);

            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
            pushToast('success', 'Password updated successfully.');
        } catch (error) {
            const message = error?.message || 'Failed to update password.';
            if (message.toLowerCase().includes('invalid login credentials')) {
                pushToast('error', 'Wrong current password entered.');
                return;
            }
            pushToast('error', message);
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-0">
            <ToastStack toasts={toasts} onClose={removeToast} />

            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your company profile, notifications, and security settings.</p>
            </div>


            {/* ── Tabs ── */}
            <div className="flex items-center border-b border-gray-200 mb-6">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                            ${activeTab === tab
                                ? 'text-[#005580] border-[#005580]'
                                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* TAB: Company Profile                              */}
            {/* ══════════════════════════════════════════════════ */}
            {activeTab === 'Company Profile' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                    {/* Section Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Company Profile</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Update your company's information and branding.</p>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {profileLoading ? (
                            <CompanyProfileTabShimmer />
                        ) : (
                            <>
                                {/* Logo Row */}
                                <div className="flex items-center gap-4 py-2">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Company Logo"
                                            className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                                        />
                                    ) : (
                                        <div
                                            className="w-14 h-14 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400 text-center px-1"
                                            aria-hidden
                                        >
                                            No logo
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => logoRef.current?.click()}
                                                className="px-4 py-2 bg-[#005580] text-white text-sm font-medium rounded-lg hover:bg-sky-900 transition-colors"
                                            >
                                                Upload Logo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLogoPreview('')}
                                                disabled={!logoPreview}
                                                className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Recommended size: 200x200px, PNG or JPG.</p>
                                    </div>
                                    <input
                                        ref={logoRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleLogoChange(e.target.files[0])}
                                    />
                                </div>

                                {/* Form Fields */}
                                <div className="border-t border-gray-100 pt-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField
                                            label="Company Name"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                        />
                                        <InputField
                                            label="Contact Email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            type="email"
                                        />
                                    </div>
                                    <InputField
                                        label="Company Address"
                                        value={companyAddr}
                                        onChange={(e) => setCompanyAddr(e.target.value)}
                                    />
                                </div>

                                {/* Save Button */}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={handleSaveCompanyProfile}
                                        disabled={profileSaving || !companyId}
                                        className="px-5 py-2.5 bg-[#005580] text-white text-sm font-semibold rounded-lg hover:bg-sky-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {profileSaving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* TAB: Notifications                                */}
            {/* ══════════════════════════════════════════════════ */}
            {activeTab === 'Notifications' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                    {/* Email Notifications */}
                    <div className="px-6 pt-6 pb-2 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Email Notifications</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Receive emails for important events. You can manage them here.</p>
                    </div>
                    <div className="px-6">
                        <ToggleRow label="New Job Assignments" description="Get notified when a new job is assigned to one of your drivers." checked={notifs.newJobAssignments} onChange={setNotif('newJobAssignments')} />
                        <ToggleRow label="Job Cancellations" description="Receive an email when a client cancels a scheduled job." checked={notifs.jobCancellations} onChange={setNotif('jobCancellations')} />
                        <ToggleRow label="Driver Document Expiry" description="Get a weekly summary of driver documents that are about to expire." checked={notifs.driverDocExpiry} onChange={setNotif('driverDocExpiry')} />
                        <ToggleRow label="SOS Alerts" description="Receive an immediate email notification for any SOS alert triggered by your drivers." checked={notifs.sosAlerts} onChange={setNotif('sosAlerts')} />
                    </div>

                    {/* In-App Notifications */}
                    <div className="border-t border-gray-100">
                        <div className="px-6 pt-6 pb-2 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">In-App Notifications</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Manage notifications you see within the RideRoster web portal.</p>
                        </div>
                        <div className="px-6">
                            <ToggleRow label="New Counter-Offers" description="Show a notification when a client submits a counter-offer for a job." checked={notifs.newCounterOffers} onChange={setNotif('newCounterOffers')} />
                            <ToggleRow label="Vehicle Check Compliance" description="Notify me when a vehicle fails its pre-journey check." checked={notifs.vehicleCheckCompliance} onChange={setNotif('vehicleCheckCompliance')} />
                            <ToggleRow label="System Updates" description="Show announcements about new features and system maintenance." checked={notifs.systemUpdates} onChange={setNotif('systemUpdates')} />
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* TAB: Security                                     */}
            {/* ══════════════════════════════════════════════════ */}
            {activeTab === 'Security' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                        <p className="text-sm text-gray-500 mt-0.5">For your security, we recommend choosing a strong password that you don't use elsewhere.</p>
                    </div>

                    <div className="px-6 py-5 border-t border-gray-100 space-y-4 max-w-md">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPwd ? 'text' : 'password'}
                                    placeholder="Enter your current password"
                                    value={currentPwd}
                                    onChange={(e) => setCurrentPwd(e.target.value)}
                                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] transition-colors bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPwd((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showCurrentPwd ? 'Hide current password' : 'Show current password'}
                                >
                                    {showCurrentPwd ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPwd ? 'text' : 'password'}
                                    placeholder="Enter a new password"
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] transition-colors bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPwd((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showNewPwd ? 'Hide new password' : 'Show new password'}
                                >
                                    {showNewPwd ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPwd ? 'text' : 'password'}
                                    placeholder="Confirm your new password"
                                    value={confirmPwd}
                                    onChange={(e) => setConfirmPwd(e.target.value)}
                                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#005580] focus:ring-1 focus:ring-[#005580] transition-colors bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPwd((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showConfirmPwd ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirmPwd ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 flex items-center gap-3">
                        <button
                            onClick={() => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }}
                            disabled={passwordLoading}
                            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePasswordUpdate}
                            disabled={passwordLoading}
                            className="px-5 py-2.5 bg-[#005580] text-white text-sm font-semibold rounded-lg hover:bg-sky-900 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {passwordLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
