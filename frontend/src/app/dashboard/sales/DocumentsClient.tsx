'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, Eye, Edit2, X, FileText } from 'lucide-react'
import { generateQuotationPdf, generateOrderPdf, buildQuotationHtml, buildOrderHtml, type DocData } from '@/lib/pdf/documentPdf'
import { quotationsApi, ordersApi } from '@/lib/api/services'
import PdfPreviewModal from '@/components/shared/PdfPreviewModal'

const Q_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'ฉบับร่าง', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'อนุมัติ', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-700' },
}
const O_STATUS: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'รอยืนยันการขาย', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'สำเร็จ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-700' },
  rejected: { label: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700' },
}

interface Props { quotations: any[]; orders: any[]; basePath?: string }

export default function DocumentsClient({ quotations, orders, basePath = '/dashboard/sales' }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'all' | 'quotation' | 'order'>('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [previewPdf, setPreviewPdf] = useState<{ html: string; filename: string; title: string; data: DocData; isQuotation: boolean } | null>(null)
  const [viewing, setViewing] = useState<any>(null)
  const [viewingFull, setViewingFull] = useState<any>(null)
  const [viewingLoading, setViewingLoading] = useState(false)

  const openDetail = async (doc: any) => {
    setViewing(doc)
    setViewingFull(null)
    setViewingLoading(true)
    try {
      const full = doc.type === 'quotation' ? await quotationsApi.get(doc.id) : await ordersApi.get(doc.id)
      setViewingFull(full)
    } finally {
      setViewingLoading(false)
    }
  }

  const combined = useMemo(() => {
    const q = quotations.map((x) => ({ ...x, type: 'quotation' as const, number: x.quotation_number, statusInfo: Q_STATUS[x.status] }))
    const o = orders.map((x) => ({ ...x, type: 'order' as const, number: x.order_number, statusInfo: O_STATUS[x.status] }))
    return [...q, ...o]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((d) => tab === 'all' || d.type === tab)
      .filter((d) => statusFilter === 'all' || d.status === statusFilter)
      .filter((d) => {
        const haystack = [
          d.number, d.customer?.company_name,
          d.creator?.first_name, d.creator?.last_name,
          d.statusInfo?.label, d.status,
          d.type === 'quotation' ? 'ใบเสนอราคา quotation' : 'คำสั่งซื้อ order',
          String(d.total_amount ?? ''),
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(search.toLowerCase())
      })
  }, [tab, search, statusFilter, quotations, orders])

  const statusOptions = useMemo(() => {
    if (tab === 'quotation') return Object.entries(Q_STATUS).map(([k, v]) => ({ value: k, label: v.label }))
    if (tab === 'order') return Object.entries(O_STATUS).map(([k, v]) => ({ value: k, label: v.label }))
    return [
      ...Object.entries(Q_STATUS).map(([k, v]) => ({ value: k, label: `[ใบเสนอ] ${v.label}` })),
      ...Object.entries(O_STATUS).map(([k, v]) => ({ value: k, label: `[คำสั่ง] ${v.label}` })),
    ]
  }, [tab])

  const [pdfBusy, setPdfBusy] = useState(false)

  const exportToPDF = async (doc: any) => {
    setPdfBusy(true)
    try {
      const isQuotation = doc.type === 'quotation'
      const full = isQuotation ? await quotationsApi.get(doc.id) : await ordersApi.get(doc.id)

      const pdfData = {
        number: doc.number,
        createdAt: doc.created_at,
        customer: {
          company_name: full.customer?.company_name ?? '-',
          address: full.customer?.address,
          contact_name: full.customer?.contact_name,
          phone: full.customer?.phone,
          email: full.customer?.email,
          drug_license_number: full.customer?.drug_license_number,
        },
        creator: full.creator,
        items: (full.items ?? []).map((it: any) => ({
          name: it.product?.name ?? '-',
          quantity: it.quantity,
          unit: it.product?.unit,
          unit_price: it.negotiated_price ?? it.unit_price,
          total_price: it.total_price,
          image_url: it.product?.image_url,
        })),
        subtotal: full.subtotal,
        vat_percent: full.vat_percent,
        vat_amount: full.vat_amount,
        include_vat: full.include_vat,
        discount_percent: full.discount_percent,
        discount_amount: full.discount_amount,
        other_label: full.other_label,
        other_amount: full.other_amount,
        total_amount: full.total_amount,
        notes: full.notes,
        contract_period_days: full.contract_period_days,
      }

      const html = isQuotation ? buildQuotationHtml(pdfData) : buildOrderHtml(pdfData)
      setPreviewPdf({
        html,
        filename: `${doc.number}.pdf`,
        title: `${isQuotation ? 'ใบเสนอราคา' : 'คำสั่งซื้อ'} ${doc.number}`,
        data: pdfData,
        isQuotation,
      })
    } catch (err: any) {
      console.error('exportToPDF failed:', err)
      alert('สร้าง PDF ไม่สำเร็จ: ' + (err?.message ?? 'unknown error'))
    } finally {
      setPdfBusy(false)
    }
  }


  const editDraft = (doc: any) => {
    if (doc.type === 'quotation') router.push(`/dashboard/sales/quotations/${doc.id}/edit`)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {[
              { id: 'all' as const, label: 'ทั้งหมด' },
              { id: 'quotation' as const, label: 'ใบเสนอราคา' },
              { id: 'order' as const, label: 'คำสั่งซื้อ' },
            ].map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setStatusFilter('all') }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === t.id ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">สถานะทั้งหมด</option>
            {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <p className="ml-auto text-sm text-gray-500">{combined.length} รายการ</p>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">เลขที่</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ประเภท</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ลูกค้า</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">มูลค่า</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">วันที่</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {combined.map((doc) => (
              <tr key={`${doc.type}-${doc.id}`} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{doc.number}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${doc.type === 'quotation' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {doc.type === 'quotation' ? 'ใบเสนอราคา' : 'คำสั่งซื้อ'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-900">{doc.customer?.company_name ?? '-'}</td>
                <td className="px-5 py-3.5 text-right text-gray-900 font-medium">฿{doc.total_amount?.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.statusInfo?.color ?? 'bg-gray-100'}`}>
                    {doc.statusInfo?.label ?? doc.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                  <div>{new Date(doc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    {doc.type === 'quotation' && doc.status === 'draft' && (
                      <button onClick={() => editDraft(doc)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition" title="แก้ไขฉบับร่าง">
                        <Edit2 size={15} />
                      </button>
                    )}
                    <button onClick={() => openDetail(doc)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition" title="ดูข้อมูล">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => exportToPDF(doc)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition" title="ดาวน์โหลด PDF">
                      <Download size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {combined.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">ไม่มีเอกสาร</td></tr>}
          </tbody>
        </table></div>
      </div>

      <PdfPreviewModal
        html={previewPdf?.html ?? null}
        filename={previewPdf?.filename ?? 'document.pdf'}
        title={previewPdf?.title}
        onClose={() => setPreviewPdf(null)}
        generatePdf={async () => {
          if (!previewPdf) throw new Error('no preview data')
          return previewPdf.isQuotation
            ? await generateQuotationPdf(previewPdf.data)
            : await generateOrderPdf(previewPdf.data)
        }}
      />

      {viewing && (
        <DocumentDetailModal
          doc={viewing}
          full={viewingFull}
          loading={viewingLoading}
          onClose={() => { setViewing(null); setViewingFull(null) }}
          onExportPDF={() => exportToPDF(viewing)}
        />
      )}

      {pdfBusy && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-5 flex items-center gap-3 shadow-xl">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-700">กำลังสร้าง PDF…</p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Group line items by product_id + unit_price so duplicates display as
 *  a single combined row. Adds _rows counter for the badge. */
function mergeDuplicateItems(items: any[]): any[] {
  const map = new Map<string, any>()
  for (const it of items) {
    const key = `${it.product_id ?? ''}-${it.unit_price ?? ''}-${it.negotiated_price ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + (it.quantity ?? 0)
      existing.total_price = (existing.total_price ?? 0) + (it.total_price ?? 0)
      existing._rows = (existing._rows ?? 1) + 1
    } else {
      map.set(key, { ...it, _rows: 1 })
    }
  }
  return Array.from(map.values())
}

function DocumentDetailModal({ doc, full, loading, onClose, onExportPDF }: {
  doc: any; full: any; loading: boolean; onClose: () => void; onExportPDF: () => void
}) {
  const isQuotation = doc.type === 'quotation'
  const items = full?.items ?? []
  const typeLabel = isQuotation ? 'ใบเสนอราคา' : 'คำสั่งซื้อ'
  const typeColor = isQuotation ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'

  // Esc to close + lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColor}`}>
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate text-base">{typeLabel} {doc.number}</h3>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${doc.statusInfo?.color ?? 'bg-gray-100'}`}>
                  {doc.statusInfo?.label ?? doc.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(doc.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {(doc.creator?.first_name || doc.creator?.last_name) && ` · โดย ${doc.creator?.first_name ?? ''} ${doc.creator?.last_name ?? ''}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 shrink-0" aria-label="ปิด">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {!loading && full && (
            <>
              {/* Customer */}
              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูลลูกค้า</h4>
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5 text-sm">
                  <Field label="บริษัท" value={full.customer?.company_name} />
                  <Field label="ผู้ติดต่อ" value={full.customer?.contact_name} />
                  <Field label="เบอร์โทรศัพท์" value={full.customer?.phone} />
                  <Field label="อีเมล" value={full.customer?.email} />
                  <Field label="ที่อยู่" value={full.customer?.address} className="sm:col-span-2" />
                </div>
              </section>

              {/* Items — merge duplicate products into single row for cleaner display */}
              {(() => {
                const merged = mergeDuplicateItems(items)
                const hadDuplicates = merged.length !== items.length
                return (
                  <section>
                    <div className="flex items-baseline justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายการสินค้า ({merged.length} รายการ)</h4>
                      {hadDuplicates && (
                        <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          รวมรายการซ้ำแล้ว (จริง {items.length} แถว)
                        </span>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                              <th className="text-center px-3 py-2.5 font-medium w-12">#</th>
                              <th className="text-left px-4 py-2.5 font-medium">สินค้า</th>
                              <th className="text-right px-4 py-2.5 font-medium">จำนวน</th>
                              <th className="text-right px-4 py-2.5 font-medium">ราคา/หน่วย</th>
                              <th className="text-right px-4 py-2.5 font-medium">รวม</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {merged.map((it: any, i: number) => (
                              <tr key={it.id ?? i} className="hover:bg-gray-50">
                                <td className="px-3 py-3 text-center text-gray-500 text-xs font-mono">{i + 1}</td>
                                <td className="px-4 py-3 text-gray-900">
                                  {it.product?.name ?? '-'}
                                  {it._rows > 1 && <span className="ml-2 text-[10px] text-orange-600">({it._rows} แถว)</span>}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">{it.quantity} {it.product?.unit ?? ''}</td>
                                <td className="px-4 py-3 text-right text-gray-700">฿{(it.negotiated_price ?? it.unit_price)?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-900 font-medium">฿{it.total_price?.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )
              })()}

              {/* Totals */}
              <section className="flex justify-end">
                <div className="bg-blue-50 rounded-xl p-4 min-w-[260px] space-y-1.5 text-sm">
                  {full.subtotal !== undefined && (
                    <div className="flex justify-between text-gray-600">
                      <span>ยอดก่อน VAT</span><span>฿{full.subtotal?.toLocaleString()}</span>
                    </div>
                  )}
                  {full.vat_amount !== undefined && (
                    <div className="flex justify-between text-gray-600">
                      <span>VAT ({full.vat_percent ?? 7}%)</span><span>฿{full.vat_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-blue-200 text-base font-semibold text-gray-900">
                    <span>ยอดสุทธิ</span><span>฿{full.total_amount?.toLocaleString()}</span>
                  </div>
                </div>
              </section>

              {/* Notes / Contract / Reject */}
              {(full.notes || full.contract_period_days || full.reject_reason) && (
                <section className="space-y-2 text-sm">
                  {full.contract_period_days && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500">ระยะเวลาสัญญา: </span>
                      <span className="text-gray-900">{full.contract_period_days} วัน</span>
                    </div>
                  )}
                  {full.notes && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500">หมายเหตุ: </span>
                      <span className="text-gray-900 whitespace-pre-wrap">{full.notes}</span>
                    </div>
                  )}
                  {full.reject_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                      <span className="font-medium">เหตุผลที่ปฏิเสธ: </span>
                      <span className="whitespace-pre-wrap">{full.reject_reason}</span>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium">ปิด</button>
          <button onClick={onExportPDF} disabled={loading || !full} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            <Download size={15} /> ดูตัวอย่าง PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: any; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-gray-900 whitespace-pre-wrap break-words">{value || '-'}</p>
    </div>
  )
}
