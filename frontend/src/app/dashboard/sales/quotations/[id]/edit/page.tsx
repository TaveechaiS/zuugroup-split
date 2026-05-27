'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CreateQuotationClient from '@/app/dashboard/sales/create-quotation/CreateQuotationClient'
import { customersApi, productsApi, quotationsApi } from '@/lib/api/services'

export default function EditQuotationPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      quotationsApi.get(params.id),
      customersApi.list(),
      productsApi.list(),
    ]).then(([q, c, p]) => {
      if (!q) { setError('ไม่พบใบเสนอราคา'); return }
      if (q.status !== 'draft' && q.status !== 'pending') { setError('สามารถแก้ไขได้เฉพาะฉบับร่างหรือรออนุมัติเท่านั้น'); return }
      setQuotation(q)
      setCustomers(c ?? [])
      setProducts((p ?? []).filter((x: any) => x.status === 'available'))
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="flex flex-col h-full"><TopBar title="แก้ไขใบเสนอราคา" /><div className="p-6 text-gray-400 text-sm">กำลังโหลด...</div></div>
  if (error) return <div className="flex flex-col h-full"><TopBar title="แก้ไขใบเสนอราคา" /><div className="p-6 text-red-600 text-sm">{error}</div></div>

  return (
    <div className="flex flex-col h-full">
      <TopBar title={`แก้ไขใบเสนอราคา ${quotation?.quotation_number ?? ''}`} />
      <CreateQuotationClient customers={customers} products={products} initial={quotation} />
    </div>
  )
}
