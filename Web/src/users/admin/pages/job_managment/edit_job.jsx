import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdCheck } from 'react-icons/md';
import { ToastStack } from '../../../../utils/Toast';
import { EditJobProvider, useEditJob } from '../../../../context/editJobContext';
import Step1EditJob from '../../components/step1_edit_job';
import Step2EditJob from '../../components/step2_edit_job';
import Step3EditJob from '../../components/step3_edit_job';
import { ShimmerBlock, LoadingStatus } from '../../../../utils/Shimmer';

const STEPS = ['Route Info', 'Pickups & Drop-offs', 'Schedule & Pay'];

const StepIndicator = ({ currentStep }) => (
    <div className="relative mb-12 px-10">
        <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-100 z-0">
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

function EditJobInner() {
    const [searchParams] = useSearchParams();
    const [toasts, setToasts] = useState([]);
    const { loading, error } = useEditJob();

    const currentStep = Math.min(3, Math.max(1, Number(searchParams.get('step')) || 1));

    if (loading) {
        return (
            <LoadingStatus label="Loading job" className="max-w-7xl mx-auto pb-20 space-y-8">
                <div className="relative mb-12 px-10">
                    <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-100 z-0 overflow-hidden rounded-full">
                        <ShimmerBlock className="h-full w-1/2 rounded-none" rounded="rounded-none" />
                    </div>
                    <div className="flex items-center justify-between relative">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={`step-skeleton-${index}`} className="flex flex-col items-center gap-2">
                                <ShimmerBlock className="w-10 h-10" rounded="rounded-full" />
                                <ShimmerBlock className="h-3 w-24 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
                        <ShimmerBlock className="h-6 w-48 rounded-md" />
                        <ShimmerBlock className="h-4 w-72 max-w-full rounded-md" />
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={`field-skeleton-${index}`} className="space-y-2">
                                <ShimmerBlock className="h-4 w-28 rounded-md" />
                                <ShimmerBlock className="h-12 rounded-xl" rounded="rounded-xl" />
                            </div>
                        ))}
                    </div>
                    <ShimmerBlock className="rounded-2xl border border-gray-100 shadow-sm min-h-125 w-full" rounded="rounded-2xl" />
                </div>
            </LoadingStatus>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto pb-20 space-y-4">
                <p className="text-[14px] text-red-600">{error}</p>
                <a href="/admin/jobs" className="text-[14px] font-bold text-[#004D6D] hover:underline">
                    Back to jobs
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <ToastStack
                toasts={toasts}
                onClose={(tid) => setToasts((prev) => prev.filter((t) => t.id !== tid))}
            />

            <StepIndicator currentStep={currentStep} />

            {currentStep === 1 && <Step1EditJob setToasts={setToasts} />}
            {currentStep === 2 && <Step2EditJob setToasts={setToasts} />}
            {currentStep === 3 && <Step3EditJob setToasts={setToasts} />}
        </div>
    );
}

const EditJob = () => (
    <EditJobProvider>
        <EditJobInner />
    </EditJobProvider>
);

export default EditJob;
