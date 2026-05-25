'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ManagerDashboardClient from './DashboardClient'
import { dashboardApi } from '@/lib/api/services'

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasTeam, setHasTeam] = useState(true)

  useEffect(() => {
    dashboardApi.manager().then((data) => {
      if (!data) setHasTeam(false)
      else setStats(data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex flex-col h-full"><TopBar title="แดชบอร์ด" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  if (!hasTeam) return (
    <div className="flex flex-col h-full"><TopBar title="แดชบอร์ด" />
      <div className="p-4 sm:p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          คุณยังไม่ได้ถูกมอบหมายให้อยู่ในทีมใด กรุณาติดต่อผู้ดูแลระบบ
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <TopBar title="แดชบอร์ด - ผู้จัดการทีม" />
      <ManagerDashboardClient stats={stats} />
    </div>
  )
}
