import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'

function cleanString(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function toNullableString(v) {
  const s = cleanString(v)
  return s.length ? s : null
}

export const getPassengers = async ({ companyId = null } = {}) => {
  let query = supabase
    .from('passenger')
    .select('*')
    .order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const updatePassenger = async (passengerId, updates) => {
  const { data, error } = await supabase
    .from('passenger')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', passengerId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Full passenger row by id (no joins).
 */
export const getPassengerById = async (passengerId) => {
  const { data, error } = await supabase
    .from('passenger')
    .select('*')
    .eq('id', passengerId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Passenger plus assigned job, driver, PA, and optional job_passenger_routes → pickup/dropoff rows.
 */
export const getPassengerDetailBundle = async (passengerId) => {
  const passenger = await getPassengerById(passengerId)
  if (!passenger) {
    return {
      passenger: null,
      job: null,
      driver: null,
      passengerAssistant: null,
      route: null,
    }
  }

  const jobId = passenger.assigned_job_id != null ? String(passenger.assigned_job_id).trim() : ''
  if (!jobId) {
    return {
      passenger,
      job: null,
      driver: null,
      passengerAssistant: null,
      route: null,
    }
  }

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle()

  if (jobErr) throw jobErr
  if (!job) {
    return {
      passenger,
      job: null,
      driver: null,
      passengerAssistant: null,
      route: null,
    }
  }

  const [driverRes, paRes, routeRes] = await Promise.all([
    supabase.from('drivers').select('*').eq('id', job.assigned_driver_id).maybeSingle(),
    supabase.from('passenger_assistant').select('*').eq('id', job.assigned_pa_id).maybeSingle(),
    supabase
      .from('job_passenger_routes')
      .select('*')
      .eq('job_id', job.id)
      .eq('passenger_id', passengerId)
      .maybeSingle(),
  ])

  if (driverRes.error) throw driverRes.error
  if (paRes.error) throw paRes.error
  if (routeRes.error) throw routeRes.error

  let route = null
  if (routeRes.data) {
    const [pickupRes, dropoffRes] = await Promise.all([
      supabase.from('job_pickups').select('*').eq('id', routeRes.data.pickup_id).maybeSingle(),
      supabase.from('job_dropoffs').select('*').eq('id', routeRes.data.dropoff_id).maybeSingle(),
    ])
    if (pickupRes.error) throw pickupRes.error
    if (dropoffRes.error) throw dropoffRes.error
    route = {
      ...routeRes.data,
      pickup: pickupRes.data,
      dropoff: dropoffRes.data,
    }
  }

  return {
    passenger,
    job,
    driver: driverRes.data,
    passengerAssistant: paRes.data,
    route,
  }
}

export const registerPassengerWithAuthAndRecord = async ({ companyId, form }) => {
  if (!companyId) throw new Error('Company is required.')

  const email = cleanString(form?.email).toLowerCase()
  const password = form?.password
  if (!email) throw new Error('Email is required.')
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }
  if (!cleanString(form?.firstName)) throw new Error('First name is required.')
  if (!cleanString(form?.surname)) throw new Error('Surname is required.')
  if (!cleanString(form?.contact1)) throw new Error('Contact number 1 is required.')
  if (!cleanString(form?.homeAddress)) throw new Error('Pickup address is required.')
  if (!cleanString(form?.homePostcode)) throw new Error('Pickup postal code is required.')
  if (!cleanString(form?.pickupTime)) throw new Error('Pickup time is required.')
  if (!cleanString(form?.schoolAddress)) throw new Error('Drop-off address is required.')
  if (!cleanString(form?.schoolPostcode)) throw new Error('Drop-off postal code is required.')
  if (!cleanString(form?.returnTime)) throw new Error('Drop-off time is required.')

  let authUserId = null

  try {
    const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'passenger' },
      user_metadata: {
        role: 'passenger',
        email,
        first_name: cleanString(form?.firstName),
        last_name: cleanString(form?.surname),
      },
    })

    if (createErr) throw createErr
    if (!createdAuth?.user?.id) throw new Error('Could not create auth user.')
    authUserId = createdAuth.user.id

    const passengerPayload = {
      id: authUserId,
      company_id: companyId,
      first_name: cleanString(form?.firstName),
      surname: cleanString(form?.surname),
      email,
      contact_number_1: cleanString(form?.contact1),
      contact_number_2: toNullableString(form?.contact2),
      pickup_address: cleanString(form?.homeAddress),
      pickup_postal_code: cleanString(form?.homePostcode),
      pickup_time: cleanString(form?.pickupTime),
      dropoff_address: cleanString(form?.schoolAddress),
      dropoff_postal_code: cleanString(form?.schoolPostcode),
      dropoff_time: cleanString(form?.returnTime),
      wheelchair_required: cleanString(form?.wheelchair).toLowerCase() === 'yes',
      notes: toNullableString(form?.notes),
      status: 'pending',
    }

    const { data, error } = await supabaseAdmin
      .from('passenger')
      .insert(passengerPayload)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    if (authUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
      } catch {
        // best effort rollback
      }
    }
    throw err
  }
}
