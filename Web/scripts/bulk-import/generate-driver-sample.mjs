import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SAMPLE_DIR = path.join(__dirname, 'sample')
const CONFIG_PATH = path.join(SAMPLE_DIR, 'config.json')
const DOCS_DIR = path.join(SAMPLE_DIR, 'documents', 'drivers')
const DUMMY_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const FALLBACK_COMPANY_ID = '85ea09ec-9051-4126-a680-07e5aacbe5fc'

const REQUIRED_DOC_FILES = [
  'profile.png',
  'driving_license_front.png',
  'driving_license_back.png',
  'taxi_badge_front.png',
  'taxi_badge_back.png',
  'dbs_certificate_front.png',
  'dbs_certificate_back.png',
  'safeguarding_certificate.png',
]

const REQUIRED_DOC_COLUMNS = [
  ['driving_license_front', 'Driving License (Front)', 'driving_license_front.png', 'license_expiry'],
  ['driving_license_back', 'Driving License (Back)', 'driving_license_back.png', 'license_expiry'],
  ['taxi_badge_front', 'Taxi Badge (Front)', 'taxi_badge_front.png', 'taxi_badge_expiry'],
  ['taxi_badge_back', 'Taxi Badge (Back)', 'taxi_badge_back.png', 'taxi_badge_expiry'],
  ['dbs_certificate_front', 'DBS Certificate (Front)', 'dbs_certificate_front.png', 'dbs_expiry'],
  ['dbs_certificate_back', 'DBS Certificate (Back)', 'dbs_certificate_back.png', 'dbs_expiry'],
  ['safeguarding_certificate', 'Safeguarding Certificate', 'safeguarding_certificate.png', 'safeguarding_expiry'],
]

const DUMMY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function readCompanyId() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    const id = String(config.company_id || '').trim()
    if (id && id !== DUMMY_COMPANY_ID) return id
  } catch {
    /* use fallback */
  }
  return FALLBACK_COMPANY_ID
}

const COMPANY_ID = readCompanyId()

const REQUIRED_DOC_FIELDS = Object.fromEntries(
  REQUIRED_DOC_COLUMNS.map(([key, , fileName]) => [key, fileName]),
)

const DRIVERS = [
  {
    company_id: COMPANY_ID,
    first_name: 'Ahmed',
    last_name: 'Khan',
    email: 'ahmed.khan@gmail.com',
    phone: '+447700900101',
    password: 'Driver@101',
    residential_address: '12 High Street, Manchester, M1 1AA',
    emergency_contact_name: 'Sara Khan',
    emergency_contact_phone: '+447700900201',
    nationality: 'British',
    right_to_work_code: '',
    passport_number: '',
    license_no: 'KHAN123456',
    dbs_service_update_id: '001234567890',
    license_expiry: '2027-06-15',
    taxi_badge_expiry: '2027-11-01',
    dbs_expiry: '2027-01-20',
    safeguarding_expiry: '2027-08-15',
    extra_docs: [],
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Fatima',
    last_name: 'Ali',
    email: 'fatima.ali@gmail.com',
    phone: '+447700900102',
    password: 'Driver@102',
    residential_address: '44 Oxford Road, Birmingham, B1 2AA',
    emergency_contact_name: 'Hassan Ali',
    emergency_contact_phone: '+447700900202',
    nationality: 'Pakistani',
    right_to_work_code: 'RTW-PAK-778899',
    passport_number: 'AB1234567',
    license_no: 'ALI654321',
    dbs_service_update_id: '001234567891',
    license_expiry: '2027-03-10',
    taxi_badge_expiry: '2027-04-22',
    dbs_expiry: '2027-09-01',
    safeguarding_expiry: '2027-07-12',
    extra_docs: ['passport.png'],
  },
  {
    company_id: COMPANY_ID,
    first_name: 'James',
    last_name: 'Wilson',
    email: 'james.wilson@gmail.com',
    phone: '+447700900103',
    password: 'Driver@103',
    residential_address: '8 Queen Street, Leeds, LS1 4AA',
    emergency_contact_name: 'Emily Wilson',
    emergency_contact_phone: '+447700900203',
    nationality: 'British',
    right_to_work_code: '',
    passport_number: '',
    license_no: 'WIL789012',
    dbs_service_update_id: '001234567892',
    license_expiry: '2027-12-01',
    taxi_badge_expiry: '2027-08-15',
    dbs_expiry: '2027-02-28',
    safeguarding_expiry: '2027-05-30',
    extra_docs: [],
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria.santos@gmail.com',
    phone: '+447700900104',
    password: 'Driver@104',
    residential_address: '21 King Street, Bristol, BS1 4DJ',
    emergency_contact_name: 'Pedro Santos',
    emergency_contact_phone: '+447700900204',
    nationality: 'Portuguese',
    right_to_work_code: 'RTW-PRT-445566',
    passport_number: '',
    license_no: 'SAN345678',
    dbs_service_update_id: '001234567893',
    license_expiry: '2027-01-18',
    taxi_badge_expiry: '2027-07-09',
    dbs_expiry: '2027-10-12',
    safeguarding_expiry: '2027-09-20',
    extra_docs: [],
  },
]

function withFolder(driver) {
  const { extra_docs, ...row } = driver
  return {
    ...row,
    ...REQUIRED_DOC_FIELDS,
    documents_folder: `documents/drivers/${driver.email}`,
    extra_docs,
  }
}

function writeDummyPng(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, DUMMY_PNG)
}

function writeDocumentFolders() {
  for (const driver of DRIVERS) {
    const folder = path.join(DOCS_DIR, driver.email)
    fs.mkdirSync(folder, { recursive: true })
    for (const fileName of REQUIRED_DOC_FILES) {
      writeDummyPng(path.join(folder, fileName))
    }
    for (const fileName of driver.extra_docs) {
      writeDummyPng(path.join(folder, fileName))
    }
  }
}

function autosize(worksheet, rows) {
  const keys = Object.keys(rows[0] || {})
  worksheet['!cols'] = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((row) => String(row[key] ?? '').length),
    )
    return { wch: Math.min(Math.max(maxLen + 2, 12), 48) }
  })
}

function writeExcel() {
  const rows = DRIVERS.map((driver) => {
    const row = withFolder(driver)
    delete row.extra_docs
    return row
  })

  const workbook = XLSX.utils.book_new()

  const driversSheet = XLSX.utils.json_to_sheet(rows)
  autosize(driversSheet, rows)
  XLSX.utils.book_append_sheet(workbook, driversSheet, 'Drivers')

  const requiredDocs = [
    ['Document', 'Excel file column', 'File name in folder', 'Expiry column', 'Required'],
    ...REQUIRED_DOC_COLUMNS.map(([column, label, fileName, expiry]) => [
      label,
      column,
      fileName,
      expiry,
      'Yes',
    ]),
  ]
  const requiredSheet = XLSX.utils.aoa_to_sheet(requiredDocs)
  requiredSheet['!cols'] = [{ wch: 32 }, { wch: 28 }, { wch: 34 }, { wch: 22 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, requiredSheet, 'Required_Documents')

  const instructions = [
    ['RideRoster bulk driver template'],
    [''],
    ['company_id', COMPANY_ID],
    [''],
    ['How to fill'],
    ['1', 'Keep the header row. One driver per row.'],
    ['2', 'Dates must be YYYY-MM-DD. All sample expiry dates are in 2027.'],
    ['3', 'Email must be unique. It becomes the login email.'],
    ['4', 'Password min 6 characters.'],
    ['5', 'British drivers: nationality = British, leave right_to_work_code empty.'],
    ['6', 'Other nationality: fill nationality AND right_to_work_code.'],
    ['7', 'passport_number is optional. If filled, also put passport.png in that driver folder.'],
    ['8', 'These 7 documents are required for every driver: Driving License (Front/Back), Taxi Badge (Front/Back), DBS Certificate (Front/Back), Safeguarding Certificate.'],
    [''],
    ['Document folder'],
    ['Path', 'documents/drivers/<driver-email>/'],
    ['Required files', REQUIRED_DOC_FILES.filter((name) => name !== 'profile.png').join(', ')],
    ['Also required', 'profile.png'],
    ['Optional files', 'passport.png'],
    ['Accepted types', 'PNG, JPG, PDF'],
    [''],
    ['Sample drivers in this file'],
    ['Ahmed Khan', 'British — no right to work code'],
    ['Fatima Ali', 'Pakistani — right to work + passport'],
    ['James Wilson', 'British'],
    ['Maria Santos', 'Portuguese — right to work, no passport'],
  ]
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 42 }, { wch: 108 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

  const xlsxPath = path.join(SAMPLE_DIR, 'Drivers.xlsx')
  XLSX.writeFile(workbook, xlsxPath)
  return xlsxPath
}

function writeConfig() {
  fs.writeFileSync(
    CONFIG_PATH,
    `${JSON.stringify(
      {
        company_id: COMPANY_ID,
        dummy: COMPANY_ID === DUMMY_COMPANY_ID,
        note: 'company_id is also written onto each Drivers.xlsx row.',
        drivers_excel: 'Drivers.xlsx',
        documents_root: 'documents/drivers',
      },
      null,
      2,
    )}\n`,
  )
  return CONFIG_PATH
}

fs.mkdirSync(SAMPLE_DIR, { recursive: true })
writeDocumentFolders()
const xlsxPath = writeExcel()
const configPath = writeConfig()

console.log(`Wrote ${xlsxPath}`)
console.log(`Wrote ${configPath}`)
console.log(`Wrote 4 driver folders under ${DOCS_DIR}`)
console.log(`company_id: ${COMPANY_ID}`)
