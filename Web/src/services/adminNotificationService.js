import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from './companyService'
import { getSubAdminById } from './subAdminService'
import { formatRelativeTime } from './dashboardService'
import { isCompanyFleet } from '../utils/fleet'

export const NOTIFICATION_ROLES = {
  ADMIN: 'admin',
  SUBADMIN: 'subadmin',
}

export const NOTIFICATION_TABS = {
  ALL: 'All Notifications',
  UNREAD: 'Unread',
  SOS: 'SOS Alerts',
  JOBS: 'Job Updates',
  LEAVE: 'Staff Day of Requests',
  DOCUMENTS: 'Documents',
  VEHICLES: 'Vehicles',
}

export const NOTIFICATION_CATEGORIES = {
  SOS: 'sos',
  JOB: 'job',
  LEAVE: 'leave',
  DOCUMENT: 'document',
  VEHICLE: 'vehicle',
}

const JOB_RESPONSE_STATUSES = new Set(['accepted', 'rejected', 'counter request', 'counter requested'])
const COUNTER_STATUSES = new Set(['counter request', 'counter requested'])

const READ_UPSERT_BATCH_SIZE = 100

const NOTIFICATION_ROUTES = {
  [NOTIFICATION_ROLES.ADMIN]: {
    leaveRequests: '/portal/users/off-day-requests',
    job: (id) => `/portal/jobs/${id}`,
    counterOffer: (id) => `/portal/jobs/${id}/counter-offer`,
    sos: (id) => `/portal/sos/${id}`,
    driverDetail: (id) => `/portal/users/drivers/${id}`,
    paDetail: (id) => `/portal/users/pa/${id}`,
    vehicleDetail: (id) => `/portal/users/vehicles/${id}`,
  },
  [NOTIFICATION_ROLES.SUBADMIN]: {
    leaveRequests: '/team/approvals',
    job: (id) => `/team/jobs/${id}`,
    counterOffer: (id) => `/team/jobs/${id}/counter-offer`,
    sos: (id) => `/team/sos/${id}`,
    driverDetail: (id) => `/team/users/drivers/${id}`,
    paDetail: (id) => `/team/users/pa/${id}`,
    vehicleDetail: (id) => `/team/users/vehicles/${id}`,
  },
}

const DOCUMENT_EXPIRY_REMINDER_LABELS = {
  '30d': '30 days',
  '14d': '14 days',
  '7d': '7 days',
  '48h': '48 hours',
  '24h': '24 hours',
}

const DRIVER_DOCUMENT_LABELS = {
  passport: 'Passport',
  driving_license_front: 'Driving License (Front)',
  driving_license_back: 'Driving License (Back)',
  taxi_badge_front: 'Taxi Badge (Front)',
  taxi_badge_back: 'Taxi Badge (Back)',
  dbs_certificate_front: 'DBS Certificate (Front)',
  dbs_certificate_back: 'DBS Certificate (Back)',
  safeguarding_certificate: 'Safeguarding Certificate',
  right_to_work: 'Right to Work',
}

const VEHICLE_DOCUMENT_LABELS = {
  mot_certificate: 'MOT Certificate',
  taxi_license_plate: 'Taxi License Plate',
  insurance_certificate: 'Insurance Certificate',
  v5_front: 'V5 (Front)',
  v5_inside: 'V5 (Inside)',
  vehicle_photo: 'Vehicle Photo',
}

const PA_DOCUMENT_LABELS = {
  passport: 'Passport',
  safeguarding_certificate: 'Safeguarding Certificate',
  background_check: 'Background Check Certificate',
  first_aid_certificate: 'First Aid Certification',
  other_certificate: 'Other Certificate',
}

let activeNotificationRoutes = NOTIFICATION_ROUTES[NOTIFICATION_ROLES.ADMIN]

export function setNotificationRole(role = NOTIFICATION_ROLES.ADMIN) {
  activeNotificationRoutes = NOTIFICATION_ROUTES[role] || NOTIFICATION_ROUTES[NOTIFICATION_ROLES.ADMIN]
}

async function upsertReadNotificationKeys(userId, role, notificationKeys) {
  const keys = [...new Set((notificationKeys || []).filter(Boolean))]
  if (!userId || !keys.length) return

  const readAt = new Date().toISOString()
  for (let i = 0; i < keys.length; i += READ_UPSERT_BATCH_SIZE) {
    const chunk = keys.slice(i, i + READ_UPSERT_BATCH_SIZE)
    const rows = chunk.map((notification_key) => ({
      user_id: userId,
      viewer_role: role,
      notification_key,
      read_at: readAt,
    }))
    const { error } = await supabase
      .from('portal_notification_reads')
      .upsert(rows, { onConflict: 'user_id,viewer_role,notification_key' })
    if (error) throw error
  }
}

export async function getReadNotificationIds(userId, role = NOTIFICATION_ROLES.ADMIN) {
  if (!userId) return new Set()

  const { data, error } = await supabase
    .from('portal_notification_reads')
    .select('notification_key')
    .eq('user_id', userId)
    .eq('viewer_role', role)

  if (error) {
    console.warn('Failed to load notification read state:', error.message)
    return new Set()
  }

  return new Set((data || []).map((row) => row.notification_key).filter(Boolean))
}

export async function markNotificationsRead(userId, notificationKeys, role = NOTIFICATION_ROLES.ADMIN) {
  await upsertReadNotificationKeys(userId, role, notificationKeys)
  return getReadNotificationIds(userId, role)
}

export async function markAllNotificationsRead(userId, notificationKeys, role = NOTIFICATION_ROLES.ADMIN) {
  return markNotificationsRead(userId, notificationKeys, role)
}

export async function getCompanyContextForRole(role = NOTIFICATION_ROLES.ADMIN) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid) {
    const err = new Error('Not authenticated')
    err.code = 'AUTH'
    throw err
  }

  if (role === NOTIFICATION_ROLES.SUBADMIN) {
    const subAdmin = await getSubAdminById(uid)
    if (!subAdmin?.company_id) {
      const err = new Error('No company linked to your account')
      err.code = 'NO_COMPANY'
      throw err
    }
    return { companyId: subAdmin.company_id, userId: uid, role }
  }

  const admin = await getCompanyAdminById(uid)
  if (!admin?.company_id) {
    const err = new Error('No company linked to your account')
    err.code = 'NO_COMPANY'
    throw err
  }
  return { companyId: admin.company_id, userId: uid, role: NOTIFICATION_ROLES.ADMIN }
}

function formatPersonName(first, last) {
  return [first, last].filter(Boolean).join(' ').trim()
}

function formatJobLabel(job) {
  if (job?.internal_job_id) return `#${job.internal_job_id}`
  if (job?.job_name) return job.job_name
  return 'Job'
}

function formatTimeOfDay(timeValue) {
  if (!timeValue) return null
  const raw = String(timeValue).trim()
  if (!raw) return null
  const parts = raw.split(':').map(Number)
  const h = parts[0]
  const m = parts[1] ?? 0
  if (!Number.isFinite(h)) return raw
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function getDirectionLabel(direction) {
  return String(direction || '').toLowerCase() === 'inbound' ? 'Evening Run' : 'Morning Run'
}

function getRunTimeLabel(job, direction) {
  const isInbound = String(direction || '').toLowerCase() === 'inbound'
  const start = formatTimeOfDay(isInbound ? job?.evening_start_time : job?.morning_start_time)
  const end = formatTimeOfDay(isInbound ? null : job?.morning_end_time)
  if (start && end) return `${start} – ${end}`
  if (start) return start
  return 'Not scheduled'
}

function formatAbsoluteDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function countExtendedWaitLines(notes) {
  return ((notes || '').match(/Extended wait: \d+ min/g) || []).length
}

function latestExtendedWaitMinutes(notes) {
  const matches = (notes || '').match(/Extended wait: (\d+) min/g) || []
  if (!matches.length) return null
  const last = matches[matches.length - 1]
  return last.match(/(\d+)/)?.[1] ?? null
}

function buildSessionStartNotification({ session, job, driver }) {
  if (!session?.id || !session?.started_at || !job?.id) return null

  const jobLabel = formatJobLabel(job)
  const driverName = formatPersonName(driver?.first_name, driver?.last_name) || 'Driver'
  const directionLabel = getDirectionLabel(session.direction)
  const runTime = getRunTimeLabel(job, session.direction)
  const startedAt = formatAbsoluteDateTime(session.started_at)
  const school = job.client_school_name || job.job_name || 'the route'

  return {
    key: `session-start:${session.id}`,
    category: NOTIFICATION_CATEGORIES.JOB,
    tab: NOTIFICATION_TABS.JOBS,
    createdAt: session.started_at,
    isNew: false,
    IconName: 'MdDirectionsBus',
    iconColor: 'text-[#005580] bg-blue-50',
    title: 'Run Started:',
    content: `Driver ${driverName} started the ${directionLabel} for ${jobLabel} (${school}). Scheduled run time: ${runTime}. Started at ${startedAt}.`,
    linkText: 'View Job',
    linkTo: activeNotificationRoutes.job(job.id),
    toastType: 'info',
    toastTitle: 'Run Started',
  }
}

function buildPassengerPickupNotification({ row, job, driver, passenger }) {
  if (!row?.id || !job?.id) return null

  const driverName = formatPersonName(driver?.first_name, driver?.last_name) || 'Driver'
  const passengerName = formatPersonName(passenger?.first_name, passenger?.surname) || 'Passenger'
  const location = row.pickup_address || 'the pickup location'
  const atTime = formatAbsoluteDateTime(row.picked_up_at || row.updated_at)

  return {
    key: `session-passenger-pickup:${row.id}`,
    category: NOTIFICATION_CATEGORIES.JOB,
    tab: NOTIFICATION_TABS.JOBS,
    createdAt: row.picked_up_at || row.updated_at,
    isNew: false,
    IconName: 'MdCheckCircle',
    iconColor: 'text-green-500 bg-green-50',
    title: 'Passenger Picked Up:',
    content: `Driver ${driverName} picked up ${passengerName} from ${location} at ${atTime}.`,
    linkText: 'View Job',
    linkTo: activeNotificationRoutes.job(job.id),
    toastType: 'success',
    toastTitle: 'Passenger Picked Up',
  }
}

function buildPassengerMissedNotification({ row, job, driver, passenger }) {
  if (!row?.id || !job?.id) return null

  const driverName = formatPersonName(driver?.first_name, driver?.last_name) || 'Driver'
  const passengerName = formatPersonName(passenger?.first_name, passenger?.surname) || 'Passenger'
  const location = row.pickup_address || 'the pickup location'
  const atTime = formatAbsoluteDateTime(row.updated_at)

  return {
    key: `session-passenger-missed:${row.id}`,
    category: NOTIFICATION_CATEGORIES.JOB,
    tab: NOTIFICATION_TABS.JOBS,
    createdAt: row.updated_at,
    isNew: false,
    IconName: 'MdPersonOff',
    iconColor: 'text-red-500 bg-red-50',
    title: 'Passenger Not Picked Up:',
    content: `Driver ${driverName} did not pick up ${passengerName} from ${location} at ${atTime}.`,
    linkText: 'View Job',
    linkTo: activeNotificationRoutes.job(job.id),
    toastType: 'warning',
    toastTitle: 'No Pickup',
  }
}

function buildExtendedWaitNotification({ row, job, driver, passenger, minutes }) {
  if (!row?.id || !job?.id) return null

  const driverName = formatPersonName(driver?.first_name, driver?.last_name) || 'Driver'
  const passengerName = formatPersonName(passenger?.first_name, passenger?.surname) || 'Passenger'
  const location = row.pickup_address || 'the pickup location'
  const atTime = formatAbsoluteDateTime(row.updated_at)
  const waitLabel = minutes ? `${minutes} min` : 'additional time'

  return {
    key: `session-passenger-extended:${row.id}:${row.updated_at}`,
    category: NOTIFICATION_CATEGORIES.JOB,
    tab: NOTIFICATION_TABS.JOBS,
    createdAt: row.updated_at,
    isNew: false,
    IconName: 'MdTimer',
    iconColor: 'text-amber-600 bg-amber-50',
    title: 'Extended Wait:',
    content: `Driver ${driverName} extended the pickup time by ${waitLabel} for ${passengerName} at ${location}. Recorded at ${atTime}.`,
    linkText: 'View Job',
    linkTo: activeNotificationRoutes.job(job.id),
    toastType: 'warning',
    toastTitle: 'Extended Wait',
  }
}

export function isSessionStartEvent(oldRow, newRow) {
  if (!newRow?.started_at) return false
  if (!oldRow) return true
  return !oldRow.started_at && Boolean(newRow.started_at)
}

export function detectSessionPassengerEventType(oldRow, newRow) {
  if (!newRow) return null

  const oldStatus = oldRow?.status
  const newStatus = newRow?.status

  if (newStatus === 'picked_up' && oldStatus !== 'picked_up') return 'pickup'
  if (newStatus === 'missed' && oldStatus !== 'missed') return 'missed'

  const oldNotes = oldRow?.notes || ''
  const newNotes = newRow?.notes || ''
  if (
    newRow.status === 'pending'
    && countExtendedWaitLines(newNotes) > countExtendedWaitLines(oldNotes)
  ) {
    return 'extended_wait'
  }

  return null
}

async function fetchCompanyJobsForSessions(companyId) {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(
      'id, internal_job_id, job_name, client_school_name, morning_start_time, morning_end_time, evening_start_time, assigned_driver_id',
    )
    .eq('company_id', companyId)

  if (error) throw error
  return jobs || []
}

async function fetchDriversByIds(driverIds) {
  if (!driverIds.length) return new Map()
  const { data, error } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .in('id', driverIds)
  if (error) throw error
  return new Map((data || []).map((d) => [d.id, d]))
}

async function fetchPassengersByIds(passengerIds) {
  if (!passengerIds.length) return new Map()
  const { data, error } = await supabase
    .from('passenger')
    .select('id, first_name, surname')
    .in('id', passengerIds)
  if (error) throw error
  return new Map((data || []).map((p) => [p.id, p]))
}

async function fetchJobSessionNotifications(companyId) {
  const jobs = await fetchCompanyJobsForSessions(companyId)
  const jobById = new Map(jobs.map((j) => [j.id, j]))
  const jobIds = jobs.map((j) => j.id)
  if (!jobIds.length) return []

  const { data: sessions, error } = await supabase
    .from('job_sessions')
    .select('id, job_id, session_date, direction, status, started_at, driver_id, created_at')
    .in('job_id', jobIds)
    .not('started_at', 'is', null)
    .order('started_at', { ascending: false })

  if (error) throw error
  if (!sessions?.length) return []

  const driverIds = [
    ...new Set(
      sessions
        .map((s) => s.driver_id || jobById.get(s.job_id)?.assigned_driver_id)
        .filter(Boolean),
    ),
  ]
  const driverById = await fetchDriversByIds(driverIds)

  return sessions
    .map((session) => {
      const job = jobById.get(session.job_id)
      if (!job) return null
      const driverId = session.driver_id || job.assigned_driver_id
      const driver = driverById.get(driverId)
      return buildSessionStartNotification({ session, job, driver })
    })
    .filter(Boolean)
}

async function fetchJobSessionPassengerNotifications(companyId) {
  const jobs = await fetchCompanyJobsForSessions(companyId)
  const jobById = new Map(jobs.map((j) => [j.id, j]))
  const jobIds = jobs.map((j) => j.id)
  if (!jobIds.length) return []

  const { data: sessions, error: sessionErr } = await supabase
    .from('job_sessions')
    .select('id, job_id, driver_id')
    .in('job_id', jobIds)

  if (sessionErr) throw sessionErr
  if (!sessions?.length) return []

  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  const sessionIds = sessions.map((s) => s.id)

  const { data: rows, error } = await supabase
    .from('job_session_passengers')
    .select('*')
    .in('session_id', sessionIds)
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!rows?.length) return []

  const driverIds = [
    ...new Set(
      sessions
        .map((s) => s.driver_id || jobById.get(s.job_id)?.assigned_driver_id)
        .filter(Boolean),
    ),
  ]
  const passengerIds = [...new Set(rows.map((r) => r.passenger_id).filter(Boolean))]

  const [driverById, passengerById] = await Promise.all([
    fetchDriversByIds(driverIds),
    fetchPassengersByIds(passengerIds),
  ])

  const notifications = []

  for (const row of rows) {
    const session = sessionById.get(row.session_id)
    if (!session) continue
    const job = jobById.get(session.job_id)
    if (!job) continue

    const driverId = session.driver_id || job.assigned_driver_id
    const driver = driverById.get(driverId)
    const passenger = passengerById.get(row.passenger_id)

    if (row.status === 'picked_up' || (row.picked_up_at && row.status !== 'missed')) {
      const pickup = buildPassengerPickupNotification({ row, job, driver, passenger })
      if (pickup) notifications.push(pickup)
    }

    if (row.status === 'missed') {
      const missed = buildPassengerMissedNotification({ row, job, driver, passenger })
      if (missed) notifications.push(missed)
    }

    if (countExtendedWaitLines(row.notes) > 0) {
      const minutes = latestExtendedWaitMinutes(row.notes)
      const extended = buildExtendedWaitNotification({
        row,
        job,
        driver,
        passenger,
        minutes,
      })
      if (extended) notifications.push(extended)
    }
  }

  return notifications
}

/**
 * Load job, driver, and passenger context for a session passenger row.
 */
export async function enrichSessionPassengerContext(row, companyId) {
  if (!row?.session_id) return null

  const { data: session, error: sessionErr } = await supabase
    .from('job_sessions')
    .select('id, job_id, driver_id')
    .eq('id', row.session_id)
    .maybeSingle()

  if (sessionErr) throw sessionErr
  if (!session) return null

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select(
      'id, company_id, internal_job_id, job_name, client_school_name, morning_start_time, morning_end_time, evening_start_time, assigned_driver_id',
    )
    .eq('id', session.job_id)
    .maybeSingle()

  if (jobErr) throw jobErr
  if (!job || job.company_id !== companyId) return null

  const driverId = session.driver_id || job.assigned_driver_id
  const [driverRes, passengerRes] = await Promise.all([
    driverId
      ? supabase.from('drivers').select('id, first_name, last_name').eq('id', driverId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    row.passenger_id
      ? supabase.from('passenger').select('id, first_name, surname').eq('id', row.passenger_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (driverRes.error) throw driverRes.error
  if (passengerRes.error) throw passengerRes.error

  return {
    session,
    job,
    driver: driverRes.data,
    passenger: passengerRes.data,
  }
}

/**
 * Load job and driver context for a job session row.
 */
export async function enrichSessionContext(sessionRow, companyId) {
  if (!sessionRow?.job_id) return null

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select(
      'id, company_id, internal_job_id, job_name, client_school_name, morning_start_time, morning_end_time, evening_start_time, assigned_driver_id',
    )
    .eq('id', sessionRow.job_id)
    .maybeSingle()

  if (jobErr) throw jobErr
  if (!job || job.company_id !== companyId) return null

  const driverId = sessionRow.driver_id || job.assigned_driver_id
  let driver = null
  if (driverId) {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, fleet')
      .eq('id', driverId)
      .maybeSingle()
    if (error) throw error
    driver = data
  }

  return { session: sessionRow, job, driver }
}

export function buildNotificationFromSessionRow(sessionRow, enrich = {}) {
  return buildSessionStartNotification({
    session: sessionRow,
    job: enrich.job,
    driver: enrich.driver,
  })
}

export function buildNotificationFromSessionPassengerRow(row, eventType, enrich = {}) {
  const ctx = { row, job: enrich.job, driver: enrich.driver, passenger: enrich.passenger }

  if (eventType === 'pickup') return buildPassengerPickupNotification(ctx)
  if (eventType === 'missed') return buildPassengerMissedNotification(ctx)
  if (eventType === 'extended_wait') {
    return buildExtendedWaitNotification({
      ...ctx,
      minutes: latestExtendedWaitMinutes(row?.notes),
    })
  }

  return null
}

function buildJobNotification(job, driverById) {
  const status = String(job.driver_approval_status || '').trim().toLowerCase()
  if (!JOB_RESPONSE_STATUSES.has(status)) return null

  const jobLabel = formatJobLabel(job)
  const driver = driverById.get(job.assigned_driver_id)
  const driverName = formatPersonName(driver?.first_name, driver?.last_name) || 'Driver'
  const school = job.client_school_name || job.job_name || 'the route'
  const counterPay = job.driver_counter_offer_pay != null
    ? Number(job.driver_counter_offer_pay).toFixed(2)
    : null

  if (COUNTER_STATUSES.has(status)) {
    return {
      key: `job:${job.id}`,
      category: NOTIFICATION_CATEGORIES.JOB,
      tab: NOTIFICATION_TABS.JOBS,
      createdAt: job.updated_at || job.created_at,
      isNew: false,
      IconName: 'MdDescription',
      iconColor: 'text-orange-500 bg-orange-50',
      title: 'Counter-Offer Received:',
      content: counterPay
        ? `Driver ${driverName} submitted a counter-offer of £${counterPay} for ${jobLabel} (${school}).`
        : `A counter-offer has been received for ${jobLabel} (${school}).`,
      linkText: 'Review Now',
      linkTo: activeNotificationRoutes.counterOffer(job.id),
      toastType: 'warning',
      toastTitle: 'Counter-Offer Received',
    }
  }

  if (status === 'accepted') {
    if (isCompanyFleet(driver?.fleet)) return null
    return {
      key: `job:${job.id}`,
      category: NOTIFICATION_CATEGORIES.JOB,
      tab: NOTIFICATION_TABS.JOBS,
      createdAt: job.updated_at || job.created_at,
      isNew: false,
      IconName: 'MdCheckCircle',
      iconColor: 'text-green-500 bg-green-50',
      title: `${jobLabel} Accepted:`,
      content: `Driver ${driverName} accepted the job request for "${school}".`,
      linkText: 'View Job',
      linkTo: activeNotificationRoutes.job(job.id),
      toastType: 'success',
      toastTitle: 'Job Accepted',
    }
  }

  if (status === 'rejected') {
    return {
      key: `job:${job.id}`,
      category: NOTIFICATION_CATEGORIES.JOB,
      tab: NOTIFICATION_TABS.JOBS,
      createdAt: job.updated_at || job.created_at,
      isNew: false,
      IconName: 'MdDescription',
      iconColor: 'text-red-500 bg-red-50',
      title: `${jobLabel} Rejected:`,
      content: `Driver ${driverName} rejected the job request for "${school}".`,
      linkText: 'View Job',
      linkTo: activeNotificationRoutes.job(job.id),
      toastType: 'error',
      toastTitle: 'Job Rejected',
    }
  }

  return null
}

function buildSosNotification(alert) {
  const plate = alert.taxi_license_plate_number
    ? `#${alert.taxi_license_plate_number}`
    : alert.vehicle_id
      ? `Vehicle ${String(alert.vehicle_id).slice(0, 8)}`
      : 'A vehicle'

  const triggeredByPa = Boolean(alert.passenger_assistant_id)
  const triggerLabel = triggeredByPa ? alert.pa_label : alert.driver_label
  const triggerPart = triggerLabel ? ` by ${triggerLabel}` : ''

  return {
    key: `sos:${alert.id}`,
    category: NOTIFICATION_CATEGORIES.SOS,
    tab: NOTIFICATION_TABS.SOS,
    createdAt: alert.created_at,
    isNew: false,
    IconName: 'MdWarning',
    iconColor: 'text-red-500 bg-red-50',
    title: 'SOS Alert Triggered:',
    content: `${plate}${triggerPart} has triggered an SOS alert.`,
    linkText: 'View Details',
    linkTo: activeNotificationRoutes.sos(alert.id),
    toastType: 'error',
    toastTitle: 'SOS Alert',
  }
}

function buildLeaveNotification(row) {
  const name = formatPersonName(row.requester_first_name, row.requester_last_name) || 'Staff member'
  const role = String(row.user_role || '').toLowerCase()
  const roleLabel = role === 'passenger_assistant' ? 'Passenger assistant' : 'Driver'
  const range = row.start_date === row.end_date
    ? row.start_date
    : `${row.start_date} – ${row.end_date}`

  return {
    key: `leave:${row.id}`,
    category: NOTIFICATION_CATEGORIES.LEAVE,
    tab: NOTIFICATION_TABS.LEAVE,
    createdAt: row.created_at,
    isNew: false,
    IconName: 'MdPersonAdd',
    iconColor: role === 'passenger_assistant' ? 'text-violet-600 bg-violet-50' : 'text-[#005580] bg-blue-50',
    title: 'Staff Day-off Request:',
    content: `${roleLabel} ${name} requested ${row.leave_type} (${range}). Status: ${row.status}.`,
    linkText: 'Review Request',
    linkTo: activeNotificationRoutes.leaveRequests,
    toastType: 'info',
    toastTitle: role === 'passenger_assistant' ? 'PA Day-off Request' : 'Driver Day-off Request',
  }
}

function formatDocumentTypeLabel(documentType, documentSource) {
  const key = String(documentType || '').trim()
  if (documentSource === 'vehicle') {
    return VEHICLE_DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
  }
  if (documentSource === 'passenger_assistant') {
    return PA_DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
  }
  return DRIVER_DOCUMENT_LABELS[key] ?? key.replace(/_/g, ' ')
}

function buildDriverEventNotification(row) {
  if (!row?.id) return null

  const eventType = String(row.event_type || '')
  const isApproved = eventType === 'driver_approved'
  const isRejected = eventType === 'driver_rejected'
  const isSuspended = eventType === 'driver_suspended'
  const isDocExpired = eventType === 'driver_document_expired'
  const isActive = eventType === 'driver_active'

  const iconColor = isApproved || isActive
    ? 'text-green-500 bg-green-50'
    : isRejected || isSuspended || isDocExpired
      ? 'text-orange-500 bg-orange-50'
      : 'text-[#005580] bg-blue-50'

  const toastType = isApproved || isActive
    ? 'success'
    : isRejected || isSuspended || isDocExpired
      ? 'warning'
      : 'info'

  const toastTitle = isApproved
    ? 'Driver Approved'
    : isRejected
      ? 'Driver Rejected'
      : isSuspended
        ? 'Driver Suspended'
        : isDocExpired
          ? 'Driver Document Expired'
          : isActive
            ? 'Driver Active'
            : 'Driver Update'

  const isDocRelated = isDocExpired
    || (isSuspended && String(row.payload?.reason || '').toLowerCase() === 'document_expiry')

  return {
    key: `driver-event:${row.id}`,
    category: isDocRelated ? NOTIFICATION_CATEGORIES.DOCUMENT : NOTIFICATION_CATEGORIES.VEHICLE,
    tab: isDocRelated ? NOTIFICATION_TABS.DOCUMENTS : NOTIFICATION_TABS.ALL,
    createdAt: row.created_at,
    isNew: false,
    IconName: isDocExpired ? 'MdDescription' : 'MdPerson',
    iconColor,
    title: row.title || toastTitle,
    content: row.body,
    linkText: 'View Driver',
    linkTo: row.driver_id ? activeNotificationRoutes.driverDetail(row.driver_id) : null,
    toastType,
    toastTitle,
  }
}

function formatVehicleEventContent(row) {
  const body = String(row?.body || '').trim()
  const driverName = String(row?.payload?.driver_name || '').trim()
  const vehicleLabel = String(row?.payload?.vehicle_label || '').trim()
  const eventType = String(row?.event_type || '')

  if (eventType === 'vehicle_unassigned' && driverName) {
    if (
      body === 'The driver has been unassigned from the vehicle.'
      || body === 'The vehicle was unassigned from the driver.'
    ) {
      return vehicleLabel
        ? `${driverName} was unassigned from ${vehicleLabel}.`
        : `${driverName} was unassigned from the vehicle.`
    }
  }

  return body
}

function buildVehicleEventNotification(row) {
  if (!row?.id) return null

  const eventType = String(row.event_type || '')
  const isAssign = eventType === 'vehicle_assigned'
  const isUnassign = eventType === 'vehicle_unassigned'
  const isOffRoad = eventType === 'vehicle_off_road'
  const isDocExpired = eventType === 'vehicle_document_expired'
  const iconColor = isAssign
    ? 'text-green-500 bg-green-50'
    : isUnassign || isOffRoad || isDocExpired
      ? 'text-orange-500 bg-orange-50'
      : 'text-[#005580] bg-blue-50'
  const toastType = isAssign
    ? 'success'
    : isUnassign || isOffRoad || isDocExpired
      ? 'warning'
      : 'info'
  const toastTitle = isAssign
    ? 'Vehicle Assigned'
    : isUnassign
      ? 'Driver Unassigned'
      : isOffRoad
        ? 'Vehicle Set to Off Road'
        : isDocExpired
          ? 'Vehicle Document Expired'
          : 'Vehicle Set to Active'

  return {
    key: `vehicle-event:${row.id}`,
    category: isDocExpired ? NOTIFICATION_CATEGORIES.DOCUMENT : NOTIFICATION_CATEGORIES.VEHICLE,
    tab: isDocExpired ? NOTIFICATION_TABS.DOCUMENTS : NOTIFICATION_TABS.VEHICLES,
    createdAt: row.created_at,
    isNew: false,
    IconName: isDocExpired ? 'MdDescription' : 'MdDirectionsCar',
    iconColor,
    title: row.title,
    content: formatVehicleEventContent(row),
    linkText: row.driver_id ? 'View Driver' : 'View Vehicle',
    linkTo: row.driver_id
      ? activeNotificationRoutes.driverDetail(row.driver_id)
      : (row.vehicle_id ? activeNotificationRoutes.vehicleDetail(row.vehicle_id) : null),
    toastType,
    toastTitle,
  }
}

function buildJobReassignmentAlert(row) {
  if (!row?.id) return null
  const createdAt = row.created_at
  const isResolved = row.payload?.event === 'job_reassignment_resolved'
    || row.payload?.is_resolved === true
  const isReminder = !isResolved && Boolean(row.payload?.is_hourly_reminder)
  return {
    key: `job-reassignment:${row.id}:${createdAt || ''}`,
    category: NOTIFICATION_CATEGORIES.JOB,
    tab: NOTIFICATION_TABS.JOBS,
    createdAt: isResolved ? (row.resolved_at || createdAt) : createdAt,
    isNew: false,
    IconName: isResolved ? 'MdCheckCircle' : 'MdWarning',
    iconColor: isResolved ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50',
    title: row.title || (isResolved ? 'Job Reassignment Resolved' : 'Job Reassignment Required'),
    content: row.body,
    linkText: 'View Job',
    linkTo: row.job_id ? activeNotificationRoutes.job(row.job_id) : null,
    toastType: isResolved ? 'success' : 'error',
    toastTitle: isResolved
      ? 'Job Reassignment Resolved'
      : (isReminder ? 'Job Reassignment Reminder' : 'Driver Removed from Job'),
    priority: !isReminder && !isResolved,
  }
}

function buildJobEventNotification(row) {
  if (!row?.id) return null
  const eventType = String(row.event_type || '')
  const isAssigned = eventType === 'job_driver_assigned'
  const isRemoved = eventType === 'job_driver_removed'

  return {
    key: `job-event:${row.id}`,
    category: NOTIFICATION_CATEGORIES.JOB,
    tab: NOTIFICATION_TABS.JOBS,
    createdAt: row.created_at,
    isNew: false,
    IconName: isAssigned ? 'MdCheckCircle' : 'MdDescription',
    iconColor: isAssigned ? 'text-green-500 bg-green-50' : 'text-orange-500 bg-orange-50',
    title: row.title,
    content: row.body,
    linkText: 'View Job',
    linkTo: row.job_id ? activeNotificationRoutes.job(row.job_id) : null,
    toastType: isAssigned ? 'success' : isRemoved ? 'warning' : 'info',
    toastTitle: isAssigned ? 'Driver Assigned' : isRemoved ? 'Driver Removed' : 'Job Update',
  }
}

function formatDocumentExpiryDate(ymd) {
  if (!ymd) return '—'
  const d = new Date(`${String(ymd).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildDocumentExpiryNotification({
  documentId,
  documentSource,
  documentType,
  expiryDate,
  reminderType,
  sentAt,
  personName,
  staffRole,
  staffUserId,
}) {
  const docName = formatDocumentTypeLabel(documentType, documentSource)
  const roleLabel = staffRole === 'passenger_assistant' ? 'Passenger assistant' : 'Driver'
  const reminderLabel = DOCUMENT_EXPIRY_REMINDER_LABELS[reminderType] || reminderType
  const expiryLabel = formatDocumentExpiryDate(expiryDate)
  const isUrgent = reminderType === '24h' || reminderType === '48h'
  const linkTo = staffRole === 'passenger_assistant'
    ? activeNotificationRoutes.paDetail(staffUserId)
    : activeNotificationRoutes.driverDetail(staffUserId)

  return {
    key: `doc-expiry:${documentSource}:${documentId}:${reminderType}`,
    category: NOTIFICATION_CATEGORIES.DOCUMENT,
    tab: NOTIFICATION_TABS.DOCUMENTS,
    createdAt: sentAt,
    isNew: false,
    IconName: 'MdDescription',
    iconColor: isUrgent ? 'text-red-500 bg-red-50' : 'text-orange-500 bg-orange-50',
    title: 'Document Expiring Soon:',
    content: `${roleLabel} ${personName}'s ${docName} expires on ${expiryLabel} (${reminderLabel} remaining).`,
    linkText: 'View Profile',
    linkTo,
    toastType: 'warning',
    toastTitle: 'Document Expiring Soon',
  }
}

/**
 * Resolve leave requester profile and verify they belong to [companyId].
 */
export async function resolveLeaveRequestProfile(row, companyId) {
  if (!row?.user_id || !companyId) return null

  const role = String(row.user_role || '').toLowerCase()

  if (role === 'passenger_assistant') {
    const { data, error } = await supabase
      .from('passenger_assistant')
      .select('id, first_name, surname, company_id')
      .eq('id', row.user_id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      first_name: data.first_name ?? '',
      last_name: data.surname ?? '',
      user_role: 'passenger_assistant',
    }
  }

  const { data, error } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, company_id')
    .eq('id', row.user_id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    first_name: data.first_name ?? '',
    last_name: data.last_name ?? '',
    user_role: 'driver',
  }
}

export function isNewPendingLeaveRequest(eventType, row) {
  if (!row) return false
  if (String(eventType || '').toUpperCase() !== 'INSERT') return false
  return String(row.status || 'pending').toLowerCase() === 'pending'
}

function applyReadState(notifications, readIds) {
  return notifications.map((n) => ({
    ...n,
    isNew: !readIds.has(n.key),
  }))
}

async function fetchCompanyUserProfiles(companyId) {
  const [driversRes, pasRes] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, first_name, last_name, company_id')
      .eq('company_id', companyId),
    supabase
      .from('passenger_assistant')
      .select('id, first_name, surname, company_id')
      .eq('company_id', companyId),
  ])

  if (driversRes.error) throw driversRes.error
  if (pasRes.error) throw pasRes.error

  const profileByUserId = new Map()
  const companyUserIds = []

  for (const d of driversRes.data || []) {
    if (!d?.id) continue
    companyUserIds.push(d.id)
    profileByUserId.set(d.id, {
      first_name: d.first_name ?? '',
      last_name: d.last_name ?? '',
      user_role: 'driver',
    })
  }

  for (const pa of pasRes.data || []) {
    if (!pa?.id) continue
    companyUserIds.push(pa.id)
    profileByUserId.set(pa.id, {
      first_name: pa.first_name ?? '',
      last_name: pa.surname ?? '',
      user_role: 'passenger_assistant',
    })
  }

  return { profileByUserId, companyUserIds }
}

async function fetchSosNotifications(companyId) {
  const { data: sosRows, error } = await supabase
    .from('sos')
    .select('id, vehicle_id, company_id, driver_id, passenger_assistant_id, created_at, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!sosRows?.length) return []

  const vehicleIds = [...new Set(sosRows.map((r) => r.vehicle_id).filter(Boolean))]
  const driverIds = [...new Set(sosRows.map((r) => r.driver_id).filter(Boolean))]
  const paIds = [...new Set(sosRows.map((r) => r.passenger_assistant_id).filter(Boolean))]

  const [vehiclesRes, driversRes, pasRes] = await Promise.all([
    vehicleIds.length
      ? supabase.from('vehicles').select('id, taxi_license_plate_number').in('id', vehicleIds)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length
      ? supabase.from('drivers').select('id, first_name, last_name').in('id', driverIds)
      : Promise.resolve({ data: [], error: null }),
    paIds.length
      ? supabase.from('passenger_assistant').select('id, first_name, surname').in('id', paIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (vehiclesRes.error) throw vehiclesRes.error
  if (driversRes.error) throw driversRes.error
  if (pasRes.error) throw pasRes.error

  const plateMap = new Map((vehiclesRes.data || []).map((v) => [v.id, v.taxi_license_plate_number]))
  const driverMap = new Map((driversRes.data || []).map((d) => [
    d.id,
    formatPersonName(d.first_name, d.last_name),
  ]))
  const paMap = new Map((pasRes.data || []).map((pa) => [
    pa.id,
    formatPersonName(pa.first_name, pa.surname),
  ]))

  return sosRows.map((row) =>
    buildSosNotification({
      id: row.id,
      vehicle_id: row.vehicle_id,
      passenger_assistant_id: row.passenger_assistant_id,
      created_at: row.created_at,
      taxi_license_plate_number: plateMap.get(row.vehicle_id) || null,
      driver_label: driverMap.get(row.driver_id) || null,
      pa_label: paMap.get(row.passenger_assistant_id) || null,
    }),
  )
}

async function fetchLeaveNotifications(companyId, profileByUserId, companyUserIds) {
  if (!companyUserIds.length) return []

  const { data: rows, error } = await supabase
    .from('leave_requests')
    .select(
      'id, user_id, user_role, leave_type, start_date, end_date, status, created_at',
    )
    .in('user_id', companyUserIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  const notifications = []

  for (const row of rows || []) {
    let profile = profileByUserId.get(row.user_id)
    if (!profile?.first_name && !profile?.last_name) {
      try {
        profile = await resolveLeaveRequestProfile(row, companyId)
      } catch {
        profile = null
      }
    }
    if (!profile) continue

    const notification = buildLeaveNotification({
      ...row,
      requester_first_name: profile.first_name ?? '',
      requester_last_name: profile.last_name ?? '',
      user_role: row.user_role || profile.user_role,
    })
    if (notification) notifications.push(notification)
  }

  return notifications
}

async function fetchJobNotifications(companyId) {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(
      'id, company_id, assigned_driver_id, internal_job_id, job_name, client_school_name, driver_approval_status, driver_counter_offer_pay, created_at, updated_at',
    )
    .eq('company_id', companyId)
    .not('driver_approval_status', 'is', null)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const driverIds = [...new Set((jobs || []).map((j) => j.assigned_driver_id).filter(Boolean))]
  let driverById = new Map()

  if (driverIds.length) {
    const { data: drivers, error: driverErr } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, fleet')
      .in('id', driverIds)
    if (driverErr) throw driverErr
    driverById = new Map((drivers || []).map((d) => [d.id, d]))
  }

  return (jobs || [])
    .map((job) => buildJobNotification(job, driverById))
    .filter(Boolean)
}

async function fetchDocumentDetailsBySource(sentRows) {
  const driverDocIds = sentRows
    .filter((row) => row.document_source === 'driver')
    .map((row) => row.document_id)
  const vehicleDocIds = sentRows
    .filter((row) => row.document_source === 'vehicle')
    .map((row) => row.document_id)
  const paDocIds = sentRows
    .filter((row) => row.document_source === 'passenger_assistant')
    .map((row) => row.document_id)

  const [driverDocsRes, vehicleDocsRes, paDocsRes] = await Promise.all([
    driverDocIds.length
      ? supabase
        .from('driver_documents')
        .select('id, document_type, expiry_date')
        .in('id', driverDocIds)
      : Promise.resolve({ data: [], error: null }),
    vehicleDocIds.length
      ? supabase
        .from('vehicle_documents')
        .select('id, document_type, expiry_date')
        .in('id', vehicleDocIds)
      : Promise.resolve({ data: [], error: null }),
    paDocIds.length
      ? supabase
        .from('passenger_assistant_documents')
        .select('id, document_type, expiry_date')
        .in('id', paDocIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (driverDocsRes.error) throw driverDocsRes.error
  if (vehicleDocsRes.error) throw vehicleDocsRes.error
  if (paDocsRes.error) throw paDocsRes.error

  const detailsByKey = new Map()
  for (const doc of driverDocsRes.data || []) {
    detailsByKey.set(`driver:${doc.id}`, doc)
  }
  for (const doc of vehicleDocsRes.data || []) {
    detailsByKey.set(`vehicle:${doc.id}`, doc)
  }
  for (const doc of paDocsRes.data || []) {
    detailsByKey.set(`passenger_assistant:${doc.id}`, doc)
  }

  return detailsByKey
}

async function fetchDocumentExpiryNotifications(companyId, profileByUserId) {
  const { data: sentRows, error } = await supabase
    .from('document_expiry_notifications_sent')
    .select('document_id, document_source, user_id, reminder_type, sent_at')
    .eq('company_id', companyId)
    .order('sent_at', { ascending: false })
    .limit(300)

  if (error) throw error
  if (!sentRows?.length) return []

  const detailsByKey = await fetchDocumentDetailsBySource(sentRows)
  const notifications = []

  for (const row of sentRows) {
    const profile = profileByUserId.get(row.user_id)
    if (!profile) continue

    const detail = detailsByKey.get(`${row.document_source}:${row.document_id}`)
    if (!detail) continue

    const personName = formatPersonName(profile.first_name, profile.last_name) || 'Staff member'
    const staffRole = row.document_source === 'passenger_assistant'
      ? 'passenger_assistant'
      : 'driver'

    const notification = buildDocumentExpiryNotification({
      documentId: row.document_id,
      documentSource: row.document_source,
      documentType: detail.document_type,
      expiryDate: detail.expiry_date,
      reminderType: row.reminder_type,
      sentAt: row.sent_at,
      personName,
      staffRole,
      staffUserId: row.user_id,
    })
    if (notification) notifications.push(notification)
  }

  return notifications
}

async function fetchDriverEventNotifications(companyId) {
  const { data, error } = await supabase
    .from('driver_event_notifications')
    .select('id, company_id, driver_id, vehicle_id, event_type, title, body, payload, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.warn('Driver event notifications unavailable:', error.message)
    return []
  }
  return (data || []).map(buildDriverEventNotification).filter(Boolean)
}

async function fetchVehicleEventNotifications(companyId) {
  const { data, error } = await supabase
    .from('vehicle_event_notifications')
    .select('id, company_id, vehicle_id, driver_id, event_type, title, body, payload, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.warn('Vehicle event notifications unavailable:', error.message)
    return []
  }
  return (data || []).map(buildVehicleEventNotification).filter(Boolean)
}

async function fetchJobEventNotifications(companyId) {
  const { data, error } = await supabase
    .from('job_event_notifications')
    .select('id, company_id, job_id, driver_id, event_type, title, body, payload, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.warn('Job event notifications unavailable:', error.message)
    return []
  }
  return (data || []).map(buildJobEventNotification).filter(Boolean)
}

async function fetchJobReassignmentAlerts(companyId) {
  const { data, error } = await supabase
    .from('job_reassignment_alerts')
    .select('id, company_id, driver_id, vehicle_id, job_id, reason, fleet, record_type, title, body, payload, status, created_at, last_notified_at, resolved_at, resolved_by_id, resolved_by_name, new_driver_id')
    .eq('company_id', companyId)
    .eq('record_type', 'notification')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.warn('Job reassignment alerts unavailable:', error.message)
    return []
  }
  return (data || []).map(buildJobReassignmentAlert).filter(Boolean)
}

/**
 * Fetch company-scoped notifications for admin or sub-admin.
 */
export async function fetchCompanyNotifications(role = NOTIFICATION_ROLES.ADMIN) {
  setNotificationRole(role)
  const { companyId, userId } = await getCompanyContextForRole(role)
  const { profileByUserId, companyUserIds } = await fetchCompanyUserProfiles(companyId)

  const [
    sosItems,
    leaveItems,
    jobItems,
    sessionItems,
    sessionPassengerItems,
    documentItems,
    vehicleItems,
    driverEventItems,
    jobEventItems,
    privateJobRemovalItems,
  ] =
    await Promise.all([
    fetchSosNotifications(companyId),
    fetchLeaveNotifications(companyId, profileByUserId, companyUserIds),
    fetchJobNotifications(companyId),
    fetchJobSessionNotifications(companyId),
    fetchJobSessionPassengerNotifications(companyId),
    fetchDocumentExpiryNotifications(companyId, profileByUserId),
    fetchVehicleEventNotifications(companyId),
    fetchDriverEventNotifications(companyId),
    fetchJobEventNotifications(companyId),
    fetchJobReassignmentAlerts(companyId),
  ])

  const readIds = await getReadNotificationIds(userId, role)
  const merged = [
    ...sosItems,
    ...leaveItems,
    ...jobItems,
    ...sessionItems,
    ...sessionPassengerItems,
    ...documentItems,
    ...vehicleItems,
    ...driverEventItems,
    ...jobEventItems,
    ...privateJobRemovalItems,
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((n) => ({
      ...n,
      time: formatRelativeTime(n.createdAt),
    }))

  return {
    companyId,
    userId,
    role,
    notifications: applyReadState(merged, readIds),
    companyUserIds,
  }
}

/**
 * Fetch all admin notifications for the signed-in company admin.
 */
export async function fetchAdminNotifications() {
  return fetchCompanyNotifications(NOTIFICATION_ROLES.ADMIN)
}

/**
 * Fetch all notifications for the signed-in sub-admin.
 */
export async function fetchSubAdminNotifications() {
  return fetchCompanyNotifications(NOTIFICATION_ROLES.SUBADMIN)
}

export function filterNotificationsByTab(notifications, activeTab) {
  if (activeTab === NOTIFICATION_TABS.ALL) return notifications
  if (activeTab === NOTIFICATION_TABS.UNREAD) return notifications.filter((n) => n.isNew)
  if (activeTab === NOTIFICATION_TABS.SOS) {
    return notifications.filter((n) => n.category === NOTIFICATION_CATEGORIES.SOS)
  }
  if (activeTab === NOTIFICATION_TABS.JOBS) {
    return notifications.filter((n) => n.category === NOTIFICATION_CATEGORIES.JOB)
  }
  if (activeTab === NOTIFICATION_TABS.LEAVE) {
    return notifications.filter((n) => n.category === NOTIFICATION_CATEGORIES.LEAVE)
  }
  if (activeTab === NOTIFICATION_TABS.DOCUMENTS) {
    return notifications.filter((n) => n.category === NOTIFICATION_CATEGORIES.DOCUMENT)
  }
  if (activeTab === NOTIFICATION_TABS.VEHICLES) {
    return notifications.filter((n) => n.category === NOTIFICATION_CATEGORIES.VEHICLE)
  }
  return notifications
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getDateGroupLabel(iso) {
  if (!iso) return 'Earlier'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Earlier'

  const today = startOfDay(new Date())
  const yesterday = startOfDay(new Date())
  yesterday.setDate(yesterday.getDate() - 1)
  const itemDay = startOfDay(d)

  if (itemDay.getTime() === today.getTime()) return 'Today'
  if (itemDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function groupNotificationsByDate(notifications) {
  const groups = []
  const map = new Map()

  for (const item of notifications) {
    const label = getDateGroupLabel(item.createdAt)
    if (!map.has(label)) {
      const group = { label, items: [] }
      map.set(label, group)
      groups.push(group)
    }
    map.get(label).items.push(item)
  }

  return groups
}

export function buildNotificationFromSosRow(row, enrich = {}) {
  return buildSosNotification({
    id: row.id,
    vehicle_id: row.vehicle_id,
    passenger_assistant_id: row.passenger_assistant_id ?? null,
    created_at: row.created_at,
    taxi_license_plate_number: enrich.plate ?? null,
    driver_label: enrich.driverLabel ?? null,
    pa_label: enrich.paLabel ?? null,
  })
}

export function buildNotificationFromLeaveRow(row, profile = {}) {
  return buildLeaveNotification({
    ...row,
    requester_first_name: profile.first_name ?? '',
    requester_last_name: profile.last_name ?? '',
    user_role: row.user_role || profile.user_role,
  })
}

export function buildNotificationFromJobRow(job, driver = null) {
  const driverById = new Map()
  if (job?.assigned_driver_id && driver) {
    driverById.set(job.assigned_driver_id, driver)
  }
  return buildJobNotification(job, driverById)
}

export function buildNotificationFromDocumentExpiryRow(row, profile = {}, document = {}) {
  const personName = formatPersonName(profile.first_name, profile.last_name) || 'Staff member'
  const staffRole = row.document_source === 'passenger_assistant'
    ? 'passenger_assistant'
    : 'driver'

  return buildDocumentExpiryNotification({
    documentId: row.document_id,
    documentSource: row.document_source,
    documentType: document.document_type,
    expiryDate: document.expiry_date,
    reminderType: row.reminder_type,
    sentAt: row.sent_at,
    personName,
    staffRole,
    staffUserId: row.user_id,
  })
}

export function buildNotificationFromDriverEventRow(row) {
  return buildDriverEventNotification(row)
}

export function buildNotificationFromVehicleEventRow(row) {
  return buildVehicleEventNotification(row)
}

export function buildNotificationFromJobReassignmentAlert(row) {
  return buildJobReassignmentAlert(row)
}

export function buildNotificationFromJobEventRow(row) {
  return buildJobEventNotification(row)
}

/** @deprecated use buildNotificationFromJobReassignmentAlert */
export function buildNotificationFromPrivateDriverJobRemovalAlert(row) {
  return buildJobReassignmentAlert(row)
}
