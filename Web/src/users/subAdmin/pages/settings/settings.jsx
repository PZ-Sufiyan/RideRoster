import React, { useState } from 'react';

const SubAdmin_Settings = () => {
    // Profile State
    const [fullName, setFullName] = useState('Alex Cohen');
    const [email, setEmail] = useState('alex.cohen@company.com');
    const [phone, setPhone] = useState('+1 (555) 123-4567');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Notification State
    const [jobUpdates, setJobUpdates] = useState(true);
    const [approvalRequests, setApprovalRequests] = useState(true);
    const [systemAlerts, setSystemAlerts] = useState(true);

    const toggleClass = "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none";
    const thumbClass = "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out";

    const Toggle = ({ enabled, setEnabled }) => (
        <button
            type="button"
            className={`${toggleClass} ${enabled ? 'bg-[#005C7A]' : 'bg-gray-200'}`}
            onClick={() => setEnabled(!enabled)}
        >
            <span className={`${thumbClass} ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    return (
        <div className="max-w-7xl space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

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
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
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

                    <button className="px-6 py-2.5 bg-[#005C7A] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors">
                        Save Changes
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
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-tight">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#005C7A] focus:border-[#005C7A]"
                                />
                            </div>
                        </div>
                    </div>

                    <button className="px-6 py-2.5 bg-[#005C7A] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors">
                        Update Security Settings
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

                    <button className="px-6 py-2.5 bg-[#005C7A] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors">
                        Save Notification Preferences
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubAdmin_Settings;
