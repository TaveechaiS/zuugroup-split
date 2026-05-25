'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminOrdersClient from './AdminOrdersClient'
import { ordersApi } from '@/lib/api/services'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => { ordersApi.list().then(setOrders) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="คำสั่งซื้อทั้งหมด" />
      <AdminOrdersClient orders={orders} />
    </div>
  )
}
