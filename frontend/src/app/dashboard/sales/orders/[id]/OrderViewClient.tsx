'use client'

import { useState } from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { generateOrderPdf, buildOrderHtml, type DocData } from '@/lib/pdf/documentPdf'
import PdfPreviewModal from '@/components/shared/PdfPreviewModal'

const STATUS: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'สำเร็จ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-700' },
  rejected: { label: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700' },
}

interface Props { order: any }

export default function OrderViewClient({ order }: Props) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const s = STATUS[order.status] ?? { label: order.status, color: 'bg-gray-100' }

  const buildData = (): DocData => ({
    number: order.order_number,
    createdAt: order.created_at,
    customer: {
      company_name: order.customer?.company_name ?? '-',
      address: order.customer?.address,
      contact_name: order.customer?.contact_name,
      phone: order.customer?.phone,
      email: order.customer?.email,
      drug_license_number: order.customer?.drug_license_number,
    },
    creator: order.creator,
    items: (order.items ?? []).map((it: any) => ({
      name: it.product?.name ?? '-',
      quantity: it.quantity,
      unit: it.product?.unit,
      unit_price: it.unit_price,
      total_price: it.total_price,
      image_url: it.product?.image_url,
    })),
    total_amount: order.total_amount,
  })

  const download = () => setPreviewHtml(buildOrderHtml(buildData()))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.close()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900">คำสั่งซื้อ {order.order_number}</h1>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
              </div>
              <p className="text-sm text-gray-500">โดย: {order.creator?.first_name} {order.creator?.last_name}</p>
            </div>
          </div>
          <button onClick={download} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Download size={15} /> ดาวน์โหลด PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">ลูกค้า</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">ชื่อบริษัท:</span> {order.customer?.company_name}</div>
            <div><span className="text-gray-500">ผู้ติดต่อ:</span> {order.customer?.contact_name ?? '-'}</div>
            <div><span className="text-gray-500">เบอร์:</span> {order.customer?.phone ?? '-'}</div>
            <div><span className="text-gray-500">อีเมล:</span> {order.customer?.email ?? '-'}</div>
            <div className="col-span-2"><span className="text-gray-500">ที่อยู่:</span> {order.customer?.address ?? '-'}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <h3 className="font-semibold text-gray-900 p-5 border-b border-gray-100">รายการสินค้า</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">สินค้า</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">จำนวน</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">ราคา</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(order.items ?? []).map((item: any) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 text-gray-900">{item.product?.name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{item.quantity} {item.product?.unit}</td>
                  <td className="px-5 py-3 text-right text-gray-700">฿{item.unit_price?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{item.total_price?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="p-5 border-t border-gray-100 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">ยอดรวม</p>
              <p className="text-2xl font-bold text-gray-900">฿{order.total_amount?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {order.reject_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-red-700">เหตุผล</p>
            <p className="text-red-700 mt-1">{order.reject_reason}</p>
          </div>
        )}
      </div>

      <PdfPreviewModal
        html={previewHtml}
        filename={`${order.order_number}.pdf`}
        title={`คำสั่งซื้อ ${order.order_number}`}
        onClose={() => setPreviewHtml(null)}
        generatePdf={() => generateOrderPdf(buildData())}
      />
    </div>
  )
}
