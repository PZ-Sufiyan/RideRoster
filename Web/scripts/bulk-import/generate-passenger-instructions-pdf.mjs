import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, 'passenger-sample', 'How_to_complete_your_passenger_data.pdf')

const NAVY = [0, 85, 128]
const TEXT = [33, 37, 41]
const MUTED = [73, 80, 87]
const LINE = [222, 226, 230]
const HEAD_BG = [0, 85, 128]
const ROW_ALT = [248, 250, 252]
const WARN_BG = [255, 247, 237]

const doc = new jsPDF({ unit: 'mm', format: 'a4' })
const pageWidth = doc.internal.pageSize.getWidth()
const pageHeight = doc.internal.pageSize.getHeight()
const margin = 16
const contentWidth = pageWidth - margin * 2
let y = 0

function ensureSpace(needed = 18) {
  if (y + needed > pageHeight - 18) {
    doc.addPage()
    y = 18
  }
}

function addFooter() {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('RideRoster  |  Passenger data instructions', margin, pageHeight - 7)
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }
}

function h2(text) {
  ensureSpace(16)
  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...NAVY)
  doc.text(text, margin, y)
  y += 2
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + 42, y)
  y += 7
}

function para(text) {
  ensureSpace(14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...TEXT)
  const lines = doc.splitTextToSize(text, contentWidth)
  doc.text(lines, margin, y)
  y += lines.length * 5 + 3
}

function bullet(items) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...TEXT)
  for (const item of items) {
    const lines = doc.splitTextToSize(item, contentWidth - 8)
    ensureSpace(lines.length * 5 + 4)
    doc.setFillColor(...NAVY)
    doc.circle(margin + 2, y - 1.2, 0.9, 'F')
    doc.text(lines, margin + 7, y)
    y += lines.length * 5 + 1.5
  }
  y += 2
}

function callout(title, body) {
  const bodyLines = doc.splitTextToSize(body, contentWidth - 10)
  const height = 8 + bodyLines.length * 5 + 4
  ensureSpace(height + 4)
  doc.setFillColor(...WARN_BG)
  doc.setDrawColor(234, 88, 12)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, y, contentWidth, height, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(154, 52, 18)
  doc.text(title, margin + 5, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT)
  doc.text(bodyLines, margin + 5, y + 12)
  y += height + 5
}

function table(head, body, columnStyles = {}) {
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.4,
      textColor: TEXT,
      lineColor: LINE,
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: HEAD_BG,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    columnStyles,
    didDrawPage: (data) => {
      y = data.cursor.y
    },
  })
  y = doc.lastAutoTable.finalY + 6
}

doc.setFillColor(...NAVY)
doc.rect(0, 0, pageWidth, 36, 'F')
doc.setFont('helvetica', 'bold')
doc.setFontSize(18)
doc.setTextColor(255, 255, 255)
doc.text('How to complete your passenger data', margin, 18)
doc.setFont('helvetica', 'normal')
doc.setFontSize(11)
doc.text('Excel instructions', margin, 27)
y = 48

para('Thank you. This pack is the format we use to add your passengers to the system. You do not enter passengers on the website. Fill the Excel and send it back to us. Passengers do not have login accounts and there is no document folder.')

h2('What you have received')
bullet([
  'Passengers.xlsx — one row per passenger. Four example passengers are already filled so you can see the format.',
  'This instruction PDF.',
])
para('Please delete the four example passengers (Oliver, Amelia, Noah and Isla) before you send the pack back. They are only examples of how to fill the form.')

h2('How to fill Passengers.xlsx')
para('Open the Passengers sheet.')
bullet([
  'Do not change or delete the header row (row 1).',
  'One passenger = one row. Add as many rows as you need.',
  'Copy the company_id value from an example row onto every new row. Do not change that number.',
])

h2('Required information (every passenger)')
para('These columns must be filled for every passenger.')
table(
  ['Column', 'What to enter'],
  [
    ['first_name', 'First name'],
    ['last_name', 'Surname'],
    ['email', 'Unique email, e.g. name@gmail.com. No two passengers can share an email.'],
    ['contact_number_1', 'Main phone, with country code, e.g. +447700900501'],
    ['primary_pickup_address', 'Home / pickup address'],
    ['primary_pickup_postcode', 'Pickup postcode'],
    ['primary_pickup_latitude', 'Pickup latitude (number)'],
    ['primary_pickup_longitude', 'Pickup longitude (number)'],
    ['pickup_time', 'Pickup time as HH:MM, e.g. 07:30'],
    ['educational_site_address', 'School / site address'],
    ['educational_site_postcode', 'School / site postcode'],
    ['educational_site_latitude', 'School latitude (number)'],
    ['educational_site_longitude', 'School longitude (number)'],
    ['dropoff_time', 'Drop-off time as HH:MM, e.g. 15:15'],
    ['wheelchair_required', 'Yes or No'],
    ['harness_required', 'Yes or No'],
  ],
  { 0: { cellWidth: 52 }, 1: { cellWidth: contentWidth - 52 } },
)

h2('Weekly schedule')
para('At least one day must be Yes. Use Yes or No in these columns: schedule_mon, schedule_tue, schedule_wed, schedule_thu, schedule_fri, schedule_sat, schedule_sun.')

h2('Times')
para('pickup_time and dropoff_time must be HH:MM.')
table(
  ['Accepted', 'Not accepted'],
  [
    ['07:30', '7.30'],
    ['15:15', '3:15 PM'],
    ['08:00', '8am'],
  ],
  { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
)

h2('Latitude and longitude — required')
para('Every passenger must have coordinates for the primary pickup and the educational site. These go onto the passenger record so the map and routing can work.')
table(
  ['Location', 'Latitude column', 'Longitude column'],
  [
    ['Primary pickup', 'primary_pickup_latitude', 'primary_pickup_longitude'],
    ['Educational site', 'educational_site_latitude', 'educational_site_longitude'],
  ],
  { 0: { cellWidth: 50 }, 1: { cellWidth: 64 }, 2: { cellWidth: contentWidth - 114 } },
)
callout(
  'Do not leave pickup or school lat/long empty.',
  'Use decimal numbers, for example 53.4812829 and -2.2472267. You can copy these from Google Maps (right-click the pin). Do not use degrees/minutes, and do not swap latitude with longitude.',
)

h2('Secondary pickup and respite (optional)')
para('These are optional extra locations. If you use one, you must fill address, postcode, latitude and longitude together. If you do not use it, leave all four columns empty.')
table(
  ['If using…', 'Fill all of these'],
  [
    ['Secondary pickup', 'secondary_pickup_address, secondary_pickup_postcode, secondary_pickup_latitude, secondary_pickup_longitude'],
    ['Respite', 'respite_address, respite_postcode, respite_latitude, respite_longitude'],
  ],
  { 0: { cellWidth: 42 }, 1: { cellWidth: contentWidth - 42 } },
)
para('Do not send an extra address without coordinates, and do not send coordinates without the address and postcode.')

h2('Optional columns')
table(
  ['Column', 'What to enter'],
  [
    ['contact_number_2', 'Second phone number, or leave empty'],
    ['notes', 'Any extra notes, or leave empty'],
  ],
  { 0: { cellWidth: 42 }, 1: { cellWidth: contentWidth - 42 } },
)

h2('The four example rows')
para('Look at these, then delete them before you send the pack back.')
table(
  ['Example', 'What it shows'],
  [
    ['Oliver Wright', 'Weekdays, no wheelchair, no harness'],
    ['Amelia Hughes', 'Wheelchair required'],
    ['Noah Patel', 'Harness required, Mon/Wed/Fri'],
    ['Isla Bennett', 'Secondary pickup + respite, includes Saturday'],
  ],
  { 0: { cellWidth: 42 }, 1: { cellWidth: contentWidth - 42 } },
)
para('All four examples include primary and educational lat/long. Isla also shows how to fill secondary pickup and respite with coordinates.')

h2('Checklist before you send')
bullet([
  'Example rows removed.',
  'One Excel row per real passenger.',
  'company_id copied onto every row and left unchanged.',
  'Every email is unique.',
  'Pickup and drop-off times are HH:MM.',
  'At least one schedule day is Yes.',
  'wheelchair_required and harness_required are Yes or No.',
  'Primary pickup has address, postcode, latitude and longitude.',
  'Educational site has address, postcode, latitude and longitude.',
  'If secondary pickup is used, all four secondary columns are filled.',
  'If respite is used, all four respite columns are filled.',
])
para('If anything is missing, we will send back a list of which row and which field needs to be completed. If you are unsure about one passenger, still send the others. We can add incomplete passengers later once the missing item is provided.')

addFooter()
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, Buffer.from(doc.output('arraybuffer')))
console.log(`Wrote ${OUT_PATH}`)
