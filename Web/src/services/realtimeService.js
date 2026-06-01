import { supabase } from '../lib/supabaseClient';

const DEBOUNCE_MS = 400;

/**
 * @typedef {Object} JobsListRealtimeEvent
 * @property {'jobs' | 'other'} source
 * @property {string} eventType
 * @property {Record<string, unknown> | null} [newRecord]
 * @property {Record<string, unknown> | null} [oldRecord]
 */

/** @type {Map<string, Set<(event: JobsListRealtimeEvent) => void>>} */
const jobsListListeners = new Map();

/** @type {Map<string, { jobs: import('@supabase/supabase-js').RealtimeChannel, aux: import('@supabase/supabase-js').RealtimeChannel }>} */
const jobsListChannels = new Map();

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const jobsListDebounceTimers = new Map();

function recordBelongsToCompany(record, companyId) {
    if (!record) return true;
    if (record.company_id == null) return true;
    return record.company_id === companyId;
}

function emitToListeners(companyId, event) {
    const callbacks = jobsListListeners.get(companyId);
    if (!callbacks) return;
    callbacks.forEach((cb) => {
        try {
            cb(event);
        } catch {
            // listener errors should not break the channel
        }
    });
}

function scheduleAuxNotify(companyId) {
    const existing = jobsListDebounceTimers.get(companyId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
        jobsListDebounceTimers.delete(companyId);
        emitToListeners(companyId, { source: 'other', eventType: 'REFRESH' });
    }, DEBOUNCE_MS);

    jobsListDebounceTimers.set(companyId, timer);
}

function notifyAllAuxListeners() {
    for (const companyId of jobsListListeners.keys()) {
        if (jobsListListeners.get(companyId)?.size) {
            scheduleAuxNotify(companyId);
        }
    }
}

function attachAuxHandler(channel, config, companyId, { global = false } = {}) {
    channel.on('postgres_changes', config, (payload) => {
        if (!global) {
            const record = payload.new ?? payload.old;
            if (!recordBelongsToCompany(record, companyId)) return;
        }
        if (global) {
            notifyAllAuxListeners();
        } else {
            scheduleAuxNotify(companyId);
        }
    });
}

function teardownJobsListChannel(companyId) {
    const timer = jobsListDebounceTimers.get(companyId);
    if (timer) {
        clearTimeout(timer);
        jobsListDebounceTimers.delete(companyId);
    }

    const channels = jobsListChannels.get(companyId);
    if (channels) {
        supabase.removeChannel(channels.jobs);
        supabase.removeChannel(channels.aux);
        jobsListChannels.delete(companyId);
    }
}

function ensureJobsListChannel(companyId) {
    if (jobsListChannels.has(companyId)) return;

    const jobsChannel = supabase.channel(`jobs-list-jobs-${companyId}`);
    jobsChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
            const record = payload.new ?? payload.old;
            if (!recordBelongsToCompany(record, companyId)) return;
            emitToListeners(companyId, {
                source: 'jobs',
                eventType: payload.eventType,
                newRecord: payload.new ?? null,
                oldRecord: payload.old ?? null,
            });
        }
    );
    jobsChannel.subscribe();

    const auxChannel = supabase.channel(`jobs-list-aux-${companyId}`);
    const companyScopedTables = ['drivers', 'passenger_assistant', 'vehicles'];

    for (const table of companyScopedTables) {
        attachAuxHandler(auxChannel, { event: '*', schema: 'public', table }, companyId);
    }

    attachAuxHandler(
        auxChannel,
        { event: '*', schema: 'public', table: 'passenger_schedules' },
        companyId,
        { global: true }
    );

    auxChannel.subscribe();
    jobsListChannels.set(companyId, { jobs: jobsChannel, aux: auxChannel });
}

/**
 * Subscribe to Supabase Realtime for the admin/sub-admin jobs list page.
 *
 * `jobs` changes (driver approval, assignment, status) are delivered immediately.
 * Other tables are debounced and reported as `{ source: 'other' }`.
 *
 * @param {string} companyId
 * @param {(event: JobsListRealtimeEvent) => void} onChange
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
