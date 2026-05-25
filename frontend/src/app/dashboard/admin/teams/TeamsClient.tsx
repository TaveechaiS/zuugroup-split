'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { teamsApi } from '@/lib/api/services'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

interface Props { teams: any[]; onReload: () => void }

export default function TeamsClient({ teams, onReload }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  const startAdd = () => { setEditing(null); setForm({ name: '', description: '' }); setShowForm(true); setError('') }
  const startEdit = (t: any) => { setEditing(t); setForm({ name: t.name, description: t.description ?? '' }); setShowForm(true); setError('') }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      if (editing) await teamsApi.update(editing.id, form)
      else await teamsApi.create(form)
      setShowForm(false); onReload()
    } catch (err: any) { setError(err.message) }
  }

  const remove = async (t: any) => {
    if (!confirm(`ลบทีม ${t.name}?`)) return
    await teamsApi.remove(t.id); onReload()
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center mb-5">
        <h2 className="text-base font-semibold text-gray-900">ทีมทั้งหมด ({teams.length})</h2>
        <button onClick={startAdd} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> สร้างทีม</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(t)} className="text-gray-400 hover:text-blue-600 p-1.5"><Edit2 size={14} /></button>
                <button onClick={() => remove(t)} className="text-gray-400 hover:text-red-600 p-1.5"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">สมาชิก ({t.members?.length ?? 0})</p>
              <div className="space-y-1.5">
                {(t.members ?? []).slice(0, 5).map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[10px]">{m.first_name?.[0]}{m.last_name?.[0]}</div>
                    <span className="text-gray-900 truncate">{m.first_name} {m.last_name}</span>
                    <span className="ml-auto text-xs text-gray-400">{ROLE_LABELS[m.role]}</span>
                  </div>
                ))}
                {(t.members?.length ?? 0) > 5 && <p className="text-xs text-gray-400">และอีก {t.members.length - 5} คน</p>}
              </div>
            </div>
          </div>
        ))}
        {teams.length === 0 && <div className="col-span-full text-center py-10 text-gray-400 text-sm">ยังไม่มีทีม</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{editing ? 'แก้ไขทีม' : 'สร้างทีมใหม่'}</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <input required placeholder="ชื่อทีม" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea rows={3} placeholder="คำอธิบาย (ไม่บังคับ)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2 justify-end pt-2">
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
