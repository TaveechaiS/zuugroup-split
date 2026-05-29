'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CreateOrderClient from '@/app/dashboard/sales/create-order/CreateOrderClient'
import { customersApi, productsApi, quotationsApi } from '@/lib/api/services'

export default function ManagerCreateOrderPage({ searchParams }: { searchParams: { fromQuotation?: string } }) {
  const fromQuotation = searchParams?.fromQuotation
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [prefill, setPrefill] = useState<any>(undefined)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const tasks: Promise<any>[] = [customersApi.list(), productsApi.list()]
    if (fromQuotation) tasks.push(quotationsApi.get(fromQuotation))
    Promise.all(tasks)
      .then(([c, p, q]) => {
        setCustomers(c ?? [])
        setProducts((p ?? []).filter((x: any) => x.status === 'available'))
        if (q) setPrefill({
          customerId: q.customer_id,
          sourceQuotationId: q.id,
          quotationNumber: q.quotation_number,
          items: (q.items ?? []).map((it: any) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: Number(it.negotiated_price ?? it.unit_price),
            product_name: it.product?.name,
          })),
        })
      })
      .finally(() => setLoading(false))
  }, [fromQuotation])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="สร้างคำสั่งซื้อ" />
      {loading ? <div className="p-6 text-gray-400">กำลังโหลด...</div> :
        <CreateOrderClient customers={customers} products={products} prefill={prefill} />}
    </div>
  )
}
