import React from 'react'

const END_REASON_LABEL = {
  completed: 'Completed',
  left: 'Left',
  removed: 'Removed',
  suspended: 'Suspended',
  reassigned: 'Reassigned',
  cancelled: 'Cancelled',
  rate_changed: 'Rate updated',
}

function formatPay(value) {
  if (value == null || value === '') return '—'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '—'
  return `£${amount.toFixed(2)}`
}

function formatDay(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function driverLabel(row) {
  const driver = row?.driver
  const name = [driver?.first_name, driver?.last_name].filter(Boolean).join(' ').trim()
  return name || 'Former driver'
}

export default function JobDriverPayHistory({ rows }) {
  if (!rows?.length) return null

  return (
    <div className="mt-4 pt-3 border-t border-gray-100">
      <p className="text-[12px] font-bold text-gray-700 mb-2">Approved pay history</p>
      <div className="space-y-2">
        {rows.map((row) => {
          const current = !row.ended_at
          const reason = END_REASON_LABEL[row.end_reason] || row.end_reason
          return (
            <div key={row.id} className="rounded-xl bg-gray-50 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-gray-900 truncate">{driverLabel(row)}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {formatDay(row.approved_at)}
                    {' – '}
                    {current ? 'current' : formatDay(row.ended_at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-gray-900">{formatPay(row.approved_pay)}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${current ? 'text-green-600' : 'text-gray-400'}`}>
                    {current ? 'Current' : reason}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
