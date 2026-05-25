'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import RequestDetailClient from './RequestDetailClient'
import { customerRequestsApi } from '@/lib/api/services'

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<any>(null)
  useEffect(() => { customerRequestsApi.get(params.id).then(setRequest).catch(() => setRequest(null)) }, [params.id])
  if (!request) return <div className="flex flex-col h-full"><TopBar title="คำขอเพิ่มลูกค้า" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title="พิจารณาคำขอเพิ่มลูกค้า" />
      <RequestDetailClient request={request} />
    </div>
  )
}
