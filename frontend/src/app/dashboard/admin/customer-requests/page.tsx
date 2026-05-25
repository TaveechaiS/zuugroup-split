'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CustomerRequestsClient from './CustomerRequestsClient'
import { customerRequestsApi } from '@/lib/api/services'

export default function AdminCustomerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  useEffect(() => { customerRequestsApi.list().then(setRequests) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="คำขอเพิ่มลูกค้า" />
      <CustomerRequestsClient requests={requests} />
    </div>
  )
}
