'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface Props {
  customers: any[]
}

export default function CustomersViewClient({ customers }: Props) {
  const [search, setSearch] = useState('')

  const filtered = customers.filter((c) =>
    `${c.company_name} ${c.contact_name} ${c.phone} ${c.address}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาลูกค้า..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <p className="text-sm text-gray-500">{filtered.length} รายการ</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อบริษัท</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้ติดต่อ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">เบอร์</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่อยู่</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่เพิ่ม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{c.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{c.company_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.contact_name ?? '-'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.phone ?? '-'}</td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">{c.address ?? '-'}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(c.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
