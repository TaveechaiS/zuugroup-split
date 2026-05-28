'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface Props {
  products: any[]
}

export default function ProductsViewClient({ products }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const categories = Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)))

  const filtered = products.filter((p) => {
    const haystack = [
      p.product_code, p.name, p.unit, p.category?.name, p.lot_number,
      p.status === 'available' ? 'พร้อมขาย available' : 'ไม่พร้อมขาย unavailable ปิด',
      String(p.quantity ?? ''), String(p.price_per_unit ?? ''),
    ].filter(Boolean).join(' ').toLowerCase()
    const matchSearch = haystack.includes(search.toLowerCase())
    const matchCat = !category || p.category?.name === category
    return matchSearch && matchCat
  })

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">หมวดหมู่ทั้งหมด</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="ml-auto text-sm text-gray-500">{filtered.length} รายการ</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ชื่อสินค้า</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">หมวดหมู่</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">คงเหลือ</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">ราคา/หน่วย</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">หน่วย</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{p.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{p.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{p.category?.name ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-900">{p.quantity}</td>
                  <td className="px-5 py-3.5 text-right text-gray-900">฿{p.price_per_unit?.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-gray-600">{p.unit ?? '-'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.status === 'available' ? 'พร้อมขาย' : 'ไม่พร้อมขาย'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
