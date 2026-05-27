'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit2, Trash2, Upload, X } from 'lucide-react'
import { productsApi } from '@/lib/api/services'

interface Props { products: any[]; categories: any[]; onReload: () => void }

export default function AdminProductsClient({ products, categories, onReload }: Props) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', quantity: 0, price_per_unit: 0, category_id: '', unit: '', image_url: '', status: 'available' })

  const filtered = products.filter((p) => {
    const haystack = [
      p.name, p.unit, p.category?.name,
      p.status === 'available' ? 'พร้อมขาย available' : 'ปิดการขาย unavailable ปิด',
      String(p.quantity ?? ''), String(p.price_per_unit ?? ''),
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  const startAdd = () => { setEditing(null); setForm({ name: '', quantity: 0, price_per_unit: 0, category_id: '', unit: '', image_url: '', status: 'available' }); setShowForm(true); setError('') }
  const startEdit = (p: any) => { setEditing(p); setForm({ name: p.name, quantity: p.quantity, price_per_unit: p.price_per_unit, category_id: p.category_id ?? '', unit: p.unit ?? '', image_url: p.image_url ?? '', status: p.status }); setShowForm(true); setError('') }

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { setError('ไฟล์ใหญ่เกิน 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => setForm((f) => ({ ...f, image_url: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      const body = { ...form, category_id: form.category_id || null, image_url: form.image_url || '' }
      if (editing) await productsApi.update(editing.id, body)
      else await productsApi.create(body)
      setShowForm(false); onReload()
    } catch (err: any) { setError(err.message) }
  }

  const remove = async (p: any) => {
    if (!confirm(`ลบสินค้า ${p.name}?`)) return
    await productsApi.remove(p.id); onReload()
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <button onClick={startAdd} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> เพิ่มสินค้า</button>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3">ชื่อสินค้า</th>
              <th className="text-left px-5 py-3">หมวดหมู่</th>
              <th className="text-right px-5 py-3">คงเหลือ</th>
              <th className="text-right px-5 py-3">ราคา/หน่วย</th>
              <th className="text-center px-5 py-3">สถานะ</th>
              <th className="text-center px-5 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-gray-900 cursor-pointer" onClick={() => router.push(`/dashboard/admin/products/${p.id}`)}>{p.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{p.category?.name ?? '-'}</td>
                <td className={`px-5 py-3.5 text-right ${p.quantity < 10 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>{p.quantity} {p.unit ?? ''}</td>
                <td className="px-5 py-3.5 text-right text-gray-900">฿{p.price_per_unit.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'available' ? 'พร้อมขาย' : 'ปิด'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-blue-600 p-1.5"><Edit2 size={15} /></button>
                    <button onClick={() => remove(p)} className="text-gray-400 hover:text-red-600 p-1.5"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่พบสินค้า</td></tr>}
          </tbody>
        </table></div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนสินค้าคงเหลือ *</label>
                  <input required type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย (เช่น กล่อง)</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขายต่อหน่วย (บาท) *</label>
                <input required type="number" step="0.01" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ไม่มีหมวด --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปสินค้า</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="hidden" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <Upload size={14} /> อัพโหลดรูป
                  </button>
                  {form.image_url && (
                    <div className="relative">
                      <img src={form.image_url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="available">พร้อมขาย</option>
                  <option value="unavailable">ปิดการขาย</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
