import React from 'react';

const Home = () => (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center px-6 selection:bg-slate-500/30">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(90vw,720px)] h-[min(90vw,720px)] bg-slate-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 text-center max-w-3xl">
            <p className="text-base md:text-lg font-semibold tracking-[0.25em] text-slate-300 mb-3">
                NOTTINGHAM
            </p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug mb-10">
                SPECIALIST TRANSPORT LTD
            </h1>
            <p className="text-lg md:text-xl font-medium text-slate-400 tracking-wide">
                coming soon
            </p>
        </div>
    </div>
);

export default Home;
