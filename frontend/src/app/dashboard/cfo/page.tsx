'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CFODashboardClient from './DashboardClient'
import { dashboardApi } from '@/lib/api/services'

export default function CFODashboardPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { dashboardApi.cfo().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title="แดชบอร์ด" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title="แดชบอร์ด - ผู้บริหาร" />
      <CFODashboardClient stats={data.stats} topProducts={data.topProducts} topCustomers={data.topCustomers} monthlyData={data.monthlyData} teams={data.teams} />
    </div>
  )
}
