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
 * Builds a branded PDF from admin dashboard payload ({@link getAdminCompanyDashboard}).
 * @param {{ companyName?: string, data: object }} opts
 * @returns {jsPDF}
 */
export function buildAdminDashboardReportPdf({ companyName, data }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const innerW = pageW - margin * 2

  doc.setFillColor(...BRAND_RGB)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Operations dashboard report', margin, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(companyName?.trim() || 'Company', margin, 22)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}`, margin, 28)

  doc.setTextColor(...MUTED_RGB)
  doc.text('RideRoster', pageW - margin, 14, { align: 'right' })

  let y = 42

  doc.setTextColor(15, 23, 42)
  y = sectionTitle(doc, y, 'Summary')

  const fleet = data?.fleetHeadline ?? 0
  const activeJobs = data?.activeJobsCount ?? 0

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  const summaryLines = [
    `Total vehicles: ${Number(fleet).toLocaleString()}`,
    `Active jobs (non-draft, non-completed): ${Number(activeJobs).toLocaleString()}`,
  ]
  summaryLines.forEach((line, i) => {
    doc.text(line, margin, y + i * 6)
  })
  y += summaryLines.length * 6 + 8

  y = sectionTitle(doc, y, 'Fleet distribution (company vs private)')

  const dist = data?.fleetDistribution || []
  const totalFleet = dist.reduce((s, x) => s + (x.count || 0), 0)
  const fleetRows = dist.map((row) => {
    const pct = totalFleet > 0 ? Math.round(((row.count || 0) / totalFleet) * 1000) / 10 : 0
    return [row.label || '—', String(row.count ?? 0), `${pct}%`]
  })

  autoTable(doc, {
    startY: y,
    head: [['Fleet', 'Vehicles', 'Share']],
    body: fleetRows.length ? fleetRows : [['No vehicles yet', '—', '—']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: innerW * 0.5 }, 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 12

  if (y > 250) {
    doc.addPage()
    y = margin
  }

  y = sectionTitle(doc, y, 'Active jobs by month (last 6 months)')

  const monthRows = (data?.jobsByMonth || []).map((m) => [m.label || '—', String(m.count ?? 0)])

  autoTable(doc, {
    startY: y,
    head: [['Month', 'Active jobs']],
    body: monthRows.length ? monthRows : [['—', '0']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 12

  if (y > 230) {
    doc.addPage()
    y = margin
  }

  y = sectionTitle(doc, y, 'Recent activity')

  const actRows = (data?.recentActivities || []).map((a) => [a.text || '—', a.timeLabel || '—'])

  autoTable(doc, {
    startY: y,
    head: [['Activity', 'When']],
    body: actRows.length ? actRows : [['No recent activity', '—']],
    theme: 'striped',
    headStyles: { fillColor: BRAND_RGB, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: innerW * 0.72 } },
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

/**
 * @param {{ companyName?: string, data: object, filename?: string }} opts
 */
export function downloadAdminDashboardReportPdf(opts) {
  const doc = buildAdminDashboardReportPdf(opts)
  const safe = (opts.companyName || 'company').replace(/[^\w-]+/g, '_').slice(0, 40)
  const day = new Date().toISOString().slice(0, 10)
  const name = opts.filename || `RideRoster_dashboard_${safe}_${day}.pdf`
  doc.save(name)
}
