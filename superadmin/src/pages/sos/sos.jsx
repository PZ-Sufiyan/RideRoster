import React, { useState } from 'react';
import {
    MdWarning,
    MdDirectionsBus,
    MdAdd,
    MdRemove,
    MdMyLocation,
    MdPerson,
    MdAccessTime,
    MdLocationOn
} from 'react-icons/md';

const SOSPage = () => {
    // Dummy Data for Alerts
    const alerts = [
        {
            id: 'V-189',
            company: 'Bright Horizons Transport',
            type: 'SOS Emergency',
            time: '2 min ago',
            description: 'Driver initiated medical emergency protocol. Passenger reporting severe allergy symptoms.',
            passengers: 3,
            driver: 'J. Doe',
            pa: 'Cathrine Smith',
            nearby: 2,
            isUrgent: true,
        },
        {
            id: 'V-456',
            company: 'Safe Journey Logistics',
            type: 'SOS Emergency',
            time: '8 min ago',
            description: 'Vehicle has been stationary for over 5 minutes in an unscheduled location. Driver unresponsive.',
            passengers: 5,
            driver: 'M. Smith',
            pa: 'David William',
            nearby: 1,
            isUrgent: true,
        }
    ];

    const [zoom, setZoom] = useState(12);
    const [searchRadius, setSearchRadius] = useState(5);

    // Mock Map Style
    const mapBgColor = '#A3D9FF'; // Light blue map color

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Page Header - Inside the content area as per dashboard text, 
                though usually header is separate. 
                Based on screenshot, title is "Global SOS Monitoring" inside the white area? 
                No, looking at sidebar, "SOS Monitoring" is active. 
                The screenshot has a top bar title "Global SOS Monitoring" with subtitle.
                This seems to be consistent with the layout's header or a page header inside the outlet.
                I will put it inside this component.
            */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Global SOS Monitoring</h1>
                <p className="text-sm text-gray-500">Live view of all active SOS alerts across the platform.</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL - MAP AREA */}
                <div className="flex-1 relative bg-[#9BCFF5] overflow-hidden">
                    {/* Visual styling for "streets" could be SVG patterns, but plain color is safer for code-only */}

                    {/* Dummy Map Content - Vector Paths mimicking roads (Optional but adds detail) */}
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 200 Q 400 250 800 200 T 1600 300" stroke="white" strokeWidth="4" fill="none" />
                        <path d="M200 0 Q 250 400 200 800" stroke="white" strokeWidth="4" fill="none" />
                        <path d="M600 0 L 650 900" stroke="white" strokeWidth="3" fill="none" />
                        <path d="M100 500 L 900 450" stroke="white" strokeWidth="3" fill="none" />
                    </svg>

                    {/* Controls: Search Radius */}
                    <div className="absolute top-6 left-6 bg-white rounded-lg shadow-md p-4 w-64 z-10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-800">Search Radius</span>
                            <span className="text-sm font-bold text-blue-600">{searchRadius} km</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="40"
                            value={searchRadius * 2} // Just visual scaling
                            onChange={(e) => setSearchRadius(Math.max(5, e.target.value / 2))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>10 km</span>
                            <span>40 km</span>
                        </div>
                    </div>

                    {/* Controls: Zoom & Location (Bottom Right) */}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
                        <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
                            <button className="p-2 hover:bg-gray-50 text-gray-600 border-b border-gray-100 flex items-center justify-center">
                                <MdAdd size={20} />
                            </button>
                            <button className="p-2 hover:bg-gray-50 text-gray-600 flex items-center justify-center">
                                <MdRemove size={20} />
                            </button>
                        </div>
                        <button className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-600 flex items-center justify-center">
                            <MdMyLocation size={20} />
                        </button>
                    </div>

                    {/* Markers */}

                    {/* Marker 1: Normal Vehicle */}
                    <div className="absolute top-[35%] left-[38%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform">
                        <div className="bg-[#4F7E91] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                            <MdDirectionsBus size={18} />
                        </div>
                    </div>

                    {/* Marker 2: SOS Alert (Center Focused) */}
                    <div className="absolute top-[50%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 z-20">
                        {/* Pulse Effect */}
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 w-full h-full transform scale-150"></div>
                        <div className="absolute -inset-8 bg-red-500 rounded-full opacity-10 animate-pulse"></div>

                        {/* Icon */}
                        <div className="cursor-pointer relative z-10 text-red-500 bg-white rounded-full p-1 shadow-lg border-2 border-red-500">
                            <MdWarning size={24} />
                        </div>
                    </div>

                    {/* Marker 3: Another SOS Alert */}
                    <div className="absolute top-[30%] left-[55%] transform -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="cursor-pointer relative z-10 text-red-500 bg-white rounded-full p-1 shadow-lg border-2 border-red-500 hover:scale-110 transition-transform">
                            <MdWarning size={20} />
                        </div>
                    </div>

                    {/* Marker 4: Normal Vehicle */}
                    <div className="absolute top-[60%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform">
                        <div className="bg-[#4F7E91] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                            <MdDirectionsBus size={18} />
                        </div>
                    </div>
                    <div className="absolute top-[75%] left-[30%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform">
                        <div className="bg-[#4F7E91] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                            <MdDirectionsBus size={18} />
                        </div>
                    </div>


                    {/* Popup / Tooltip for Center Vehicle */}
                    <div className="absolute top-[50%] left-[45%] transform -translate-x-1/2 -translate-y-[140%] z-30">
                        <div className="bg-white rounded-lg shadow-lg p-3 min-w-[160px] relative">
                            {/* Triangle Pointer */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white shadow-sm"></div>

                            <div className="relative z-10">
                                <h3 className="text-xs font-bold text-gray-900 mb-1">Vehicle #V-189 - SOS</h3>
                                <div className="space-y-0.5 text-[10px] text-gray-500 font-medium">
                                    <p className="text-[#005580]">3 - Passenger</p>
                                    <p className="text-[#005580]">5 - Seater</p>
                                    <div className="flex justify-between mt-1 text-gray-400">
                                        <span>Nearby</span>
                                        <span>10 km</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT PANEL - ALERTS LIST */}
                <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-xl">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">Active SOS Alerts</h2>
                        <p className="text-sm text-gray-500 mt-1">2 incidents require attention.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">Vehicle #{alert.id} - {alert.type}</h3>
                                    <span className="text-xs font-medium text-red-500 whitespace-nowrap">{alert.time}</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-3">{alert.company}</p>

                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    {alert.description}
                                </p>

                                <div className="flex flex-wrap gap-y-2 gap-x-4 mb-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <MdPerson size={14} className="text-gray-400" />
                                        <span>{alert.passengers} passengers</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <MdPerson size={14} className="text-gray-400" />
                                        <span>Driver: {alert.driver}</span>
                                    </div>
                                    {alert.pa && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <MdPerson size={14} className="text-gray-400" />
                                            <span>PA: {alert.pa}</span>
                                        </div>
                                    )}
                                </div>

                                <button className="text-sm font-medium text-[#0088CC] hover:text-[#006699] hover:underline transition-colors block">
                                    View nearby drivers ({alert.nearby} available)
                                </button>
                            </div>
                        ))}

                        <div className="pt-8 text-center">
                            <p className="text-sm text-gray-400">No other active alerts.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SOSPage;
