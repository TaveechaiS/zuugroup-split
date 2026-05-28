'use client'

import { useState } from 'react'
import { Search, X, Package, Calendar, Tag, Layers, Image as ImageIcon } from 'lucide-react'

interface Props {
  products: any[]
}

export default function ProductsViewClient({ products }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [viewing, setViewing] = useState<any>(null)

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
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-gray-100">
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">รหัส</th>
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
                <tr
                  key={p.id}
                  onClick={() => setViewing(p)}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                  title="คลิกเพื่อดูรายละเอียด"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-blue-700">{p.product_code ?? p.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-8 h-8 object-cover rounded-md border border-gray-200" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-300">
                          <Package size={14} />
                        </div>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{p.category?.name ?? '-'}</td>
                  <td className={`px-5 py-3.5 text-right ${p.quantity < 10 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>{p.quantity}</td>
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

      {viewing && <ProductDetailModal product={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function ProductDetailModal({ product, onClose }: { product: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Package size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs text-blue-700">{product.product_code ?? '—'}</p>
              <h3 className="font-semibold text-gray-900 text-base truncate">{product.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{product.category?.name ?? 'ไม่ระบุหมวด'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Image + main info */}
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
            {/* Image */}
            <div>
              {product.image_url ? (
                <a href={product.image_url} target="_blank" rel="noopener noreferrer" title="คลิกเพื่อดูรูปขนาดเต็ม">
                  <img src={product.image_url} alt={product.name}
                    className="w-full aspect-square object-cover rounded-xl border border-gray-200 hover:shadow-lg transition" />
                </a>
              ) : (
                <div className="w-full aspect-square bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-gray-300 gap-2">
                  <ImageIcon size={48} />
                  <p className="text-xs">ไม่มีรูปสินค้า</p>
                </div>
              )}
            </div>

            {/* Main info grid */}
            <div className="space-y-3">
              <InfoBlock icon={<Layers size={14} />} label="คงเหลือในสต๊อก">
                <span className={`text-lg font-semibold ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {product.quantity} {product.unit ?? ''}
                </span>
                {product.quantity < 10 && product.quantity > 0 && (
                  <span className="ml-2 text-xs text-red-600">⚠ ใกล้หมด</span>
                )}
                {product.quantity === 0 && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">หมดสต๊อก</span>
                )}
              </InfoBlock>

              <InfoBlock icon={<Tag size={14} />} label="ราคาขายต่อหน่วย">
                <span className="text-lg font-semibold text-blue-700">
                  ฿{product.price_per_unit?.toLocaleString()}
                </span>
                <span className="ml-2 text-xs text-gray-500">/ {product.unit ?? 'หน่วย'}</span>
              </InfoBlock>

              <InfoBlock label="สถานะ">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.status === 'available' ? 'พร้อมขาย' : 'ไม่พร้อมขาย'}
                </span>
              </InfoBlock>
            </div>
          </div>

          {/* Lot / dates info */}
          {(product.lot_number || product.manufacture_date || product.expiry_date) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar size={12} /> ข้อมูลล็อต / วันที่
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {product.lot_number && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">เลขล็อต</p>
                    <p className="font-mono text-gray-900">{product.lot_number}</p>
                  </div>
                )}
                {product.manufacture_date && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">วันผลิต</p>
                    <p className="text-gray-900">{new Date(product.manufacture_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
                {product.expiry_date && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">วันหมดอายุ</p>
                    <p className={`${isNearExpiry(product.expiry_date) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                      {new Date(product.expiry_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {isNearExpiry(product.expiry_date) && <span className="ml-1 text-xs">⚠</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Updated time */}
          <div className="text-xs text-gray-400">
            อัปเดตล่าสุด {new Date(product.updated_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">ปิด</button>
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">{icon}{label}</p>
      <div>{children}</div>
    </div>
  )
}

function isNearExpiry(dateStr: string): boolean {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  const now = new Date()
  const sixMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
  return d < sixMonthsFromNow
}
