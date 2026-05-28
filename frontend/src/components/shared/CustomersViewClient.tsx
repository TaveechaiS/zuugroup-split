'use client'

import { useState } from 'react'
import { Search, X, Eye } from 'lucide-react'

interface Props {
  customers: any[]
}

export default function CustomersViewClient({ customers }: Props) {
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<any>(null)

  const filtered = customers.filter((c) => {
    const haystack = [
      c.customer_code, c.company_name, c.contact_name, c.phone, c.email,
      c.address, c.drug_license_number, c.tax_id,
      c.zone?.code, c.zone?.name, c.zone?.province, c.zone?.region,
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อบริษัท</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้ติดต่อ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">เบอร์</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่อยู่</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setViewing(c)}>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{c.company_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.contact_name ?? '-'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.phone ?? '-'}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    <div className="max-w-[220px] truncate" title={c.address ?? ''}>{c.address ?? '-'}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setViewing(c)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                      <Eye size={14} /> ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && <CustomerDetailModal customer={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

export function CustomerDetailModal({ customer, onClose }: { customer: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{customer.company_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              เพิ่มเมื่อ {new Date(customer.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">ที่อยู่</p>
            <p className="text-gray-900 whitespace-pre-wrap">{customer.address ?? '-'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div><p className="text-xs text-gray-500 mb-0.5">ผู้ติดต่อ</p><p className="text-gray-900">{customer.contact_name ?? '-'}</p></div>
            <div><p className="text-xs text-gray-500 mb-0.5">เบอร์โทร</p><p className="text-gray-900">{customer.phone ?? '-'}</p></div>
            <div><p className="text-xs text-gray-500 mb-0.5">อีเมล</p><p className="text-gray-900">{customer.email ?? '-'}</p></div>
            <div><p className="text-xs text-gray-500 mb-0.5">เลขอนุญาตขายยา</p><p className="text-gray-900">{customer.drug_license_number ?? '-'}</p></div>
          </div>
          {(customer.location_image_url || customer.drug_license_image_url || customer.hospital_license_image_url) && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">เอกสารและรูปภาพ</p>
              <div className="grid grid-cols-3 gap-2">
                {customer.location_image_url && (
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">รูปสถานที่</p>
                    <a href={customer.location_image_url} target="_blank" rel="noopener noreferrer">
                      <img src={customer.location_image_url} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    </a>
                  </div>
                )}
                {customer.drug_license_image_url && (
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">ใบอนุญาตขายยา</p>
                    <a href={customer.drug_license_image_url} target="_blank" rel="noopener noreferrer">
                      <img src={customer.drug_license_image_url} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    </a>
                  </div>
                )}
                {customer.hospital_license_image_url && (
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">ใบอนุญาตสถานพยาบาล</p>
                    <a href={customer.hospital_license_image_url} target="_blank" rel="noopener noreferrer">
                      <img src={customer.hospital_license_image_url} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">ปิด</button>
        </div>
      </div>
    </div>
  )
}
