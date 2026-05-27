'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import { X, Users as UsersIcon } from 'lucide-react'
import { teamsApi } from '@/lib/api/services'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

export default function CFOTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [viewing, setViewing] = useState<any>(null)

  useEffect(() => { teamsApi.list().then(setTeams) }, [])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="ทีมทั้งหมด" />
      <div className="p-4 sm:p-6">
        <p className="text-sm text-gray-500 mb-4">ทั้งหมด {teams.length} ทีม</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 cursor-pointer" onClick={() => setViewing(t)}>
              <h3 className="font-semibold text-gray-900">{t.name}</h3>
              {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><UsersIcon size={12} /> {(t.members ?? []).length} สมาชิก</p>
            </div>
          ))}
          {teams.length === 0 && <div className="col-span-full text-center py-10 text-gray-400 text-sm">ยังไม่มีทีม</div>}
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{viewing.name}</h3>
                {viewing.description && <p className="text-xs text-gray-500 mt-0.5">{viewing.description}</p>}
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><UsersIcon size={14} /> สมาชิก ({(viewing.members ?? []).length})</p>
              {(viewing.members ?? []).map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[10px]">{m.first_name?.[0]}{m.last_name?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">{ROLE_LABELS[m.role]}</span>
                </div>
              ))}
              {(viewing.members ?? []).length === 0 && <p className="text-center text-gray-400 text-xs py-3">ยังไม่มีสมาชิก</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
