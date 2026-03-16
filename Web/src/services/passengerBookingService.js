import { supabase } from '../lib/supabaseClient'

export const getAllPassengerBookings = async ({ companyId = null, passengerId = null } = {}) => {
  let query = supabase.from('passenger_bookings').select('*').order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  if (passengerId) query = query.eq('passenger_id', passengerId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getPassengerBookingById = async (bookingId) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .select('*')
    .eq('id', bookingId)
    .single()
  if (error) throw error
  return data
}

export const createPassengerBooking = async (bookingPayload) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .insert(bookingPayload)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updatePassengerBooking = async (bookingId, updates) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deletePassengerBooking = async (bookingId) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .delete()
    .eq('id', bookingId)
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Additional operations requested ---

// Get all bookings for a company
export const getPassengerBookingsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all bookings for a passenger
export const getPassengerBookingsByPassenger = async (passengerId) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .select('*')
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get bookings filtered by both company_id and passenger_id
export const getPassengerBookingsByCompanyAndPassenger = async (companyId, passengerId) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .select('*')
    .match({ company_id: companyId, passenger_id: passengerId })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Update bookings that match company_id AND passenger_id
// Note: this updates all rows that match the pair; returns updated rows
export const updatePassengerBookingsByCompanyAndPassenger = async (companyId, passengerId, updates) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .match({ company_id: companyId, passenger_id: passengerId })
    .select()

  if (error) throw error
  return data
}

// Delete bookings that match company_id AND passenger_id
// Note: this deletes all rows that match the pair; returns deleted rows
export const deletePassengerBookingsByCompanyAndPassenger = async (companyId, passengerId) => {
  const { data, error } = await supabase
    .from('passenger_bookings')
    .delete()
    .match({ company_id: companyId, passenger_id: passengerId })
    .select()

  if (error) throw error
  return data
}