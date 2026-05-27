'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import { Search, X } from 'lucide-react'
import { usersApi } from '@/lib/api/services'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

export default function CFOUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<any>(null)

  useEffect(() => { usersApi.list().then(setUsers) }, [])

  const filtered = users.filter((u) => {
    const haystack = [
      u.first_name, u.last_name, u.email, u.phone,
      ROLE_LABELS[u.role], u.role,
      u.team?.name,
      u.is_active ? 'ใช้งาน active' : 'ปิด inactive',
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col h-full">
      <TopBar title="ผู้ใช้ทั้งหมด" />
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-72" />
            </div>
            <p className="ml-auto text-sm text-gray-500">{filtered.length} คน</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                  <th className="text-left px-5 py-3">ชื่อ-นามสกุล</th>
                  <th className="text-left px-5 py-3">อีเมล</th>
                  <th className="text-center px-5 py-3">บทบาท</th>
                  <th className="text-left px-5 py-3">ทีม</th>
                  <th className="text-center px-5 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewing(u)}>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5 text-center"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{ROLE_LABELS[u.role]}</span></td>
                    <td className="px-5 py-3.5 text-gray-600">{u.team?.name ?? '-'}</td>
                    <td className="px-5 py-3.5 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.is_active ? 'ใช้งาน' : 'ปิด'}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">ไม่พบผู้ใช้</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">รายละเอียดผู้ใช้</h3>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">{viewing.first_name?.[0]}{viewing.last_name?.[0]}</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
