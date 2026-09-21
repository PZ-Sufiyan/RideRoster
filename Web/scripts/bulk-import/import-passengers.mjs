import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_ROOT = path.resolve(__dirname, '../..')
const SAMPLE_DIR = path.join(__dirname, 'passenger-sample')
const EXCEL_PATH = path.join(SAMPLE_DIR, 'Passengers.xlsx')
const RESULTS_PATH = path.join(SAMPLE_DIR, 'import-results.json')
const DUMMY_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const REQUIRED_COLUMNS = [
  'company_id',
  'first_name',
  'last_name',
  'email',
  'contact_number_1',
  'primary_pickup_address',
  'primary_pickup_postcode',
  'primary_pickup_latitude',
  'primary_pickup_longitude',
  'pickup_time',
  'educational_site_address',
  'educational_site_postcode',
  'educational_site_latitude',
  'educational_site_longitude',
  'dropoff_time',
]

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const text = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null) process.env[key] = value
  }
}

loadEnvFile(path.join(WEB_ROOT, '.env'))
loadEnvFile(path.join(WEB_ROOT, '.env.local'))

function clean(value) {
  if (value == null) return ''
  return String(value).trim()
}

function nullable(value) {
  const s = clean(value)
  return s ? s : null
}

function toYesNo(value) {
  const s = clean(value).toLowerCase()
  return s === 'yes' || s === 'true' || s === '1'
}

function toTimeString(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const h = String(value.getHours()).padStart(2, '0')
    const m = String(value.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalMinutes = Math.round(value * 24 * 60) % (24 * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const s = clean(value)
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (match) return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
  return s
}

function toCoord(value, label, missingFields) {
  const s = clean(value)
  if (!s) {
    missingFields.push(label)
    return null
  }
  const n = Number(s)
  if (!Number.isFinite(n)) {
    missingFields.push(`${label} (must be a number)`)
    return null
  }
  return n
}

function toCoordText(value) {
  const n = Number(value)
  return Number.isFinite(n) ? String(n) : null
}

function weeklySchedule(row) {
  const schedule = {}
  for (const day of DAY_KEYS) {
    schedule[day] = toYesNo(row[`schedule_${day}`])
  }
  return schedule
}

function createAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in Web/.env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
}

function readExcelRows() {
  if (!fs.existsSync(EXCEL_PATH)) throw new Error(`Excel not found: ${EXCEL_PATH}`)
  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'passengers') || workbook.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
  if (!rows.length) throw new Error('Passengers sheet is empty.')
  return rows
}

function validateRow(row, index) {
  const missingFields = []
  const warnings = []
  const excelRow = index + 2
  for (const key of REQUIRED_COLUMNS) {
    if (!clean(row[key])) missingFields.push(key)
  }
  const email = clean(row.email).toLowerCase()
  const companyId = clean(row.company_id)
  if (companyId === DUMMY_COMPANY_ID) missingFields.push('company_id (still dummy)')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missingFields.push('email (invalid format)')

  const pickupTime = toTimeString(row.pickup_time)
  const dropoffTime = toTimeString(row.dropoff_time)
  if (clean(row.pickup_time) && !/^\d{2}:\d{2}$/.test(pickupTime)) missingFields.push('pickup_time (use HH:MM)')
  if (clean(row.dropoff_time) && !/^\d{2}:\d{2}$/.test(dropoffTime)) missingFields.push('dropoff_time (use HH:MM)')

  const schedule = weeklySchedule(row)
  if (!Object.values(schedule).some(Boolean)) missingFields.push('weekly schedule (at least one day must be Yes)')

  const secondaryAddress = nullable(row.secondary_pickup_address)
  const secondaryPostcode = nullable(row.secondary_pickup_postcode)
  const secondaryLat = toCoord(row.secondary_pickup_latitude, 'secondary_pickup_latitude', [])
  const secondaryLng = toCoord(row.secondary_pickup_longitude, 'secondary_pickup_longitude', [])
  const hasSecondaryAddress = Boolean(secondaryAddress || secondaryPostcode)
  if (hasSecondaryAddress) {
    if (!secondaryAddress || !secondaryPostcode) {
      missingFields.push('secondary pickup needs both address and postcode')
    }
    toCoord(row.secondary_pickup_latitude, 'secondary_pickup_latitude', missingFields)
    toCoord(row.secondary_pickup_longitude, 'secondary_pickup_longitude', missingFields)
  } else if (secondaryLat != null || secondaryLng != null) {
    missingFields.push('secondary pickup lat/long need address and postcode')
  }

  const respiteAddress = nullable(row.respite_address)
  const respitePostcode = nullable(row.respite_postcode)
  const respiteLat = toCoord(row.respite_latitude, 'respite_latitude', [])
  const respiteLng = toCoord(row.respite_longitude, 'respite_longitude', [])
  const hasRespiteAddress = Boolean(respiteAddress || respitePostcode)
  if (hasRespiteAddress) {
    if (!respiteAddress || !respitePostcode) {
      missingFields.push('respite needs both address and postcode')
    }
    toCoord(row.respite_latitude, 'respite_latitude', missingFields)
    toCoord(row.respite_longitude, 'respite_longitude', missingFields)
  } else if (respiteLat != null || respiteLng != null) {
    missingFields.push('respite lat/long need address and postcode')
  }

  const coords = {
    primaryLat: toCoord(row.primary_pickup_latitude, 'primary_pickup_latitude', []),
    primaryLng: toCoord(row.primary_pickup_longitude, 'primary_pickup_longitude', []),
    eduLat: toCoord(row.educational_site_latitude, 'educational_site_latitude', []),
    eduLng: toCoord(row.educational_site_longitude, 'educational_site_longitude', []),
    secondaryLat: hasSecondaryAddress ? toCoord(row.secondary_pickup_latitude, 'secondary_pickup_latitude', []) : null,
    secondaryLng: hasSecondaryAddress ? toCoord(row.secondary_pickup_longitude, 'secondary_pickup_longitude', []) : null,
    respiteLat: hasRespiteAddress ? toCoord(row.respite_latitude, 'respite_latitude', []) : null,
    respiteLng: hasRespiteAddress ? toCoord(row.respite_longitude, 'respite_longitude', []) : null,
  }

  return {
    excelRow,
    email,
    companyId,
    pickupTime,
    dropoffTime,
    schedule,
    coords,
    missingFields,
    warnings,
    ok: missingFields.length === 0,
  }
}

async function importPassenger(supabase, row, check) {
  const payload = {
    company_id: check.companyId,
    first_name: clean(row.first_name),
    surname: clean(row.last_name),
    email: check.email || null,
    contact_number_1: clean(row.contact_number_1),
    contact_number_2: nullable(row.contact_number_2),
    primary_pickup_address: clean(row.primary_pickup_address),
    primary_pickup_postcode: clean(row.primary_pickup_postcode),
    primary_pickup_latitude: toCoordText(check.coords.primaryLat),
    primary_pickup_longitude: toCoordText(check.coords.primaryLng),
    primary_pickup_time: check.pickupTime,
    educational_site_address: clean(row.educational_site_address),
    educational_site_postcode: clean(row.educational_site_postcode),
    educational_site_latitude: toCoordText(check.coords.eduLat),
    educational_site_longitude: toCoordText(check.coords.eduLng),
    educational_site_dropoff_time: check.dropoffTime,
    wheelchair_required: toYesNo(row.wheelchair_required),
    harness_required: toYesNo(row.harness_required),
    notes: nullable(row.notes),
    weekly_schedule: check.schedule,
    status: 'active',
  }

  const { data: passenger, error } = await supabase
    .from('passenger')
    .insert(payload)
    .select('id, email, status, primary_pickup_latitude, primary_pickup_longitude, educational_site_latitude, educational_site_longitude')
    .single()
  if (error) throw error

  const locationInserts = []
  if (nullable(row.secondary_pickup_address) && nullable(row.secondary_pickup_postcode)) {
    locationInserts.push({
      passenger_id: passenger.id,
      location_type: 'secondary_pickup',
      address: clean(row.secondary_pickup_address),
      postcode: clean(row.secondary_pickup_postcode),
      latitude: check.coords.secondaryLat,
      longitude: check.coords.secondaryLng,
    })
  }
  if (nullable(row.respite_address) && nullable(row.respite_postcode)) {
    locationInserts.push({
      passenger_id: passenger.id,
      location_type: 'respite',
      address: clean(row.respite_address),
      postcode: clean(row.respite_postcode),
      latitude: check.coords.respiteLat,
      longitude: check.coords.respiteLng,
    })
  }
  if (locationInserts.length) {
    const { error: locErr } = await supabase.from('passenger_locations').insert(locationInserts)
    if (locErr) {
      await supabase.from('passenger').delete().eq('id', passenger.id)
      throw locErr
    }
  }

  return {
    status: 'imported',
    excelRow: check.excelRow,
    email: passenger.email,
    passengerId: passenger.id,
    passengerStatus: passenger.status,
    wheelchair: payload.wheelchair_required,
    harness: payload.harness_required,
    extraLocations: locationInserts.map((l) => l.location_type),
    coords: {
      primary: [passenger.primary_pickup_latitude, passenger.primary_pickup_longitude],
      educational: [passenger.educational_site_latitude, passenger.educational_site_longitude],
      extra: locationInserts.map((l) => ({ type: l.location_type, lat: l.latitude, lng: l.longitude })),
    },
    scheduleDays: DAY_KEYS.filter((d) => check.schedule[d]),
  }
}

async function main() {
  const rows = readExcelRows()
  const checks = rows.map((row, index) => ({ row, check: validateRow(row, index) }))
  const companyIds = [...new Set(checks.map(({ check }) => check.companyId).filter(Boolean))]
  console.log(`Excel: ${EXCEL_PATH}`)
  console.log(`Passengers in sheet: ${rows.length}`)
  console.log(`Company id(s): ${companyIds.join(', ') || '(missing)'}`)
  console.log('')

  const missingReport = []
  for (const { check } of checks) {
    if (!check.ok) {
      missingReport.push(check)
      console.log(`ROW ${check.excelRow}  ${check.email || '(no email)'}  INCOMPLETE`)
      console.log(`  Missing: ${check.missingFields.join(', ')}`)
    } else {
      console.log(`ROW ${check.excelRow}  ${check.email}  ready`)
    }
  }
  console.log('')

  const supabase = createAdminClient()
  if (companyIds.length !== 1) throw new Error('Every row must use the same real company_id.')
  const companyId = companyIds[0]
  const { data: company, error: companyErr } = await supabase
    .from('companies').select('id, company_name, status').eq('id', companyId).maybeSingle()
  if (companyErr) throw companyErr
  if (!company) throw new Error(`Company not found in DB: ${companyId}`)
  console.log(`Company: ${company.company_name} (${company.status})`)
  console.log('')

  const results = []
  for (const { row, check } of checks) {
    if (!check.ok) {
      results.push({
        status: 'skipped_missing_data',
        excelRow: check.excelRow,
        email: check.email,
        missingFields: check.missingFields,
      })
      continue
    }
    if (check.email) {
      const { data: existing } = await supabase
        .from('passenger')
        .select('id, status')
        .eq('company_id', companyId)
        .ilike('email', check.email)
        .limit(1)
      if (existing?.[0]?.id) {
        console.log(`SKIP ${check.email} — already exists (${existing[0].id})`)
        results.push({ status: 'skipped_exists', excelRow: check.excelRow, email: check.email, existing: existing[0] })
        continue
      }
    }
    try {
      const imported = await importPassenger(supabase, row, check)
      console.log(
        `OK  ${imported.email}  status=${imported.passengerStatus}  days=${imported.scheduleDays.join(',')}  extra=${imported.extraLocations.join(',') || 'none'}  primary=${imported.coords.primary.join(',')}`,
      )
      results.push(imported)
    } catch (err) {
      const message = err?.message || String(err)
      console.log(`FAIL ${check.email} — ${message}`)
      results.push({ status: 'failed', excelRow: check.excelRow, email: check.email, error: message })
    }
  }

  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`)
  console.log('')
  console.log(`Results written to ${RESULTS_PATH}`)
  const imported = results.filter((r) => r.status === 'imported')
  const failed = results.filter((r) => r.status === 'failed')
  const skipped = results.filter((r) => r.status.startsWith('skipped'))
  console.log(`Imported ${imported.length}, skipped ${skipped.length}, failed ${failed.length}`)
  if (failed.length || missingReport.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
