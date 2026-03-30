import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdPerson,
    MdHome,
    MdSchool,
    MdAccessible,
    MdOutlineNotes,
    MdSettings,
    MdInfo,
} from 'react-icons/md';
import { HiExclamationCircle } from 'react-icons/hi';
import { ToastStack } from '../../../../../utils/Toast';

const EditPassenger = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [form, setForm] = useState({
        firstName: 'Alex',
        surname: 'Thompson',
        email: 'alex.t@guardian-mail.com',
        contact1: '7700900077',
        contact2: '7700900123',
        homeAddress: '124 Maple Avenue, Springfield',
        homePostcode: 'SP1 2NF',
        pickupTime: '07:45',
        schoolAddress: "St. Mary's Academy, High St",
        schoolPostcode: 'SP4 8RT',
        returnTime: '15:30',
        wheelchair: 'yes',
        notes: 'Passenger needs assistance with seatbelt. Prefers sitting in the middle row.',
    });
    const [toasts, setToasts] = useState([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const handleChange = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const noteMax = 500;

    const goBack = () => navigate(`/admin/users/passengers/${id}`);

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

    const requiredKeys = [
        'firstName',
        'surname',
        'contact1',
        'homeAddress',
        'homePostcode',
        'pickupTime',
        'schoolAddress',
        'schoolPostcode',
        'returnTime',
    ];

    const isMissing = (key) => !String(form[key] || '').trim();
    const showRequiredError = (key) => submitAttempted && isMissing(key);

    const inputClass = (key) =>
        `w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 ${
            showRequiredError(key)
                ? 'border-red-400 text-red-700 focus:ring-red-500'
                : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'
        }`;

    const textareaClass = (key) =>
        `w-full px-3 py-2.5 border rounded-lg text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 resize-none ${
            showRequiredError(key)
                ? 'border-red-400 text-red-700 focus:ring-red-500'
                : 'border-gray-200 text-gray-700 focus:ring-[#004D6D]'
        }`;

    const prefixedPhoneWrapClass = (key) =>
        `flex items-center border rounded-lg overflow-hidden focus-within:ring-1 ${
            showRequiredError(key)
                ? 'border-red-400 focus-within:ring-red-500'
                : 'border-gray-200 focus-within:ring-[#004D6D]'
        }`;

    const getCompletionPercentage = () => {
        const filled = requiredKeys.filter((key) => !isMissing(key)).length;
        return Math.round((filled / requiredKeys.length) * 100);
    };

    const completion = getCompletionPercentage();

    const handleSave = () => {
        setSubmitAttempted(true);
        const missing = requiredKeys.some((key) => isMissing(key));
        if (missing) {
            pushToast('warning', 'Please fill in all required fields before saving passenger.');
            return;
        }
        pushToast('success', 'Passenger updated successfully.');
        navigate(`/admin/users/passengers/${id}`);
    };

    return (
        <div className="space-y-5 pb-20">
            <ToastStack
                toasts={toasts}
                onClose={(toastId) => setToasts((prev) => prev.filter((t) => t.id !== toastId))}
            />

            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Edit Passenger</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                <div className="lg:col-span-2 space-y-5">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <MdPerson size={20} className="text-[#004D6D]" />
                            <h2 className="text-[14px] font-bold text-gray-900">Passenger Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">First Name<span className="text-red-500">*</span></label>
                                <input type="text" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className={inputClass('firstName')} />
                                {showRequiredError('firstName') && <p className="text-[11px] font-semibold text-red-600">First Name is required.</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">Surname<span className="text-red-500">*</span></label>
                                <input type="text" value={form.surname} onChange={(e) => handleChange('surname', e.target.value)} className={inputClass('surname')} />
                                {showRequiredError('surname') && <p className="text-[11px] font-semibold text-red-600">Surname is required.</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                            <label className="text-[12px] font-semibold text-gray-700">Email ID</label>
                            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D]" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">Contact Number 1<span className="text-red-500">*</span></label>
                                <div className={prefixedPhoneWrapClass('contact1')}>
                                    <span className="px-3 py-2.5 bg-gray-50 text-[13px] text-gray-500 font-medium border-r border-gray-200 shrink-0">+44</span>
                                    <input type="tel" value={form.contact1} onChange={(e) => handleChange('contact1', e.target.value)} className="flex-1 px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white" />
                                </div>
                                {showRequiredError('contact1') && <p className="text-[11px] font-semibold text-red-600">Contact Number 1 is required.</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-700">Contact Number 2 (Optional)</label>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#004D6D]">
                                    <span className="px-3 py-2.5 bg-gray-50 text-[13px] text-gray-500 font-medium border-r border-gray-200 shrink-0">+44</span>
                                    <input type="tel" value={form.contact2} onChange={(e) => handleChange('contact2', e.target.value)} className="flex-1 px-3 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none bg-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdHome size={18} className="text-[#004D6D]" />
                                <h2 className="text-[13px] font-bold text-gray-900">Pickup Address (Home)</h2>
                            </div>
                            <div className="space-y-1.5 mb-4">
                                <label className="text-[12px] font-semibold text-gray-700">Home Address<span className="text-red-500">*</span></label>
                                <textarea rows={3} value={form.homeAddress} onChange={(e) => handleChange('homeAddress', e.target.value)} className={textareaClass('homeAddress')} />
                                {showRequiredError('homeAddress') && <p className="text-[11px] font-semibold text-red-600">Home Address is required.</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">Post Code<span className="text-red-500">*</span></label>
                                    <input type="text" value={form.homePostcode} onChange={(e) => handleChange('homePostcode', e.target.value)} className={inputClass('homePostcode')} />
                                    {showRequiredError('homePostcode') && <p className="text-[11px] font-semibold text-red-600">Post Code is required.</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">Pick-up Time<span className="text-red-500">*</span></label>
                                    <input type="time" value={form.pickupTime} onChange={(e) => handleChange('pickupTime', e.target.value)} className={`w-full px-3 py-2.5 border rounded-lg text-[13px] pr-9 focus:outline-none focus:ring-1 ${showRequiredError('pickupTime') ? 'border-red-400 text-red-700 focus:ring-red-500' : 'border-gray-200 text-gray-500 focus:ring-[#004D6D]'}`} />
                                    {showRequiredError('pickupTime') && <p className="text-[11px] font-semibold text-red-600">Pick-up Time is required.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdSchool size={18} className="text-orange-500" />
                                <h2 className="text-[13px] font-bold text-gray-900">Drop-Off Address (School)</h2>
                            </div>
                            <div className="space-y-1.5 mb-4">
                                <label className="text-[12px] font-semibold text-gray-700">Drop-Off Address<span className="text-red-500">*</span></label>
                                <textarea rows={3} value={form.schoolAddress} onChange={(e) => handleChange('schoolAddress', e.target.value)} className={textareaClass('schoolAddress')} />
                                {showRequiredError('schoolAddress') && <p className="text-[11px] font-semibold text-red-600">Drop-Off Address is required.</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">Post Code<span className="text-red-500">*</span></label>
                                    <input type="text" value={form.schoolPostcode} onChange={(e) => handleChange('schoolPostcode', e.target.value)} className={inputClass('schoolPostcode')} />
                                    {showRequiredError('schoolPostcode') && <p className="text-[11px] font-semibold text-red-600">Post Code is required.</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-700">Return Time<span className="text-red-500">*</span></label>
                                    <input type="time" value={form.returnTime} onChange={(e) => handleChange('returnTime', e.target.value)} className={`w-full px-3 py-2.5 border rounded-lg text-[13px] pr-9 focus:outline-none focus:ring-1 ${showRequiredError('returnTime') ? 'border-red-400 text-red-700 focus:ring-red-500' : 'border-gray-200 text-gray-500 focus:ring-[#004D6D]'}`} />
                                    {showRequiredError('returnTime') && <p className="text-[11px] font-semibold text-red-600">Return Time is required.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdAccessible size={18} className="text-blue-500" />
                                <h2 className="text-[13px] font-bold text-gray-900">Accessibility</h2>
                            </div>
                            <p className="text-[12px] font-semibold text-gray-700 mb-3">Wheelchair Requirement</p>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="wheelchair" checked={form.wheelchair === 'yes'} onChange={() => handleChange('wheelchair', 'yes')} className="w-4 h-4 accent-[#004D6D]" />
                                    <span className="text-[13px] text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="wheelchair" checked={form.wheelchair === 'no'} onChange={() => handleChange('wheelchair', 'no')} className="w-4 h-4 accent-[#004D6D]" />
                                    <span className="text-[13px] text-gray-700">No</span>
                                </label>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MdOutlineNotes size={18} className="text-[#004D6D]" />
                                <h2 className="text-[13px] font-bold text-gray-900">Notes (Optional)</h2>
                            </div>
                            <textarea
                                rows={4}
                                maxLength={noteMax}
                                value={form.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004D6D] resize-none"
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">{form.notes.length} / {noteMax} characters</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
                        <div className="bg-[#004D6D] px-5 py-4">
                            <h3 className="text-[14px] font-bold text-white">Schedule Summary</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <MdSettings size={18} className="text-gray-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">Morning Pickup</div>
                                    <div className="text-[15px] font-bold text-gray-800 mt-0.5">{form.pickupTime || <span className="text-gray-400 font-bold">-- : --</span>}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                    <MdSchool size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-gray-500 font-medium">School Drop-Off</div>
                                    <div className="text-[15px] font-bold text-gray-800 mt-0.5">{form.returnTime || <span className="text-gray-400 font-bold">-- : --</span>}</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600">Wheelchair Access</span>
                                    <span className={`text-[12px] font-semibold ${form.wheelchair === 'yes' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {form.wheelchair === 'yes' ? 'Required' : 'Not Required'}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[12px] text-gray-600">Form Completion</span>
                                        <span className="text-[12px] font-bold text-[#004D6D]">{completion}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#004D6D] rounded-full" style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                            </div>

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

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                    <HiExclamationCircle size={16} className="text-red-500 shrink-0" />
                    <span className="text-[12px] text-red-500">Please fill in all required fields marked with <span className="font-bold">*</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={goBack} className="px-5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all rounded-lg">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-5 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPassenger;
