import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, 'sample', 'How_to_complete_your_driver_data.pdf')

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
    doc.text('RideRoster  |  Driver data instructions', margin, pageHeight - 7)
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }
}

function h1(text) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...NAVY)
  doc.text(text, margin, y)
  y += 8
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

// Cover header
doc.setFillColor(...NAVY)
doc.rect(0, 0, pageWidth, 36, 'F')
doc.setFont('helvetica', 'bold')
doc.setFontSize(18)
doc.setTextColor(255, 255, 255)
doc.text('How to complete your driver data', margin, 18)
doc.setFont('helvetica', 'normal')
doc.setFontSize(11)
doc.text('Excel and document folder instructions', margin, 27)
y = 48

para('Thank you. This pack is the format we use to add your drivers to the system. You do not enter drivers on the website. Fill the Excel, add the documents in the folders, and send both back to us.')

h2('What you have received')
bullet([
  'Drivers.xlsx — one row per driver. Four example drivers are already filled so you can see the format.',
  'documents/drivers/ — one folder per driver. The folder name is that driver’s email address.',
  'This instruction PDF.',
])
para('Please delete the four example drivers (Ahmed, Fatima, James and Maria) before you send the pack back, including their folders. They are only examples of how to fill the form.')

h2('How to fill Drivers.xlsx')
para('Open the Drivers sheet.')
bullet([
  'Do not change or delete the header row (row 1).',
  'One driver = one row. Add as many rows as you need.',
  'Copy the company_id value from an example row onto every new row. Do not change that number.',
  'Copy the documents_folder pattern. It must match the driver’s email, for example: documents/drivers/john.smith@gmail.com',
])
para('There is also a Required_Documents sheet that lists every file we need.')

h2('Required information (every driver)')
para('These columns must be filled for every driver.')
table(
  ['Column', 'What to enter'],
  [
    ['first_name', 'First name'],
    ['last_name', 'Last name'],
    ['email', 'Unique login email the driver can use, e.g. name@gmail.com. No two drivers can share an email.'],
    ['phone', 'Full number with country code, e.g. +447700900101'],
    ['password', 'Login password, at least 6 characters. You may use one shared temporary password for everyone.'],
    ['residential_address', 'Full home address'],
    ['emergency_contact_name', 'Emergency contact’s name'],
    ['emergency_contact_phone', 'Emergency contact’s phone, with country code'],
    ['nationality', 'e.g. British, Pakistani, Portuguese'],
    ['license_no', 'Driving licence number'],
    ['dbs_service_update_id', 'DBS Update Service ID'],
    ['license_expiry', 'Driving licence expiry date'],
    ['taxi_badge_expiry', 'Taxi badge expiry date'],
    ['dbs_expiry', 'DBS certificate expiry date'],
    ['safeguarding_expiry', 'Safeguarding certificate expiry date'],
  ],
  { 0: { cellWidth: 48 }, 1: { cellWidth: contentWidth - 48 } },
)

h2('Dates — follow this exactly')
para('All expiry dates must be written as YYYY-MM-DD.')
table(
  ['Accepted', 'Not accepted'],
  [
    ['2027-06-15', '15/06/2027'],
    ['2027-11-01', '15-06-2027'],
    ['2027-01-20', 'June 2027  or  15 Jun 27'],
  ],
  { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
)
para('Use the driver’s real expiry date. Do not copy the sample dates.')

h2('British vs other nationality')
para('This rule is important and is often missed.')
table(
  ['If the driver is…', 'nationality', 'right_to_work_code'],
  [
    ['British', 'Type British', 'Leave this empty'],
    ['Not British', 'Type their nationality, e.g. Pakistani', 'You must fill this. We cannot add the driver without it.'],
  ],
  { 0: { cellWidth: 38 }, 1: { cellWidth: 55 }, 2: { cellWidth: contentWidth - 93 } },
)

h2('Passport (optional)')
para('Passport is not required for every driver. The number and the document must always go together.')
callout(
  'If you add a passport number, you must also add the passport document.',
  'Leave passport_number empty if there is no passport, and do not add a passport file. If you enter a passport_number, put a file named passport.png (or passport.jpg / passport.pdf) in that driver’s folder. Do not send a number without the file, and do not send a file without the number.',
)

h2('Document folders')
para('Create one folder per driver inside documents/drivers/. The folder name must be the same email as in the Excel, all lowercase, with no extra spaces.')
table(
  ['Excel email', 'Correct folder name'],
  [
    ['john.smith@gmail.com', 'documents/drivers/john.smith@gmail.com/'],
  ],
  { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
)
para('Wrong examples: a folder named John Smith, a folder named john.smith, or an Excel email of John.Smith@gmail.com with a folder named john.smith@gmail.com. The email and folder name must match exactly.')
para('Put that driver’s files inside their own folder only. Do not put all documents in one shared folder.')

h2('Required documents (every driver)')
para('Every driver must have a profile photo and these 7 documents. Replace the tiny example images with the real photos or PDFs. Keep the file name exactly as shown. You may only change the ending to .png, .jpg, .jpeg or .pdf.')
table(
  ['Document', 'Exact file name', 'Matching Excel expiry column'],
  [
    ['Profile photo', 'profile.png', '—'],
    ['Driving License (Front)', 'driving_license_front.png', 'license_expiry'],
    ['Driving License (Back)', 'driving_license_back.png', 'license_expiry'],
    ['Taxi Badge (Front)', 'taxi_badge_front.png', 'taxi_badge_expiry'],
    ['Taxi Badge (Back)', 'taxi_badge_back.png', 'taxi_badge_expiry'],
    ['DBS Certificate (Front)', 'dbs_certificate_front.png', 'dbs_expiry'],
    ['DBS Certificate (Back)', 'dbs_certificate_back.png', 'dbs_expiry'],
    ['Safeguarding Certificate', 'safeguarding_certificate.png', 'safeguarding_expiry'],
    ['Passport (only if number is filled)', 'passport.png', '—'],
  ],
  { 0: { cellWidth: 58 }, 1: { cellWidth: 62 }, 2: { cellWidth: contentWidth - 120 } },
)
para('Do not use names like license front.jpg or DBS.pdf. In the Excel, leave the document columns as those file names (already filled in the examples) and copy them onto each new row.')

h2('The four example rows')
para('Look at these, then delete them before you send the pack back.')
table(
  ['Example', 'What it shows'],
  [
    ['Ahmed Khan', 'British, no Right to Work, no passport'],
    ['Fatima Ali', 'Not British, Right to Work filled, passport number and passport.png'],
    ['James Wilson', 'British, no passport'],
    ['Maria Santos', 'Not British, Right to Work filled, no passport'],
  ],
  { 0: { cellWidth: 42 }, 1: { cellWidth: contentWidth - 42 } },
)
para('All four examples also include the profile photo and the 7 required documents.')

h2('Checklist before you send')
bullet([
  'Example rows and example folders removed.',
  'One Excel row per real driver.',
  'company_id copied onto every row and left unchanged.',
  'Every email is unique and is a real address the driver can use.',
  'Folder name is exactly that driver’s email.',
  'Every driver has a profile photo plus the 7 required documents.',
  'All four expiry dates are filled, format YYYY-MM-DD.',
  'British drivers: nationality is British, Right to Work left empty.',
  'Non-British drivers: nationality and Right to Work code both filled.',
  'If passport number is filled, passport.png (or jpg/pdf) is in that folder.',
  'If there is no passport number, there is no passport file.',
])
para('If anything is missing, we will send back a list of which row, which field, or which file needs to be completed. If you are unsure about one driver, still send the others. We can add incomplete drivers later once the missing item is provided.')

addFooter()
fs.writeFileSync(OUT_PATH, Buffer.from(doc.output('arraybuffer')))
console.log(`Wrote ${OUT_PATH}`)
