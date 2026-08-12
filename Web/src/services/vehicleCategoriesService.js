import { supabase } from '../lib/supabaseClient'

/** Preferred category order — matches app registration UI. */
const CATEGORY_ORDER = ['Car', 'People Carrier', 'Minibus', 'Hackney']

/**
 * Fetch vehicle type options from `vehicle_categories`.
 * Returns items shaped for driver add/edit selects:
 * `{ value, seats, wheelchairAccessible }`
 * where `value` is `"Category - Variant"` (same as stored `body_style`).
 */
export async function getVehicleTypeOptions() {
  const { data, error } = await supabase
    .from('vehicle_categories')
    .select('category_key, variant_label, seats, wheelchair_accessible')
    .order('category_key', { ascending: true })
    .order('variant_label', { ascending: true })

  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  const options = []

  for (const row of rows) {
    const key = String(row.category_key ?? '').trim()
    const label = String(row.variant_label ?? '').trim()
    if (!key || !label) continue

    const seatsNum = Number(row.seats)
    if (!Number.isFinite(seatsNum) || seatsNum <= 0) continue

    options.push({
      value: `${key} - ${label}`,
      seats: String(Math.trunc(seatsNum)),
      wheelchairAccessible: row.wheelchair_accessible === true,
      _categoryKey: key,
    })
  }

  options.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a._categoryKey)
    const bi = CATEGORY_ORDER.indexOf(b._categoryKey)
    const aRank = ai === -1 ? CATEGORY_ORDER.length : ai
    const bRank = bi === -1 ? CATEGORY_ORDER.length : bi
    if (aRank !== bRank) return aRank - bRank
    return a.value.localeCompare(b.value)
  })

  return options.map(({ _categoryKey, ...rest }) => rest)
}
