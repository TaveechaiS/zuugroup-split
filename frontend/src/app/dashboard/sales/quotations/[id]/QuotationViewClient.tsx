'use client'

import { ArrowLeft, Download } from 'lucide-react'
import { generateQuotationPdf } from '@/lib/pdf/documentPdf'

const STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'ฉบับร่าง', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'อนุมัติ', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-700' },
}

interface Props { quotation: any }

export default function QuotationViewClient({ quotation }: Props) {
  const s = STATUS[quotation.status] ?? { label: quotation.status, color: 'bg-gray-100' }

  const download = () => {
    const blob = generateQuotationPdf({
      number: quotation.quotation_number,
      date: new Date(quotation.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
      customer: {
        company_name: quotation.customer?.company_name ?? '-',
        address: quotation.customer?.address,
        contact_name: quotation.customer?.contact_name,
        phone: quotation.customer?.phone,
        email: quotation.customer?.email,
      },
      items: (quotation.items ?? []).map((it: any) => ({
        name: it.product?.name ?? '-',
        quantity: it.quantity,
        unit: it.product?.unit,
        unit_price: it.negotiated_price ?? it.unit_price,
        total_price: it.total_price,
      })),
      subtotal: quotation.subtotal,
      vat_percent: quotation.vat_percent,
      vat_amount: quotation.vat_amount,
      total_amount: quotation.total_amount,
      notes: quotation.notes,
      contract_period_days: quotation.contract_period_days,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${quotation.quotation_number}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.close()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900">ใบเสนอราคา {quotation.quotation_number}</h1>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
              </div>
              <p className="text-sm text-gray-500">โดย: {quotation.creator?.first_name} {quotation.creator?.last_name}</p>
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
            <div><span className="text-gray-500">ชื่อบริษัท:</span> {quotation.customer?.company_name}</div>
            <div><span className="text-gray-500">ผู้ติดต่อ:</span> {quotation.customer?.contact_name ?? '-'}</div>
            <div><span className="text-gray-500">เบอร์:</span> {quotation.customer?.phone ?? '-'}</div>
            <div><span className="text-gray-500">อีเมล:</span> {quotation.customer?.email ?? '-'}</div>
            <div className="col-span-2"><span className="text-gray-500">ที่อยู่:</span> {quotation.customer?.address ?? '-'}</div>
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
              {(quotation.items ?? []).map((item: any) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 text-gray-900">{item.product?.name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{item.quantity} {item.product?.unit}</td>
                  <td className="px-5 py-3 text-right text-gray-700">฿{(item.negotiated_price ?? item.unit_price)?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{item.total_price?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="p-5 border-t border-gray-100 bg-gray-50">
            <div className="ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>ยอดรวม:</span><span>฿{quotation.subtotal?.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-600"><span>VAT ({quotation.vat_percent}%):</span><span>฿{quotation.vat_amount?.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-base text-gray-900 pt-1.5 border-t border-gray-200">
                <span>ยอดสุทธิ:</span><span>฿{quotation.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {quotation.reject_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-red-700">เหตุผลที่ไม่อนุมัติ</p>
            <p className="text-red-700 mt-1">{quotation.reject_reason}</p>
          </div>
        )}

        {(quotation.notes || quotation.contract_period_days) && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm">
            {quotation.contract_period_days && <p className="mb-2"><span className="text-gray-500">ระยะเวลาสัญญา:</span> {quotation.contract_period_days} วัน</p>}
            {quotation.notes && <p><span className="text-gray-500">หมายเหตุ:</span> {quotation.notes}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
