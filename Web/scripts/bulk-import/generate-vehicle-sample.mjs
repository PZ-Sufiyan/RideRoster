import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SAMPLE_DIR = path.join(__dirname, 'vehicle-sample')
const DRIVER_CONFIG_PATH = path.join(__dirname, 'sample', 'config.json')
const CONFIG_PATH = path.join(SAMPLE_DIR, 'config.json')
const DOCS_DIR = path.join(SAMPLE_DIR, 'documents', 'vehicles')
const DUMMY_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const FALLBACK_COMPANY_ID = '85ea09ec-9051-4126-a680-07e5aacbe5fc'

const REQUIRED_DOC_FILES = [
  'vehicle_photo.png',
  'v5_front.png',
  'v5_inside.png',
  'mot_certificate.png',
  'taxi_license_plate.png',
  'insurance_certificate.png',
]

const REQUIRED_DOC_COLUMNS = [
  ['vehicle_photo', 'Vehicle photo', 'vehicle_photo.png', ''],
  ['v5_front', 'V5 (Front)', 'v5_front.png', ''],
  ['v5_inside', 'V5 (Inside)', 'v5_inside.png', ''],
  ['mot_certificate', 'MOT certificate', 'mot_certificate.png', 'mot_expiry'],
  ['taxi_license_plate', 'Taxi license plate document', 'taxi_license_plate.png', 'taxi_plate_expiry'],
  ['insurance_certificate', 'Insurance certificate', 'insurance_certificate.png', 'insurance_expiry'],
]

const DUMMY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

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
const REQUIRED_DOC_FIELDS = Object.fromEntries(
  REQUIRED_DOC_COLUMNS.map(([key, , fileName]) => [key, fileName]),
)

const VEHICLES = [
  {
    company_id: COMPANY_ID,
    taxi_license_plate_number: 'MAN TAXI 01',
    registration_number: 'AB12CDE',
    make: 'Ford',
    model: 'Focus',
    vehicle_colour: 'White',
    year_of_first_registration: '2019-03-01',
    licensing_type: 'Nottingham City Council',
    body_style: 'Car - 4 seater',
    seating_capacity: 4,
    wheelchair_accessible: 'No',
    mot_expiry: '2027-06-15',
    taxi_plate_expiry: '2027-11-01',
    insurance_expiry: '2027-01-20',
  },
  {
    company_id: COMPANY_ID,
    taxi_license_plate_number: 'MAN TAXI 02',
    registration_number: 'FG34HIJ',
    make: 'Vauxhall',
    model: 'Zafira',
    vehicle_colour: 'Silver',
    year_of_first_registration: '2020-07-12',
    licensing_type: 'Nottingham City Council',
    body_style: 'People Carrier - 6 passenger',
    seating_capacity: 6,
    wheelchair_accessible: 'No',
    mot_expiry: '2027-03-10',
    taxi_plate_expiry: '2027-04-22',
    insurance_expiry: '2027-09-01',
  },
  {
    company_id: COMPANY_ID,
    taxi_license_plate_number: 'MAN TAXI 03',
    registration_number: 'KL56MNO',
    make: 'Ford',
    model: 'Transit',
    vehicle_colour: 'Blue',
    year_of_first_registration: '2018-11-20',
    licensing_type: 'Nottingham City Council',
    body_style: 'Minibus - Wheelchair ramp',
    seating_capacity: 8,
    wheelchair_accessible: 'Yes',
    mot_expiry: '2027-12-01',
    taxi_plate_expiry: '2027-08-15',
    insurance_expiry: '2027-02-28',
  },
  {
    company_id: COMPANY_ID,
    taxi_license_plate_number: 'MAN TAXI 04',
    registration_number: 'PQ78RST',
    make: 'LEVC',
    model: 'TX',
    vehicle_colour: 'Black',
    year_of_first_registration: '2021-01-18',
    licensing_type: 'Nottingham City Council',
    body_style: 'Hackney - Wheelchair',
    seating_capacity: 5,
    wheelchair_accessible: 'Yes',
    mot_expiry: '2027-01-18',
    taxi_plate_expiry: '2027-07-09',
    insurance_expiry: '2027-10-12',
  },
]

function withFolder(row) {
  return {
    ...row,
    ...REQUIRED_DOC_FIELDS,
    documents_folder: `documents/vehicles/${row.registration_number}`,
  }
}

function writeDummyPng(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, DUMMY_PNG)
}

function writeDocumentFolders() {
  for (const vehicle of VEHICLES) {
    const folder = path.join(DOCS_DIR, vehicle.registration_number)
    fs.mkdirSync(folder, { recursive: true })
    for (const fileName of REQUIRED_DOC_FILES) {
      writeDummyPng(path.join(folder, fileName))
    }
  }
}

function autosize(worksheet, rows) {
  const keys = Object.keys(rows[0] || {})
  worksheet['!cols'] = keys.map((key) => {
    const maxLen = Math.max(key.length, ...rows.map((row) => String(row[key] ?? '').length))
    return { wch: Math.min(Math.max(maxLen + 2, 12), 48) }
  })
}

function writeExcel() {
  const rows = VEHICLES.map(withFolder)
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(rows)
  autosize(sheet, rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Vehicles')

  const requiredDocs = [
    ['Document', 'Excel file column', 'File name in folder', 'Expiry column', 'Required'],
    ...REQUIRED_DOC_COLUMNS.map(([column, label, fileName, expiry]) => [
      label, column, fileName, expiry || '—', 'Yes',
    ]),
  ]
  const requiredSheet = XLSX.utils.aoa_to_sheet(requiredDocs)
  requiredSheet['!cols'] = [{ wch: 34 }, { wch: 28 }, { wch: 32 }, { wch: 22 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, requiredSheet, 'Required_Documents')

  const bodyStyles = [
    ['body_style must match one of these exactly'],
    ['Car - 4 seater'],
    ['People Carrier - 6 passenger'],
    ['People Carrier - 7 passenger'],
    ['Minibus - 8 passenger'],
    ['Minibus - Wheelchair ramp'],
    ['Minibus - Wheelchair tail lift'],
    ['Hackney - 5 passenger'],
    ['Hackney - 6 passenger'],
    ['Hackney - Wheelchair'],
  ]
  const typesSheet = XLSX.utils.aoa_to_sheet(bodyStyles)
  typesSheet['!cols'] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, typesSheet, 'Vehicle_Types')

  const instructions = [
    ['RideRoster bulk vehicle template (dummy data — test only)'],
    [''],
    ['company_id', COMPANY_ID],
    ['1', 'One vehicle per row. Keep the header row.'],
    ['2', 'Dates must be YYYY-MM-DD. Sample expiries are in 2027.'],
    ['3', 'body_style must match the Vehicle_Types sheet exactly.'],
    ['4', 'wheelchair_accessible: Yes or No. Must match the body_style (wheelchair types = Yes).'],
    ['5', 'Folder name = registration_number, e.g. documents/vehicles/AB12CDE/'],
    ['6', 'Required files: vehicle_photo, v5_front, v5_inside, mot_certificate, taxi_license_plate, insurance_certificate.'],
    [''],
    ['Sample vehicles'],
    ['AB12CDE', 'Car — not wheelchair'],
    ['FG34HIJ', 'People Carrier — not wheelchair'],
    ['KL56MNO', 'Minibus wheelchair ramp'],
    ['PQ78RST', 'Hackney wheelchair'],
  ]
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 42 }, { wch: 100 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

  const xlsxPath = path.join(SAMPLE_DIR, 'Vehicles.xlsx')
  XLSX.writeFile(workbook, xlsxPath)
  return xlsxPath
}

function writeConfig() {
  fs.writeFileSync(
    CONFIG_PATH,
    `${JSON.stringify({
      company_id: COMPANY_ID,
      dummy: COMPANY_ID === DUMMY_COMPANY_ID,
      vehicles_excel: 'Vehicles.xlsx',
      documents_root: 'documents/vehicles',
    }, null, 2)}\n`,
  )
  return CONFIG_PATH
}

fs.mkdirSync(SAMPLE_DIR, { recursive: true })
writeDocumentFolders()
console.log(`Wrote ${writeExcel()}`)
console.log(`Wrote ${writeConfig()}`)
console.log(`Wrote 4 vehicle folders under ${DOCS_DIR}`)
console.log(`company_id: ${COMPANY_ID}`)
