'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight } from 'lucide-react'

const STATUS: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'รอยืนยันการขาย', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'สำเร็จ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-500' },
  rejected: { label: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700' },
}

export default function AdminOrdersClient({ orders }: { orders: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

  const filtered = orders
    .filter((o) => statusFilter === 'all' || o.status === statusFilter)
    .filter((o) => {
      const haystack = [
        o.order_number, o.customer?.company_name,
        o.creator?.first_name, o.creator?.last_name,
        STATUS[o.status]?.label, o.status,
        String(o.total_amount ?? ''),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending_review">รอตรวจสอบ</option>
            <option value="processing">กำลังดำเนินการ</option>
            <option value="completed">สำเร็จ</option>
            <option value="rejected">ไม่ผ่าน</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          <p className="ml-auto text-sm text-gray-500">{filtered.length} รายการ</p>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3">เลขที่</th>
              <th className="text-left px-5 py-3">ลูกค้า</th>
              <th className="text-left px-5 py-3">ผู้สร้าง</th>
              <th className="text-right px-5 py-3">มูลค่า</th>
              <th className="text-center px-5 py-3">สถานะ</th>
              <th className="text-left px-5 py-3">วันที่</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((o) => (
              <tr key={o.id} onClick={() => router.push(`/dashboard/admin/orders/${o.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{o.order_number}</td>
                <td className="px-5 py-3.5 text-gray-900">{o.customer?.company_name ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{o.creator?.first_name} {o.creator?.last_name}</td>
                <td className="px-5 py-3.5 text-right text-gray-900 font-medium">฿{o.total_amount?.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS[o.status]?.color}`}>{STATUS[o.status]?.label ?? o.status}</span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                  <div>{new Date(o.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-5 py-3.5"><ChevronRight size={16} className="text-gray-400" /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">ไม่พบคำสั่งซื้อ</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
