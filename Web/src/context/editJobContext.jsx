/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
import React, {
    createContext, useCallback, useContext,
    useEffect, useMemo, useRef, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCompanyAdminById } from '../services/companyService';
import {
    fetchJobDetailBundle,
    fetchJobSchedulePassengers,
    fetchJobsListPageData,
    timeInputFromDb,
    toPgTime,
} from '../services/jobService';

// ── Context ───────────────────────────────────────────────────────────────────

const EditJobContext = createContext(null);

export function useEditJob() {
    const ctx = useContext(EditJobContext);
    if (!ctx) throw new Error('useEditJob must be used within EditJobProvider');
    return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMoneyInput(v) {
    if (v == null || String(v).trim() === '') return null;
    const n = Number(String(v).replace(/[^0-9.]/g, ''));
    if (Number.isNaN(n) || n < 0) return null;
    return n;
}

function parseCoord(value) {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Build passenger_schedules INSERT rows from the ordered passenger array.
 * Mirrors the private helper in jobService — kept here so saveAllChanges
 * can call it without making that function public.
 */
function buildScheduleRows(jobId, selectedPassengers, hasOutbound, hasInbound, eveningStartTime) {
    const rows = [];

    for (let idx = 0; idx < selectedPassengers.length; idx++) {
        const p = selectedPassengers[idx];
        const stopOrder  = idx + 1;
        const schedule   = p.weekly_schedule || {};
        const activeDays = WEEKDAY_KEYS.filter((d) => Boolean(schedule[d]));

        const pickupAddr = p.primary_pickup_address   ?? p.pickup_address    ?? '';
        const pickupPost = p.primary_pickup_postcode  ?? p.pickup_postal_code ?? '';
        const pickupLat  = parseCoord(p.primary_pickup_latitude  ?? p.pickup_latitude  ?? null);
        const pickupLng  = parseCoord(p.primary_pickup_longitude ?? p.pickup_longitude ?? null);
        const pickupTime = timeInputFromDb(p.primary_pickup_time ?? p.pickup_time ?? '');

        const eduAddr    = p.educational_site_address   ?? p.dropoff_address    ?? '';
        const eduPost    = p.educational_site_postcode  ?? p.dropoff_postal_code ?? '';
        const eduLat     = parseCoord(p.educational_site_latitude  ?? p.dropoff_latitude  ?? null);
        const eduLng     = parseCoord(p.educational_site_longitude ?? p.dropoff_longitude ?? null);
        const dropoffTime = timeInputFromDb(p.educational_site_dropoff_time ?? p.dropoff_time ?? '');

        for (const day of activeDays) {
            if (hasOutbound && pickupAddr && eduAddr) {
                rows.push({
                    job_id:            jobId,
                    passenger_id:      p.id,
                    weekday:           day,
                    direction:         'outbound',
                    stop_order:        stopOrder,
                    pickup_address:    pickupAddr,
                    pickup_postcode:   pickupPost || null,
                    pickup_latitude:   pickupLat,
                    pickup_longitude:  pickupLng,
                    pickup_time:       toPgTime(pickupTime) || '08:00:00',
                    dropoff_address:   eduAddr,
                    dropoff_postcode:  eduPost || null,
                    dropoff_latitude:  eduLat,
                    dropoff_longitude: eduLng,
                    dropoff_time:      toPgTime(dropoffTime) || null,
                    exception_date:    null,
                    exception_type:    null,
                    notes:             null,
                });
            }
            if (hasInbound && eduAddr && pickupAddr) {
                rows.push({
                    job_id:            jobId,
                    passenger_id:      p.id,
                    weekday:           day,
                    direction:         'inbound',
                    stop_order:        stopOrder,
                    pickup_address:    eduAddr,
                    pickup_postcode:   eduPost || null,
                    pickup_latitude:   eduLat,
                    pickup_longitude:  eduLng,
                    pickup_time:       toPgTime(eveningStartTime) || '15:00:00',
                    dropoff_address:   pickupAddr,
                    dropoff_postcode:  pickupPost || null,
                    dropoff_latitude:  pickupLat,
                    dropoff_longitude: pickupLng,
                    dropoff_time:      null,
                    exception_date:    null,
                    exception_type:    null,
                    notes:             null,
                });
            }
        }
    }
    return rows;
}

/**
 * Validate driver assignment constraints directly against the DB.
 * Extracted here so saveAllChanges can run the same checks as the modal pick,
 * guarding against race conditions or context state drift.
 *
 * Checks:
 *  1. No other non-cancelled job has this driver assigned (one job at a time).
 *  2. Driver has a registered vehicle.
 *  3. Passenger count ≤ vehicle seat capacity.
 *  4. If any passenger needs a wheelchair, vehicle must be wheelchair_accessible.
 *
 * @param {string} jobId
 * @param {string} driverId
 * @param {string} companyId
 * @param {Array}  passengers  - the selectedPassengers array from context
 */
async function validateDriverConstraints(jobId, driverId, companyId, passengers) {
    if (!driverId) return; // no driver assigned — nothing to validate

    // ── 1. One-job-at-a-time ─────────────────────────────────────────────
    const { data: conflicts, error: conflictErr } = await supabase
        .from('jobs')
        .select('id, job_name')
        .eq('assigned_driver_id', driverId)
        .neq('id', jobId)
        .neq('status', 'cancelled');

    if (conflictErr) throw conflictErr;
    if (conflicts && conflicts.length > 0) {
        const name = conflicts[0].job_name || 'another job';
        throw new Error(
            `This driver is already assigned to "${name}". Remove them from that job first.`
        );
    }

    // ── 2 & 3 & 4. Vehicle checks ────────────────────────────────────────
    const { data: vehicle, error: vehErr } = await supabase
        .from('vehicles')
        .select('seating_capacity, wheelchair_accessible')
        .eq('driver_id', driverId)
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();

    if (vehErr) throw vehErr;

    if (!vehicle) {
        throw new Error(
            'This driver has no vehicle registered. Please add a vehicle for this driver before assigning.'
        );
    }

    const passengerCount  = passengers.length;
    const needsWheelchair = passengers.some((p) => p.wheelchair_required === true);

    if (vehicle.seating_capacity != null && passengerCount > vehicle.seating_capacity) {
        throw new Error(
            `This job has ${passengerCount} passenger${passengerCount !== 1 ? 's' : ''} but the driver's vehicle only has ${vehicle.seating_capacity} seat${vehicle.seating_capacity !== 1 ? 's' : ''}. Please choose a driver with a larger vehicle.`
        );
    }

    if (needsWheelchair && !vehicle.wheelchair_accessible) {
        throw new Error(
            'One or more passengers on this job require a wheelchair-accessible vehicle. Please choose a driver whose vehicle is wheelchair accessible.'
        );
    }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function EditJobProvider({ children }) {
    const { id: jobId } = useParams();

    // ── Remote state ──
    const [loading,        setLoading]        = useState(true);
    const [error,          setError]          = useState(null);
    const [companyId,      setCompanyId]      = useState(null);
    const [bundle,         setBundle]         = useState(null);
    const [driversCatalog, setDriversCatalog] = useState([]);
    const [pasCatalog,     setPasCatalog]     = useState([]);
    const [jobsMinimal,    setJobsMinimal]    = useState([]);

    // ── Step 1 draft ──
    const [step1Draft, setStep1Draft] = useState({
        city:       '',
        jobType:    'School Contract',
        clientName: '',
        internalId: '',
    });

    // ── Step 2 draft — full passenger objects in pickup order ──
    const [selectedPassengers, setSelectedPassengers] = useState([]);
    const [step2Loaded,        setStep2Loaded]        = useState(false);

    // ── Step 3 draft ──
    const [step3Draft, setStep3Draft] = useState({
        semesterStart:         '',
        semesterEnd:           '',
        hasOutbound:           true,
        hasInbound:            true,
        morningStartTime:      '',
        morningEndTime:        '',
        eveningStartTime:      '',
        driverPay:             '',
        passengerAssistantPay: '',
    });

    // ── Driver / PA draft ──
    const [draftDriverId, setDraftDriverId] = useState(null);
    const [draftPaId,     setDraftPaId]     = useState(null);

    // ── Save state ──
    const [saveInProgress, setSaveInProgress] = useState(false);

    // Guard: only hydrate drafts once per jobId
    const draftsHydratedRef = useRef(false);

    // Reset guard when job changes
    useEffect(() => {
        draftsHydratedRef.current = false;
        setStep2Loaded(false);
        setSelectedPassengers([]);
    }, [jobId]);

    // ── Load ──────────────────────────────────────────────────────────────────

    const load = useCallback(async (opts = {}) => {
        const silent = opts.silent === true;
        if (!jobId) return null;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('Not authenticated.');
            const admin = await getCompanyAdminById(uid);
            const cid = admin?.company_id;
            if (!cid) throw new Error('No company linked to your account.');
            setCompanyId(cid);

            const [detail, listData, schedPax] = await Promise.all([
                fetchJobDetailBundle(jobId, cid),
                fetchJobsListPageData(cid),
                fetchJobSchedulePassengers(jobId),
            ]);

            setBundle(detail);
            setDriversCatalog(listData.drivers          || []);
            setPasCatalog(listData.passengerAssistants  || []);
            setJobsMinimal(listData.jobsMinimal         || []);

            return { detail, schedPax };
        } catch (e) {
            setError(e?.message || 'Could not load job.');
            setBundle(null);
            return null;
        } finally {
            if (!silent) setLoading(false);
        }
    }, [jobId]);

    // ── Hydrate drafts from DB (once per jobId) ───────────────────────────────

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const result = await load();
            if (!result || cancelled) return;
            if (draftsHydratedRef.current) return;
            draftsHydratedRef.current = true;

            const { detail, schedPax } = result;
            const j = detail.job;

            setStep1Draft({
                city:       j.city               ?? '',
                jobType:    j.job_type            ?? 'School Contract',
                clientName: j.client_school_name  ?? '',
                internalId: j.internal_job_id     ?? '',
            });

            setStep3Draft({
                semesterStart:         j.semester_start          ?? '',
                semesterEnd:           j.semester_end            ?? '',
                hasOutbound:           j.has_outbound            !== false,
                hasInbound:            j.has_inbound             !== false,
                morningStartTime:      timeInputFromDb(j.morning_start_time) ?? '',
                morningEndTime:        timeInputFromDb(j.morning_end_time)   ?? '',
                eveningStartTime:      timeInputFromDb(j.evening_start_time) ?? '',
                driverPay:             j.driver_pay              != null ? String(j.driver_pay) : '',
                passengerAssistantPay: j.passenger_assistant_pay != null ? String(j.passenger_assistant_pay) : '',
            });

            setDraftDriverId(j.assigned_driver_id ?? null);
            setDraftPaId(j.assigned_pa_id         ?? null);

            // schedPax is already ordered by stop_order ASC from fetchJobSchedulePassengers
            setSelectedPassengers(schedPax || []);
            setStep2Loaded(true);
        })();
        return () => { cancelled = true; };
    }, [load]); // `load` is stable per jobId (useCallback + [jobId])

    // ── Save ──────────────────────────────────────────────────────────────────

    const saveAllChanges = useCallback(async () => {
        if (!jobId || !companyId) throw new Error('Missing job or company data.');

        // ── Field validation ──────────────────────────────────────────────────
        if (!step1Draft.clientName?.trim()) throw new Error('Client / School Name is required.');
        if (!step1Draft.jobType?.trim())    throw new Error('Job Type is required.');
        if (!step3Draft.semesterStart)      throw new Error('Semester start date is required.');
        if (!step3Draft.semesterEnd)        throw new Error('Semester end date is required.');
        if (step3Draft.semesterEnd < step3Draft.semesterStart)
            throw new Error('Semester end must be after start date.');
        if (!step3Draft.hasOutbound && !step3Draft.hasInbound)
            throw new Error('Enable at least one direction.');
        if (step3Draft.hasOutbound && !step3Draft.morningStartTime)
            throw new Error('Morning start time is required.');
        if (step3Draft.hasOutbound && !step3Draft.morningEndTime)
            throw new Error('Morning end time is required.');
        if (step3Draft.hasInbound && !step3Draft.eveningStartTime)
            throw new Error('Evening start time is required.');
        if (selectedPassengers.length === 0)
            throw new Error('Add at least one passenger.');

        // ── Driver assignment validation ──────────────────────────────────────
        // Run even if draftDriverId is the same as the DB value — the passenger
        // list or vehicle may have changed since the modal was opened.
        await validateDriverConstraints(jobId, draftDriverId, companyId, selectedPassengers);

        setSaveInProgress(true);
        try {
            // 1 ── Update jobs row
            const { error: jobErr } = await supabase
                .from('jobs')
                .update({
                    city:                    step1Draft.city.trim()       || null,
                    job_type:                step1Draft.jobType.trim(),
                    client_school_name:      step1Draft.clientName.trim(),
                    internal_job_id:         step1Draft.internalId.trim() || null,
                    semester_start:          step3Draft.semesterStart,
                    semester_end:            step3Draft.semesterEnd,
                    has_outbound:            Boolean(step3Draft.hasOutbound),
                    has_inbound:             Boolean(step3Draft.hasInbound),
                    morning_start_time:      toPgTime(step3Draft.morningStartTime) || null,
                    morning_end_time:        toPgTime(step3Draft.morningEndTime)   || null,
                    evening_start_time:      toPgTime(step3Draft.eveningStartTime) || null,
                    driver_pay:              parseMoneyInput(step3Draft.driverPay),
                    passenger_assistant_pay: parseMoneyInput(step3Draft.passengerAssistantPay),
                    assigned_driver_id:      draftDriverId || null,
                    assigned_pa_id:          draftPaId     || null,
                    updated_at:              new Date().toISOString(),
                })
                .eq('id', jobId)
                .eq('company_id', companyId);

            if (jobErr) throw jobErr;

            // 2 ── Delete only BASE schedule rows (exception_date IS NULL).
            //      Exception rows set by admin are intentionally preserved.
            const { error: delErr } = await supabase
                .from('passenger_schedules')
                .delete()
                .eq('job_id', jobId)
                .is('exception_date', null);

            if (delErr) throw delErr;

            // 3 ── Re-insert base rows from the current passenger order
            const newRows = buildScheduleRows(
                jobId,
                selectedPassengers,
                Boolean(step3Draft.hasOutbound),
                Boolean(step3Draft.hasInbound),
                step3Draft.eveningStartTime || '',
            );

            if (newRows.length > 0) {
                const { error: insErr } = await supabase
                    .from('passenger_schedules')
                    .insert(newRows);
                if (insErr) throw insErr;
            }

            // 4 ── Silent reload to re-sync local state with what the DB now holds
            const result = await load({ silent: true });
            if (result) {
                const { detail, schedPax } = result;
                const j = detail.job;
                setStep1Draft({
                    city:       j.city               ?? '',
                    jobType:    j.job_type            ?? 'School Contract',
                    clientName: j.client_school_name  ?? '',
                    internalId: j.internal_job_id     ?? '',
                });
                setStep3Draft({
                    semesterStart:         j.semester_start          ?? '',
                    semesterEnd:           j.semester_end            ?? '',
                    hasOutbound:           j.has_outbound            !== false,
                    hasInbound:            j.has_inbound             !== false,
                    morningStartTime:      timeInputFromDb(j.morning_start_time) ?? '',
                    morningEndTime:        timeInputFromDb(j.morning_end_time)   ?? '',
                    eveningStartTime:      timeInputFromDb(j.evening_start_time) ?? '',
                    driverPay:             j.driver_pay              != null ? String(j.driver_pay) : '',
                    passengerAssistantPay: j.passenger_assistant_pay != null ? String(j.passenger_assistant_pay) : '',
                });
                setDraftDriverId(j.assigned_driver_id ?? null);
                setDraftPaId(j.assigned_pa_id         ?? null);
                setSelectedPassengers(schedPax || []);
            }
        } finally {
            setSaveInProgress(false);
        }
    }, [
        jobId, companyId,
        step1Draft, step3Draft,
        selectedPassengers,
        draftDriverId, draftPaId,
        load,
    ]);

    // ── Context value (memoised to avoid cascading renders) ───────────────────

    const value = useMemo(() => ({
        // Remote
        loading, error, companyId, jobId,
        bundle, refetch: load,
        driversCatalog, pasCatalog, jobsMinimal,
        // Step 1
        step1Draft, setStep1Draft,
        // Step 2
        selectedPassengers, setSelectedPassengers, step2Loaded,
        // Step 3
        step3Draft, setStep3Draft,
        // Driver / PA
        draftDriverId, setDraftDriverId,
        draftPaId,     setDraftPaId,
        // Save
        saveAllChanges, saveInProgress,
    }), [
        loading, error, companyId, jobId,
        bundle, load,
        driversCatalog, pasCatalog, jobsMinimal,
        step1Draft,
        selectedPassengers, step2Loaded,
        step3Draft,
        draftDriverId, draftPaId,
        saveAllChanges, saveInProgress,
    ]);

    return (
        <EditJobContext.Provider value={value}>
            {children}
        </EditJobContext.Provider>
    );
}