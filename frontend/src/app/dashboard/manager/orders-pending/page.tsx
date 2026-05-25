'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import PendingOrdersClient from './PendingOrdersClient'
import { ordersApi } from '@/lib/api/services'

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => { ordersApi.list({ scope: 'pending' }).then(setOrders) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="คำสั่งซื้อรอตรวจสอบ" />
      <PendingOrdersClient orders={orders} />
    </div>
  )
}
