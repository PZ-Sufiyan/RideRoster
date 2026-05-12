import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdSearch,
  MdKeyboardArrowDown,
  MdChevronLeft,
  MdChevronRight,
  MdWorkOutline,
  MdOutlineEventBusy,
} from 'react-icons/md'
import {
  getOffDayRequestsEnrichedForCurrentAdmin,
  updateOffDayRequestStatus,
} from '../../../../../services/driverOffDayRequestService'
import { ShimmerBlock } from '../../../../../utils/Shimmer'

const ITEMS_PER_PAGE = 6

const STATUS_STYLES = {
  pending: 'bg-blue-50 text-blue-700 border border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

const WEEKDAY_LABEL = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

function driverName(r) {
  const n = [r.driver_first_name, r.driver_last_name].filter(Boolean).join(' ').trim()
  return n || '—'
}

function formatYmd(ymdStr) {
  if (!ymdStr) return '—'
  const d = new Date(`${ymdStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymdStr
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(t) {
  if (t == null || t === '') return '—'
  const s = String(t)
  return s.length >= 5 ? s.slice(0, 5) : s
}

function passengerFromRow(row) {
  const p = row.passenger
  if (Array.isArray(p)) return p[0] || {}
  return p || {}
}

function passengerLabel(row) {
  const p = passengerFromRow(row)
  const n = [p.first_name, p.surname].filter(Boolean).join(' ').trim()
  return n || 'Passenger'
}

function statusPillClass(status) {
  const s = (status || '').toLowerCase()
  return STATUS_STYLES[s] || 'bg-gray-100 text-gray-600 border border-gray-200'
}

function ScheduleDirectionBlock({ title, rows, job }) {
  if (!rows?.length) return null
  const showRoute = job?.has_outbound !== false || job?.has_inbound !== false

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      <ul className="space-y-2">
        {rows.map((row) => {
          const p = passengerFromRow(row)
          const wd = WEEKDAY_LABEL[String(row.weekday || '').toLowerCase()] || row.weekday
          return (
            <li
              key={row.id}
              className="rounded-md border border-white bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <span className="font-medium text-gray-900">{passengerLabel(row)}</span>
                <span className="text-xs text-gray-500 shrink-0">{wd}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Pickup {formatTime(row.pickup_time)} · {row.pickup_address || '—'}
              </p>
              <p className="text-xs text-gray-600">
                Drop-off {row.dropoff_address || '—'}
                {row.dropoff_time ? ` · ${formatTime(row.dropoff_time)}` : ''}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.wheelchair_required ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                    Wheelchair
                  </span>
                ) : (
                  <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-100">
                    No wheelchair
                  </span>
                )}
                {p.harness_required ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-50 text-violet-800 border border-violet-100">
                    Harness
                  </span>
                ) : null}
                {showRoute && title === 'Outbound' && job?.has_outbound === false ? (
                  <span className="text-[10px] text-gray-400">Job: outbound off</span>
                ) : null}
                {showRoute && title === 'Inbound' && job?.has_inbound === false ? (
                  <span className="text-[10px] text-gray-400">Job: inbound off</span>
                ) : null}
              </div>
              {row.notes ? <p className="text-xs text-gray-500 mt-1 italic">Note: {row.notes}</p> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function OffDayRequestsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [statusOpen, setStatusOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [notesDraft, setNotesDraft] = useState({})
  const [busyId, setBusyId] = useState(null)
  const statusRef = useRef(null)

  const statuses = ['All', 'Pending', 'Approved', 'Rejected']

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOffDayRequestsEnrichedForCurrentAdmin()
      setRows(data || [])
    } catch (e) {
      setError(e?.message || 'Could not load off day requests.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handler = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const name = driverName(r).toLowerCase()
      const matchQ =
        !q ||
        name.includes(q) ||
        (r.leave_type || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
      const st = (r.status || '').toLowerCase()
      const matchSt =
        statusFilter === 'All' || st === statusFilter.toLowerCase()
      return matchQ && matchSt
    })
  }, [rows, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const setNoteFor = (id, val) => {
    setNotesDraft((prev) => ({ ...prev, [id]: val }))
  }

  const handleDecision = async (requestId, status) => {
    const notes = notesDraft[requestId] ?? ''
    setBusyId(requestId)
    setError(null)
    try {
      await updateOffDayRequestStatus(requestId, { status, adminNotes: notes })
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

  const shimmerCards = Array.from({ length: 3 })

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null)
              load()
            }}
            className="shrink-0 text-red-700 font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Off day requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review driver leave requests. When a driver has accepted jobs that run on those weekdays,
            passenger route details appear for context before you approve or reject.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.07)] overflow-visible">
        <div className="border-b border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search driver, type, or reason"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-64 max-w-full"
              />
            </div>
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => setStatusOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {statusFilter}
                <MdKeyboardArrowDown className="text-gray-400" size={16} />
              </button>
              {statusOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg z-20">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStatusFilter(s)
                        setStatusOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        statusFilter === s ? 'font-semibold text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {filtered.length} request{filtered.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            shimmerCards.map((_, i) => (
              <div
                key={`sk-${i}`}
                className="rounded-xl border border-gray-100 p-4 space-y-3"
              >
                <ShimmerBlock className="h-4 w-48 rounded-md" />
                <ShimmerBlock className="h-3 w-full max-w-md rounded-md" />
                <ShimmerBlock className="h-24 w-full rounded-lg" />
              </div>
            ))
          ) : paginated.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              <MdOutlineEventBusy className="mx-auto mb-2 text-gray-300" size={40} />
              No off day requests match your filters.
            </div>
          ) : (
            paginated.map((r) => {
              const pending = (r.status || '').toLowerCase() === 'pending'
              const contexts = r.jobContexts || []
              return (
                <article
                  key={r.id}
                  className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-4 border-b border-gray-50 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900 truncate">
                          {driverName(r)}
                        </h2>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusPillClass(r.status)}`}
                        >
                          {r.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium text-gray-700">{r.leave_type || 'Leave'}</span>
                        {' · '}
                        {formatYmd(r.start_date)}
                        {r.end_date !== r.start_date ? ` – ${formatYmd(r.end_date)}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted{' '}
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Reason
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.reason || '—'}</p>
                    </div>

                    {contexts.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <MdWorkOutline size={14} className="text-gray-400" />
                          Work on these dates (accepted jobs)
                        </p>
                        <div className="space-y-3">
                          {contexts.map((ctx) => (
                            <div
                              key={ctx.job.id}
                              className="rounded-lg border border-sky-100 bg-sky-50/40 p-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {ctx.job.job_name || 'Job'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {ctx.job.client_school_name || '—'}
                                    {ctx.job.internal_job_id
                                      ? ` · #${ctx.job.internal_job_id}`
                                      : ''}
                                  </p>
                                  {(ctx.job.semester_start || ctx.job.semester_end) && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Semester{' '}
                                      {ctx.job.semester_start
                                        ? formatYmd(String(ctx.job.semester_start).slice(0, 10))
                                        : '—'}{' '}
                                      –{' '}
                                      {ctx.job.semester_end
                                        ? formatYmd(String(ctx.job.semester_end).slice(0, 10))
                                        : '—'}
                                    </p>
                                  )}
                                </div>
                                <Link
                                  to={`/portal/jobs/${ctx.job.id}`}
                                  className="inline-flex items-center gap-0.5 text-xs font-medium text-[#005580] hover:underline shrink-0"
                                >
                                  View job
                                  <MdChevronRight size={14} className="opacity-70" />
                                </Link>
                              </div>
                              <div className="grid md:grid-cols-2 gap-3 mt-3">
                                <ScheduleDirectionBlock title="Outbound" rows={ctx.outbound} job={ctx.job} />
                                <ScheduleDirectionBlock title="Inbound" rows={ctx.inbound} job={ctx.job} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
                        No passenger schedules on these weekdays for this driver’s accepted jobs
                        (or no overlapping active job). You can still process the request on its own merits.
                      </div>
                    )}

                    {r.admin_notes && (
                      <div className="rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-2">
                        <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                          Admin notes
                        </p>
                        <p className="text-sm text-amber-950 mt-0.5 whitespace-pre-wrap">{r.admin_notes}</p>
                      </div>
                    )}

                    {pending && (
                      <div className="pt-2 border-t border-gray-100 space-y-3">
                        <div>
                          <label
                            htmlFor={`notes-${r.id}`}
                            className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"
                          >
                            Notes to driver (optional)
                          </label>
                          <textarea
                            id={`notes-${r.id}`}
                            rows={2}
                            value={notesDraft[r.id] ?? ''}
                            onChange={(e) => setNoteFor(r.id, e.target.value)}
                            placeholder="e.g. Approved — please confirm cover with dispatch."
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => handleDecision(r.id, 'approved')}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            {busyId === r.id ? 'Saving…' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => handleDecision(r.id, 'rejected')}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>

        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <MdChevronLeft size={20} />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
