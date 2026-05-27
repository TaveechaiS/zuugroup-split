// src/lib/pdf/documentPdf.ts
//
// PDF generator that uses HTML + html2canvas so Thai characters render
// correctly (browser handles complex shaping / combining marks).
// The HTML is built off-screen, captured to a canvas, then placed into
// a jsPDF A4 page. This avoids jsPDF's lack of OpenType GPOS support.

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ============================================================
// Company constants
// ============================================================
const ZUU = {
  nameEn: 'ZUU GROUP CO.,LTD.',
  address: '35/9 หมู่ 11 ถนนเลียบวารี แขวงโคกแฝด เขตหนองจอก กรุงเทพมหานคร 10530',
  phone: '061-3626565',
  taxId: '0125561035117',
}

const ISSUER_TITLE = 'รองกรรมการผู้จัดการ'

const NOTES = [
  'เครดิตการชำระเงิน 90 วัน  นับจากวันจัดส่งสินค้า',
  'สินค้ามีปัญหาหรือชำรุดเปลี่ยนให้ 100%',
  'กำหนดยืนยันราคาและโปรโมชั่นไม่น้อยกว่า 1 ปี',
]

const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

function thaiDate(d: Date | string | undefined): string {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  const day = date.getDate()
  const month = TH_MONTHS[date.getMonth()]
  const year = date.getFullYear() + 543
  return `วันที่ ${day} ${month} พ.ศ. ${year}`
}

// ============================================================
// Types
// ============================================================
export interface DocData {
  number: string
  createdAt?: string | Date
  customer: {
    company_name: string
    address?: string
    contact_name?: string
    phone?: string
    email?: string
    tax_id?: string
    drug_license_number?: string
  }
  creator?: {
    first_name?: string
    last_name?: string
  }
  items: Array<{
    name: string
    quantity: number
    unit?: string
    unit_price: number
    total_price: number
    image_url?: string
    description?: string
  }>
  subtotal?: number
  vat_percent?: number
  vat_amount?: number
  total_amount: number
  notes?: string
  contract_period_days?: number
}

const fmt = (n: number) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

// ============================================================
// Public entry points
// ============================================================
export async function generateQuotationPdf(data: DocData): Promise<Blob> {
  return await generateDocumentPdf('ใบเสนอราคา', data)
}

export async function generateOrderPdf(data: DocData): Promise<Blob> {
  return await generateDocumentPdf('คำสั่งซื้อ', data)
}

/** Build a full standalone HTML document (with embedded CSS) for the
 *  given doc data. Used by PdfPreviewModal to render an iframe preview
 *  without going through PDF rendering at all. */
export function buildQuotationHtml(data: DocData): string {
  return wrapStandalone(STYLES + buildHtml('ใบเสนอราคา', data))
}

export function buildOrderHtml(data: DocData): string {
  return wrapStandalone(STYLES + buildHtml('คำสั่งซื้อ', data))
}

function wrapStandalone(inner: string): string {
  return `<!doctype html>
<html lang="th"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet" />
<style>
  body { margin: 0; background: #e5e7eb; display: flex; justify-content: center; padding: 20px 0; }
</style>
</head><body>
${inner}
</body></html>`
}

// ============================================================
// Build HTML
// ============================================================
function buildHtml(title: string, data: DocData): string {
  const items = data.items.map((it, idx) => {
    const imgTag = it.image_url
      ? `<img class="prod-img" src="${esc(it.image_url)}" crossorigin="anonymous" alt="" />`
      : ''
    const desc = it.description
      ? esc(it.description)
      : `ราคาในใบเสนอราคาเป็นราคาต่อ${esc(it.unit ?? 'หน่วย')}`
    return `
      <tr>
        <td class="c-center">${idx + 1}</td>
        <td>
          <div class="prod-name">${esc(it.name)}</div>
          <div class="prod-desc">${desc}</div>
          ${imgTag}
        </td>
        <td class="c-center">${esc(it.quantity)}</td>
        <td class="c-center">${esc(it.unit ?? '')}</td>
        <td class="c-right">${fmt(it.unit_price)}</td>
        <td class="c-right">${fmt(it.total_price)}</td>
      </tr>`
  }).join('')

  const fullName = [data.creator?.first_name, data.creator?.last_name]
    .filter(Boolean).join(' ') || '...........................'

  const taxId = data.customer.tax_id ?? data.customer.drug_license_number ?? ''

  return `
<div class="doc">
  <!-- Header: logo + company info centered -->
  <div class="header">
    <img class="logo" src="/images/logo-quotation.png" alt="ZUU" />
    <div class="company">
      <div class="company-name">${esc(ZUU.nameEn)}</div>
      <div class="company-line">${esc(ZUU.address)}</div>
      <div class="company-line">โทรศัพท์ : ${esc(ZUU.phone)}</div>
      <div class="company-line">เลขประจำตัวผู้เสียภาษี : ${esc(ZUU.taxId)}</div>
    </div>
  </div>
  <div class="divider"></div>

  <!-- Title centered -->
  <div class="title">${esc(title)}</div>

  <!-- Date right -->
  <div class="date-row">
    <div class="date-text">${esc(thaiDate(data.createdAt))}</div>
    <div class="num-text">เลขที่ : ${esc(data.number)}</div>
  </div>

  <!-- Customer block left -->
  <div class="customer">
    <div class="row"><span class="lbl">เรียน</span>${esc(data.customer.company_name ?? '')}</div>
    ${data.customer.contact_name ? `<div class="row"><span class="lbl">ผู้ติดต่อ</span>${esc(data.customer.contact_name)}</div>` : ''}
    <div class="row"><span class="lbl">ที่อยู่</span>${esc(data.customer.address ?? '')}</div>
    <div class="row"><span class="lbl">โทรศัพท์</span>${esc(data.customer.phone ?? '')}</div>
    <div class="row"><span class="lbl">เลขประจำตัวผู้เสียภาษี :</span>${esc(taxId)}</div>
  </div>

  <div class="subtitle">บริษัทฯ มีความยินดีที่จะเสนอราคาสินค้า  ดังต่อไปนี้</div>

  <!-- Items table -->
  <table class="items">
    <thead>
      <tr>
        <th style="width: 7%;">ลำดับ</th>
        <th>รายการ</th>
        <th style="width: 9%;">จำนวน</th>
        <th style="width: 9%;">หน่วย</th>
        <th style="width: 16%;">ราคา/หน่วย<br/>รวม VAT</th>
        <th style="width: 18%;">จำนวนเงิน(บาท)<br/>รวม VAT</th>
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>

  <!-- Footer: notes left, signature right -->
  <div class="footer">
    <div class="notes">
      <div class="notes-title">หมายเหตุและเงื่อนไข</div>
      ${NOTES.map((n) => `<div class="note-item">- ${esc(n)}</div>`).join('')}
      ${data.notes ? `<div class="note-item" style="margin-top:6px;">หมายเหตุ : ${esc(data.notes)}</div>` : ''}
    </div>
    <div class="sign">
      <div class="sign-line">ลงชื่อ ........................................ ผู้เสนอราคา</div>
      <div class="sign-name">( ${esc(fullName)} )</div>
      <div class="sign-title">${esc(ISSUER_TITLE)}</div>
    </div>
  </div>
</div>
`
}

const STYLES = `
<style>
  .doc {
    font-family: 'Sarabun', 'TH Sarabun New', 'Tahoma', sans-serif;
    color: #111;
    font-size: 14px;
    line-height: 1.5;
    width: 794px;            /* ~A4 width at 96dpi */
    padding: 30px 36px;
    background: #fff;
    box-sizing: border-box;
  }
  .doc * { box-sizing: border-box; }

  /* Header */
  .header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 8px;
  }
  .logo {
    width: 100px;
    height: auto;
    object-fit: contain;
    flex-shrink: 0;
  }
  .company {
    flex: 1;
    text-align: center;
    padding-top: 4px;
  }
  .company-name {
    font-size: 18px;
    margin-bottom: 4px;
  }
  .company-line {
    font-size: 13px;
    color: #374151;
    margin: 2px 0;
  }

  .divider {
    border-bottom: 1px solid #d1d5db;
    margin: 6px 0 10px;
  }

  /* Title */
  .title {
    text-align: center;
    font-size: 22px;
    margin: 4px 0 10px;
  }

  /* Date / number */
  .date-row {
    text-align: right;
    margin-bottom: 4px;
  }
  .date-text { font-size: 14px; }
  .num-text { font-size: 12px; color: #6b7280; margin-top: 2px; }

  /* Customer */
  .customer {
    margin: 4px 0 8px;
  }
  .customer .row {
    margin: 4px 0;
    font-size: 14px;
  }
  .customer .lbl {
    display: inline-block;
    margin-right: 8px;
    color: #111;
  }

  .subtitle {
    text-align: center;
    margin: 8px 0 6px;
    font-size: 14px;
  }

  /* Table */
  table.items {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-bottom: 14px;
  }
  table.items th,
  table.items td {
    border: 1px solid #000;
    padding: 6px 8px;
    vertical-align: top;
  }
  table.items th {
    background: #f3f4f6;
    text-align: center;
    font-size: 12px;
    line-height: 1.3;
  }
  table.items .c-center { text-align: center; }
  table.items .c-right { text-align: right; }

  .prod-name { font-size: 13px; }
  .prod-desc { font-size: 12px; color: #4b5563; margin-top: 2px; }
  .prod-img {
    display: block;
    max-width: 80px;
    max-height: 70px;
    margin-top: 6px;
    object-fit: contain;
  }

  /* Footer */
  .footer {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 18px;
  }
  .notes {
    flex: 1;
    font-size: 13px;
  }
  .notes-title { margin-bottom: 4px; }
  .note-item { color: #374151; margin: 2px 0; }

  .sign {
    width: 280px;
    text-align: center;
    font-size: 14px;
  }
  .sign-line { text-align: right; margin-bottom: 8px; }
  .sign-name { margin: 4px 0; }
  .sign-title { margin: 2px 0; }
</style>
`

// ============================================================
// Convert image src to data URL so html2canvas can capture them
// even when origin is different.
// ============================================================
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(imgs.map(async (img) => {
    const src = img.getAttribute('src') ?? ''
    if (!src || src.startsWith('data:')) return
    try {
      const res = await fetch(src, { mode: 'cors' })
      if (!res.ok) { img.remove(); return }
      const blob = await res.blob()
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = reject
        r.readAsDataURL(blob)
      })
      img.setAttribute('src', dataUrl)
    } catch {
      img.remove()
    }
  }))
}

// ============================================================
// Main generator
// ============================================================
async function generateDocumentPdf(title: string, data: DocData): Promise<Blob> {
  // Build off-screen container
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed; top:0; left:-10000px; z-index:-1; opacity:0; pointer-events:none;'
  container.innerHTML = STYLES + buildHtml(title, data)
  document.body.appendChild(container)

  try {
    const docNode = container.querySelector('.doc') as HTMLElement
    // Ensure all images inside are inlined (so html2canvas can capture them
    // when CORS is restrictive)
    await inlineImages(docNode)

    // Capture
    const canvas = await html2canvas(docNode, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: 794,
    })

    // Build PDF (A4 portrait, 210x297 mm)
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 0 // canvas already has its own padding
    const usableW = pageW - margin * 2

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const imgRatio = canvas.height / canvas.width
    const imgWmm = usableW
    const imgHmm = imgWmm * imgRatio

    if (imgHmm <= pageH) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWmm, imgHmm)
    } else {
      // Multi-page: slice the canvas into page-height chunks
      const pageHeightPx = (pageH / imgWmm) * canvas.width
      let renderedHeight = 0
      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceHeight
        const ctx = sliceCanvas.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95)
        const sliceHmm = (sliceHeight / canvas.width) * imgWmm

        if (renderedHeight > 0) pdf.addPage()
        pdf.addImage(sliceData, 'JPEG', margin, margin, imgWmm, sliceHmm)
        renderedHeight += sliceHeight
      }
    }

    return pdf.output('blob')
  } finally {
    document.body.removeChild(container)
  }
}
