import { supabaseAdmin } from '../lib/supabaseAdmin'
import { SUB_ADMIN_PERMISSION_KEYS } from './subAdminService'

const ROLE = 'subadmin'

function cleanString(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function toNullableString(v) {
  const s = cleanString(v)
  return s.length ? s : null
}

/**
 * Registers a sub-admin in Auth (`role: subadmin`), then inserts `sub_admins`.
 * Uses the service-role client so the company admin session is unchanged.
 *
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} params.fullName
 * @param {string} params.email
 * @param {string} [params.phone]
 * @param {string} params.password
 * @param {string[]} params.permissionKeys — keys from `permissionsConstants` / `SUB_ADMIN_PERMISSION_KEYS`
 */
export async function registerSubAdminWithAuthAndRecord({
  companyId,
  fullName,
  email,
  phone = '',
  password,
  permissionKeys = [],
}) {
  const normalizedEmail = cleanString(email).toLowerCase()
  const name = cleanString(fullName)
  if (!normalizedEmail) throw new Error('Email is required.')
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }
  if (!name) throw new Error('Full name is required.')
  if (!companyId) throw new Error('Company is required.')

  const granted = new Set((permissionKeys || []).filter((k) => SUB_ADMIN_PERMISSION_KEYS.includes(k)))

  let authUserId = null

  try {
    const { data: createdAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      app_metadata: { role: ROLE },
      user_metadata: {
        role: ROLE,
        email: normalizedEmail,
        name,
      },
    })

    if (createErr) throw createErr
    if (!createdAuth?.user?.id) throw new Error('Could not create auth user.')
    authUserId = createdAuth.user.id

    const row = {
      id: authUserId,
      company_id: companyId,
      email: normalizedEmail,
      name,
      phone: toNullableString(phone),
      status: 'pending',
    }

    for (const key of SUB_ADMIN_PERMISSION_KEYS) {
      row[key] = granted.has(key)
    }

    const { error: insertErr } = await supabaseAdmin.from('sub_admins').insert(row)
    if (insertErr) throw insertErr

    return { userId: authUserId, email: normalizedEmail }
  } catch (err) {
    if (authUserId) {
      try {
        await supabaseAdmin.from('sub_admins').delete().eq('id', authUserId)
      } catch {
        /* best effort */
      }
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
      } catch {
        /* best effort */
      }
    }
    throw err
  }
}
