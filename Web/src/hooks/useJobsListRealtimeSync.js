import { useEffect, useRef } from 'react';
import { subscribeJobsListRealtime } from '../services/realtimeService';
import { applyJobsListRealtimeChange } from '../services/jobService';

/**
 * Wires jobs-list Realtime to React state.
 * - `jobs` table: patch the affected row (driver approval status, assignments, etc.)
 * - other tables: serial full reload to avoid out-of-order overwrites
 */
export function useJobsListRealtimeSync({
    companyId,
    companyIdRef,
    setJobs,
    setJobsMinimal,
    getCatalogs,
    reloadDataRef,
}) {
    const reloadingRef = useRef(false);
    const queuedReloadRef = useRef(false);

    const runSerialReloadRef = useRef(null);
    runSerialReloadRef.current = async () => {
        if (!companyIdRef.current) return;
        if (reloadingRef.current) {
            queuedReloadRef.current = true;
            return;
        }
        reloadingRef.current = true;
        try {
            await reloadDataRef.current?.();
        } finally {
            reloadingRef.current = false;
            if (queuedReloadRef.current) {
                queuedReloadRef.current = false;
                await runSerialReloadRef.current();
            }
        }
    };

    useEffect(() => {
        if (!companyId) return undefined;

        return subscribeJobsListRealtime(companyId, async (event) => {
            if (event.source !== 'jobs') {
                await runSerialReloadRef.current();
                return;
            }

            const cid = companyIdRef.current;
            if (!cid) return;

            try {
                const { drivers, passengerAssistants } = getCatalogs();
                const result = await applyJobsListRealtimeChange({
                    companyId: cid,
                    eventType: event.eventType,
                    newRecord: event.newRecord,
                    oldRecord: event.oldRecord,
                    drivers,
                    passengerAssistants,
                });

                if (result.type === 'reload') {
                    await runSerialReloadRef.current();
                    return;
                }

                if (result.type === 'remove') {
                    setJobs((prev) => prev.filter((j) => j.id !== result.jobId));
                    setJobsMinimal((prev) => prev.filter((j) => j.id !== result.jobId));
                    return;
                }

                setJobs((prev) => {
                    const idx = prev.findIndex((j) => j.id === result.row.id);
                    if (idx === -1) return [result.row, ...prev];
                    const next = [...prev];
                    next[idx] = result.row;
                    return next;
                });
                setJobsMinimal((prev) => {
                    const idx = prev.findIndex((j) => j.id === result.minimal.id);
                    if (idx === -1) return [result.minimal, ...prev];
                    const next = [...prev];
                    next[idx] = result.minimal;
                    return next;
                });
            } catch {
                await runSerialReloadRef.current();
            }
        });
    }, [companyId]);
}
