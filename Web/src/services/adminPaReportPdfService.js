import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND_RGB = [0, 77, 109]
const MUTED_RGB = [100, 116, 139]

function sectionTitle(doc, y, title) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(title, 18, y)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(18, y + 2, doc.internal.pageSize.getWidth() - 18, y + 2)
  return y + 10
}

function money(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `£${Number(n).toFixed(2)}`
}

/**
 * @param {{ companyName?: string, report: object }} opts
 */
export function buildAdminPaReportPdf({ companyName, report }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const period = report?.periodLabel || '—'
  const pa = report?.pa || {}
  const stats = report?.stats || {}

  doc.setFillColor(...BRAND_RGB)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('PA performance report', margin, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(pa.name || 'Passenger Assistant', margin, 22)
  doc.setFontSize(9)
  doc.text(
    `${companyName?.trim() || 'Company'}  ·  ${period}  ·  Generated ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`,
    margin,
    28,
  )
  doc.text('RideRoster', pageW - margin, 14, { align: 'right' })

  let y = 42
  y = sectionTitle(doc, y, 'Passenger assistant')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  const profileLines = [
    `Name: ${pa.name || '—'}`,
    `Fleet: ${pa.fleetLabel || '—'}`,
    `Status: ${pa.status || '—'}`,
    `Phone: ${pa.phone || '—'}`,
  ]
  profileLines.forEach((line, i) => doc.text(line, margin, y + i * 6))
  y += profileLines.length * 6 + 10

  y = sectionTitle(doc, y, `Summary · ${period}`)
  const summaryLines = [
    `Jobs assigned: ${Number(stats.jobsAssigned || 0).toLocaleString()}`,
    `Total sessions: ${Number(stats.totalSessions || 0).toLocaleString()}`,
    `Completed: ${Number(stats.completedSessions || 0).toLocaleString()} (${Number(stats.completionRate || 0)}%)`,
    `Morning completed: ${Number(stats.morningCompleted || 0).toLocaleString()}`,
    `Evening completed: ${Number(stats.eveningCompleted || 0).toLocaleString()}`,
    `Skipped / incomplete: ${Number(stats.skippedSessions || 0) + Number(stats.incompleteSessions || 0)}`,
    `Active days: ${Number(stats.activeDays || 0).toLocaleString()}`,
    `Approved leave requests: ${Number(stats.leaveDays || 0).toLocaleString()}`,
  ]
  if (pa.isPrivate) {
    summaryLines.push(`Estimated pay: ${money(stats.estimatedPay)}`)
  }
  summaryLines.forEach((line, i) => doc.text(line, margin, y + i * 6))
  y += summaryLines.length * 6 + 10

  if (y > 240) {
    doc.addPage()
    y = margin
  }

  y = sectionTitle(doc, y, 'Jobs breakdown')
  const jobRows = (report?.jobsBreakdown || []).map((j) => {
    const row = [
      j.jobName || '—',
      String(j.totalSessions ?? 0),
      String(j.completedSessions ?? 0),
      String(j.morningCompleted ?? 0),
      String(j.eveningCompleted ?? 0),
    ]
    if (pa.isPrivate) row.push(money(j.estimatedPay))
    return row
  })
  autoTable(doc, {
    startY: y,
    head: [
      pa.isPrivate
        ? ['Job', 'Sessions', 'Completed', 'Morning', 'Evening', 'Pay']
        : ['Job', 'Sessions', 'Completed', 'Morning', 'Evening'],
    ],
    body: jobRows.length ? jobRows : [pa.isPrivate ? ['No jobs', '—', '—', '—', '—', '—'] : ['No jobs', '—', '—', '—', '—']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 12

  if (y > 230) {
    doc.addPage()
    y = margin
  }

  y = sectionTitle(doc, y, 'Session history')
  const sessionRows = (report?.sessionHistory || []).slice(0, 40).map((s) => [
    s.date || '—',
    s.jobName || '—',
    s.direction || '—',
    s.status || '—',
  ])
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Job', 'Direction', 'Status']],
    body: sessionRows.length ? sessionRows : [['No sessions', '—', '—', '—']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    margin: { left: margin, right: margin },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...MUTED_RGB)
    doc.text(`Page ${i} of ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
  }

  return doc
}

export function downloadAdminPaReportPdf({ companyName, report, filename }) {
  const doc = buildAdminPaReportPdf({ companyName, report })
  const safePa = String(report?.pa?.name || 'pa').replace(/[^\w\-]+/g, '_').slice(0, 30)
  const period = String(report?.periodLabel || 'report').replace(/\s+/g, '_')
  doc.save(filename || `RideRoster_pa_${safePa}_${period}.pdf`)
}
