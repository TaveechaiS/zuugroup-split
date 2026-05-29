'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, FileText } from 'lucide-react'
import { ordersApi } from '@/lib/api/services'
import { buildOrderHtml, generateOrderPdf, type DocData } from '@/lib/pdf/documentPdf'
import PdfPreviewModal from '@/components/shared/PdfPreviewModal'

export default function OrderReviewClient({ order }: { order: any }) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [previewPdf, setPreviewPdf] = useState<{ html: string; filename: string; title: string; data: DocData } | null>(null)

  const openPdf = () => {
    const data: DocData = {
      number: order.order_number,
      createdAt: order.created_at,
      customer: {
        company_name: order.customer?.company_name ?? '-',
        address: order.customer?.address,
        contact_name: order.customer?.contact_name,
        phone: order.customer?.phone,
        email: order.customer?.email,
        tax_id: order.customer?.tax_id,
        drug_license_number: order.customer?.drug_license_number,
      },
      creator: order.creator,
      items: (order.items ?? []).map((it: any) => ({
        name: it.product?.name ?? '-',
        quantity: it.quantity,
        unit: it.product?.unit,
        unit_price: it.negotiated_price ?? it.unit_price,
        total_price: it.total_price,
        image_url: it.product?.image_url,
      })),
      subtotal: order.subtotal,
      vat_percent: order.vat_percent,
      vat_amount: order.vat_amount,
      include_vat: order.include_vat,
      discount_percent: order.discount_percent,
      discount_amount: order.discount_amount,
      other_label: order.other_label,
      other_amount: order.other_amount,
      total_amount: order.total_amount,
      notes: order.notes,
      show_tax_id: order.show_tax_id,
    }
    setPreviewPdf({
      html: buildOrderHtml(data),
      filename: `${order.order_number}.pdf`,
      title: `คำสั่งซื้อ ${order.order_number}`,
      data,
    })
  }

  const approve = async () => {
    setSaving(true); setError('')
    try {
      await ordersApi.reviewPass(order.id)
      window.location.href = '/dashboard/manager/orders-pending'
    } catch (err: any) { setError(err.message); setSaving(false) }
  }

  const reject = async () => {
    if (!reason.trim()) { setError('กรุณาระบุเหตุผล'); return }
    setSaving(true); setError('')
    try {
      await ordersApi.reviewReject(order.id, reason)
      window.location.href = '/dashboard/manager/orders-pending'
    } catch (err: any) { setError(err.message); setSaving(false) }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">คำสั่งซื้อ {order.order_number}</h2>
              <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={openPdf} className="inline-flex items-center gap-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium">
                <FileText size={14} /> ดู / โหลด PDF
              </button>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">รอตรวจสอบ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">ผู้สร้างเอกสาร</p>
              <p className="font-medium text-gray-900">{order.creator?.first_name} {order.creator?.last_name}</p>
              <p className="text-xs text-gray-500">{order.creator?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">ลูกค้า</p>
              <p className="font-medium text-gray-900">{order.customer?.company_name}</p>
              <p className="text-xs text-gray-500">โทร: {order.customer?.phone ?? '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-900">รายการสินค้า</div>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-center px-3 py-2.5 w-12">#</th>
                <th className="text-left px-5 py-2.5">สินค้า</th>
                <th className="text-right px-5 py-2.5">จำนวน</th>
                <th className="text-right px-5 py-2.5">ราคา/หน่วย</th>
                <th className="text-right px-5 py-2.5">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(order.items ?? []).map((it: any, i: number) => (
                <tr key={it.id}>
                  <td className="px-3 py-3 text-center text-gray-500 text-xs font-mono">{i + 1}</td>
                  <td className="px-5 py-3 text-gray-900">{it.product?.name}</td>
                  <td className="px-5 py-3 text-right">{it.quantity} {it.product?.unit ?? ''}</td>
                  <td className="px-5 py-3 text-right">฿{it.unit_price.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{it.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              {order.subtotal !== undefined && order.subtotal > 0 && (
                <div className="flex justify-between text-gray-600"><span>ยอดก่อน VAT:</span><span>฿{order.subtotal?.toLocaleString()}</span></div>
              )}
              {order.vat_amount !== undefined && order.vat_amount > 0 && (
                <div className="flex justify-between text-gray-600"><span>VAT ({order.vat_percent ?? 7}%):</span><span>฿{order.vat_amount?.toLocaleString()}</span></div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                <span>ยอดสุทธิ:</span><span>฿{order.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {!showReject ? (
          <div className="flex gap-3 justify-end">
            <button onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
            <button onClick={() => setShowReject(true)} disabled={saving} className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2 disabled:opacity-60"><X size={16} /> ไม่ผ่าน</button>
            <button onClick={approve} disabled={saving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"><Check size={16} /> {saving ? 'บันทึก...' : 'ผ่านการตรวจสอบ'}</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
            <p className="text-sm font-medium text-gray-900">เหตุผลที่ไม่ผ่าน *</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder="ระบุเหตุผล..." />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowReject(false)} className="px-4 py-2 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={reject} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'บันทึก...' : 'ยืนยัน'}</button>
            </div>
          </div>
        )}
      </div>

      {previewPdf && (
        <PdfPreviewModal
          html={previewPdf.html}
          filename={previewPdf.filename}
          title={previewPdf.title}
          onClose={() => setPreviewPdf(null)}
          generatePdf={() => generateOrderPdf(previewPdf.data)}
        />
      )}
    </div>
  )
}
