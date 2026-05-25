'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CustomerDetailClient from './CustomerDetailClient'
import { customersApi, productsApi } from '@/lib/api/services'

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [prices, setPrices] = useState<any[]>([])
  useEffect(() => {
    Promise.all([
      customersApi.get(params.id),
      productsApi.list(),
      customersApi.prices(params.id),
    ]).then(([c, p, pr]) => { setCustomer(c); setProducts(p ?? []); setPrices(pr ?? []) })
  }, [params.id])
  if (!customer) return <div className="flex flex-col h-full"><TopBar title="ข้อมูลลูกค้า" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={customer.company_name} />
      <CustomerDetailClient customer={customer} products={products} customPrices={prices} />
    </div>
  )
}
