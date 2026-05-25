'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CustomersViewClient from '@/components/shared/CustomersViewClient'
import { customersApi } from '@/lib/api/services'

export default function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  useEffect(() => { customersApi.list().then(setCustomers) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="ข้อมูลลูกค้า" />
      <CustomersViewClient customers={customers} />
    </div>
  )
}
