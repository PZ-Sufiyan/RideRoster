import React from 'react';

const Settings = () => {
    return (
        <div className="space-y-6">
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
                            defaultValue="Eleanor Pena"
                            className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            defaultValue="eleanor.pena@example.com"
                            className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Secondary Email Address */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Secondary Email Address
                        </label>
                        <input
                            type="email"
                            defaultValue="eleanor.pena@example.com"
                            className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Empty Div to maintain grid structure (optional, but good for explicit layout if we wanted to force empty cell, though CSS Grid auto placement allows skipping) */}
                    <div className="hidden md:block"></div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            defaultValue="+1 (555) 123-4567"
                            className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Role
                        </label>
                        <input
                            type="text"
                            defaultValue="Super Admin"
                            disabled
                            className="block w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                        />
                    </div>

                </div>

                {/* Actions */}
                <div className="mt-10 flex items-center gap-4">
                    <button className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white">
                        Cancel
                    </button>
                    <button className="px-6 py-2.5 bg-[#407B90] rounded-lg text-sm font-semibold text-white hover:bg-[#356a7d] transition-colors shadow-sm">
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Settings;
