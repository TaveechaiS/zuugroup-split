'use client'

import { useState, useMemo } from 'react'
import { Search, Download, Eye } from 'lucide-react'
import { generateQuotationPdf, generateOrderPdf } from '@/lib/pdf/documentPdf'
import { quotationsApi, ordersApi } from '@/lib/api/services'

const Q_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'ฉบับร่าง', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'อนุมัติ', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-700' },
}
const O_STATUS: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'สำเร็จ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-700' },
  rejected: { label: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700' },
}

interface Props { quotations: any[]; orders: any[] }

export default function DocumentsClient({ quotations, orders }: Props) {
  const [tab, setTab] = useState<'all' | 'quotation' | 'order'>('all')
  const [search, setSearch] = useState('')

  const combined = useMemo(() => {
    const q = quotations.map((x) => ({ ...x, type: 'quotation' as const, number: x.quotation_number, statusInfo: Q_STATUS[x.status] }))
    const o = orders.map((x) => ({ ...x, type: 'order' as const, number: x.order_number, statusInfo: O_STATUS[x.status] }))
    return [...q, ...o]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((d) => tab === 'all' || d.type === tab)
      .filter((d) => `${d.number} ${d.customer?.company_name}`.toLowerCase().includes(search.toLowerCase()))
  }, [tab, search, quotations, orders])

  const exportToPDF = async (doc: any) => {
    const isQuotation = doc.type === 'quotation'
    const full = isQuotation ? await quotationsApi.get(doc.id) : await ordersApi.get(doc.id)

    const pdfData = {
      number: doc.number,
      date: new Date(doc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
      customer: {
        company_name: full.customer?.company_name ?? '-',
        address: full.customer?.address,
        contact_name: full.customer?.contact_name,
        phone: full.customer?.phone,
        email: full.customer?.email,
      },
      items: (full.items ?? []).map((it: any) => ({
        name: it.product?.name ?? '-',
        quantity: it.quantity,
        unit: it.product?.unit,
        unit_price: it.negotiated_price ?? it.unit_price,
        total_price: it.total_price,
      })),
      subtotal: full.subtotal,
      vat_percent: full.vat_percent,
      vat_amount: full.vat_amount,
      total_amount: full.total_amount,
      notes: full.notes,
      contract_period_days: full.contract_period_days,
    }

    const blob = isQuotation ? generateQuotationPdf(pdfData) : generateOrderPdf(pdfData)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${doc.number}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  const openDetail = (doc: any) => {
    const route = doc.type === 'quotation' ? 'quotations' : 'orders'
    window.open(`/dashboard/sales/${route}/${doc.id}`, '_blank')
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
              <button key={t.id} onClick={() => setTab(t.id)}
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
                <td className="px-5 py-3.5 text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1">
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
    </div>
  )
}
