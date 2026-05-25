'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminDashboardClient from './DashboardClient'
import { dashboardApi } from '@/lib/api/services'

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { dashboardApi.admin().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title="แดชบอร์ด" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title="แดชบอร์ด - ผู้ดูแลระบบ" />
      <AdminDashboardClient stats={data.stats} />
    </div>
  )
}
