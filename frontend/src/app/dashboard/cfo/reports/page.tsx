'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminReportsClient from '@/app/dashboard/admin/reports/AdminReportsClient'
import { reportsApi } from '@/lib/api/services'

export default function CFOReportsPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { reportsApi.admin().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title="รายงาน" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title="รายงาน" />
      <AdminReportsClient orders={data.orders ?? []} products={data.products ?? []} customers={data.customers ?? []} orderItems={data.orderItems ?? []} />
    </div>
  )
}
