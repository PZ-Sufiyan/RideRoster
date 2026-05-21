import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineEventBusy,
  MdOutlineAttachment,
  MdOpenInNew,
  MdRoute,
} from 'react-icons/md'
import {
  getLeaveRequestsEnrichedForCurrentAdmin,
  updateLeaveRequestStatus,
  USER_ROLE_DRIVER,
  USER_ROLE_PA,
} from '../../../../../services/driverOffDayRequestService'
import { ShimmerBlock } from '../../../../../utils/Shimmer'

const ITEMS_PER_PAGE = 10

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

function requesterName(r) {
  const first = r.requester_first_name ?? r.driver_first_name ?? ''
  const last = r.requester_last_name ?? r.driver_last_name ?? ''
  return [first, last].filter(Boolean).join(' ').trim() || '—'
}

function roleLabel(userRole) {
  const role = (userRole || '').toLowerCase()
  if (role === USER_ROLE_PA) return 'Passenger assistant'
  if (role === USER_ROLE_DRIVER) return 'Driver'
  return role || '—'
}

function roleBadgeClass(userRole) {
  const role = (userRole || '').toLowerCase()
  if (role === USER_ROLE_PA) return 'bg-violet-50 text-violet-800'
  return 'bg-sky-50 text-sky-800'
}

function formatYmd(ymdStr) {
  if (!ymdStr) return '—'
  const d = new Date(`${ymdStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymdStr
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function dayCount(startStr, endStr) {
  const s = new Date(`${startStr}T12:00:00`)
  const e = new Date(`${endStr}T12:00:00`)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null
  return Math.round((e - s) / 86400000) + 1
}

function statusClass(status) {
  const s = (status || 'pending').toLowerCase()
  if (s === 'approved') return 'bg-emerald-50 text-emerald-800'
  if (s === 'rejected') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

function passengerFromRow(row) {
  const p = row.passenger
  return (Array.isArray(p) ? p[0] : p) || {}
}

function summarizeJobContext(ctx) {
  const rows = [...(ctx.outbound || []), ...(ctx.inbound || [])]
  const passengerIds = new Set()
  let anyWheelchair = false
  let anyHarness = false
  for (const row of rows) {
    const pid = row.passenger_id
    if (pid != null && String(pid).trim() !== '') passengerIds.add(String(pid))
    const p = passengerFromRow(row)
    if (p.wheelchair_required) anyWheelchair = true
    if (p.harness_required) anyHarness = true
  }
  const passengerCount = passengerIds.size > 0 ? passengerIds.size : rows.length
  return {
    jobName: ctx.job?.job_name?.trim() || 'Job',
    passengerCount: passengerCount || 0,
    anyWheelchair,
    anyHarness,
  }
}

function FieldLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{children}</p>
  )
}

function AffectedRoutesSummary({ contexts }) {
  if (!contexts?.length) return null
  return (
    <div className="rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2.5">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">
        <MdRoute size={13} aria-hidden="true" />
        Routes affected
      </p>
      <ul className="space-y-1.5">
        {contexts.map((ctx) => {
          const { jobName, passengerCount, anyWheelchair, anyHarness } = summarizeJobContext(ctx)
          return (
            <li key={ctx.job?.id ?? jobName} className="flex flex-wrap items-baseline gap-1 text-sm">
              {ctx.job?.id ? (
                <Link
                  to={`/portal/jobs/${ctx.job.id}`}
                  className="font-medium text-sky-700 hover:underline"
                >
                  {jobName}
                </Link>
              ) : (
                <span className="font-medium">{jobName}</span>
              )}
              <span className="text-xs text-gray-500">
                · {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}
              </span>
              {(anyWheelchair || anyHarness) && (
                <span className="text-xs text-gray-500">
                  ·{' '}
                  {anyWheelchair ? <span className="font-medium text-amber-900">Wheelchair</span> : null}
                  {anyWheelchair && anyHarness ? ', ' : null}
                  {anyHarness ? <span className="font-medium text-amber-900">Harness</span> : null}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function RequestRow({ r, notesDraft, setNoteFor, busyId, onDecision }) {
  const pending = r.status === 'pending'
  const days = dayCount(r.start_date, r.end_date)
  const notesVal = notesDraft[r.id] ?? ''
  const MAX_NOTES = 300
  const st = (r.status || 'pending').toLowerCase()
  const singleDay = r.end_date === r.start_date

  return (
    <div className="border-b border-gray-100 px-5 py-5 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">

        {/* ── Left: request info ── */}
        <div className="min-w-0 flex-1 space-y-3">

          {/* Header: name + badge + leave type */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold text-gray-900">{requesterName(r)}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(r.user_role)}`}
            >
              {roleLabel(r.user_role)}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(st)}`}>
              {STATUS_LABEL[st] ?? st}
            </span>
            {r.leave_type ? (
              <span className="text-gray-500">{r.leave_type}</span>
            ) : null}
          </div>

          {/* Period + Duration */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="space-y-0.5">
              <FieldLabel>Period</FieldLabel>
              <p className="text-sm text-gray-800">
                {formatYmd(r.start_date)}
                {!singleDay ? ` → ${formatYmd(r.end_date)}` : null}
              </p>
            </div>
            <div className="space-y-0.5">
              <FieldLabel>Duration</FieldLabel>
              <p className="text-sm text-gray-800">
                {days != null ? `${days} day${days !== 1 ? 's' : ''}` : '—'}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-0.5">
            <FieldLabel>Reason</FieldLabel>
            {r.reason ? (
              <p className="whitespace-pre-wrap text-sm text-gray-700">{r.reason}</p>
            ) : (
              <p className="text-sm text-gray-400">No reason given</p>
            )}
          </div>

          {/* Attachment */}
          {r.attachment_url ? (
            <a
              href={r.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline"
            >
              <MdOutlineAttachment className="shrink-0" size={15} />
              Attachment
              <MdOpenInNew className="shrink-0 opacity-60" size={13} />
            </a>
          ) : null}

          {/* Affected routes */}
          <AffectedRoutesSummary contexts={r.jobContexts} />

          {/* Admin note (resolved only) */}
          {!pending && r.admin_notes ? (
            <div className="rounded-md bg-gray-50 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Admin note ·{' '}
              </span>
              <span className="text-sm text-gray-700">{r.admin_notes}</span>
            </div>
          ) : null}
        </div>

        {/* ── Right: action panel (pending only) ── */}
        {pending ? (
          <div className="w-full shrink-0 space-y-2.5 border-gray-100 sm:w-56 sm:border-l sm:pl-5">
            <div className="space-y-1">
              <FieldLabel>Admin note</FieldLabel>
              <p className="text-[11px] text-gray-400">Optional — shared with the requester</p>
              <textarea
                rows={3}
                maxLength={MAX_NOTES}
                value={notesVal}
                onChange={(e) => setNoteFor(r.id, e.target.value)}
                placeholder="Add a note…"
                className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-right text-[10px] tabular-nums text-gray-400">
                {notesVal.length}/{MAX_NOTES}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => onDecision(r.id, 'approved')}
                className="flex-1 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {busyId === r.id ? '…' : 'Approve'}
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => onDecision(r.id, 'rejected')}
                className="flex-1 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ListShimmer() {
  return (
    <div className="divide-y divide-gray-100">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3 px-5 py-5">
          <div className="flex gap-2">
            <ShimmerBlock className="h-4 w-32 rounded" />
            <ShimmerBlock className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ShimmerBlock className="h-8 w-full rounded" />
            <ShimmerBlock className="h-8 w-full rounded" />
          </div>
          <ShimmerBlock className="h-10 w-full max-w-md rounded" />
        </div>
      ))}
    </div>
  )
}

export default function OffDayRequestsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [notesDraft, setNotesDraft] = useState({})
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLeaveRequestsEnrichedForCurrentAdmin()
      setRows(data || [])
    } catch (e) {
      setError(e?.message || 'Could not load leave requests.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const matchQ =
        !q ||
        requesterName(r).toLowerCase().includes(q) ||
        roleLabel(r.user_role).toLowerCase().includes(q) ||
        (r.leave_type || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
      const st = (r.status || 'pending').toLowerCase()
      const matchSt = statusFilter === 'all' || st === statusFilter
      const role = (r.user_role || '').toLowerCase()
      const matchRole = roleFilter === 'all' || role === roleFilter
      return matchQ && matchSt && matchRole
    })
  }, [rows, search, statusFilter, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const setNoteFor = (id, val) => setNotesDraft((prev) => ({ ...prev, [id]: val }))

  const handleDecision = async (requestId, status) => {
    const notes = notesDraft[requestId] ?? ''
    setBusyId(requestId)
    setError(null)
    try {
      await updateLeaveRequestStatus(requestId, { status, adminNotes: notes })
      await load()
      setNotesDraft((prev) => {
        const next = { ...prev }
        delete next[requestId]
        return next
      })
    } catch (e) {
      setError(e?.message || 'Could not update request.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null)
              load()
            }}
            className="shrink-0 font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <h1 className="text-xl font-bold text-gray-900">Leave requests</h1>

      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-1 flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search name, role, type, reason"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm sm:max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm sm:w-40"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm sm:w-48"
          >
            <option value="all">All roles</option>
            <option value={USER_ROLE_DRIVER}>Drivers</option>
            <option value={USER_ROLE_PA}>Passenger assistants</option>
          </select>
        </div>
        {!loading ? (
          <p className="px-3 pb-3 text-xs text-gray-500 sm:pb-0 sm:pr-3">
            {filtered.length} request{filtered.length === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <ListShimmer />
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MdOutlineEventBusy className="mb-2 text-gray-300" size={40} />
            <p className="text-sm font-medium text-gray-600">No requests</p>
            <p className="mt-1 text-xs text-gray-400">
              {search || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Change search or filter.'
                : 'Nothing submitted yet.'}
            </p>
          </div>
        ) : (
          paginated.map((r) => (
            <RequestRow
              key={r.id}
              r={r}
              notesDraft={notesDraft}
              setNoteFor={setNoteFor}
              busyId={busyId}
              onDecision={handleDecision}
            />
          ))
        )}

        {!loading && filtered.length > ITEMS_PER_PAGE ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <MdChevronLeft size={18} />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <MdChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}