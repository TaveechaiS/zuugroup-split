'use client'

import { useEffect, useState } from 'react'
import OrderViewClient from './OrderViewClient'
import { ordersApi } from '@/lib/api/services'

export default function OrderViewPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null)
  useEffect(() => { ordersApi.get(params.id).then(setOrder).catch(() => setOrder(null)) }, [params.id])
  if (!order) return <div className="p-6 text-gray-400">กำลังโหลด...</div>
  return <OrderViewClient order={order} />
}
