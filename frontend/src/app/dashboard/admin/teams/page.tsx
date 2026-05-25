'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import TeamsClient from './TeamsClient'
import { teamsApi } from '@/lib/api/services'

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const reload = () => teamsApi.list().then(setTeams)
  useEffect(() => { reload() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="จัดการทีม" />
      <TeamsClient teams={teams} onReload={reload} />
    </div>
  )
}
