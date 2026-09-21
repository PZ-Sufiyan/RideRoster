import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, 'vehicle-sample', 'How_to_complete_your_vehicle_data.pdf')

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
    doc.text('RideRoster  |  Vehicle data instructions', margin, pageHeight - 7)
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
doc.text('How to complete your vehicle data', margin, 18)
doc.setFont('helvetica', 'normal')
doc.setFontSize(11)
doc.text('Excel and document folder instructions', margin, 27)
y = 48

para('Thank you. This pack is the format we use to add your vehicles to the system. You do not enter vehicles on the website. Fill the Excel, add the documents in the folders, and send both back to us. Vehicles do not have login accounts. You can assign a driver later in the system.')

h2('What you have received')
bullet([
  'Vehicles.xlsx — one row per vehicle. Four example vehicles are already filled so you can see the format.',
  'documents/vehicles/ — one folder per vehicle. The folder name is that vehicle’s registration number.',
  'This instruction PDF.',
])
para('Please delete the four example vehicles (AB12CDE, FG34HIJ, KL56MNO and PQ78RST) before you send the pack back, including their folders. They are only examples of how to fill the form.')

h2('How to fill Vehicles.xlsx')
para('Open the Vehicles sheet.')
bullet([
  'Do not change or delete the header row (row 1).',
  'One vehicle = one row. Add as many rows as you need.',
  'Copy the company_id value from an example row onto every new row. Do not change that number.',
  'Copy the documents_folder pattern. It must match the registration number, for example: documents/vehicles/AB12CDE',
])
para('There is also a Required_Documents sheet and a Vehicle_Types sheet. body_style must match Vehicle_Types exactly.')

h2('Required information (every vehicle)')
para('These columns must be filled for every vehicle.')
table(
  ['Column', 'What to enter'],
  [
    ['taxi_license_plate_number', 'Taxi licence plate number'],
    ['registration_number', 'Vehicle registration (also used as the folder name)'],
    ['make', 'e.g. Ford'],
    ['model', 'e.g. Transit'],
    ['vehicle_colour', 'e.g. White'],
    ['year_of_first_registration', 'First registration date, YYYY-MM-DD'],
    ['licensing_type', 'e.g. Nottingham City Council'],
    ['body_style', 'Must match a value from the Vehicle_Types sheet exactly'],
    ['seating_capacity', 'Number of seats (the examples already match the body type)'],
    ['wheelchair_accessible', 'Yes or No. Must match the body type (wheelchair types = Yes)'],
    ['mot_expiry', 'MOT expiry date'],
    ['taxi_plate_expiry', 'Taxi plate expiry date'],
    ['insurance_expiry', 'Insurance expiry date'],
  ],
  { 0: { cellWidth: 52 }, 1: { cellWidth: contentWidth - 52 } },
)

h2('Dates — follow this exactly')
para('year_of_first_registration and all expiry dates must be written as YYYY-MM-DD.')
table(
  ['Accepted', 'Not accepted'],
  [
    ['2027-06-15', '15/06/2027'],
    ['2019-03-01', '15-06-2027'],
    ['2027-01-20', 'June 2027  or  15 Jun 27'],
  ],
  { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
)
para('Use the vehicle’s real dates. Do not copy the sample dates.')

h2('Vehicle type (body_style)')
para('Copy one of these values exactly. Do not shorten or rewrite them.')
table(
  ['body_style', 'Wheelchair accessible'],
  [
    ['Car - 4 seater', 'No'],
    ['People Carrier - 6 passenger', 'No'],
    ['People Carrier - 7 passenger', 'No'],
    ['Minibus - 8 passenger', 'No'],
    ['Minibus - Wheelchair ramp', 'Yes'],
    ['Minibus - Wheelchair tail lift', 'Yes'],
    ['Hackney - 5 passenger', 'No'],
    ['Hackney - 6 passenger', 'No'],
    ['Hackney - Wheelchair', 'Yes'],
  ],
  { 0: { cellWidth: contentWidth * 0.62 }, 1: { cellWidth: contentWidth * 0.38 } },
)
callout(
  'body_style and wheelchair_accessible must match.',
  'If you choose a wheelchair type (for example Minibus - Wheelchair ramp), set wheelchair_accessible to Yes. If you choose a non-wheelchair type, set it to No.',
)

h2('Document folders')
para('Create one folder per vehicle inside documents/vehicles/. The folder name must be the same registration_number as in the Excel, with no extra spaces.')
table(
  ['Excel registration_number', 'Correct folder name'],
  [['AB12CDE', 'documents/vehicles/AB12CDE/']],
  { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
)
para('Wrong examples: a folder named Ford Transit, a folder named AB 12 CDE, or a registration of ab12cde with a folder named AB12CDE if they do not match the Excel exactly. Keep Excel and folder names the same.')
para('Put that vehicle’s files inside its own folder only. Do not put all documents in one shared folder.')

h2('Required documents (every vehicle)')
para('Every vehicle must have a photo and these 5 documents. Replace the tiny example images with the real photos or PDFs. Keep the file name exactly as shown. You may only change the ending to .png, .jpg, .jpeg or .pdf.')
table(
  ['Document', 'Exact file name', 'Matching Excel expiry column'],
  [
    ['Vehicle photo', 'vehicle_photo.png', '—'],
    ['V5 (Front)', 'v5_front.png', '—'],
    ['V5 (Inside)', 'v5_inside.png', '—'],
    ['MOT certificate', 'mot_certificate.png', 'mot_expiry'],
    ['Taxi license plate document', 'taxi_license_plate.png', 'taxi_plate_expiry'],
    ['Insurance certificate', 'insurance_certificate.png', 'insurance_expiry'],
  ],
  { 0: { cellWidth: 58 }, 1: { cellWidth: 58 }, 2: { cellWidth: contentWidth - 116 } },
)
para('Do not use names like MOT.pdf or insurance scan.jpg. In the Excel, leave the document columns as those file names (already filled in the examples) and copy them onto each new row.')

h2('The four example rows')
para('Look at these, then delete them before you send the pack back.')
table(
  ['Example', 'What it shows'],
  [
    ['AB12CDE', 'Car — not wheelchair'],
    ['FG34HIJ', 'People Carrier — not wheelchair'],
    ['KL56MNO', 'Minibus with wheelchair ramp'],
    ['PQ78RST', 'Hackney wheelchair'],
  ],
  { 0: { cellWidth: 32 }, 1: { cellWidth: contentWidth - 32 } },
)
para('All four examples also include the vehicle photo and the 5 required documents.')

h2('Checklist before you send')
bullet([
  'Example rows and example folders removed.',
  'One Excel row per real vehicle.',
  'company_id copied onto every row and left unchanged.',
  'registration_number is unique and matches the folder name.',
  'body_style copied exactly from the Vehicle_Types list.',
  'wheelchair_accessible is Yes or No and matches that body type.',
  'Every vehicle has a photo plus V5 front, V5 inside, MOT, taxi plate and insurance files.',
  'year_of_first_registration, mot_expiry, taxi_plate_expiry and insurance_expiry are YYYY-MM-DD.',
])
para('If anything is missing, we will send back a list of which row, which field, or which file needs to be completed. If you are unsure about one vehicle, still send the others. We can add incomplete vehicles later once the missing item is provided.')

addFooter()
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, Buffer.from(doc.output('arraybuffer')))
console.log(`Wrote ${OUT_PATH}`)
