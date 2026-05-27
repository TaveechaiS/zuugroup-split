'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CustomersViewClient from '@/components/shared/CustomersViewClient'
import { customersApi } from '@/lib/api/services'

export default function CFOCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  useEffect(() => { customersApi.list().then(setCustomers) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="ลูกค้าทั้งหมด" />
      <CustomersViewClient customers={customers} />
    </div>
  )
}
