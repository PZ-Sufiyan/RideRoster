import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SAMPLE_DIR = path.join(__dirname, 'pa-sample')
const DRIVER_CONFIG_PATH = path.join(__dirname, 'sample', 'config.json')
const CONFIG_PATH = path.join(SAMPLE_DIR, 'config.json')
const DOCS_DIR = path.join(SAMPLE_DIR, 'documents', 'pas')
const DUMMY_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const FALLBACK_COMPANY_ID = '85ea09ec-9051-4126-a680-07e5aacbe5fc'

const REQUIRED_DOC_FILES = [
  'profile.png',
  'safeguarding_certificate.png',
  'background_check.png',
  'first_aid_certificate.png',
]

const REQUIRED_DOC_COLUMNS = [
  ['safeguarding_certificate', 'Safeguarding Certificate', 'safeguarding_certificate.png', 'safeguarding_expiry'],
  ['background_check', 'Background Check Certificate', 'background_check.png', ''],
  ['first_aid_certificate', 'First Aid Certification', 'first_aid_certificate.png', ''],
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

const PAS = [
  {
    company_id: COMPANY_ID,
    first_name: 'Aisha',
    last_name: 'Khan',
    email: 'aisha.khan@gmail.com',
    phone: '+447700900301',
    password: 'Pa@101',
    residential_address: '5 Chapel Street, Manchester, M3 1AA',
    emergency_contact_name: 'Omar Khan',
    emergency_contact_phone: '+447700900401',
    nationality: 'British',
    right_to_work_code: '',
    passport_number: '',
    safeguarding_expiry: '2027-06-15',
    extra_docs: [],
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Nora',
    last_name: 'Ahmed',
    email: 'nora.ahmed@gmail.com',
    phone: '+447700900302',
    password: 'Pa@102',
    residential_address: '19 Broad Street, Birmingham, B1 2HB',
    emergency_contact_name: 'Yusuf Ahmed',
    emergency_contact_phone: '+447700900402',
    nationality: 'Pakistani',
    right_to_work_code: 'RTW-PAK-112233',
    passport_number: 'PK9988776',
    safeguarding_expiry: '2027-03-10',
    extra_docs: ['passport.png'],
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Tom',
    last_name: 'Baker',
    email: 'tom.baker@gmail.com',
    phone: '+447700900303',
    password: 'Pa@103',
    residential_address: '7 Park Row, Leeds, LS1 5HD',
    emergency_contact_name: 'Helen Baker',
    emergency_contact_phone: '+447700900403',
    nationality: 'British',
    right_to_work_code: '',
    passport_number: '',
    safeguarding_expiry: '2027-12-01',
    extra_docs: [],
  },
  {
    company_id: COMPANY_ID,
    first_name: 'Lucia',
    last_name: 'Costa',
    email: 'lucia.costa@gmail.com',
    phone: '+447700900304',
    password: 'Pa@104',
    residential_address: '14 Queen Square, Bristol, BS1 4LH',
    emergency_contact_name: 'Marco Costa',
    emergency_contact_phone: '+447700900404',
    nationality: 'Portuguese',
    right_to_work_code: 'RTW-PRT-778899',
    passport_number: '',
    safeguarding_expiry: '2027-09-20',
    extra_docs: [],
  },
]

function withFolder(row) {
  const { extra_docs, ...rest } = row
  return {
    ...rest,
    ...REQUIRED_DOC_FIELDS,
    documents_folder: `documents/pas/${row.email}`,
    extra_docs,
  }
}

function writeDummyPng(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, DUMMY_PNG)
}

function writeDocumentFolders() {
  for (const pa of PAS) {
    const folder = path.join(DOCS_DIR, pa.email)
    fs.mkdirSync(folder, { recursive: true })
    for (const fileName of REQUIRED_DOC_FILES) {
      writeDummyPng(path.join(folder, fileName))
    }
    for (const fileName of pa.extra_docs) {
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
  const rows = PAS.map((pa) => {
    const row = withFolder(pa)
    delete row.extra_docs
    return row
  })

  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(rows)
  autosize(sheet, rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'PAs')

  const requiredDocs = [
    ['Document', 'Excel file column', 'File name in folder', 'Expiry column', 'Required'],
    ['Profile photo', '—', 'profile.png', '—', 'Yes'],
    ...REQUIRED_DOC_COLUMNS.map(([column, label, fileName, expiry]) => [
      label,
      column,
      fileName,
      expiry || '—',
      'Yes',
    ]),
    ['Passport copy', 'passport_number + passport.png', 'passport.png', '—', 'Only if passport_number is filled'],
  ]
  const requiredSheet = XLSX.utils.aoa_to_sheet(requiredDocs)
  requiredSheet['!cols'] = [{ wch: 36 }, { wch: 36 }, { wch: 34 }, { wch: 22 }, { wch: 36 }]
  XLSX.utils.book_append_sheet(workbook, requiredSheet, 'Required_Documents')

  const instructions = [
    ['RideRoster bulk PA template'],
    [''],
    ['company_id', COMPANY_ID],
    [''],
    ['How to fill'],
    ['1', 'Keep the header row. One passenger assistant per row.'],
    ['2', 'Dates must be YYYY-MM-DD. Sample safeguarding expiry dates are in 2027.'],
    ['3', 'Email must be unique. It becomes the login email.'],
    ['4', 'Password min 6 characters.'],
    ['5', 'British: nationality = British, leave right_to_work_code empty.'],
    ['6', 'Other nationality: fill nationality AND right_to_work_code.'],
    ['7', 'passport_number is optional. If filled, also put passport.png in that PA folder.'],
    ['8', 'Required files: profile, safeguarding_certificate, background_check, first_aid_certificate.'],
    [''],
    ['Document folder'],
    ['Path', 'documents/pas/<pa-email>/'],
    ['Required files', REQUIRED_DOC_FILES.join(', ')],
    ['Optional files', 'passport.png'],
    ['Accepted types', 'PNG, JPG, PDF'],
    [''],
    ['Sample PAs in this file'],
    ['Aisha Khan', 'British — no right to work code, no passport'],
    ['Nora Ahmed', 'Pakistani — right to work + passport'],
    ['Tom Baker', 'British — no passport'],
    ['Lucia Costa', 'Portuguese — right to work, no passport'],
  ]
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 42 }, { wch: 108 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

  const xlsxPath = path.join(SAMPLE_DIR, 'PAs.xlsx')
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
        note: 'company_id is also written onto each PAs.xlsx row.',
        pas_excel: 'PAs.xlsx',
        documents_root: 'documents/pas',
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
console.log(`Wrote 4 PA folders under ${DOCS_DIR}`)
console.log(`company_id: ${COMPANY_ID}`)
