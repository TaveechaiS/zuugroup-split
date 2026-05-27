'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import TeamsClient from './TeamsClient'
import { teamsApi, usersApi } from '@/lib/api/services'

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const reload = () => Promise.all([teamsApi.list(), usersApi.list()]).then(([t, u]) => { setTeams(t ?? []); setUsers(u ?? []) })
  useEffect(() => { reload() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="จัดการทีม" />
      <TeamsClient teams={teams} allUsers={users} onReload={reload} />
    </div>
  )
}
