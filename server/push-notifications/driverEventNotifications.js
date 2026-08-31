export async function insertDriverPortalEvent(supabase, row) {
  const { data, error } = await supabase
    .from('driver_event_notifications')
    .insert(row)
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function notifyDriverPortalEvent(supabase, {
  companyId,
  driverId,
  vehicleId = null,
  eventType,
  title,
  body,
  payload = {},
  notifyPortalUsersPush,
}) {
  const portalEvent = await insertDriverPortalEvent(supabase, {
    company_id: companyId,
    driver_id: driverId,
    vehicle_id: vehicleId,
    actor_id: null,
    event_type: eventType,
    title,
    body,
    payload: {
      ...payload,
      event: eventType,
      driver_id: driverId,
      vehicle_id: vehicleId || null,
    },
  })

  if (notifyPortalUsersPush) {
    await notifyPortalUsersPush(supabase, {
      companyId,
      title,
      body,
      type: eventType,
      notificationId: portalEvent?.id,
      referenceId: driverId,
    })
  }

  return portalEvent
}
