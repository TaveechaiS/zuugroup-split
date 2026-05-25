'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ManagerReportsClient from './ManagerReportsClient'
import { reportsApi } from '@/lib/api/services'

export default function ManagerReportsPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { reportsApi.manager().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title="รายงานทีม" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title="รายงานทีม" />
      <ManagerReportsClient quotations={data.quotations ?? []} orders={data.orders ?? []} teamMembers={data.teamMembers ?? []} />
    </div>
  )
}
