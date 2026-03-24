import React, { useState } from 'react';
import { MdLock, MdWarning } from 'react-icons/md';
import { HiOutlineLocationMarker, HiOutlineFlag, HiPlus } from 'react-icons/hi';
import { MdKeyboardArrowDown } from 'react-icons/md';

const clientOptions = [
    'Westwood High School District',
    'Bright Horizons Transport',
    'Northwood Academy',
    'City Center Charter School',
    'Eastside Learning Institute',
];

const SubAdmin_NewJob = () => {
    const [jobTitle, setJobTitle]         = useState('');
    const [clientName, setClientName]     = useState('Westwood High School District');
    const [clientOpen, setClientOpen]     = useState(false);
    const [notes, setNotes]               = useState('');
    const [pickupGPS, setPickupGPS]       = useState('');
    const [pickupPost, setPickupPost]     = useState('');
    const [dropoffGPS, setDropoffGPS]     = useState('');
    const [dropoffPost, setDropoffPost]   = useState('');
    const [pickupDate, setPickupDate]     = useState('2025-11-25');
    const [pickupTime, setPickupTime]     = useState('07:30');

    return (
        <div className="space-y-5">

            {/* Page Title */}
            <h1 className="text-[22px] font-bold text-gray-900">Create New Job</h1>

            {/* Permission Banner */}
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <MdWarning size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-amber-700">Permission Limitations Active</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                        Your role has limited permissions. You can create jobs, but compensation rates are fixed and all new jobs require approval from a Company Admin.
                    </p>
                </div>
            </div>

            {/* ── Section 1: Route & Client Information ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Route &amp; Client Information</h2>

                {/* Job Title + Client Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Job Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Job Title / Route Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Morning School Run – Route A"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>

                    {/* Client Name Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Client Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setClientOpen((o) => !o)}
                                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] transition-colors"
                            >
                                <span>{clientName}</span>
                                <MdKeyboardArrowDown size={20} className="text-gray-400 shrink-0" />
                            </button>
                            {clientOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                                    {clientOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => { setClientName(opt); setClientOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 ${clientName === opt ? 'font-semibold text-[#005C7A]' : 'text-gray-700'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Internal Notes */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Internal Notes (Optional)
                    </label>
                    <textarea
                        rows={4}
                        placeholder="add any relevant details for dispatchers or admins..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] resize-none"
                    />
                </div>
            </div>

            {/* ── Section 2: Pickup & Drop-off Points ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-bold text-gray-900">Pickup &amp; Drop-off Points</h2>
                    <button
                        type="button"
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#005C7A] hover:text-[#004a63] transition-colors"
                    >
                        <HiPlus size={16} />
                        Add Stop
                    </button>
                </div>

                {/* Pickup Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <HiOutlineLocationMarker size={16} className="text-blue-500 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">GPS coordinates</span>
                            <span className="text-red-500 text-sm">*</span>
                        </div>
                        <input
                            type="text"
                            placeholder="GPS"
                            value={pickupGPS}
                            onChange={(e) => setPickupGPS(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-gray-700">Post Code</span>
                            <span className="text-red-500 text-sm">*</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Post Code"
                            value={pickupPost}
                            onChange={(e) => setPickupPost(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>
                </div>

                {/* Drop-off Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <HiOutlineFlag size={16} className="text-red-500 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">GPS coordinates</span>
                            <span className="text-red-500 text-sm">*</span>
                        </div>
                        <input
                            type="text"
                            placeholder="GPS"
                            value={dropoffGPS}
                            onChange={(e) => setDropoffGPS(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-gray-700">Post Code</span>
                            <span className="text-red-500 text-sm">*</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Post Code"
                            value={dropoffPost}
                            onChange={(e) => setDropoffPost(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>
                </div>
            </div>

            {/* ── Section 3: Schedule & Compensation ── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                <h2 className="text-[16px] font-bold text-gray-900">Schedule &amp; Compensation</h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Pickup Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Pickup Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>

                    {/* Pickup Time */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Pickup Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A]"
                        />
                    </div>

                    {/* Driver Rate — locked */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Driver Rate (per hour)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">$</span>
                            <input
                                type="text"
                                value="25.00"
                                readOnly
                                className="w-full pl-7 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                            />
                            <MdLock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* PA Rate — locked */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            PA Rate (per hour)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">$</span>
                            <input
                                type="text"
                                value="21.50"
                                readOnly
                                className="w-full pl-7 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                            />
                            <MdLock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex items-center justify-end gap-3 pb-4">
                <button
                    type="button"
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                    Save as Draft
                </button>
                <button
                    type="button"
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#005C7A] hover:bg-[#004a63] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    Submit for Approval →
                </button>
            </div>

        </div>
    );
};

export default SubAdmin_NewJob;
