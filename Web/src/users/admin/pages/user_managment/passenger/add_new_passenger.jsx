import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdPerson,
    MdHome,
    MdSchool,
    MdAccessible,
    MdOutlineNotes,
    MdAccessTime,
    MdSettings,
    MdInfo,
} from 'react-icons/md';
import { HiExclamationCircle } from 'react-icons/hi';

const AddNewPassenger = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: '',
        surname: '',
        email: '',
        contact1: '',
        contact2: '',
        homeAddress: '',
        homePostcode: 'SW1A 1AA',
        pickupTime: '',
        schoolAddress: '',
        schoolPostcode: 'E1 6AN',
        returnTime: '',
        wheelchair: 'no',
        notes: '',
    });

    const handleChange = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const noteMax = 500;

    const goBack = () => navigate('/admin/users/passengers');

    return (
        <div className="space-y-5 pb-20">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Add New Passenger</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={goBack}
                        className="px-5 py-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button className="px-5 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm">
                        Save Passenger
                    </button>
                </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* ── LEFT: main form (2/3 width) ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── PASSENGER DETAILS ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <MdPerson size={20} className="text-[#004D6D]" />
                            <h2 className="text-[14px] font-bold text-gray-900">Passenger Details</h2>
                        </div>

                        {/* First Name + Surname */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    First Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. John"
                                    value={form.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Surname<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Doe"
                                    value={form.surname}
                                    onChange={(e) => handleChange('surname', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5 mb-4">
                            <label className="text-[12px] font-semibold text-gray-700">Email ID</label>
                            <input
                                type="email"
                                placeholder="passenger@example.com"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                            />
                        </div>

                        {/* Contact Number 1 + 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Contact Number 1<span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#004D6D]">
                                    <span className="px-3 py-2.5 bg-gray-50 text-[13px] text-gray-500 font-medium border-r border-gray-200 shrink-0">+44</span>
                                    <input
                                        type="tel"
                                        placeholder="7700 900000"
                                        value={form.contact1}
                                        onChange={(e) => handleChange('contact1', e.target.value)}
                                        className="flex-1 px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">Contact Number 2 (Optional)</label>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#004D6D]">
                                    <span className="px-3 py-2.5 bg-gray-50 text-[13px] text-gray-500 font-medium border-r border-gray-200 shrink-0">+44</span>
                                    <input
                                        type="tel"
                                        placeholder="7700 900000"
                                        value={form.contact2}
                                        onChange={(e) => handleChange('contact2', e.target.value)}
                                        className="flex-1 px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── PICKUP + DROP-OFF ADDRESS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Pickup Address (Home) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdHome size={18} className="text-[#004D6D]" />
                                <h2 className="text-[13px] font-bold text-gray-900">Pickup Address (Home)</h2>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Home Address<span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter full address..."
                                    value={form.homeAddress}
                                    onChange={(e) => handleChange('homeAddress', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Post Code<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.homePostcode}
                                        onChange={(e) => handleChange('homePostcode', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Pick-up Time<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={form.pickupTime}
                                            onChange={(e) => handleChange('pickupTime', e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#004D6D] pr-9"
                                        />
                                        <MdAccessTime className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 italic">
                                "This is the default morning pickup location."
                            </p>
                        </div>

                        {/* Drop-Off Address (School) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdSchool size={18} className="text-orange-500" />
                                <h2 className="text-[13px] font-bold text-gray-900">Drop-Off Address (School)</h2>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <label className="text-[12px] font-semibold text-gray-700">
                                    Drop-Off Address<span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="School name and address..."
                                    value={form.schoolAddress}
                                    onChange={(e) => handleChange('schoolAddress', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Post Code<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.schoolPostcode}
                                        onChange={(e) => handleChange('schoolPostcode', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004D6D]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">
                                        Return Time<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={form.returnTime}
                                            onChange={(e) => handleChange('returnTime', e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#004D6D] pr-9"
                                        />
                                        <MdAccessTime className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 italic">
                                "Used for return journey scheduling."
                            </p>
                        </div>
                    </div>

                    {/* ── ACCESSIBILITY + NOTES ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Accessibility */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdAccessible size={18} className="text-blue-500" />
                                <h2 className="text-[13px] font-bold text-gray-900">Accessibility</h2>
                            </div>

                            <p className="text-[12px] font-semibold text-gray-700 mb-3">Wheelchair Requirement</p>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="wheelchair"
                                        value="yes"
                                        checked={form.wheelchair === 'yes'}
                                        onChange={() => handleChange('wheelchair', 'yes')}
                                        className="w-4 h-4 accent-[#004D6D]"
                                    />
                                    <span className="text-[13px] text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="wheelchair"
                                        value="no"
                                        checked={form.wheelchair === 'no'}
                                        onChange={() => handleChange('wheelchair', 'no')}
                                        className="w-4 h-4 accent-[#004D6D]"
                                    />
                                    <span className="text-[13px] text-gray-700">No</span>
                                </label>
                            </div>
                        </div>

                        {/* Notes (Optional) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdOutlineNotes size={18} className="text-[#004D6D]" />
                                <h2 className="text-[13px] font-bold text-gray-900">Notes (Optional)</h2>
                            </div>

                            <textarea
                                rows={4}
                                placeholder="Medical notes, behavior instructions..."
                                maxLength={noteMax}
                                value={form.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D] resize-none"
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                {form.notes.length} / {noteMax} characters
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Schedule Summary ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
                        {/* Teal header */}
                        <div className="bg-[#004D6D] px-5 py-4">
                            <h3 className="text-[14px] font-bold text-white">Schedule Summary</h3>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Morning Pickup */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <MdSettings size={18} className="text-gray-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">Morning Pickup</div>
                                    <div className="text-[15px] font-bold text-gray-800 mt-0.5">
                                        {form.pickupTime
                                            ? form.pickupTime
                                            : <span className="text-gray-400 font-bold">-- : --</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* School Drop-Off */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                    <MdSchool size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">School Drop-Off</div>
                                    <div className="text-[15px] font-bold text-gray-800 mt-0.5">
                                        {form.returnTime
                                            ? form.returnTime
                                            : <span className="text-gray-400 font-bold">-- : --</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                {/* Wheelchair Access */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Wheelchair Access</span>
                                    <span className={`text-[12px] font-semibold ${form.wheelchair === 'yes' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {form.wheelchair === 'yes' ? 'Required' : 'Not Required'}
                                    </span>
                                </div>

                                {/* Form Completion */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[12px] text-gray-600">Form Completion</span>
                                        <span className="text-[12px] font-bold text-[#004D6D]">45%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#004D6D] rounded-full" style={{ width: '45%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Info note */}
                            <div className="flex items-start gap-2 pt-2">
                                <MdInfo size={15} className="text-gray-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    Summary updates live as you fill in the details. Please ensure all mandatory fields are accurate.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── Sticky Bottom Footer ── */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between z-20">
                {/* Left: validation note */}
                <div className="flex items-center gap-2">
                    <HiExclamationCircle size={16} className="text-red-500 shrink-0" />
                    <span className="text-[12px] text-red-500">Please fill in all required fields marked with <span className="font-bold">*</span></span>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={goBack}
                        className="px-5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all rounded-lg"
                    >
                        Cancel
                    </button>
                    <button className="px-5 py-2 border border-gray-300 rounded-lg text-[13px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                        Save &amp; Add Another
                    </button>
                    <button className="px-5 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm opacity-80">
                        Save Passenger
                    </button>
                </div>
            </div>

        </div>
    );
};

export default AddNewPassenger;
