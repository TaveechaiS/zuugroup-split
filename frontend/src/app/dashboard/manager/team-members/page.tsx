'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import { teamsApi } from '@/lib/api/services'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

export default function TeamMembersPage() {
  const [members, setMembers] = useState<any[]>([])
  useEffect(() => { teamsApi.my().then((d) => setMembers(d?.members ?? [])) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="รายชื่อพนักงานในทีม" />
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:border-blue-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{m.first_name} {m.last_name}</p>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{ROLE_LABELS[m.role]}</span>
                </div>
              </div>
            ))}
            {members.length === 0 && <div className="col-span-full text-center py-10 text-gray-400 text-sm">ยังไม่มีสมาชิกในทีม</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
