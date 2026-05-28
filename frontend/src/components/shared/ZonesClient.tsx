'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react'
import { zonesApi } from '@/lib/api/services'

interface Props {
  zones: any[]
  canEdit: boolean      // admin
  canDelete: boolean    // admin
  onReload: () => void
}

const empty = { code: '', name: '', region: '', province: '', description: '' }

export default function ZonesClient({ zones, canEdit, canDelete, onReload }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const startAdd = () => { setEditing(null); setForm(empty); setShowForm(true); setError('') }
  const startEdit = (z: any) => {
    setEditing(z)
    setForm({ code: z.code, name: z.name, region: z.region ?? '', province: z.province ?? '', description: z.description ?? '' })
    setShowForm(true); setError('')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      if (editing) await zonesApi.update(editing.id, form)
      else await zonesApi.create(form)
      setShowForm(false); onReload()
    } catch (err: any) {
      setError(err.message || 'บันทึกไม่สำเร็จ')
    } finally { setSaving(false) }
  }

  const remove = async (z: any) => {
    if (!confirm(`ลบเขตการขาย "${z.code} - ${z.name}"?`)) return
    try {
      await zonesApi.remove(z.id); onReload()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">เขตการขาย ({zones.length})</h2>
          <button onClick={startAdd} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Plus size={14} /> เพิ่มเขต
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3">รหัส</th>
                <th className="text-left px-5 py-3">ชื่อเขต</th>
                <th className="text-left px-5 py-3">จังหวัด</th>
                <th className="text-left px-5 py-3">ภาค</th>
                <th className="text-center px-5 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-blue-700">{z.code}</td>
                  <td className="px-5 py-3.5 text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      {z.name}
                    </div>
                    {z.description && <p className="text-xs text-gray-500 mt-0.5 ml-6">{z.description}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{z.province ?? '-'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{z.region ?? '-'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && (
                        <button onClick={() => startEdit(z)} className="text-gray-400 hover:text-blue-600 p-1.5" title="แก้ไข">
                          <Edit2 size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => remove(z)} className="text-gray-400 hover:text-red-600 p-1.5" title="ลบ">
                          <Trash2 size={15} />
                        </button>
                      )}
                      {!canEdit && !canDelete && <span className="text-xs text-gray-400">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">ยังไม่มีเขตการขาย — กด "เพิ่มเขต" เพื่อสร้าง</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editing ? 'แก้ไขเขตการขาย' : 'เพิ่มเขตการขายใหม่'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสเขต <span className="text-red-500">*</span></label>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="เช่น BKK, CNX, S-01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเขต <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น กรุงเทพและปริมณฑล"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                  <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                    placeholder="เช่น กรุงเทพมหานคร"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ภาค</label>
                  <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ไม่ระบุ --</option>
                    <option>ภาคกลาง</option>
                    <option>ภาคเหนือ</option>
                    <option>ภาคใต้</option>
                    <option>ภาคตะวันออก</option>
                    <option>ภาคตะวันออกเฉียงเหนือ</option>
                    <option>ภาคตะวันตก</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? 'กำลังบันทึก…' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
