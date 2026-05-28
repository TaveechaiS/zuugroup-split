'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ZonesClient from '@/components/shared/ZonesClient'
import { zonesApi } from '@/lib/api/services'

export default function AdminZonesPage() {
  const [zones, setZones] = useState<any[]>([])
  const load = () => zonesApi.list().then(setZones).catch(() => setZones([]))
  useEffect(() => { load() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="จัดการเขตการขาย" />
      <ZonesClient zones={zones} canEdit canDelete onReload={load} />
    </div>
  )
}
