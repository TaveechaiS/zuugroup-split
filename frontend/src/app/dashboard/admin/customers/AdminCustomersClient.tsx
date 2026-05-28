'use client'

import { useState } from 'react'
import { Plus, Search, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerFormClient from '@/components/shared/CustomerFormClient'
import { CustomerDetailModal } from '@/components/shared/CustomersViewClient'

interface Props { customers: any[]; onReload: () => void }

export default function AdminCustomersClient({ customers, onReload }: Props) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<any>(null)
  const router = useRouter()

  const filtered = customers.filter((c) => {
    const haystack = [
      c.customer_code, c.company_name, c.contact_name, c.phone, c.email,
      c.address, c.drug_license_number, c.tax_id,
      c.zone?.code, c.zone?.name, c.zone?.province, c.zone?.region,
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  if (showForm) {
    return (
      <div>
        <div className="p-6 pb-0">
          <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 hover:text-blue-600">← กลับ</button>
        </div>
        <CustomerFormClient mode="create" onDone={() => { setShowForm(false); onReload() }} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> เพิ่มลูกค้า</button>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3">บริษัท</th>
              <th className="text-left px-5 py-3">ผู้ติดต่อ</th>
              <th className="text-left px-5 py-3">โทรศัพท์</th>
              <th className="text-left px-5 py-3">อีเมล</th>
              <th className="text-left px-5 py-3">ที่อยู่</th>
              <th className="text-center px-5 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => setViewing(c)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-medium text-gray-900">{c.company_name}</td>
                <td className="px-5 py-3.5 text-gray-600">{c.contact_name ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{c.phone ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{c.email ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">
                  <div className="max-w-[220px] truncate" title={c.address ?? ''}>{c.address ?? '-'}</div>
                </td>
                <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setViewing(c)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                      <Eye size={14} /> ดูรายละเอียด
                    </button>
                    <button onClick={() => router.push(`/dashboard/admin/customers/${c.id}`)} className="text-xs text-gray-500 hover:text-blue-600">แก้ไข</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่พบลูกค้า</td></tr>}
          </tbody>
        </table></div>
      </div>

      {viewing && <CustomerDetailModal customer={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
