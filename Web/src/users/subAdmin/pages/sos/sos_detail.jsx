import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdClose,
    MdWarning,
    MdLocalPhone,
    MdPerson,
    MdInfoOutline,
    MdMoreHoriz
} from 'react-icons/md';

const SubAdmin_SOSDetail = () => {
    const navigate = useNavigate();

    const passengers = [
        { name: 'Olivia Chen', assistant: 'Amelia Harper' },
        { name: 'Liam Rodriguez', assistant: 'Carmen Smith' },
        { name: 'Ava Nguyen', assistant: 'Mark Jason' },
    ];

    return (
        <div className="relative -m-6 mt-1 h-[calc(100vh-64px)] overflow-hidden bg-gray-100 font-sans">
            {/* ── Background Map/Aerial View ── */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=2000"
                    alt="City Map"
                    className="w-full h-full object-cover grayscale-[0.2] brightness-[0.85]"
                />

                {/* Simulated SOS Markers */}
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex flex-col items-center">
                        <div className="bg-red-600 text-white font-bold text-xs px-2 py-1 rounded shadow-lg animate-pulse">SOS</div>
                        <div className="w-1 h-3 bg-red-600"></div>
                        <div className="w-8 h-4 bg-black/40 rounded-full blur-[2px] -mt-1"></div>
                    </div>
                </div>

                <div className="absolute top-[70%] left-[30%]">
                    <div className="relative flex flex-col items-center opacity-80 scale-90">
                        <div className="bg-red-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-lg">SOS</div>
                        <div className="w-1 h-2 bg-red-700"></div>
                    </div>
                </div>

                <div className="absolute top-[60%] left-[80%]">
                    <div className="relative flex flex-col items-center opacity-80 scale-90">
                        <div className="bg-red-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-lg">SOS</div>
                        <div className="w-1 h-2 bg-red-700"></div>
                    </div>
                </div>
            </div>

            {/* ── Right Detail Panel ── */}
            <div className="absolute top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-10 flex flex-col border-l border-gray-100">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                            <MdWarning size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">SOS Alert Details</h2>
                            <p className="text-sm font-medium text-gray-500 mt-0.5">Job ID: J-789123</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/subadmin/sos')}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Alert Summary Box */}
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-red-600 mb-3">Alert Summary</h3>
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Time of Alert:</span>
                                <span className="font-bold text-gray-900">20:15:30 (2 mins ago)</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Location:</span>
                                <span className="font-bold text-gray-900">123 Market St, SF</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Vehicle:</span>
                                <span className="font-bold text-gray-900">Ford Transit (PLATE-567)</span>
                            </div>
                        </div>
                    </div>

                    {/* Driver Information */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">Driver Information</h3>
                        <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                            <img
                                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
                                alt="Driver"
                                className="w-14 h-14 rounded-xl object-cover"
                            />
                            <div>
                                <h4 className="font-bold text-gray-900">Jacob Jones</h4>
                                <p className="text-xs text-gray-500 mt-0.5">ID: DRV-0045</p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1.5 font-medium">
                                    <MdLocalPhone size={14} className="text-gray-400" />
                                    +1 415-555-0123
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Passenger Manifest */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">Passenger Manifest (3)</h3>
                        <div className="space-y-3">
                            {passengers.map((p, i) => (
                                <div key={i} className="flex flex-col p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#005580]">
                                            <MdPerson size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.assistant}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Action Log */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">Action Log</h3>
                        <div className="relative pl-6 py-1">
                            {/* Vertical Line */}
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-100"></div>

                            {/* Entry */}
                            <div className="relative">
                                <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-red-400 border-2 border-white"></div>
                                <h4 className="text-sm font-bold text-gray-900 leading-tight">SOS Button Activated by Driver</h4>
                                <p className="text-xs text-gray-500 mt-1">Manual Trigger - 20:15:30</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        View Job Details
                    </button>
                    <button className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-shadow shadow-md shadow-red-200 active:scale-[0.98]">
                        Resolve Alert
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SubAdmin_SOSDetail;
