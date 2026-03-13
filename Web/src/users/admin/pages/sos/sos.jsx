import React from 'react';
import { useNavigate } from 'react-router-dom';

const Admin_SOSPage = () => {
    const navigate = useNavigate();
    const alerts = [
        {
            id: 1,
            type: 'URGENT: Vehicle Accident',
            time: '1 min ago',
            vehicleId: 'BH-1129',
            driver: 'Robert Fox',
            description: 'Reported collision near Oak St & 3rd Ave. Emergency services dispatched.',
            color: 'text-red-600',
        },
        {
            id: 2,
            type: 'Medical Assistance Req.',
            time: '8 mins ago',
            vehicleId: 'BH-1084',
            driver: 'Jenny Wilson',
            description: 'Passenger requires medical attention. Vehicle is stationary.',
            color: 'text-yellow-600',
        },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">SOS Monitoring</h1>

            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                {/* Left Sidebar */}
                <div className="w-full md:w-80 border-r border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-gray-900">Active SOS Alerts (2)</h2>
                        <p className="text-sm text-gray-500 mt-1">Real-time incidents from your fleet.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => navigate(`/admin/sos/${alert.vehicleId}`)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`text-sm font-bold ${alert.color}`}>{alert.type}</h3>
                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">{alert.time}</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium italic mb-2">Vehicle ID: {alert.vehicleId}</p>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-800">Driver: {alert.driver}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{alert.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map Area Placeholder */}
                <div className="flex-1 relative bg-[#F8F3E9]">
                    {/* Simulated Map Background (Patterned) */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
                        backgroundImage: `radial-gradient(#d1d5db 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                    }}></div>

                    {/* Simulated City Regions / Roads */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-[20%] left-[30%] w-40 h-60 bg-[#DE8A66] rounded-lg"></div>
                        <div className="absolute top-[50%] left-[10%] w-80 h-20 bg-[#7FB069] rounded-lg"></div>
                        <div className="absolute top-[10%] left-[60%] w-32 h-40 bg-[#DE8A66] rounded-lg"></div>
                    </div>

                    {/* Marker 1 (BH-1129) */}
                    <div
                        className="absolute top-[45%] left-[65%] -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer group z-10"
                        onClick={() => navigate('/admin/sos/BH-1129')}
                    >
                        <div className="bg-white px-3 py-1.5 rounded-lg shadow-md border border-gray-100 mb-2 group-hover:border-[#005580] transition-colors">
                            <span className="text-xs font-bold text-gray-800">BH-1129</span>
                        </div>
                        <div className="w-4 h-4 rounded-full bg-[#005580] border-2 border-white shadow-sm ring-4 ring-[#005580]/20 group-hover:ring-[#005580]/40 transition-all"></div>
                        <div className="w-0.5 h-4 bg-[#005580]"></div>
                    </div>

                    {/* Marker 2 (BH-1084) */}
                    <div
                        className="absolute top-[65%] left-[55%] -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer group z-10"
                        onClick={() => navigate('/admin/sos/BH-1084')}
                    >
                        <div className="bg-white px-3 py-1.5 rounded-lg shadow-md border border-gray-100 mb-2 group-hover:border-yellow-500 transition-colors">
                            <span className="text-xs font-bold text-gray-800">BH-1084</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white shadow-sm ring-8 ring-yellow-500/20 group-hover:ring-yellow-500/40 flex items-center justify-center transition-all">
                            <span className="text-white text-xs font-black">+</span>
                        </div>
                        <div className="w-0.5 h-6 bg-yellow-500"></div>
                    </div>

                    {/* Disclaimer */}
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm pointer-events-none">
                        <span className="text-[10px] text-gray-400 font-medium">Map View: San Francisco Central</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_SOSPage;
