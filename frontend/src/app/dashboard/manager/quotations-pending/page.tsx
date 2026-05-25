'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import PendingQuotationsClient from './PendingQuotationsClient'
import { quotationsApi } from '@/lib/api/services'

export default function PendingQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  useEffect(() => { quotationsApi.list({ scope: 'pending' }).then(setQuotations) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="ใบเสนอราคารออนุมัติ" />
      <PendingQuotationsClient quotations={quotations} />
    </div>
  )
}
