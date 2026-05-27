'use client'

import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react'
import { usersApi } from '@/lib/api/services'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

interface Props { users: any[]; teams: any[]; onReload: () => void }

export default function UsersClient({ users, teams, onReload }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState<any>(null)

  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'sales', team_id: '', phone: '' })

  const filtered = users.filter((u) => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))

  const startAdd = () => {
    setEditing(null)
    setForm({ email: '', password: '', first_name: '', last_name: '', role: 'sales', team_id: '', phone: '' })
    setShowAdd(true); setError('')
  }
  const startEdit = (u: any) => {
    setEditing(u)
    setForm({ email: u.email, password: '', first_name: u.first_name, last_name: u.last_name, role: u.role, team_id: u.team_id ?? '', phone: u.phone ?? '' })
    setShowAdd(true); setError('')
    setViewing(null)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      if (editing) {
        const body: any = { first_name: form.first_name, last_name: form.last_name, role: form.role as any, team_id: form.team_id || null, phone: form.phone }
        if (form.password) body.password = form.password
        await usersApi.update(editing.id, body)
      } else {
        await usersApi.create({ email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name, role: form.role, team_id: form.team_id || null, phone: form.phone })
      }
      setShowAdd(false); onReload()
    } catch (err: any) { setError(err.message) }
  }

  const remove = async (u: any) => {
    if (!confirm(`ลบผู้ใช้ ${u.first_name} ${u.last_name}?`)) return
    await usersApi.remove(u.id); onReload()
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <button onClick={startAdd} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> เพิ่มผู้ใช้</button>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3">ชื่อ-นามสกุล</th>
              <th className="text-left px-5 py-3">อีเมล</th>
              <th className="text-center px-5 py-3">บทบาท</th>
              <th className="text-left px-5 py-3">ทีม</th>
              <th className="text-center px-5 py-3">สถานะ</th>
              <th className="text-center px-5 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewing(u)}>
                <td className="px-5 py-3.5 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                <td className="px-5 py-3.5 text-center"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{ROLE_LABELS[u.role]}</span></td>
                <td className="px-5 py-3.5 text-gray-600">{u.team?.name ?? '-'}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? 'ใช้งาน' : 'ปิด'}
                  </span>
                </td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => startEdit(u)} className="text-gray-400 hover:text-blue-600 p-1.5"><Edit2 size={15} /></button>
                    <button onClick={() => remove(u)} className="text-gray-400 hover:text-red-600 p-1.5"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่พบผู้ใช้</td></tr>}
          </tbody>
        </table></div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">รายละเอียดผู้ใช้</h3>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                {viewing.first_name?.[0]}{viewing.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{viewing.first_name} {viewing.last_name}</p>
                <p className="text-sm text-gray-500">{viewing.email}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">บทบาท:</span> <span className="font-medium">{ROLE_LABELS[viewing.role]}</span></div>
              <div><span className="text-gray-500">ทีม:</span> <span className="font-medium">{viewing.team?.name ?? '-'}</span></div>
              <div><span className="text-gray-500">เบอร์โทร:</span> <span className="font-medium">{viewing.phone ?? '-'}</span></div>
              <div><span className="text-gray-500">สถานะ:</span> <span className="font-medium">{viewing.is_active ? 'ใช้งาน' : 'ปิด'}</span></div>
              <div><span className="text-gray-500">วันที่สร้าง:</span> <span className="font-medium">{new Date(viewing.created_at).toLocaleDateString('th-TH')}</span></div>
            </div>
            <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-gray-100">
              <button onClick={() => startEdit(viewing)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">แก้ไข</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">{editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                  <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                  <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล *</label>
                <input required type="email" disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน {editing ? '(เว้นว่างไว้หากไม่เปลี่ยน)' : '* (อย่างน้อย 6 ตัว)'}
                </label>
                <input required={!editing} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="admin">ผู้ดูแล</option>
                    <option value="manager">ผู้จัดการ</option>
                    <option value="sales">พนักงานขาย</option>
                    <option value="cfo">ผู้บริหาร</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ทีม</label>
                  <select value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ไม่มีทีม --</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
