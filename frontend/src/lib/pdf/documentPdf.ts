// src/lib/pdf/documentPdf.ts
import { createThaiPdf } from './createThaiPdf'
import autoTable from 'jspdf-autotable'

interface DocData {
  number: string
  date: string
  customer: {
    company_name: string
    address?: string
    contact_name?: string
    phone?: string
    email?: string
  }
  items: Array<{
    name: string
    quantity: number
    unit?: string
    unit_price: number
    total_price: number
  }>
  subtotal?: number
  vat_percent?: number
  vat_amount?: number
  total_amount: number
  notes?: string
  contract_period_days?: number
}

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function generateQuotationPdf(data: DocData): Blob {
  return generateDocumentPdf('ใบเสนอราคา (QUOTATION)', data)
}

export function generateOrderPdf(data: DocData): Blob {
  return generateDocumentPdf('คำสั่งซื้อ (ORDER)', data)
}

function generateDocumentPdf(title: string, data: DocData): Blob {
  const doc = createThaiPdf()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header (company)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(16)
  doc.setTextColor('#2563EB')
  doc.text('ZUUGROUP', 14, 16)

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#666666')
  doc.text('ระบบจัดการตัวแทนขายยา', 14, 22)

  // Document title (right)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(14)
  doc.setTextColor('#111111')
  doc.text(title, pageWidth - 14, 16, { align: 'right' })

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(10)
  doc.text(`เลขที่: ${data.number}`, pageWidth - 14, 22, { align: 'right' })
  doc.text(`วันที่: ${data.date}`, pageWidth - 14, 27, { align: 'right' })

  // Divider line
  doc.setDrawColor('#e5e7eb')
  doc.line(14, 33, pageWidth - 14, 33)

  // Customer info
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(11)
  doc.setTextColor('#111111')
  doc.text('ข้อมูลลูกค้า', 14, 41)

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#374151')
  let y = 47
  doc.text(`บริษัท: ${data.customer.company_name}`, 14, y); y += 5
  if (data.customer.contact_name) { doc.text(`ผู้ติดต่อ: ${data.customer.contact_name}`, 14, y); y += 5 }
  if (data.customer.address) {
    const lines = doc.splitTextToSize(`ที่อยู่: ${data.customer.address}`, pageWidth - 28)
    doc.text(lines, 14, y); y += 5 * lines.length
  }
  if (data.customer.phone) { doc.text(`โทรศัพท์: ${data.customer.phone}`, 14, y); y += 5 }
  if (data.customer.email) { doc.text(`อีเมล: ${data.customer.email}`, 14, y); y += 5 }

  y += 3

  // Items table
  autoTable(doc, {
    startY: y,
    head: [['ลำดับ', 'รายการสินค้า', 'จำนวน', 'ราคา/หน่วย', 'รวม']],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      item.name,
      `${item.quantity} ${item.unit ?? ''}`,
      fmt(item.unit_price),
      fmt(item.total_price),
    ]),
    styles: { font: 'Sarabun', fontSize: 10, cellPadding: 2.5, textColor: '#374151' },
    headStyles: { font: 'Sarabun', fontStyle: 'bold', fillColor: '#2563EB', textColor: '#ffffff' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 32 },
    },
  })

  let finalY = (doc as any).lastAutoTable.finalY + 6

  // Totals (right side)
  const totalsX = pageWidth - 80
  if (data.subtotal !== undefined) {
    doc.setFont('Sarabun', 'normal')
    doc.setFontSize(10)
    doc.text('ยอดรวม:', totalsX, finalY)
    doc.text(`฿ ${fmt(data.subtotal)}`, pageWidth - 14, finalY, { align: 'right' })
    finalY += 5

    if (data.vat_amount !== undefined) {
      doc.text(`VAT (${data.vat_percent ?? 7}%):`, totalsX, finalY)
      doc.text(`฿ ${fmt(data.vat_amount)}`, pageWidth - 14, finalY, { align: 'right' })
      finalY += 5
    }
  }

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(12)
  doc.setDrawColor('#9ca3af')
  doc.line(totalsX, finalY - 1, pageWidth - 14, finalY - 1)
  finalY += 4
  doc.text('ยอดสุทธิ:', totalsX, finalY)
  doc.text(`฿ ${fmt(data.total_amount)}`, pageWidth - 14, finalY, { align: 'right' })
  finalY += 10

  // Contract & notes
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#374151')
  if (data.contract_period_days) {
    doc.text(`ระยะเวลาสัญญา: ${data.contract_period_days} วัน`, 14, finalY); finalY += 5
  }
  if (data.notes) {
    const lines = doc.splitTextToSize(`หมายเหตุ: ${data.notes}`, pageWidth - 28)
    doc.text(lines, 14, finalY); finalY += 5 * lines.length
  }

  // Footer signatures
  const footerY = doc.internal.pageSize.getHeight() - 30
  doc.setDrawColor('#9ca3af')
  doc.line(20, footerY, 80, footerY)
  doc.line(pageWidth - 80, footerY, pageWidth - 20, footerY)
  doc.setFontSize(9)
  doc.setTextColor('#6b7280')
  doc.text('ผู้จัดทำ', 50, footerY + 5, { align: 'center' })
  doc.text('ผู้อนุมัติ', pageWidth - 50, footerY + 5, { align: 'center' })

  return doc.output('blob')
}
