import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_ROOT = path.resolve(__dirname, '../..')
const SAMPLE_DIR = path.join(__dirname, 'pa-sample')
const EXCEL_PATH = path.join(SAMPLE_DIR, 'PAs.xlsx')
const RESULTS_PATH = path.join(SAMPLE_DIR, 'import-results.json')
const DUMMY_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const COMPANY_DOCS_BUCKET = 'company-documents'
const ROLE = 'passenger_assistant'

const REQUIRED_COLUMNS = [
  'company_id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'password',
  'residential_address',
  'emergency_contact_name',
  'emergency_contact_phone',
  'nationality',
  'safeguarding_expiry',
  'safeguarding_certificate',
  'background_check',
  'first_aid_certificate',
]

const REQUIRED_DOCS = [
  { type: 'profile', fileBase: 'profile', profile: true },
  { type: 'safeguarding_certificate', fileBase: 'safeguarding_certificate', expiry: 'safeguarding_expiry' },
  { type: 'background_check', fileBase: 'background_check' },
  { type: 'first_aid_certificate', fileBase: 'first_aid_certificate' },
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
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return String(value).trim()
}

function nullable(value) {
  const s = clean(value)
  return s ? s : null
}

function toDateString(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
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

function isBritish(nationality) {
  return clean(nationality).toLowerCase() === 'british'
}

function mimeFor(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  return MIME_BY_EXT[ext] || null
}

function findFile(folder, baseName) {
  if (!fs.existsSync(folder)) return null
  const wanted = baseName.toLowerCase()
  const entries = fs.readdirSync(folder)
  const match = entries.find((name) => {
    const parsed = path.parse(name)
    return parsed.name.toLowerCase() === wanted && mimeFor(name)
  })
  return match ? path.join(folder, match) : null
}

function readExcelRows() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Excel not found: ${EXCEL_PATH}`)
  }
  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === 'pas') ||
    workbook.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
  if (!rows.length) throw new Error('PAs sheet is empty.')
  return rows
}

function resolveDocsFolder(row) {
  const relative = clean(row.documents_folder) || `documents/pas/${clean(row.email).toLowerCase()}`
  return path.resolve(SAMPLE_DIR, relative)
}

function collectDocs(row) {
  const folder = resolveDocsFolder(row)
  const found = {}
  const missingFiles = []

  for (const spec of REQUIRED_DOCS) {
    const filePath = findFile(folder, spec.fileBase)
    if (!filePath) missingFiles.push(`${spec.fileBase} (.png/.jpg/.pdf)`)
    else found[spec.type] = filePath
  }

  const passportNumber = nullable(row.passport_number)
  const passportPath = findFile(folder, 'passport')
  if (passportNumber && !passportPath) missingFiles.push('passport (.png/.jpg/.pdf)')
  if (passportPath) found.passport = passportPath

  return { folder, found, missingFiles }
}

function validateRow(row, index) {
  const missingFields = []
  const warnings = []
  const excelRow = index + 2

  for (const key of REQUIRED_COLUMNS) {
    if (!clean(row[key])) missingFields.push(key)
  }

  const email = clean(row.email).toLowerCase()
  const password = clean(row.password)
  const nationality = clean(row.nationality)
  const companyId = clean(row.company_id)

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    missingFields.push('email (invalid format)')
  }
  if (password && password.length < 6) missingFields.push('password (min 6 characters)')

  if (companyId === DUMMY_COMPANY_ID) {
    missingFields.push('company_id (still the dummy UUID — use the real company id)')
  }

  if (nationality) {
    if (isBritish(nationality)) {
      if (nullable(row.right_to_work_code)) {
        warnings.push('British PA — right_to_work_code will be ignored')
      }
    } else if (!nullable(row.right_to_work_code)) {
      missingFields.push('right_to_work_code (required when nationality is not British)')
    }
  }

  const safeguardingExpiry = toDateString(row.safeguarding_expiry)
  if (clean(row.safeguarding_expiry) && !/^\d{4}-\d{2}-\d{2}$/.test(safeguardingExpiry)) {
    missingFields.push('safeguarding_expiry (use YYYY-MM-DD)')
  }

  const docs = collectDocs(row)
  if (!fs.existsSync(docs.folder)) {
    missingFields.push(`documents folder missing: ${docs.folder}`)
  }

  return {
    excelRow,
    email,
    companyId,
    missingFields,
    missingFiles: docs.missingFiles,
    warnings,
    docs,
    ok: missingFields.length === 0 && docs.missingFiles.length === 0,
  }
}

function createAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in Web/.env')
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

function safeFileName(filePath) {
  return path
    .basename(filePath)
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
}

async function uploadBuffer({ supabase, companyId, assistantId, documentType, filePath, profile = false }) {
  const buffer = fs.readFileSync(filePath)
  const fileName = safeFileName(filePath)
  const contentType = mimeFor(fileName)
  if (!contentType) throw new Error(`Unsupported file type: ${fileName}`)

  const fileStoragePath = profile
    ? `${companyId}/passenger-assistants/${assistantId}/profile/${crypto.randomUUID()}_${fileName}`
    : `${companyId}/passenger-assistants/${assistantId}/${documentType}/${crypto.randomUUID()}_${fileName}`

  const { error } = await supabase.storage
    .from(COMPANY_DOCS_BUCKET)
    .upload(fileStoragePath, buffer, { upsert: false, contentType })

  if (error) throw error

  const { data } = supabase.storage.from(COMPANY_DOCS_BUCKET).getPublicUrl(fileStoragePath)
  if (!data?.publicUrl) throw new Error(`Uploaded ${documentType} but could not resolve public URL.`)

  return {
    file_name: fileName,
    file_path: fileStoragePath,
    file_url: data.publicUrl,
    bucket: COMPANY_DOCS_BUCKET,
  }
}

async function rollback({ supabase, authUserId, uploaded }) {
  if (authUserId) {
    await supabase.from('passenger_assistant').delete().eq('id', authUserId)
    try {
      await supabase.auth.admin.deleteUser(authUserId)
    } catch {
      /* best effort */
    }
  }
  if (uploaded.length) {
    await Promise.allSettled(
      uploaded.map((item) => supabase.storage.from(item.bucket).remove([item.file_path])),
    )
  }
}

function isDuplicateAuthError(err) {
  const message = String(err?.message || '').toLowerCase()
  const code = String(err?.code || err?.error_code || '').toLowerCase()
  return (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message.includes('already been registered') ||
    message.includes('already registered') ||
    message.includes('user already exists') ||
    message.includes('email address has already')
  )
}

async function importPa(supabase, row, check) {
  const email = check.email
  const password = clean(row.password)
  const companyId = check.companyId
  const uploaded = []
  let authUserId = null

  try {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: ROLE },
      user_metadata: {
        role: ROLE,
        email,
        first_name: clean(row.first_name),
        last_name: clean(row.last_name),
      },
    })

    if (createErr) {
      if (isDuplicateAuthError(createErr)) {
        const err = new Error('Auth user already exists for this email')
        err.code = 'already_exists'
        throw err
      }
      throw createErr
    }
    authUserId = created?.user?.id
    if (!authUserId) throw new Error('Auth user was not created.')

    const profileMeta = await uploadBuffer({
      supabase,
      companyId,
      assistantId: authUserId,
      documentType: 'profile',
      filePath: check.docs.found.profile,
      profile: true,
    })
    uploaded.push(profileMeta)

    const paPayload = {
      id: authUserId,
      company_id: companyId,
      first_name: clean(row.first_name),
      surname: clean(row.last_name),
      email,
      phone: clean(row.phone),
      residential_address: nullable(row.residential_address),
      emergency_contact_name: clean(row.emergency_contact_name),
      emergency_contact_phone: clean(row.emergency_contact_phone),
      nationality: clean(row.nationality),
      right_to_work_code: isBritish(row.nationality) ? null : nullable(row.right_to_work_code),
      passport_number: nullable(row.passport_number),
      profile_picture_url: profileMeta.file_url,
      status: 'approve',
      fleet: 'company',
    }

    const { error: paErr } = await supabase.from('passenger_assistant').insert(paPayload)
    if (paErr) throw paErr

    const docRows = []
    const safeguardingExpiry = toDateString(row.safeguarding_expiry) || null

    for (const spec of REQUIRED_DOCS) {
      if (spec.profile) continue
      const meta = await uploadBuffer({
        supabase,
        companyId,
        assistantId: authUserId,
        documentType: spec.type,
        filePath: check.docs.found[spec.type],
      })
      uploaded.push(meta)
      docRows.push({
        passenger_assistant_id: authUserId,
        document_type: spec.type,
        file_name: meta.file_name,
        file_url: meta.file_url,
        expiry_date: spec.expiry ? safeguardingExpiry : null,
        verified: false,
      })
    }

    if (check.docs.found.passport) {
      const meta = await uploadBuffer({
        supabase,
        companyId,
        assistantId: authUserId,
        documentType: 'passport',
        filePath: check.docs.found.passport,
      })
      uploaded.push(meta)
      docRows.push({
        passenger_assistant_id: authUserId,
        document_type: 'passport',
        file_name: meta.file_name,
        file_url: meta.file_url,
        expiry_date: null,
        verified: false,
      })
    }

    const { error: docsErr } = await supabase.from('passenger_assistant_documents').insert(docRows)
    if (docsErr) throw docsErr

    const { data: authUser, error: authGetErr } = await supabase.auth.admin.getUserById(authUserId)
    if (authGetErr) throw authGetErr

    const { data: savedPa, error: savedErr } = await supabase
      .from('passenger_assistant')
      .select('id, email, status, nationality, right_to_work_code, profile_picture_url')
      .eq('id', authUserId)
      .single()
    if (savedErr) throw savedErr

    const { data: savedDocs, error: savedDocsErr } = await supabase
      .from('passenger_assistant_documents')
      .select('document_type, expiry_date')
      .eq('passenger_assistant_id', authUserId)
    if (savedDocsErr) throw savedDocsErr

    return {
      status: 'imported',
      excelRow: check.excelRow,
      email,
      password,
      paId: authUserId,
      companyId,
      paStatus: savedPa.status,
      emailConfirmed: Boolean(authUser?.user?.email_confirmed_at),
      documents: (savedDocs || []).map((d) => d.document_type),
      warnings: check.warnings,
    }
  } catch (err) {
    await rollback({ supabase, authUserId, uploaded })
    throw err
  }
}

async function alreadyExists(supabase, email) {
  const { data: rows, error } = await supabase
    .from('passenger_assistant')
    .select('id, status, company_id, email')
    .ilike('email', email)
    .limit(1)

  if (error) throw error
  const pa = rows?.[0]
  if (pa?.id) {
    return { kind: 'passenger_assistant', id: pa.id, status: pa.status }
  }
  return null
}

async function main() {
  const rows = readExcelRows()
  const checks = rows.map((row, index) => ({ row, check: validateRow(row, index) }))
  const companyIds = [...new Set(checks.map(({ check }) => check.companyId).filter(Boolean))]

  console.log(`Excel: ${EXCEL_PATH}`)
  console.log(`PAs in sheet: ${rows.length}`)
  console.log(`Company id(s): ${companyIds.join(', ') || '(missing)'}`)
  console.log('')

  const missingReport = []
  for (const { check } of checks) {
    if (check.missingFields.length || check.missingFiles.length) {
      missingReport.push(check)
      console.log(`ROW ${check.excelRow}  ${check.email || '(no email)'}  INCOMPLETE`)
      if (check.missingFields.length) {
        console.log(`  Missing in table/Excel: ${check.missingFields.join(', ')}`)
      }
      if (check.missingFiles.length) {
        console.log(`  Missing documents: ${check.missingFiles.join(', ')}`)
      }
    } else {
      console.log(`ROW ${check.excelRow}  ${check.email}  ready`)
      for (const warning of check.warnings) console.log(`  warning: ${warning}`)
    }
  }
  console.log('')

  const supabase = createAdminClient()

  if (companyIds.length !== 1) {
    throw new Error('Every row must use the same real company_id.')
  }

  const companyId = companyIds[0]
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .select('id, company_name, status')
    .eq('id', companyId)
    .maybeSingle()

  if (companyErr) throw companyErr
  if (!company) {
    throw new Error(`Company not found in DB: ${companyId}`)
  }
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
        missingFiles: check.missingFiles,
      })
      continue
    }

    const existing = await alreadyExists(supabase, check.email)
    if (existing) {
      console.log(`SKIP ${check.email} — already exists as ${existing.kind} (${existing.id})`)
      results.push({
        status: 'skipped_exists',
        excelRow: check.excelRow,
        email: check.email,
        existing,
      })
      continue
    }

    try {
      const imported = await importPa(supabase, row, check)
      console.log(
        `OK  ${imported.email}  status=${imported.paStatus}  confirmed=${imported.emailConfirmed}  docs=${imported.documents.length}`,
      )
      results.push(imported)
    } catch (err) {
      const message = err?.message || String(err)
      if (err?.code === 'already_exists' || isDuplicateAuthError(err)) {
        console.log(`SKIP ${check.email} — auth user already exists`)
        results.push({
          status: 'skipped_exists',
          excelRow: check.excelRow,
          email: check.email,
          existing: { kind: 'auth' },
        })
        continue
      }
      console.log(`FAIL ${check.email} — ${message}`)
      results.push({
        status: 'failed',
        excelRow: check.excelRow,
        email: check.email,
        error: message,
      })
    }
  }

  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`)
  console.log('')
  console.log(`Results written to ${RESULTS_PATH}`)

  const imported = results.filter((r) => r.status === 'imported')
  const failed = results.filter((r) => r.status === 'failed')
  const skipped = results.filter((r) => r.status.startsWith('skipped'))
  console.log(`Imported ${imported.length}, skipped ${skipped.length}, failed ${failed.length}`)

  if (imported.length) {
    console.log('')
    console.log('Login (status=approve, email already confirmed):')
    for (const item of imported) {
      console.log(`  ${item.email}  /  ${item.password}`)
    }
  }

  if (failed.length || missingReport.length) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
