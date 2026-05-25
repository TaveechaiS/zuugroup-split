'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import DocumentsClient from '@/app/dashboard/sales/DocumentsClient'
import { quotationsApi, ordersApi } from '@/lib/api/services'

export default function ManagerMyDocsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => {
    Promise.all([quotationsApi.list({ scope: 'my' }), ordersApi.list({ scope: 'my' })])
      .then(([q, o]) => { setQuotations(q ?? []); setOrders(o ?? []) })
  }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="เอกสารของฉัน" />
      <DocumentsClient quotations={quotations} orders={orders} />
    </div>
  )
}
