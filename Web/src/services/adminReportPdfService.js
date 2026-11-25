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

/**
 * @param {{ companyName?: string, report: object }} opts
 */
export function buildAdminMonthlyReportPdf({ companyName, report }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const innerW = pageW - margin * 2
  const period = report?.periodLabel || '—'

  doc.setFillColor(...BRAND_RGB)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Monthly performance report', margin, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(companyName?.trim() || 'Company', margin, 22)
  doc.setFontSize(9)
  doc.text(`${period}  ·  Generated ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`, margin, 28)
  doc.text('RideRoster', pageW - margin, 14, { align: 'right' })

  let y = 42
  y = sectionTitle(doc, y, `Summary · ${period}`)

  const stats = report?.stats || {}
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  const summaryLines = [
    `Total jobs: ${Number(stats.totalJobs || 0).toLocaleString()}`,
    `Total drivers: ${Number(stats.totalDrivers || 0).toLocaleString()}`,
    `Total PAs: ${Number(stats.totalPas || 0).toLocaleString()}`,
    `Total sessions: ${Number(stats.totalSessions || 0).toLocaleString()} (morning ${Number(stats.morningSessions || 0).toLocaleString()} · evening ${Number(stats.eveningSessions || 0).toLocaleString()})`,
  ]
  summaryLines.forEach((line, i) => {
    doc.text(line, margin, y + i * 6)
  })
  y += summaryLines.length * 6 + 10

  y = sectionTitle(doc, y, 'Staff performance')

  const staffRows = (report?.staff || []).map((s) => [
    s.name || '—',
    s.role || '—',
    String(s.jobsAssigned ?? 0),
    String(s.totalSessions ?? 0),
    String(s.morningSessions ?? 0),
    String(s.eveningSessions ?? 0),
    s.status || '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Name', 'Role', 'Jobs', 'Sessions', 'Morning', 'Evening', 'Status']],
    body: staffRows.length ? staffRows : [['No staff data', '—', '—', '—', '—', '—', '—']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 12

  if (y > 240) {
    doc.addPage()
    y = margin
  }

  y = sectionTitle(doc, y, 'Top 5 sessions completed')
  const topRows = (report?.topStaffBySessions || []).map((s, i) => [
    String(i + 1),
    s.name || '—',
    s.role || '—',
    String(s.value ?? 0),
  ])
  autoTable(doc, {
    startY: y,
    head: [['#', 'Name', 'Role', 'Sessions']],
    body: topRows.length ? topRows : [['—', 'No completed sessions', '—', '0']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 12 }, 3: { halign: 'right' } },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 12

  if (y > 240) {
    doc.addPage()
    y = margin
  }

  y = sectionTitle(doc, y, 'Morning vs evening sessions')
  const weekRows = (report?.morningVsEveningByWeek || []).map((w) => [
    w.label || '—',
    String(w.morning ?? 0),
    String(w.evening ?? 0),
  ])
  autoTable(doc, {
    startY: y,
    head: [['Week', 'Morning', 'Evening']],
    body: weekRows.length ? weekRows : [['—', '0', '0']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
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

export function downloadAdminMonthlyReportPdf({ companyName, report, filename }) {
  const doc = buildAdminMonthlyReportPdf({ companyName, report })
  const safe = String(companyName || 'company').replace(/[^\w\-]+/g, '_').slice(0, 40)
  const period = String(report?.periodLabel || 'report').replace(/\s+/g, '_')
  doc.save(filename || `RideRoster_report_${safe}_${period}.pdf`)
}
