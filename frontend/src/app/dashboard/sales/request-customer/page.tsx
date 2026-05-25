'use client'

import TopBar from '@/components/layout/TopBar'
import CustomerFormClient from '@/components/shared/CustomerFormClient'

export default function RequestCustomerPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="ส่งคำขอเพิ่มลูกค้า" />
      <CustomerFormClient mode="request" />
    </div>
  )
}
