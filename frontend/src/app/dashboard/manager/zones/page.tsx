'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ZonesClient from '@/components/shared/ZonesClient'
import { zonesApi } from '@/lib/api/services'

export default function ManagerZonesPage() {
  const [zones, setZones] = useState<any[]>([])
  const load = () => zonesApi.list().then(setZones).catch(() => setZones([]))
  useEffect(() => { load() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="เขตการขาย" />
      {/* Manager can ADD but not edit/delete */}
      <ZonesClient zones={zones} canEdit={false} canDelete={false} onReload={load} />
    </div>
  )
}
