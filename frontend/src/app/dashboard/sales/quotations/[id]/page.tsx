'use client'

import { useEffect, useState } from 'react'
import QuotationViewClient from './QuotationViewClient'
import { quotationsApi } from '@/lib/api/services'

export default function QuotationViewPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<any>(null)
  useEffect(() => { quotationsApi.get(params.id).then(setQuotation).catch(() => setQuotation(null)) }, [params.id])
  if (!quotation) return <div className="p-6 text-gray-400">กำลังโหลด...</div>
  return <QuotationViewClient quotation={quotation} />
}
