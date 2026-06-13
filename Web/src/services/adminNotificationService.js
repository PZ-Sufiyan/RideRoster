import { supabase } from '../lib/supabaseClient'
import { getCompanyAdminById } from './companyService'
import { formatRelativeTime } from './dashboardService'

export const NOTIFICATION_TABS = {
  ALL: 'All Notifications',
  UNREAD: 'Unread',
  SOS: 'SOS Alerts',
  JOBS: 'Job Updates',
  LEAVE: 'Staff Day of Requests',
}

export const NOTIFICATION_CATEGORIES = {
  SOS: 'sos',
  JOB: 'job',
  LEAVE: 'leave',
}

const JOB_RESPONSE_STATUSES = new Set(['accepted', 'rejected', 'counter request', 'counter requested'])
const COUNTER_STATUSES = new Set(['counter request', 'counter requested'])
const READ_STORAGE_PREFIX = 'rideRoster_admin_notif_reads_'

function readStorageKey(userId) {
  return `${READ_STORAGE_PREFIX}${userId}`
}

export function getReadNotificationIds(userId) {
  if (!userId) return new Set()
  try {
    const raw = localStorage.getItem(readStorageKey(userId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function persistReadNotificationIds(userId, ids) {
  if (!userId) return
  localStorage.setItem(readStorageKey(userId), JSON.stringify([...ids]))
}

export function markNotificationsRead(userId, notificationKeys) {
  const next = getReadNotificationIds(userId)
  for (const key of notificationKeys) next.add(key)
  persistReadNotificationIds(userId, next)
  return next
}

export function markAllNotificationsRead(userId, notificationKeys) {
  return markNotificationsRead(userId, notificationKeys)
}

async function getCompanyIdForCurrentAdmin() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid) {
    const err = new Error('Not authenticated')
    err.code = 'AUTH'
    throw err
  }
  const admin = await getCompanyAdminById(uid)
  if (!admin?.company_id) {
    const err = new Error('No company linked to your account')
    err.code = 'NO_COMPANY'
    throw err
  }
  return { companyId: admin.company_id, userId: uid }
}

function formatPersonName(first, last) {
  return [first, last].filter(Boolean).join(' ').trim()
}

function formatJobLabel(job) {
  if (job?.internal_job_id) return `#${job.internal_job_id}`
  if (job?.job_name) return job.job_name
  return 'Job'
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
      linkTo: `/portal/jobs/${job.id}/counter-offer`,
      toastType: 'warning',
      toastTitle: 'Counter-Offer Received',
    }
  }

  if (status === 'accepted') {
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
      linkTo: `/portal/jobs/${job.id}`,
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
      linkTo: `/portal/jobs/${job.id}`,
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
  const driverPart = alert.driver_label ? ` by ${alert.driver_label}` : ''

  return {
    key: `sos:${alert.id}`,
    category: NOTIFICATION_CATEGORIES.SOS,
    tab: NOTIFICATION_TABS.SOS,
    createdAt: alert.created_at,
    isNew: false,
    IconName: 'MdWarning',
    iconColor: 'text-red-500 bg-red-50',
    title: 'SOS Alert Triggered:',
    content: `${plate}${driverPart} has triggered an SOS alert.`,
    linkText: 'View Details',
    linkTo: `/portal/sos/${alert.id}`,
    toastType: 'error',
    toastTitle: 'SOS Alert',
  }
}

function buildLeaveNotification(row) {
  const name = formatPersonName(row.requester_first_name, row.requester_last_name) || 'Staff member'
  const roleLabel = row.user_role === 'passenger_assistant' ? 'Passenger assistant' : 'Driver'
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
    iconColor: 'text-[#005580] bg-blue-50',
    title: 'Staff Day-off Request:',
    content: `${roleLabel} ${name} requested ${row.leave_type} (${range}). Status: ${row.status}.`,
    linkText: 'Review Request',
    linkTo: '/portal/users/off-day-requests',
    toastType: 'info',
    toastTitle: 'Day-off Request',
  }
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
    .select('id, vehicle_id, company_id, driver_id, created_at, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!sosRows?.length) return []

  const vehicleIds = [...new Set(sosRows.map((r) => r.vehicle_id).filter(Boolean))]
  const driverIds = [...new Set(sosRows.map((r) => r.driver_id).filter(Boolean))]

  const [vehiclesRes, driversRes] = await Promise.all([
    vehicleIds.length
      ? supabase.from('vehicles').select('id, taxi_license_plate_number').in('id', vehicleIds)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length
      ? supabase.from('drivers').select('id, first_name, last_name').in('id', driverIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (vehiclesRes.error) throw vehiclesRes.error
  if (driversRes.error) throw driversRes.error

  const plateMap = new Map((vehiclesRes.data || []).map((v) => [v.id, v.taxi_license_plate_number]))
  const driverMap = new Map((driversRes.data || []).map((d) => [
    d.id,
    formatPersonName(d.first_name, d.last_name),
  ]))

  return sosRows.map((row) =>
    buildSosNotification({
      id: row.id,
      vehicle_id: row.vehicle_id,
      created_at: row.created_at,
      taxi_license_plate_number: plateMap.get(row.vehicle_id) || null,
      driver_label: driverMap.get(row.driver_id) || null,
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

  return (rows || []).map((row) => {
    const profile = profileByUserId.get(row.user_id) || {}
    return buildLeaveNotification({
      ...row,
      requester_first_name: profile.first_name ?? '',
      requester_last_name: profile.last_name ?? '',
      user_role: row.user_role || profile.user_role,
    })
  })
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
      .select('id, first_name, last_name')
      .in('id', driverIds)
    if (driverErr) throw driverErr
    driverById = new Map((drivers || []).map((d) => [d.id, d]))
  }

  return (jobs || [])
    .map((job) => buildJobNotification(job, driverById))
    .filter(Boolean)
}

/**
 * Fetch all admin notifications for the signed-in company admin.
 */
export async function fetchAdminNotifications() {
  const { companyId, userId } = await getCompanyIdForCurrentAdmin()
  const { profileByUserId, companyUserIds } = await fetchCompanyUserProfiles(companyId)

  const [sosItems, leaveItems, jobItems] = await Promise.all([
    fetchSosNotifications(companyId),
    fetchLeaveNotifications(companyId, profileByUserId, companyUserIds),
    fetchJobNotifications(companyId),
  ])

  const readIds = getReadNotificationIds(userId)
  const merged = [...sosItems, ...leaveItems, ...jobItems]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((n) => ({
      ...n,
      time: formatRelativeTime(n.createdAt),
    }))

  return {
    companyId,
    userId,
    notifications: applyReadState(merged, readIds),
    companyUserIds,
  }
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
    created_at: row.created_at,
    taxi_license_plate_number: enrich.plate ?? null,
    driver_label: enrich.driverLabel ?? null,
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
