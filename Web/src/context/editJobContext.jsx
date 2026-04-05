/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCompanyAdminById } from '../services/companyService';
import {
    fetchJobDetailBundle,
    fetchJobsListPageData,
    getPassengersForJobCreation,
    buildPickupEditsFromJobBundle,
    buildDropoffEditsFromJobBundle,
    replaceJobStopsAndRoutes,
    timeInputFromDb,
    updateJobById,
    toPgTime,
} from '../services/jobService';

const EditJobContext = createContext(null);

export function useEditJob() {
    const ctx = useContext(EditJobContext);
    if (!ctx) throw new Error('useEditJob must be used within EditJobProvider');
    return ctx;
}

function parseMoneyInput(v) {
    if (v == null || String(v).trim() === '') return null;
    const n = Number(String(v).replace(/[^0-9.]/g, ''));
    if (Number.isNaN(n) || n < 0) return null;
    return n;
}

export function EditJobProvider({ children }) {
    const { id: jobId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [bundle, setBundle] = useState(null);
    const [driversCatalog, setDriversCatalog] = useState([]);
    const [pasCatalog, setPasCatalog] = useState([]);
    const [jobsMinimal, setJobsMinimal] = useState([]);

    const [step1Draft, setStep1Draft] = useState({
        jobType: 'Regular Contract',
        clientName: '',
        internalId: '',
    });
    const [step3Draft, setStep3Draft] = useState({
        jobDate: '',
        pickupTime: '',
        estDropoff: '',
        driverPay: '',
        passengerAssistantPay: '',
        isRecurring: false,
    });
    const [passengerIdsDraft, setPassengerIdsDraft] = useState([]);
    const [pickupEdits, setPickupEdits] = useState({});
    const [dropoffEdits, setDropoffEdits] = useState({});
    const [step2StopsHydrated, setStep2StopsHydrated] = useState(false);
    const [draftDriverId, setDraftDriverId] = useState(null);
    const [draftPaId, setDraftPaId] = useState(null);

    const [saveInProgress, setSaveInProgress] = useState(false);
    const [draftsHydrated, setDraftsHydrated] = useState(false);

    const draftsHydratedRef = useRef(false);
    const initialPassengerIdsRef = useRef(new Set());

    const load = useCallback(async (opts = {}) => {
        const silent = opts.silent === true;
        if (!jobId) return null;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const cid = admin?.company_id;
            if (!cid) throw new Error('No company linked to your account.');
            setCompanyId(cid);

            const [detail, listData] = await Promise.all([
                fetchJobDetailBundle(jobId, cid),
                fetchJobsListPageData(cid),
            ]);

            setBundle(detail);
            setDriversCatalog(listData.drivers);
            setPasCatalog(listData.passengerAssistants);
            setJobsMinimal(listData.jobsMinimal);
            return detail;
        } catch (e) {
            setError(e?.message || 'Could not load job.');
            setBundle(null);
            return null;
        } finally {
            if (!silent) setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        draftsHydratedRef.current = false;
        setDraftsHydrated(false);
        setPickupEdits({});
        setDropoffEdits({});
        setStep2StopsHydrated(false);
    }, [jobId]);

    useEffect(() => {
        if (!bundle?.job || !companyId || !draftsHydrated) return;
        let cancelled = false;
        setStep2StopsHydrated(false);
        (async () => {
            try {
                const rows = await getPassengersForJobCreation(companyId);
                const byId = new Map(rows.map((p) => [p.id, p]));
                if (cancelled) return;
                setPickupEdits(buildPickupEditsFromJobBundle(bundle, byId));
                setDropoffEdits(buildDropoffEditsFromJobBundle(bundle, byId));
                setStep2StopsHydrated(true);
            } catch {
                if (!cancelled) {
                    setPickupEdits({});
                    setDropoffEdits({});
                    setStep2StopsHydrated(true);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [bundle, companyId, draftsHydrated]);

    useEffect(() => {
        if (!bundle?.job || draftsHydratedRef.current) return;
        draftsHydratedRef.current = true;
        const j = bundle.job;
        setStep1Draft({
            jobType: j.job_type || 'Regular Contract',
            clientName: j.client_school_name || '',
            internalId: j.internal_job_id || '',
        });
        const ids = [...new Set((bundle.routes || []).map((r) => r.passenger_id).filter(Boolean))];
        setPassengerIdsDraft(ids);
        initialPassengerIdsRef.current = new Set(ids);
        setStep3Draft({
            jobDate: j.job_date || '',
            pickupTime: timeInputFromDb(j.pickup_time),
            estDropoff: timeInputFromDb(j.estimated_dropoff_time),
            driverPay: j.driver_pay != null && j.driver_pay !== '' ? String(j.driver_pay) : '',
            passengerAssistantPay:
                j.passenger_assistant_pay != null && j.passenger_assistant_pay !== '' ? String(j.passenger_assistant_pay) : '',
            isRecurring: Boolean(j.is_recurring),
        });
        setDraftDriverId(j.assigned_driver_id ?? null);
        setDraftPaId(j.assigned_pa_id ?? null);
        setDraftsHydrated(true);
    }, [bundle, jobId]);

    const saveAllChanges = useCallback(async () => {
        if (!jobId || !companyId || !bundle?.job) throw new Error('Missing job data.');
        const s1 = step1Draft;
        const s3 = step3Draft;
        if (!s1.clientName?.trim() || !s1.jobType?.trim()) {
            throw new Error('Please fill in client and job type (step 1).');
        }
        if (!s3.jobDate || !s3.pickupTime || !s3.estDropoff) {
            throw new Error('Please fill in job date and times (step 3).');
        }
        if (passengerIdsDraft.length === 0) {
            throw new Error('Add at least one passenger (step 2).');
        }

        setSaveInProgress(true);
        try {
            await updateJobById(jobId, companyId, {
                job_type: s1.jobType.trim(),
                client_school_name: s1.clientName.trim(),
                internal_job_id: s1.internalId.trim() || null,
                job_date: s3.jobDate,
                pickup_time: toPgTime(s3.pickupTime),
                estimated_dropoff_time: toPgTime(s3.estDropoff),
                is_recurring: s3.isRecurring,
                recurrence_pattern: s3.isRecurring ? { frequency: 'weekly' } : null,
                driver_pay: parseMoneyInput(s3.driverPay),
                passenger_assistant_pay: parseMoneyInput(s3.passengerAssistantPay),
                assigned_driver_id: draftDriverId,
                assigned_pa_id: draftPaId,
            });

            const catalog = await getPassengersForJobCreation(companyId);
            const byId = new Map(catalog.map((p) => [p.id, p]));
            const selected = passengerIdsDraft.map((id) => byId.get(id)).filter(Boolean);
            if (selected.length !== passengerIdsDraft.length) {
                throw new Error('One or more passengers could not be loaded. Refresh and try again.');
            }
            await replaceJobStopsAndRoutes(jobId, selected, pickupEdits, dropoffEdits);

            initialPassengerIdsRef.current = new Set(passengerIdsDraft);

            const detail = await load({ silent: true });
            if (detail) {
                const j = detail.job;
                setStep1Draft({
                    jobType: j.job_type || 'Regular Contract',
                    clientName: j.client_school_name || '',
                    internalId: j.internal_job_id || '',
                });
                const newIds = [...new Set((detail.routes || []).map((r) => r.passenger_id).filter(Boolean))];
                setPassengerIdsDraft(newIds);
                initialPassengerIdsRef.current = new Set(newIds);
                setStep3Draft({
                    jobDate: j.job_date || '',
                    pickupTime: timeInputFromDb(j.pickup_time),
                    estDropoff: timeInputFromDb(j.estimated_dropoff_time),
                    driverPay: j.driver_pay != null && j.driver_pay !== '' ? String(j.driver_pay) : '',
                    passengerAssistantPay:
                        j.passenger_assistant_pay != null && j.passenger_assistant_pay !== ''
                            ? String(j.passenger_assistant_pay)
                            : '',
                    isRecurring: Boolean(j.is_recurring),
                });
                setDraftDriverId(j.assigned_driver_id ?? null);
                setDraftPaId(j.assigned_pa_id ?? null);
            }
        } finally {
            setSaveInProgress(false);
        }
    }, [
        jobId,
        companyId,
        bundle,
        step1Draft,
        step3Draft,
        passengerIdsDraft,
        draftDriverId,
        draftPaId,
        pickupEdits,
        dropoffEdits,
        load,
    ]);

    const value = useMemo(
        () => ({
            loading,
            error,
            companyId,
            jobId,
            bundle,
            refetch: load,
            driversCatalog,
            pasCatalog,
            jobsMinimal,
            pickupEdits,
            setPickupEdits,
            dropoffEdits,
            setDropoffEdits,
            step2StopsHydrated,
            step1Draft,
            setStep1Draft,
            step3Draft,
            setStep3Draft,
            passengerIdsDraft,
            setPassengerIdsDraft,
            draftDriverId,
            setDraftDriverId,
            draftPaId,
            setDraftPaId,
            saveAllChanges,
            saveInProgress,
        }),
        [
            loading,
            error,
            companyId,
            jobId,
            bundle,
            load,
            driversCatalog,
            pasCatalog,
            jobsMinimal,
            pickupEdits,
            dropoffEdits,
            step2StopsHydrated,
            step1Draft,
            step3Draft,
            passengerIdsDraft,
            draftDriverId,
            draftPaId,
            saveAllChanges,
            saveInProgress,
        ]
    );

    return <EditJobContext.Provider value={value}>{children}</EditJobContext.Provider>;
}
