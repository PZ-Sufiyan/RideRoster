import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdHome,
    MdSchool,
    MdEdit,
    MdBlock,
} from 'react-icons/md';
import { HiOutlineWifi } from 'react-icons/hi';

/* ── Toggle Switch ────────────────────────────────────────── */
const Toggle = ({ checked }) => (
    <div
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#004D6D]' : 'bg-gray-300'}`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </div>
);

/* ── Read-only field ──────────────────────────────────────── */
const ReadField = ({ label, value }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] text-gray-500">{label}</label>
        <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-white">
            {value}
        </div>
    </div>
);

/* ── Main Component ───────────────────────────────────────── */
const PassengerDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <div className="space-y-5">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <h1 className="text-[22px] font-bold text-gray-900">Passenger Profile</h1>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-red-400 rounded-lg text-[13px] font-semibold text-red-500 bg-white hover:bg-red-50 transition-all">
                        <MdBlock size={16} />
                        Deactivate
                    </button>
                    <button
                        onClick={() => navigate(`/admin/users/passengers/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004D6D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#003c55] transition-all shadow-sm"
                    >
                        <MdEdit size={15} />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* ════════ LEFT (2/3) ════════ */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── Profile Summary Card ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-4 mb-5">
                            {/* Avatar */}
                            <img
                                src="https://i.pravatar.cc/150?u=alex-thompson"
                                alt="Alex Thompson"
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shrink-0"
                            />
                            {/* Name + badges */}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[18px] font-bold text-gray-900">Alex Thompson</span>
                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">ACTIVE</span>
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-500">
                                        {/* wheelchair icon inline */}
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5h2l1 4h3v2h-3.5l-.5-2H13l1 4a4 4 0 1 1-2 0l-1-4z"/>
                                        </svg>
                                        Wheelchair Required
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assigned row */}
                        <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4">
                            <div>
                                <div className="text-[10px] text-gray-400 font-medium mb-1">Assigned Job</div>
                                <div className="text-[13px] font-semibold text-[#004D6D]">Job #42 – North District</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-medium mb-1">Assigned Driver</div>
                                <div className="text-[13px] font-semibold text-gray-800">Marcus Sterling</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-medium mb-1">Assigned PA</div>
                                <div className="text-[13px] font-semibold text-gray-800">Sarah Jenkins</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Personal Information ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-5">Personal Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <ReadField label="First Name" value="Alex" />
                            <ReadField label="Surname" value="Thompson" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <ReadField label="Email ID" value="alex.t@guardian-mail.com" />
                            <ReadField label="Contact Number 1" value="+44 7700 900077" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ReadField label="Contact Number 2 (Optional)" value="+44 7700 900123" />
                        </div>
                    </div>

                    {/* ── Pickup + Drop-Off ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Pickup (Home) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <MdHome size={18} className="text-[#004D6D]" />
                                </div>
                                <h3 className="text-[13px] font-bold text-gray-900">Pickup (Home)</h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Address</div>
                                    <div className="text-[13px] text-gray-800 font-medium">124 Maple Avenue, Springfield</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Post Code</div>
                                    <div className="text-[13px] text-gray-800 font-medium">SP1 2NF</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Pickup Time (Morning)</div>
                                    <div className="text-[14px] font-bold text-[#004D6D]">07:45 AM</div>
                                </div>
                            </div>
                        </div>

                        {/* Drop-Off (School) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                    <MdSchool size={18} className="text-orange-500" />
                                </div>
                                <h3 className="text-[13px] font-bold text-gray-900">Drop-Off (School)</h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Address</div>
                                    <div className="text-[13px] text-gray-800 font-medium">St. Mary's Academy, High St</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Post Code</div>
                                    <div className="text-[13px] text-gray-800 font-medium">SP4 8RT</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Pickup Time (Return)</div>
                                    <div className="text-[14px] font-bold text-orange-500">03:30 PM</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ════════ RIGHT (1/3) ════════ */}
                <div className="lg:col-span-1 space-y-5">

                    {/* ── Accessibility & Notes ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Accessibility &amp; Notes</h2>

                        {/* Wheelchair Requirement */}
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <div className="text-[13px] font-bold text-gray-800">Wheelchair Requirement</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">Requires accessible vehicle</div>
                            </div>
                            <Toggle checked={true} />
                        </div>

                        {/* Special Instructions */}
                        <div>
                            <div className="text-[13px] font-bold text-gray-800 mb-2">Special Instructions / Notes</div>
                            <div className="w-full px-3 py-3 border border-gray-200 rounded-lg text-[12px] text-gray-700 bg-white leading-relaxed min-h-[90px]">
                                Passenger needs assistance with seatbelt. Prefers sitting in the middle row. Contact parent 5 mins before arrival.
                            </div>
                            <p className="text-[11px] text-gray-400 italic mt-2">
                                Helper text: Internal notes for drivers and PAs.
                            </p>
                        </div>
                    </div>

                    {/* ── Audit & History ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-[15px] font-bold text-gray-900 mb-4">Audit &amp; History</h2>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-gray-500">Created Date</span>
                                <span className="text-[12px] font-medium text-gray-700">Jan 12, 2024</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-gray-500">Last Updated By</span>
                                <span className="text-[12px] font-medium text-gray-700">Admin (ID: #409)</span>
                            </div>
                        </div>

                        {/* Recent Changes */}
                        <div>
                            <div className="text-[11px] font-semibold text-gray-500 mb-3">Recent Changes</div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-[#004D6D] shrink-0 mt-1.5"></span>
                                    <div>
                                        <div className="text-[12px] font-semibold text-gray-800">Job changed to #42</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">15 Jan 2024, 09:30 AM</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-[#004D6D] shrink-0 mt-1.5"></span>
                                    <div>
                                        <div className="text-[12px] font-semibold text-gray-800">Address updated</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">10 Jan 2024, 02:15 PM</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PassengerDetail;
