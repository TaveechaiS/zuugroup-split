'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CreateOrderClient from '@/app/dashboard/sales/create-order/CreateOrderClient'
import { customersApi, productsApi } from '@/lib/api/services'

export default function ManagerCreateOrderPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([customersApi.list(), productsApi.list()])
      .then(([c, p]) => { setCustomers(c ?? []); setProducts((p ?? []).filter((x: any) => x.status === 'available')) })
      .finally(() => setLoading(false))
  }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="สร้างคำสั่งซื้อ" />
      {loading ? <div className="p-6 text-gray-400">กำลังโหลด...</div> : <CreateOrderClient customers={customers} products={products} />}
    </div>
  )
}
