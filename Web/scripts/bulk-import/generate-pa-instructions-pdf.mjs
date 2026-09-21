import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, 'pa-sample', 'How_to_complete_your_PA_data.pdf')

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
    doc.text('RideRoster  |  Passenger assistant data instructions', margin, pageHeight - 7)
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
doc.text('How to complete your passenger assistant data', margin, 18)
doc.setFont('helvetica', 'normal')
doc.setFontSize(11)
doc.text('Excel and document folder instructions', margin, 27)
y = 48

para('Thank you. This pack is the format we use to add your passenger assistants (PAs) to the system. You do not enter them on the website. Fill the Excel, add the documents in the folders, and send both back to us.')

h2('What you have received')
bullet([
  'PAs.xlsx — one row per passenger assistant. Four example PAs are already filled so you can see the format.',
  'documents/pas/ — one folder per PA. The folder name is that PA’s email address.',
  'This instruction PDF.',
])
para('Please delete the four example PAs (Aisha, Nora, Tom and Lucia) before you send the pack back, including their folders. They are only examples of how to fill the form.')

h2('How to fill PAs.xlsx')
para('Open the PAs sheet.')
bullet([
  'Do not change or delete the header row (row 1).',
  'One passenger assistant = one row. Add as many rows as you need.',
  'Copy the company_id value from an example row onto every new row. Do not change that number.',
  'Copy the documents_folder pattern. It must match the PA’s email, for example: documents/pas/jane.doe@gmail.com',
])
para('There is also a Required_Documents sheet that lists every file we need.')

h2('Required information (every PA)')
para('These columns must be filled for every passenger assistant.')
table(
  ['Column', 'What to enter'],
  [
    ['first_name', 'First name'],
    ['last_name', 'Last name / surname'],
    ['email', 'Unique login email the PA can use, e.g. name@gmail.com. No two PAs can share an email.'],
    ['phone', 'Full number with country code, e.g. +447700900301'],
    ['password', 'Login password, at least 6 characters. You may use one shared temporary password for everyone.'],
    ['residential_address', 'Full home address'],
    ['emergency_contact_name', 'Emergency contact’s name'],
    ['emergency_contact_phone', 'Emergency contact’s phone, with country code'],
    ['nationality', 'e.g. British, Pakistani, Portuguese'],
    ['safeguarding_expiry', 'Safeguarding certificate expiry date'],
  ],
  { 0: { cellWidth: 48 }, 1: { cellWidth: contentWidth - 48 } },
)

h2('Dates — follow this exactly')
para('Safeguarding expiry must be written as YYYY-MM-DD.')
table(
  ['Accepted', 'Not accepted'],
  [
    ['2027-06-15', '15/06/2027'],
    ['2027-11-01', '15-06-2027'],
    ['2027-01-20', 'June 2027  or  15 Jun 27'],
  ],
  { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
)
para('Use the PA’s real expiry date. Do not copy the sample dates.')

h2('British vs other nationality')
para('This rule is important and is often missed.')
table(
  ['If the PA is…', 'nationality', 'right_to_work_code'],
  [
    ['British', 'Type British', 'Leave this empty'],
    ['Not British', 'Type their nationality, e.g. Pakistani', 'You must fill this. We cannot add the PA without it.'],
  ],
  { 0: { cellWidth: 38 }, 1: { cellWidth: 55 }, 2: { cellWidth: contentWidth - 93 } },
)

h2('Passport (optional)')
para('Passport is not required for every PA. The number and the document must always go together.')
callout(
  'If you add a passport number, you must also add the passport document.',
  'Leave passport_number empty if there is no passport, and do not add a passport file. If you enter a passport_number, put a file named passport.png (or passport.jpg / passport.pdf) in that PA’s folder. Do not send a number without the file, and do not send a file without the number.',
)

h2('Document folders')
para('Create one folder per PA inside documents/pas/. The folder name must be the same email as in the Excel, all lowercase, with no extra spaces.')
table(
  ['Excel email', 'Correct folder name'],
  [['jane.doe@gmail.com', 'documents/pas/jane.doe@gmail.com/']],
  { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
)
para('Wrong examples: a folder named Jane Doe, a folder named jane.doe, or an Excel email of Jane.Doe@gmail.com with a folder named jane.doe@gmail.com. The email and folder name must match exactly.')
para('Put that PA’s files inside their own folder only. Do not put all documents in one shared folder.')

h2('Required documents (every PA)')
para('Every PA must have a profile photo and these 3 documents. Replace the tiny example images with the real photos or PDFs. Keep the file name exactly as shown. You may only change the ending to .png, .jpg, .jpeg or .pdf.')
table(
  ['Document', 'Exact file name', 'Matching Excel expiry column'],
  [
    ['Profile photo', 'profile.png', '—'],
    ['Safeguarding Certificate', 'safeguarding_certificate.png', 'safeguarding_expiry'],
    ['Background Check Certificate', 'background_check.png', '—'],
    ['First Aid Certification', 'first_aid_certificate.png', '—'],
    ['Passport (only if number is filled)', 'passport.png', '—'],
  ],
  { 0: { cellWidth: 62 }, 1: { cellWidth: 62 }, 2: { cellWidth: contentWidth - 124 } },
)
para('Do not use names like safeguarding.jpg or First Aid.pdf. In the Excel, leave the document columns as those file names (already filled in the examples) and copy them onto each new row.')

h2('The four example rows')
para('Look at these, then delete them before you send the pack back.')
table(
  ['Example', 'What it shows'],
  [
    ['Aisha Khan', 'British, no Right to Work, no passport'],
    ['Nora Ahmed', 'Not British, Right to Work filled, passport number and passport.png'],
    ['Tom Baker', 'British, no passport'],
    ['Lucia Costa', 'Not British, Right to Work filled, no passport'],
  ],
  { 0: { cellWidth: 42 }, 1: { cellWidth: contentWidth - 42 } },
)
para('All four examples also include the profile photo and the 3 required documents.')

h2('Checklist before you send')
bullet([
  'Example rows and example folders removed.',
  'One Excel row per real passenger assistant.',
  'company_id copied onto every row and left unchanged.',
  'Every email is unique and is a real address the PA can use.',
  'Folder name is exactly that PA’s email.',
  'Every PA has a profile photo plus safeguarding, background check and first aid files.',
  'safeguarding_expiry is filled, format YYYY-MM-DD.',
  'British PAs: nationality is British, Right to Work left empty.',
  'Non-British PAs: nationality and Right to Work code both filled.',
  'If passport number is filled, passport.png (or jpg/pdf) is in that folder.',
  'If there is no passport number, there is no passport file.',
])
para('If anything is missing, we will send back a list of which row, which field, or which file needs to be completed. If you are unsure about one PA, still send the others. We can add incomplete PAs later once the missing item is provided.')

addFooter()
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, Buffer.from(doc.output('arraybuffer')))
console.log(`Wrote ${OUT_PATH}`)
