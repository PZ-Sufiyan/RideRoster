export async function insertPaPortalEvent(supabase, row) {
  const { data, error } = await supabase
    .from('pa_event_notifications')
    .insert(row)
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function notifyPaPortalEvent(supabase, {
  companyId,
  paId,
  jobId = null,
  eventType,
  title,
  body,
  payload = {},
  notifyPortalUsersPush,
}) {
  const portalEvent = await insertPaPortalEvent(supabase, {
    company_id: companyId,
    pa_id: paId,
    job_id: jobId,
    actor_id: null,
    event_type: eventType,
    title,
    body,
    payload: {
      ...payload,
      event: eventType,
      pa_id: paId,
      job_id: jobId || null,
    },
  })

  if (notifyPortalUsersPush) {
    await notifyPortalUsersPush(supabase, {
      companyId,
      title,
      body,
      type: eventType,
      notificationId: portalEvent?.id,
      referenceId: jobId || paId,
    })
  }

  return portalEvent
}
