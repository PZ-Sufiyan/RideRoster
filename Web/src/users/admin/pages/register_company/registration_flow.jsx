import React, { useEffect, useMemo, useState } from 'react';
import Admin_Register_BasicInfo from './basic_info';
import Admin_Register_Contact from './contact';
import Admin_Register_AdminScale from './admin_detail';
import Admin_Register_ComplianceDocs from './compliance';
import Admin_Register_Review from './review';
import {
    createTempCompanyId,
    loadCompanyRegistrationDraft,
    saveCompanyRegistrationDraft,
} from '../../../../services/registrationDraftService';
import { supabase } from '../../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Contact & Address' },
    { id: 3, label: 'Admin & Scale' },
    { id: 4, label: 'Compliance' },
    { id: 5, label: 'Review' },
];

const initialRegistrationState = {
    company: {
        company_name: '',
        company_registration_number: '',
        company_type: '',
        vat_number: '',
        primary_business_activity: '',

        company_address: '',
        company_operating_address: '',
        company_email: '',
        company_phone: '',
        company_website: '',
        company_preferred_language: 'English (UK)',

        driver_estimate: null,

        operator_licence_number: '',
        operator_licence_issuing_authority: '',

        // Certificate of Incorporation or equivalent
        coioe_registration_number: '',
        coioe_issue_date: '',

        // Commercial Insurance Certificate
        cic_policy_number: '',
        cic_coverage_amount: '',
        cic_expiry_date: '',
    },
    admin: {
        full_name: '',
        email: '',
        phone: '',
    },
    documents: {
        operator_license: null,
        public_liability_insurance: null,
        certificate_of_incorporation: null,
        commercial_insurance_certificate: null,
        vat_certificate: null,
        primary_admin_id: null,
    },
};

// ─── StepBubble ──────────────────────────────────────────────────────────────
// Isolated so className logic stays clean and non-conflicting
const StepBubble = ({ stepId, active, completed }) => {
    if (active || completed) {
        return (
            <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold mr-2.5 text-white"
                style={{ backgroundColor: '#2f6b8f' }}
            >
                {completed ? '✓' : stepId}
            </div>
        );
    }
    return (
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold mr-2.5 text-gray-400">
            {stepId}
        </div>
    );
};

// ─── StepLabel ───────────────────────────────────────────────────────────────
const StepLabel = ({ label, active, completed }) => {
    if (active || completed) {
        return (
            <span className="text-[14px] font-bold" style={{ color: '#2f6b8f' }}>
                {label}
            </span>
        );
    }
    return <span className="text-[14px] font-bold text-gray-400">{label}</span>;
};

// ─── RegistrationFlow ────────────────────────────────────────────────────────
const RegistrationFlow = () => {
    const navigate = useNavigate();
    const loadedDraft = useMemo(() => loadCompanyRegistrationDraft(), []);

    const [activeStep, setActiveStep] = useState(() => loadedDraft?.activeStep ?? 1);
    const [maxUnlocked, setMaxUnlocked] = useState(() => loadedDraft?.maxUnlocked ?? 1);

    const [tempCompanyId] = useState(() => loadedDraft?.tempCompanyId ?? createTempCompanyId());
    const [registration, setRegistration] = useState(() => loadedDraft?.registration ?? initialRegistrationState);

    // Primary admin email must match company_admins / auth (same row); keep in sync on load.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user?.id || cancelled) return;

            const { data: row } = await supabase
                .from('company_admins')
                .select('email')
                .eq('id', user.id)
                .maybeSingle();

            const email =
                row?.email?.trim().toLowerCase() ||
                user.email?.trim().toLowerCase() ||
                '';
            if (!email || cancelled) return;

            setRegistration((prev) => ({
                ...prev,
                admin: { ...prev.admin, email },
            }));
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    /**
     * maxUnlocked tracks the furthest step the user has progressed to.
     * A step is "unlocked" if its id <= maxUnlocked.
     * Users can freely navigate between all unlocked steps via the stepper.
     * Only goNext() advances maxUnlocked — clicking the stepper alone does not.
     */
    const goToStep = (stepId) => {
        if (stepId <= maxUnlocked) {
            setActiveStep(stepId);
        }
    };

    const goNext = () => {
        const next = activeStep + 1;
        if (next <= STEPS.length) {
            setMaxUnlocked((prev) => Math.max(prev, next));
            setActiveStep(next);
        }
    };

    const goPrev = () => {
        if (activeStep > 1) {
            setActiveStep((prev) => prev - 1);
        }
    };

    // Persist draft to localStorage on changes (form fields + uploaded document metadata).
    useEffect(() => {
        saveCompanyRegistrationDraft({
            registration,
            tempCompanyId,
            activeStep,
            maxUnlocked,
        })
    }, [registration, tempCompanyId, activeStep, maxUnlocked])

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-gray-900">
            <div className="max-w-300 mx-auto space-y-8">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight tracking-tight">
                            New Tenant Registration
                        </h1>
                        <p className="text-[15px] text-gray-500 mt-1 font-medium">
                            Onboard a new transport company to the RideRoster ecosystem.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            localStorage.clear();
                            navigate('/home');
                        }}
                        className="ml-8 mt-1 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold text-sm shadow-sm hover:bg-red-100 transition-colors"
                    >
                        Log out
                    </button>
                </div>

                {/* ── Stepper ── */}
                <div className="flex items-center border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden text-center h-16">
                    {STEPS.map((step) => {
                        const active = step.id === activeStep;
                        const completed = step.id < activeStep;
                        const unlocked = step.id <= maxUnlocked;

                        return (
                            <button
                                key={step.id}
                                onClick={() => goToStep(step.id)}
                                disabled={!unlocked}
                                title={!unlocked ? 'Complete previous steps to unlock' : undefined}
                                className={[
                                    'flex-1 flex items-center justify-center h-full border-b-[3px] transition-all duration-200 outline-none',
                                    active ? 'bg-blue-50/30' : '',
                                    unlocked && !active ? 'hover:bg-gray-50 cursor-pointer' : '',
                                    !unlocked ? 'cursor-not-allowed opacity-50' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                style={{ borderBottomColor: active ? '#2f6b8f' : 'transparent' }}
                            >
                                <StepBubble stepId={step.id} active={active} completed={completed} />
                                <StepLabel label={step.label} active={active} completed={completed} />
                            </button>
                        );
                    })}
                </div>

                {/* ── Active Step ── */}
                {activeStep === 1 && (
                    <Admin_Register_BasicInfo
                        value={registration}
                        onChange={setRegistration}
                        onNext={goNext}
                        tempCompanyId={tempCompanyId}
                    />
                )}
                {activeStep === 2 && (
                    <Admin_Register_Contact
                        value={registration}
                        onChange={setRegistration}
                        onNext={goNext}
                        onPrev={goPrev}
                    />
                )}
                {activeStep === 3 && (
                    <Admin_Register_AdminScale
                        value={registration}
                        onChange={setRegistration}
                        onNext={goNext}
                        onPrev={goPrev}
                        adminEmailLocked
                    />
                )}
                {activeStep === 4 && (
                    <Admin_Register_ComplianceDocs
                        value={registration}
                        onChange={setRegistration}
                        onNext={goNext}
                        onPrev={goPrev}
                        tempCompanyId={tempCompanyId}
                    />
                )}
                {activeStep === 5 && (
                    <Admin_Register_Review
                        value={registration}
                        onChange={setRegistration}
                        onPrev={goPrev}
                    />
                )}

            </div>
        </div>
    );
};

export default RegistrationFlow;