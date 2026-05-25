'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import { activityLogsApi } from '@/lib/api/services'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => { activityLogsApi.list().then(setLogs) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="บันทึกการใช้งาน" />
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3">เวลา</th>
                <th className="text-left px-5 py-3">ผู้ใช้</th>
                <th className="text-left px-5 py-3">บทบาท</th>
                <th className="text-left px-5 py-3">การกระทำ</th>
                <th className="text-left px-5 py-3">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600 text-xs">{new Date(log.created_at).toLocaleString('th-TH')}</td>
                  <td className="px-5 py-3 text-gray-900">{log.user?.first_name} {log.user?.last_name}</td>
                  <td className="px-5 py-3 text-gray-600">{ROLE_LABELS[log.user?.role] ?? '-'}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{log.action}</span></td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{log.details ? JSON.stringify(log.details) : '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">ยังไม่มีบันทึก</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  )
}
