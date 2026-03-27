import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const roles = [
        {
            title: 'Super Admin',
            description: 'System administration and platform management',
            icon: '🛡️',
            path: '/superadmin/login',
            color: 'from-purple-600 to-indigo-700'
        },
        {
            title: 'Admin Login',
            description: 'Manage your company and fleet operations',
            icon: '🏢',
            path: '/admin/login',
            color: 'from-blue-600 to-cyan-500'
        },
        {
            title: 'Sub Admin',
            description: 'Staff member and coordinator portal',
            icon: '👥',
            path: '/subadmin/login',
            color: 'from-orange-500 to-amber-600'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white selection:bg-indigo-500/30">
            {/* Background patterns */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-white via-white to-gray-400">
                        RideRoster <span className="text-indigo-500">SaaS</span>
                    </h1>
                    <p className="text-gray-400 text-lg lg:text-xl max-w-2xl mx-auto">
                        Choose your portal to get started with the ultimate fleet management and ride-hailing infrastructure.
                    </p>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                    {roles.map((role, index) => (
                        <button
                            key={role.title}
                            onClick={() => navigate(role.path)}
                            style={{ animationDelay: `${index * 100}ms` }}
                            className="group relative flex flex-col items-center p-8 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 text-center animate-in fade-in zoom-in duration-700 fill-mode-both"
                        >
                            {/* Gradient hover background */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300 bg-linear-to-br ${role.color.replace('from-', 'from-').replace('to-', 'to-')}`} />

                            <div className="mb-6 text-4xl transform group-hover:scale-110 transition-transform duration-300">
                                {role.icon}
                            </div>

                            <h3 className="text-xl font-semibold mb-3">
                                {role.title}
                            </h3>

                            <p className="text-gray-400 text-sm leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
                                {role.description}
                            </p>

                            <div className={`mt-auto px-4 py-2 rounded-full text-xs font-medium bg-linear-to-r ${role.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                                Continue →
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer info */}
                <div className="mt-24 text-gray-500 text-sm animate-pulse">
                    © {new Date().getFullYear()} RideRoster Enterprise Solutions. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Home;
