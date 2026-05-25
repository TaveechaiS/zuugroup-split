'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2 } from 'lucide-react'
import CustomerFormClient from '@/components/shared/CustomerFormClient'
import { customersApi } from '@/lib/api/services'

export default function CustomerDetailClient({ customer, products, customPrices }: { customer: any; products: any[]; customPrices: any[] }) {
  const [editing, setEditing] = useState(false)
  const router = useRouter()

  if (editing) {
    return <CustomerFormClient mode="edit" initial={customer} onDone={() => { setEditing(false); router.refresh() }} />
  }

  const priceMap = new Map(customPrices.map((p) => [p.product_id, p.custom_price]))
  const productsWithCustomPrices = products.filter((p) => priceMap.has(p.id))

  const remove = async () => {
    if (!confirm(`ลบลูกค้า ${customer.company_name}?`)) return
    await customersApi.remove(customer.id)
    router.push('/dashboard/admin/customers')
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{customer.company_name}</h2>
              <p className="text-sm text-gray-500 mt-1">ผู้ติดต่อ: {customer.contact_name ?? '-'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Edit2 size={14} /> แก้ไข</button>
              <button onClick={remove} className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium">ลบ</button>
            </div>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500 text-xs">ที่อยู่</dt><dd className="text-gray-900 mt-0.5">{customer.address ?? '-'}</dd></div>
            <div><dt className="text-gray-500 text-xs">เบอร์โทรศัพท์</dt><dd className="text-gray-900 mt-0.5">{customer.phone ?? '-'}</dd></div>
            <div><dt className="text-gray-500 text-xs">อีเมล</dt><dd className="text-gray-900 mt-0.5">{customer.email ?? '-'}</dd></div>
            <div><dt className="text-gray-500 text-xs">เลขที่อนุญาตขายยา</dt><dd className="text-gray-900 mt-0.5">{customer.drug_license_number ?? '-'}</dd></div>
          </dl>

          {(customer.location_image_url || customer.drug_license_image_url || customer.hospital_license_image_url) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              {[
                { url: customer.location_image_url, label: 'รูปสถานที่' },
                { url: customer.drug_license_image_url, label: 'ใบอนุญาตขายยา' },
                { url: customer.hospital_license_image_url, label: 'ใบอนุญาตสถานพยาบาล' },
              ].filter((x) => x.url).map((img) => (
                <div key={img.label}>
                  <p className="text-xs text-gray-500 mb-1.5">{img.label}</p>
                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                    <img src={img.url} alt={img.label} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {productsWithCustomPrices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-900">ราคาตกลง</div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                  <th className="text-left px-5 py-3">สินค้า</th>
                  <th className="text-right px-5 py-3">ราคาปกติ</th>
                  <th className="text-right px-5 py-3">ราคาตกลง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productsWithCustomPrices.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3">{p.name}</td>
                    <td className="px-5 py-3 text-right text-gray-500">฿{p.price_per_unit.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-blue-600 font-medium">฿{priceMap.get(p.id)?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}
      </div>
    </div>
  )
}
