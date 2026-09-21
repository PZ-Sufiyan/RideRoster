import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SAMPLE_DIR = path.join(__dirname, 'passenger-sample')
const DRIVER_CONFIG_PATH = path.join(__dirname, 'sample', 'config.json')
const CONFIG_PATH = path.join(SAMPLE_DIR, 'config.json')
const DUMMY_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const FALLBACK_COMPANY_ID = '85ea09ec-9051-4126-a680-07e5aacbe5fc'

function readCompanyId() {
  for (const filePath of [CONFIG_PATH, DRIVER_CONFIG_PATH]) {
    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      const id = String(config.company_id || '').trim()
      if (id && id !== DUMMY_COMPANY_ID) return id
    } catch {
      /* try next */
    }
  }
  return FALLBACK_COMPANY_ID
}

const COMPANY_ID = readCompanyId()

const PASSENGERS = [
  {
    company_id: COMPANY_ID,
    first_name: 'Oliver',
    last_name: 'Wright',
    email: 'oliver.wright@gmail.com',
    contact_number_1: '+447700900501',
    contact_number_2: '',
    primary_pickup_address: '10 King Street, Manchester',
    primary_pickup_postcode: 'M2 6AW',
    primary_pickup_latitude: 53.4812829,
    primary_pickup_longitude: -2.2472267,
    pickup_time: '07:30',
    educational_site_address: 'Manchester Grammar School, Old Hall Lane',
    educational_site_postcode: 'M13 0XT',
    educational_site_latitude: 53.4478989,
    educational_site_longitude: -2.2121852,
    dropoff_time: '15:15',
    wheelchair_required: 'No',
    harness_required: 'No',
    notes: 'Weekdays only. Dummy test passenger.',
    schedule_mon: 'Yes',
    schedule_tue: 'Yes',
    schedule_wed: 'Yes',
    schedule_thu: 'Yes',
    schedule_fri: 'Yes',
    schedule_sat: 'No',
    schedule_sun: 'No',
    secondary_pickup_address: '',
    secondary_pickup_postcode: '',
    respite_address: '',
    respite_postcode: '',
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Amelia',
    last_name: 'Hughes',
    email: 'amelia.hughes@gmail.com',
    contact_number_1: '+447700900502',
    contact_number_2: '+447700900602',
    primary_pickup_address: '22 Corporation Street, Birmingham',
    primary_pickup_postcode: 'B2 4RN',
    primary_pickup_latitude: 52.4793751,
    primary_pickup_longitude: -1.8976384,
    pickup_time: '08:00',
    educational_site_address: 'King Edward VI School, Edgbaston Park Road',
    educational_site_postcode: 'B15 2UA',
    educational_site_latitude: 52.4509341,
    educational_site_longitude: -1.9258011,
    dropoff_time: '15:45',
    wheelchair_required: 'Yes',
    harness_required: 'No',
    notes: 'Wheelchair required. Dummy test passenger.',
    schedule_mon: 'Yes',
    schedule_tue: 'Yes',
    schedule_wed: 'Yes',
    schedule_thu: 'Yes',
    schedule_fri: 'Yes',
    schedule_sat: 'No',
    schedule_sun: 'No',
    secondary_pickup_address: '',
    secondary_pickup_postcode: '',
    respite_address: '',
    respite_postcode: '',
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Noah',
    last_name: 'Patel',
    email: 'noah.patel@gmail.com',
    contact_number_1: '+447700900503',
    contact_number_2: '',
    primary_pickup_address: '8 Park Row, Leeds',
    primary_pickup_postcode: 'LS1 5HD',
    primary_pickup_latitude: 53.7984138,
    primary_pickup_longitude: -1.5470586,
    pickup_time: '07:45',
    educational_site_address: 'Roundhay School, Gledhow Lane',
    educational_site_postcode: 'LS8 1ND',
    educational_site_latitude: 53.8305339,
    educational_site_longitude: -1.5103536,
    dropoff_time: '15:30',
    wheelchair_required: 'No',
    harness_required: 'Yes',
    notes: 'Harness required. Dummy test passenger.',
    schedule_mon: 'Yes',
    schedule_tue: 'No',
    schedule_wed: 'Yes',
    schedule_thu: 'No',
    schedule_fri: 'Yes',
    schedule_sat: 'No',
    schedule_sun: 'No',
    secondary_pickup_address: '',
    secondary_pickup_postcode: '',
    respite_address: '',
    respite_postcode: '',
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Isla',
    last_name: 'Bennett',
    email: 'isla.bennett@gmail.com',
    contact_number_1: '+447700900504',
    contact_number_2: '+447700900604',
    primary_pickup_address: '16 Queen Square, Bristol',
    primary_pickup_postcode: 'BS1 4ND',
    primary_pickup_latitude: 51.4505076,
    primary_pickup_longitude: -2.5932304,
    pickup_time: '08:15',
    educational_site_address: 'Bristol Grammar School, University Road',
    educational_site_postcode: 'BS8 1SR',
    educational_site_latitude: 51.4578031,
    educational_site_longitude: -2.6056574,
    dropoff_time: '16:00',
    wheelchair_required: 'No',
    harness_required: 'No',
    notes: 'Has secondary pickup and respite. Dummy test passenger.',
    schedule_mon: 'Yes',
    schedule_tue: 'Yes',
    schedule_wed: 'Yes',
    schedule_thu: 'Yes',
    schedule_fri: 'Yes',
    schedule_sat: 'Yes',
    schedule_sun: 'No',
    secondary_pickup_address: '4 College Green, Bristol',
    secondary_pickup_postcode: 'BS1 5TB',
    secondary_pickup_latitude: 51.4524989,
    secondary_pickup_longitude: -2.5997766,
    respite_address: 'Southmead Hospital, Southmead Road',
    respite_postcode: 'BS10 5NB',
    respite_latitude: 51.4969164,
    respite_longitude: -2.5914217,
  },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocode(address, postcode) {
  const query = `${address}, ${postcode}, UK`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'RideRoster-bulk-import' } })
  if (!res.ok) throw new Error(`Geocode failed for ${query}: HTTP ${res.status}`)
  const data = await res.json()
  if (!data.length) throw new Error(`No geocode result for ${query}`)
  return {
    latitude: Number(Number(data[0].lat).toFixed(7)),
    longitude: Number(Number(data[0].lon).toFixed(7)),
  }
}

function hasCoord(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

async function fillCoordinates(passengers) {
  const cache = new Map()
  const rows = []
  for (const passenger of passengers) {
    const row = { ...passenger }
    const pairs = [
      ['primary_pickup', row.primary_pickup_address, row.primary_pickup_postcode],
      ['educational_site', row.educational_site_address, row.educational_site_postcode],
      ['secondary_pickup', row.secondary_pickup_address, row.secondary_pickup_postcode],
      ['respite', row.respite_address, row.respite_postcode],
    ]
    for (const [prefix, address, postcode] of pairs) {
      if (!String(address || '').trim() || !String(postcode || '').trim()) {
        if (!hasCoord(row[`${prefix}_latitude`])) row[`${prefix}_latitude`] = ''
        if (!hasCoord(row[`${prefix}_longitude`])) row[`${prefix}_longitude`] = ''
        continue
      }
      if (hasCoord(row[`${prefix}_latitude`]) && hasCoord(row[`${prefix}_longitude`])) continue
      const key = `${address}|${postcode}`.toLowerCase()
      if (!cache.has(key)) {
        console.log(`Geocoding ${address}, ${postcode}`)
        cache.set(key, await geocode(address, postcode))
        await sleep(1100)
      }
      const coords = cache.get(key)
      row[`${prefix}_latitude`] = coords.latitude
      row[`${prefix}_longitude`] = coords.longitude
    }
    rows.push(orderRow(row))
  }
  return rows
}

function orderRow(row) {
  return {
    company_id: row.company_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    contact_number_1: row.contact_number_1,
    contact_number_2: row.contact_number_2,
    primary_pickup_address: row.primary_pickup_address,
    primary_pickup_postcode: row.primary_pickup_postcode,
    primary_pickup_latitude: row.primary_pickup_latitude,
    primary_pickup_longitude: row.primary_pickup_longitude,
    pickup_time: row.pickup_time,
    educational_site_address: row.educational_site_address,
    educational_site_postcode: row.educational_site_postcode,
    educational_site_latitude: row.educational_site_latitude,
    educational_site_longitude: row.educational_site_longitude,
    dropoff_time: row.dropoff_time,
    wheelchair_required: row.wheelchair_required,
    harness_required: row.harness_required,
    notes: row.notes,
    schedule_mon: row.schedule_mon,
    schedule_tue: row.schedule_tue,
    schedule_wed: row.schedule_wed,
    schedule_thu: row.schedule_thu,
    schedule_fri: row.schedule_fri,
    schedule_sat: row.schedule_sat,
    schedule_sun: row.schedule_sun,
    secondary_pickup_address: row.secondary_pickup_address,
    secondary_pickup_postcode: row.secondary_pickup_postcode,
    secondary_pickup_latitude: row.secondary_pickup_latitude,
    secondary_pickup_longitude: row.secondary_pickup_longitude,
    respite_address: row.respite_address,
    respite_postcode: row.respite_postcode,
    respite_latitude: row.respite_latitude,
    respite_longitude: row.respite_longitude,
  }
}

function autosize(worksheet, rows) {
  const keys = Object.keys(rows[0] || {})
  worksheet['!cols'] = keys.map((key) => {
    const maxLen = Math.max(key.length, ...rows.map((row) => String(row[key] ?? '').length))
    return { wch: Math.min(Math.max(maxLen + 2, 12), 42) }
  })
}

function writeExcel(rows) {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(rows)
  autosize(sheet, rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Passengers')

  const instructions = [
    ['RideRoster bulk passenger template'],
    [''],
    ['company_id', COMPANY_ID],
    ['Passengers have no login and no document folder.'],
    [''],
    ['Required'],
    ['1', 'One passenger per row. Keep the header row.'],
    ['2', 'Times must be HH:MM (example: 07:30).'],
    ['3', 'At least one schedule day must be Yes (schedule_mon … schedule_sun).'],
    ['4', 'wheelchair_required and harness_required: Yes or No.'],
    ['5', 'Primary pickup AND educational site must include latitude and longitude.'],
    ['6', 'If secondary pickup or respite is filled, include that address, postcode, latitude and longitude.'],
    [''],
    ['Optional'],
    ['contact_number_2', 'Second phone number'],
    ['notes', 'Any extra notes'],
    ['secondary_pickup_*', 'All four fields together, or leave all empty'],
    ['respite_*', 'All four fields together, or leave all empty'],
    [''],
    ['Sample passengers'],
    ['Oliver Wright', 'Weekdays, no wheelchair, no harness'],
    ['Amelia Hughes', 'Wheelchair required'],
    ['Noah Patel', 'Harness required, Mon/Wed/Fri'],
    ['Isla Bennett', 'Secondary pickup + respite, includes Saturday'],
  ]
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 42 }, { wch: 90 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

  const xlsxPath = path.join(SAMPLE_DIR, 'Passengers.xlsx')
  XLSX.writeFile(workbook, xlsxPath)
  return xlsxPath
}

function writeConfig() {
  fs.writeFileSync(
    CONFIG_PATH,
    `${JSON.stringify({
      company_id: COMPANY_ID,
      dummy: COMPANY_ID === DUMMY_COMPANY_ID,
      passengers_excel: 'Passengers.xlsx',
    }, null, 2)}\n`,
  )
  return CONFIG_PATH
}

const rows = await fillCoordinates(PASSENGERS)
fs.mkdirSync(SAMPLE_DIR, { recursive: true })
console.log(`Wrote ${writeExcel(rows)}`)
console.log(`Wrote ${writeConfig()}`)
console.log(`company_id: ${COMPANY_ID}`)
