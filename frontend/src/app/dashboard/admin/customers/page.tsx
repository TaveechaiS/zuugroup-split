'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminCustomersClient from './AdminCustomersClient'
import { customersApi } from '@/lib/api/services'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const reload = () => customersApi.list().then(setCustomers)
  useEffect(() => { reload() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="จัดการลูกค้า" />
      <AdminCustomersClient customers={customers} onReload={reload} />
    </div>
  )
}
