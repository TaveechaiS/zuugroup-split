'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import QuotationApprovalClient from './QuotationApprovalClient'
import { quotationsApi } from '@/lib/api/services'

export default function ApprovalPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<any>(null)
  useEffect(() => { quotationsApi.get(params.id).then(setQuotation).catch(() => setQuotation(null)) }, [params.id])
  if (!quotation) return <div className="flex flex-col h-full"><TopBar title="พิจารณาใบเสนอราคา" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title="พิจารณาใบเสนอราคา" />
      <QuotationApprovalClient quotation={quotation} />
    </div>
  )
}
