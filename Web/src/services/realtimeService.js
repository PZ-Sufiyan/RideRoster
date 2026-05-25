import { supabase } from '../lib/supabaseClient';

const DEBOUNCE_MS = 400;

/** @type {Map<string, Set<() => void>>} */
const jobsListListeners = new Map();

/** @type {Map<string, import('@supabase/supabase-js').RealtimeChannel>} */
const jobsListChannels = new Map();

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const jobsListDebounceTimers = new Map();

function recordBelongsToCompany(record, companyId) {
    if (!record) return true;
    if (record.company_id == null) return true;
    return record.company_id === companyId;
}

function scheduleJobsListNotify(companyId) {
    const existing = jobsListDebounceTimers.get(companyId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
        jobsListDebounceTimers.delete(companyId);
        const callbacks = jobsListListeners.get(companyId);
        if (!callbacks) return;
        callbacks.forEach((cb) => {
            try {
                cb();
            } catch {
                // listener errors should not break the channel
            }
        });
    }, DEBOUNCE_MS);

    jobsListDebounceTimers.set(companyId, timer);
}

function notifyAllJobsListListeners() {
    for (const companyId of jobsListListeners.keys()) {
        if (jobsListListeners.get(companyId)?.size) {
            scheduleJobsListNotify(companyId);
        }
    }
}

function attachJobsListHandler(channel, config, companyId, { global = false } = {}) {
    channel.on('postgres_changes', config, (payload) => {
        if (!global) {
            const record = payload.new ?? payload.old;
            if (!recordBelongsToCompany(record, companyId)) return;
        }
        if (global) {
            notifyAllJobsListListeners();
        } else {
            scheduleJobsListNotify(companyId);
        }
    });
}

function teardownJobsListChannel(companyId) {
    const timer = jobsListDebounceTimers.get(companyId);
    if (timer) {
        clearTimeout(timer);
        jobsListDebounceTimers.delete(companyId);
    }

    const channel = jobsListChannels.get(companyId);
    if (channel) {
        supabase.removeChannel(channel);
        jobsListChannels.delete(companyId);
    }
}

function ensureJobsListChannel(companyId) {
    if (jobsListChannels.has(companyId)) return;

    const channel = supabase.channel(`jobs-list-${companyId}`);
    const companyFilter = `company_id=eq.${companyId}`;

    const companyScopedTables = [
        { table: 'jobs', events: ['INSERT', 'UPDATE', 'DELETE'] },
        { table: 'drivers', events: ['*'] },
        { table: 'passenger_assistant', events: ['*'] },
        { table: 'vehicles', events: ['*'] },
    ];

    for (const { table, events } of companyScopedTables) {
        for (const event of events) {
            attachJobsListHandler(
                channel,
                {
                    event,
                    schema: 'public',
                    table,
                    filter: companyFilter,
                },
                companyId
            );
        }
    }

    for (const table of ['passenger_schedules', 'job_passenger_routes']) {
        attachJobsListHandler(
            channel,
            { event: '*', schema: 'public', table },
            companyId,
            { global: true }
        );
    }

    channel.subscribe();
    jobsListChannels.set(companyId, channel);
}

/**
 * Subscribe to Supabase Realtime updates for the admin/sub-admin jobs list page.
 * Calls `onChange` when jobs, assignments, drivers, PAs, vehicles, or passenger
 * counts may have changed. Debounced to avoid rapid refetch storms.
 *
 * @param {string} companyId
 * @param {() => void} onChange — typically triggers a silent reload (no loading spinner)
 * @returns {() => void} unsubscribe
 */
export function subscribeJobsListRealtime(companyId, onChange) {
    if (!companyId || typeof onChange !== 'function') {
        return () => {};
    }

    if (!jobsListListeners.has(companyId)) {
        jobsListListeners.set(companyId, new Set());
    }
    jobsListListeners.get(companyId).add(onChange);
    ensureJobsListChannel(companyId);

    return () => {
        const set = jobsListListeners.get(companyId);
        if (!set) return;
        set.delete(onChange);
        if (set.size === 0) {
            jobsListListeners.delete(companyId);
            teardownJobsListChannel(companyId);
        }
    };
}
