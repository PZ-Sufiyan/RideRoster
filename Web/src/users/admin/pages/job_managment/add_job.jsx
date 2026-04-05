import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdCheck } from 'react-icons/md';
import { ToastStack } from '../../../../utils/Toast';
import Step1Job from '../../components/step1_job';
import Step2Job from '../../components/step2_job';
import Step3Job from '../../components/step3_job';

// ─── Step Progress Indicator ─────────────────────────────────────────────────

const STEPS = ['Route Info', 'Pickups & Drop-offs', 'Schedule & Pay'];

const StepIndicator = ({ currentStep }) => (
    <div className="relative mb-12 px-10">
        <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 z-0">
            <div
                className="h-full bg-[#004D6D] transition-all duration-500"
                style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            />
        </div>
        <div className="flex items-center justify-between relative">
            {STEPS.map((label, i) => {
                const stepNum = i + 1;
                const done = stepNum < currentStep;
                const active = stepNum === currentStep;
                return (
                    <div key={stepNum} className="flex flex-col items-center gap-2">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                                ${done || active
                                    ? 'bg-[#004D6D] text-white ring-4 ring-[#004D6D]/10'
                                    : 'border-2 border-gray-200 bg-white text-gray-400'
                                }`}
                        >
                            {done ? <MdCheck size={20} /> : stepNum}
                        </div>
                        <span className={`text-[13px] font-bold ${done || active ? 'text-[#004D6D]' : 'text-gray-400'}`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

// ─── Main AddJob Page ─────────────────────────────────────────────────────────

const AddJob = () => {
    const [searchParams] = useSearchParams();
    const [toasts, setToasts] = useState([]);

    const currentStep = Math.min(3, Math.max(1, Number(searchParams.get('step')) || 1));

    return (
        <div className="max-w-[1280px] mx-auto pb-20">
            <ToastStack
                toasts={toasts}
                onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
            />

            <StepIndicator currentStep={currentStep} />

            {currentStep === 1 && <Step1Job setToasts={setToasts} />}
            {currentStep === 2 && <Step2Job setToasts={setToasts} />}
            {currentStep === 3 && <Step3Job setToasts={setToasts} />}
        </div>
    );
};

export default AddJob;