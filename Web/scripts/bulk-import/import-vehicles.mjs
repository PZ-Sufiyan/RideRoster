import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_ROOT = path.resolve(__dirname, '../..')
const SAMPLE_DIR = path.join(__dirname, 'vehicle-sample')
const EXCEL_PATH = path.join(SAMPLE_DIR, 'Vehicles.xlsx')
const RESULTS_PATH = path.join(SAMPLE_DIR, 'import-results.json')
const DUMMY_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const COMPANY_DOCS_BUCKET = 'company-documents'

const REQUIRED_COLUMNS = [
  'company_id',
  'taxi_license_plate_number',
  'registration_number',
  'make',
  'model',
  'vehicle_colour',
  'year_of_first_registration',
  'licensing_type',
  'body_style',
  'mot_expiry',
  'taxi_plate_expiry',
  'insurance_expiry',
  'vehicle_photo',
  'v5_front',
  'v5_inside',
  'mot_certificate',
  'taxi_license_plate',
  'insurance_certificate',
]

const REQUIRED_DOCS = [
  { type: 'vehicle_photo', fileBase: 'vehicle_photo', photo: true },
  { type: 'v5_front', fileBase: 'v5_front' },
  { type: 'v5_inside', fileBase: 'v5_inside' },
  { type: 'mot_certificate', fileBase: 'mot_certificate', expiry: 'mot_expiry' },
  { type: 'taxi_license_plate', fileBase: 'taxi_license_plate', expiry: 'taxi_plate_expiry' },
  { type: 'insurance_certificate', fileBase: 'insurance_certificate', expiry: 'insurance_expiry' },
]

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
}

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
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

function toDateString(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && Number.isFinite(value)) {
    const epoch = new Date(Date.UTC(1899, 11, 30))
    epoch.setUTCDate(epoch.getUTCDate() + Math.floor(value))
    return epoch.toISOString().slice(0, 10)
  }
  const s = clean(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const parsed = new Date(s)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return s
}

function toBoolean(value) {
  const s = clean(value).toLowerCase()
  return s === 'true' || s === 'yes' || s === '1'
}

function toSeatingCapacity(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function mimeFor(fileName) {
  return MIME_BY_EXT[path.extname(fileName).toLowerCase()] || null
}

function findFile(folder, baseName) {
  if (!fs.existsSync(folder)) return null
  const wanted = baseName.toLowerCase()
  const match = fs.readdirSync(folder).find((name) => {
    const parsed = path.parse(name)
    return parsed.name.toLowerCase() === wanted && mimeFor(name)
  })
  return match ? path.join(folder, match) : null
}

function createAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in Web/.env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
}

function safeFileName(filePath) {
  return path.basename(filePath).toLowerCase().replace(/[^a-z0-9.\-_]+/g, '_').replace(/_+/g, '_').slice(0, 120)
}

function readExcelRows() {
  if (!fs.existsSync(EXCEL_PATH)) throw new Error(`Excel not found: ${EXCEL_PATH}`)
  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'vehicles') || workbook.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
  if (!rows.length) throw new Error('Vehicles sheet is empty.')
  return rows
}

function collectDocs(row) {
  const relative = clean(row.documents_folder) || `documents/vehicles/${clean(row.registration_number)}`
  const folder = path.resolve(SAMPLE_DIR, relative)
  const found = {}
  const missingFiles = []
  for (const spec of REQUIRED_DOCS) {
    const filePath = findFile(folder, spec.fileBase)
    if (!filePath) missingFiles.push(`${spec.fileBase} (.png/.jpg/.pdf)`)
    else found[spec.type] = filePath
  }
  return { folder, found, missingFiles }
}

function validateRow(row, index) {
  const missingFields = []
  const excelRow = index + 2
  for (const key of REQUIRED_COLUMNS) {
    if (!clean(row[key])) missingFields.push(key)
  }
  const companyId = clean(row.company_id)
  if (companyId === DUMMY_COMPANY_ID) missingFields.push('company_id (still dummy)')
  for (const key of ['year_of_first_registration', 'mot_expiry', 'taxi_plate_expiry', 'insurance_expiry']) {
    const value = toDateString(row[key])
    if (clean(row[key]) && !/^\d{4}-\d{2}-\d{2}$/.test(value)) missingFields.push(`${key} (use YYYY-MM-DD)`)
  }
  const docs = collectDocs(row)
  if (!fs.existsSync(docs.folder)) missingFields.push(`documents folder missing: ${docs.folder}`)
  return {
    excelRow,
    companyId,
    registration: clean(row.registration_number).toUpperCase(),
    missingFields,
    missingFiles: docs.missingFiles,
    docs,
    ok: missingFields.length === 0 && docs.missingFiles.length === 0,
  }
}

async function uploadBuffer({ supabase, companyId, vehicleId, documentType, filePath }) {
  const buffer = fs.readFileSync(filePath)
  const fileName = safeFileName(filePath)
  const contentType = mimeFor(fileName)
  if (!contentType) throw new Error(`Unsupported file type: ${fileName}`)
  const fileStoragePath = `${companyId}/vehicles/${vehicleId}/${documentType}/${crypto.randomUUID()}_${fileName}`
  const { error } = await supabase.storage.from(COMPANY_DOCS_BUCKET).upload(fileStoragePath, buffer, {
    upsert: false,
    contentType,
  })
  if (error) throw error
  const { data } = supabase.storage.from(COMPANY_DOCS_BUCKET).getPublicUrl(fileStoragePath)
  if (!data?.publicUrl) throw new Error(`Uploaded ${documentType} but could not resolve public URL.`)
  return { file_path: fileStoragePath, file_url: data.publicUrl, bucket: COMPANY_DOCS_BUCKET }
}

async function rollback({ supabase, vehicleId, uploaded }) {
  if (vehicleId) await supabase.from('vehicles').delete().eq('id', vehicleId)
  if (uploaded.length) {
    await Promise.allSettled(uploaded.map((item) => supabase.storage.from(item.bucket).remove([item.file_path])))
  }
}

async function importVehicle(supabase, row, check, typeMap) {
  const companyId = check.companyId
  const uploaded = []
  let vehicleId = null
  const bodyStyle = clean(row.body_style)
  const typeMeta = typeMap.get(bodyStyle)
  if (!typeMeta) throw new Error(`Unknown body_style "${bodyStyle}". Use a value from the Vehicle_Types sheet.`)

  try {
    const { data: vehicleRow, error: vehicleErr } = await supabase
      .from('vehicles')
      .insert({
        company_id: companyId,
        driver_id: null,
        taxi_license_plate_number: clean(row.taxi_license_plate_number),
        seating_capacity: toSeatingCapacity(row.seating_capacity) ?? typeMeta.seats,
        vehicle_photo_url: null,
        name: `${clean(row.make)} ${clean(row.model)}`.trim() || null,
        registration_number: clean(row.registration_number),
        make: clean(row.make),
        model: clean(row.model),
        vehicle_colour: clean(row.vehicle_colour),
        year_of_first_registration: toDateString(row.year_of_first_registration) || null,
        licensing_type: clean(row.licensing_type),
        body_style: bodyStyle,
        wheelchair_accessible: toBoolean(row.wheelchair_accessible) || typeMeta.wheelchairAccessible,
        fleet: 'company',
        status: 'active',
      })
      .select('id')
      .single()
    if (vehicleErr) throw vehicleErr
    vehicleId = vehicleRow?.id
    if (!vehicleId) throw new Error('Vehicle record was not created.')

    const photoMeta = await uploadBuffer({
      supabase, companyId, vehicleId, documentType: 'vehicle_photo', filePath: check.docs.found.vehicle_photo,
    })
    uploaded.push(photoMeta)
    const { error: photoErr } = await supabase
      .from('vehicles')
      .update({ vehicle_photo_url: photoMeta.file_url, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
    if (photoErr) throw photoErr

    const expiryByKey = {
      mot_expiry: toDateString(row.mot_expiry) || null,
      taxi_plate_expiry: toDateString(row.taxi_plate_expiry) || null,
      insurance_expiry: toDateString(row.insurance_expiry) || null,
    }
    const docRows = []
    for (const spec of REQUIRED_DOCS) {
      if (spec.photo) continue
      const meta = await uploadBuffer({
        supabase, companyId, vehicleId, documentType: spec.type, filePath: check.docs.found[spec.type],
      })
      uploaded.push(meta)
      docRows.push({
        company_id: companyId,
        vehicle_id: vehicleId,
        document_type: spec.type,
        file_url: meta.file_url,
        expiry_date: spec.expiry ? expiryByKey[spec.expiry] : null,
      })
    }
    const { error: docsErr } = await supabase.from('vehicle_documents').insert(docRows)
    if (docsErr) throw docsErr

    const { data: saved, error: savedErr } = await supabase
      .from('vehicles')
      .select('id, registration_number, status, body_style, wheelchair_accessible, vehicle_photo_url')
      .eq('id', vehicleId)
      .single()
    if (savedErr) throw savedErr
    const { data: savedDocs, error: savedDocsErr } = await supabase
      .from('vehicle_documents')
      .select('document_type')
      .eq('vehicle_id', vehicleId)
    if (savedDocsErr) throw savedDocsErr

    return {
      status: 'imported',
      excelRow: check.excelRow,
      registration: saved.registration_number,
      vehicleId,
      companyId,
      vehicleStatus: saved.status,
      bodyStyle: saved.body_style,
      wheelchairAccessible: saved.wheelchair_accessible,
      hasPhoto: Boolean(saved.vehicle_photo_url),
      documents: (savedDocs || []).map((d) => d.document_type),
    }
  } catch (err) {
    await rollback({ supabase, vehicleId, uploaded })
    throw err
  }
}

async function main() {
  const rows = readExcelRows()
  const checks = rows.map((row, index) => ({ row, check: validateRow(row, index) }))
  const companyIds = [...new Set(checks.map(({ check }) => check.companyId).filter(Boolean))]
  console.log(`Excel: ${EXCEL_PATH}`)
  console.log(`Vehicles in sheet: ${rows.length}`)
  console.log(`Company id(s): ${companyIds.join(', ') || '(missing)'}`)
  console.log('')

  const missingReport = []
  for (const { check } of checks) {
    if (!check.ok) {
      missingReport.push(check)
      console.log(`ROW ${check.excelRow}  ${check.registration || '(no registration)'}  INCOMPLETE`)
      if (check.missingFields.length) console.log(`  Missing in Excel: ${check.missingFields.join(', ')}`)
      if (check.missingFiles.length) console.log(`  Missing documents: ${check.missingFiles.join(', ')}`)
    } else {
      console.log(`ROW ${check.excelRow}  ${check.registration}  ready`)
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

  const { data: categories, error: catErr } = await supabase
    .from('vehicle_categories')
    .select('category_key, variant_label, seats, wheelchair_accessible')
  if (catErr) throw catErr
  const typeMap = new Map()
  for (const row of categories || []) {
    typeMap.set(`${String(row.category_key).trim()} - ${String(row.variant_label).trim()}`, {
      seats: Number(row.seats) || null,
      wheelchairAccessible: row.wheelchair_accessible === true,
    })
  }
  console.log('')

  const results = []
  for (const { row, check } of checks) {
    if (!check.ok) {
      results.push({
        status: 'skipped_missing_data',
        excelRow: check.excelRow,
        registration: check.registration,
        missingFields: check.missingFields,
        missingFiles: check.missingFiles,
      })
      continue
    }
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id, status')
      .eq('company_id', companyId)
      .ilike('registration_number', check.registration)
      .limit(1)
    if (existing?.[0]?.id) {
      console.log(`SKIP ${check.registration} — already exists (${existing[0].id})`)
      results.push({ status: 'skipped_exists', excelRow: check.excelRow, registration: check.registration, existing: existing[0] })
      continue
    }
    try {
      const imported = await importVehicle(supabase, row, check, typeMap)
      console.log(`OK  ${imported.registration}  status=${imported.vehicleStatus}  docs=${imported.documents.length}  photo=${imported.hasPhoto}`)
      results.push(imported)
    } catch (err) {
      const message = err?.message || String(err)
      console.log(`FAIL ${check.registration} — ${message}`)
      results.push({ status: 'failed', excelRow: check.excelRow, registration: check.registration, error: message })
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
