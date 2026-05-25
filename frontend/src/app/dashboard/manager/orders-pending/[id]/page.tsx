'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import OrderReviewClient from './OrderReviewClient'
import { ordersApi } from '@/lib/api/services'

export default function OrderReviewPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null)
  useEffect(() => { ordersApi.get(params.id).then(setOrder).catch(() => setOrder(null)) }, [params.id])
  if (!order) return <div className="flex flex-col h-full"><TopBar title="ตรวจสอบคำสั่งซื้อ" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title="ตรวจสอบคำสั่งซื้อ" />
      <OrderReviewClient order={order} />
    </div>
  )
}
