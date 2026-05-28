// src/lib/pdf/documentPdf.ts
//
// PDF generator: HTML + html2canvas (so Thai shaping is correct).
// Output is A4 portrait with proper multi-page support:
//   - Page 1: header, customer block, items chunk, page-N/Total footer
//   - Page 2..N-1: header, items chunk, page-N/Total footer
//   - Last page: header, items chunk, notes + signature, page-N/Total footer

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

const DEFAULT_ISSUER_TITLE = 'รองกรรมการผู้จัดการ'
const ROLE_TITLE: Record<string, string> = {
  admin:   'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  sales:   'พนักงานขาย',
  cfo:     'ผู้บริหาร',
}
function issuerTitle(role?: string | null): string {
  if (!role) return DEFAULT_ISSUER_TITLE
  return ROLE_TITLE[role] ?? DEFAULT_ISSUER_TITLE
}

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
// Pagination — how many items fit per page.
// Two profiles: with-images (bigger rows) vs text-only (smaller rows).
// Notes + signature appear on EVERY page. Totals box appears only on
// the last page.
// ============================================================
const WITH_IMG = { first: 4, middle: 6, last: 4, only: 4 }
const TEXT_ONLY = { first: 8, middle: 12, last: 8, only: 10 }

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
    role?: string
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
  include_vat?: boolean
  discount_percent?: number
  discount_amount?: number
  other_label?: string | null
  other_amount?: number
  total_amount: number
  notes?: string
  contract_period_days?: number
}

const fmt = (n: number) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

// ============================================================
// Image loading (URL → data URL, parallel, cached per call)
// ============================================================
async function loadImageDataUrl(url: string | undefined | null): Promise<string | null> {
  if (!url) return null
  if (url.startsWith('data:')) return url
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ============================================================
// Public entry points
// ============================================================
export async function generateQuotationPdf(data: DocData): Promise<Blob> {
  return await generateDocumentPdf('ใบเสนอราคา', data)
}

export async function generateOrderPdf(data: DocData): Promise<Blob> {
  return await generateDocumentPdf('คำสั่งซื้อ', data)
}

export function buildQuotationHtml(data: DocData): string {
  return wrapStandalone(STYLES + buildAllPagesHtml('ใบเสนอราคา', data))
}

export function buildOrderHtml(data: DocData): string {
  return wrapStandalone(STYLES + buildAllPagesHtml('คำสั่งซื้อ', data))
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
  body { margin: 0; background: #e5e7eb; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 16px; }
</style>
</head><body>
${inner}
</body></html>`
}

// ============================================================
// Merge duplicate items (same product + same price) into one row
// ============================================================
function mergeDuplicates(items: DocData['items']): DocData['items'] {
  const map = new Map<string, any>()
  for (const it of items) {
    const key = `${it.name}|${it.unit_price}|${it.unit ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.quantity += it.quantity
      existing.total_price += it.total_price
    } else {
      map.set(key, { ...it })
    }
  }
  return Array.from(map.values())
}

// ============================================================
// Page chunking — adapts items-per-page based on image presence
// ============================================================
function chunkItems(items: DocData['items']): DocData['items'][] {
  const hasImages = items.some((it) => !!it.image_url)
  const sz = hasImages ? WITH_IMG : TEXT_ONLY

  if (items.length === 0) return [[]]
  if (items.length <= sz.only) return [items]

  const pages: DocData['items'][] = []
  pages.push(items.slice(0, sz.first))
  let i = sz.first
  while (i < items.length) {
    const remaining = items.length - i
    if (remaining <= sz.last) {
      pages.push(items.slice(i))
      break
    }
    pages.push(items.slice(i, i + sz.middle))
    i += sz.middle
  }
  return pages
}

// ============================================================
// Render one page's HTML
// ============================================================
interface PageContext {
  isFirst: boolean
  isLast: boolean
  pageNum: number
  totalPages: number
}

function buildPageHtml(
  title: string,
  data: DocData,
  pageItems: DocData['items'],
  itemStartIdx: number,
  ctx: PageContext,
): string {
  const itemsHtml = pageItems.map((it, i) => {
    const overallIdx = itemStartIdx + i + 1
    const imgTag = it.image_url
      ? `<img class="prod-img" src="${esc(it.image_url)}" crossorigin="anonymous" alt="" />`
      : ''
    const desc = it.description
      ? esc(it.description)
      : `ราคาในใบเสนอราคาเป็นราคาต่อ${esc(it.unit ?? 'หน่วย')}`
    return `
      <tr>
        <td class="c-center">${overallIdx}</td>
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

  // ----- Header (every page) -----
  const headerHtml = `
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

    <div class="title">${esc(title)}${ctx.isFirst ? '' : ' (ต่อ)'}</div>

    <div class="date-row">
      <div class="date-text">${esc(thaiDate(data.createdAt))}</div>
      <div class="num-text">เลขที่ : ${esc(data.number)}</div>
    </div>`

  // ----- Customer block (first page only) -----
  const customerHtml = ctx.isFirst ? `
    <div class="customer">
      <div class="row"><span class="lbl">เรียน</span>${esc(data.customer.company_name ?? '')}</div>
      ${data.customer.contact_name ? `<div class="row"><span class="lbl">ผู้ติดต่อ</span>${esc(data.customer.contact_name)}</div>` : ''}
      <div class="row"><span class="lbl">ที่อยู่</span>${esc(data.customer.address ?? '')}</div>
      <div class="row"><span class="lbl">โทรศัพท์</span>${esc(data.customer.phone ?? '')}</div>
      <div class="row"><span class="lbl">เลขประจำตัวผู้เสียภาษี :</span>${esc(taxId)}</div>
    </div>
    <div class="subtitle">บริษัทฯ มีความยินดีที่จะเสนอราคาสินค้า  ดังต่อไปนี้</div>
  ` : ''

  // ----- Items table (always shown) -----
  const tableHtml = `
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
      <tbody>${itemsHtml}</tbody>
    </table>`

  // ----- Totals box (last page only — it's a summary) -----
  const discountTotal =
    (data.subtotal ?? 0) * ((data.discount_percent ?? 0) / 100) + (data.discount_amount ?? 0)
  const totalsHtml = ctx.isLast ? `
    <div class="totals">
      ${data.subtotal !== undefined ? `<div class="totals-row"><span>ยอดรวมก่อนปรับ</span><span>${fmt(data.subtotal)}</span></div>` : ''}
      ${discountTotal > 0 ? `<div class="totals-row" style="color:#dc2626"><span>ส่วนลด</span><span>-${fmt(discountTotal)}</span></div>` : ''}
      ${data.vat_amount !== undefined && data.vat_amount > 0 ? `<div class="totals-row"><span>VAT (${data.vat_percent ?? 7}%)</span><span>${fmt(data.vat_amount)}</span></div>` : ''}
      ${(data.other_amount ?? 0) > 0 ? `<div class="totals-row"><span>${esc(data.other_label || 'อื่นๆ')}</span><span>${fmt(data.other_amount ?? 0)}</span></div>` : ''}
      <div class="totals-row totals-grand"><span>ยอดสุทธิ (บาท)</span><span>${fmt(data.total_amount)}</span></div>
    </div>
  ` : ''

  // ----- Notes + Signature (EVERY page) -----
  const footerHtml = `
    <div class="footer">
      <div class="notes">
        <div class="notes-title">หมายเหตุและเงื่อนไข</div>
        ${NOTES.map((n) => `<div class="note-item">- ${esc(n)}</div>`).join('')}
        ${ctx.isLast && data.notes ? `<div class="note-item" style="margin-top:6px;">หมายเหตุ : ${esc(data.notes)}</div>` : ''}
        ${ctx.isLast && data.contract_period_days ? `<div class="note-item">ระยะเวลาสัญญา : ${data.contract_period_days} วัน</div>` : ''}
      </div>
      <div class="sign">
        <div class="sign-line">ลงชื่อ ........................................ ผู้เสนอราคา</div>
        <div class="sign-name">( ${esc(fullName)} )</div>
        <div class="sign-title">${esc(issuerTitle(data.creator?.role))}</div>
      </div>
    </div>`

  // ----- Page footer -----
  const pageFooterHtml = `
    <div class="page-footer">
      หน้า ${ctx.pageNum} / ${ctx.totalPages}
    </div>`

  return `
<div class="doc">
  <div class="doc-body">
    ${headerHtml}
    ${customerHtml}
    ${tableHtml}
    ${totalsHtml}
    ${footerHtml}
  </div>
  ${pageFooterHtml}
</div>`
}

function buildAllPagesHtml(title: string, data: DocData): string {
  const merged = mergeDuplicates(data.items)
  const pages = chunkItems(merged)
  const total = pages.length
  let startIdx = 0
  return pages.map((pageItems, i) => {
    const html = buildPageHtml(title, data, pageItems, startIdx, {
      isFirst: i === 0,
      isLast: i === total - 1,
      pageNum: i + 1,
      totalPages: total,
    })
    startIdx += pageItems.length
    return html
  }).join('')
}

// ============================================================
// Styles
// ============================================================
const STYLES = `
<style>
  .doc {
    font-family: 'Sarabun', 'TH Sarabun New', 'Tahoma', sans-serif;
    color: #111;
    font-size: 14px;
    line-height: 1.5;
    width: 794px;            /* A4 width at 96dpi */
    height: 1123px;          /* A4 height at 96dpi */
    padding: 24px 36px 20px 36px;
    background: #fff;
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .doc * { box-sizing: border-box; }
  .doc-body { flex: 1; min-height: 0; }

  /* Header */
  .header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 4px;
  }
  .logo { width: 88px; height: auto; object-fit: contain; flex-shrink: 0; }
  .company { flex: 1; text-align: center; padding-top: 4px; }
  .company-name { font-size: 17px; margin-bottom: 4px; }
  .company-line { font-size: 12px; color: #374151; margin: 2px 0; }

  .divider { border-bottom: 1px solid #d1d5db; margin: 4px 0 8px; }

  /* Title */
  .title { text-align: center; font-size: 20px; margin: 2px 0 6px; }

  /* Date / number */
  .date-row { text-align: right; margin-bottom: 4px; }
  .date-text { font-size: 13px; }
  .num-text { font-size: 11px; color: #6b7280; margin-top: 2px; }

  /* Customer */
  .customer { margin: 2px 0 6px; }
  .customer .row { margin: 3px 0; font-size: 13px; }
  .customer .lbl { display: inline-block; margin-right: 8px; color: #111; }

  .subtitle { text-align: center; margin: 6px 0 4px; font-size: 13px; }

  /* Table */
  table.items {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 8px;
  }
  table.items th, table.items td {
    border: 1px solid #000;
    padding: 5px 7px;
    vertical-align: top;
  }
  table.items th {
    background: #f3f4f6;
    text-align: center;
    font-size: 11px;
    line-height: 1.3;
  }
  table.items .c-center { text-align: center; }
  table.items .c-right { text-align: right; }

  .prod-name { font-size: 12px; }
  .prod-desc { font-size: 11px; color: #4b5563; margin-top: 2px; }
  .prod-img {
    display: block;
    max-width: 72px;
    max-height: 60px;
    margin-top: 5px;
    object-fit: contain;
  }

  /* Totals box */
  .totals { margin: 6px 0 10px; margin-left: auto; width: 280px; font-size: 13px; }
  .totals-row { display: flex; justify-content: space-between; padding: 2px 4px; color: #374151; }
  .totals-grand {
    font-size: 15px;
    color: #111;
    border-top: 1px solid #000;
    padding-top: 5px;
    margin-top: 3px;
  }

  /* Footer (notes left + signature right) */
  .footer {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 8px;
  }
  .notes { flex: 1; font-size: 12px; }
  .notes-title { margin-bottom: 3px; }
  .note-item { color: #374151; margin: 2px 0; }

  .sign { width: 270px; text-align: center; font-size: 13px; }
  .sign-line { text-align: right; margin-bottom: 6px; }
  .sign-name { margin: 3px 0; }
  .sign-title { margin: 2px 0; }

  /* Page footer */
  .page-footer {
    text-align: center;
    font-size: 10px;
    color: #9ca3af;
    padding-top: 4px;
    border-top: 1px solid #f3f4f6;
    margin-top: 4px;
  }
</style>
`

// ============================================================
// Inline images (so html2canvas can capture cross-origin images)
// ============================================================
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(imgs.map(async (img) => {
    const src = img.getAttribute('src') ?? ''
    if (!src || src.startsWith('data:')) return
    const dataUrl = await loadImageDataUrl(src)
    if (dataUrl) img.setAttribute('src', dataUrl)
    else img.remove()
  }))
}

// ============================================================
// Main generator — render each page separately, combine in PDF
// ============================================================
async function generateDocumentPdf(title: string, data: DocData): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()   // 210mm
  const pageH = pdf.internal.pageSize.getHeight()  // 297mm

  const mergedItems = mergeDuplicates(data.items)
  const pages = chunkItems(mergedItems)
  const total = pages.length
  let startIdx = 0

  for (let i = 0; i < pages.length; i++) {
    const isFirst = i === 0
    const isLast = i === total - 1

    // Build standalone container for this page
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed; top:0; left:-10000px; z-index:-1; opacity:0; pointer-events:none;'
    container.innerHTML = STYLES + buildPageHtml(title, data, pages[i], startIdx, {
      isFirst, isLast, pageNum: i + 1, totalPages: total,
    })
    document.body.appendChild(container)

    try {
      const docNode = container.querySelector('.doc') as HTMLElement
      await inlineImages(docNode)

      const canvas = await html2canvas(docNode, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 794,
        windowHeight: 1123,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH)

      startIdx += pages[i].length
    } finally {
      document.body.removeChild(container)
    }
  }

  return pdf.output('blob')
}
