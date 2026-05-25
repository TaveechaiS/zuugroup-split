'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import UsersClient from './UsersClient'
import { usersApi, teamsApi } from '@/lib/api/services'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const reload = () => {
    Promise.all([usersApi.list(), teamsApi.list()])
      .then(([u, t]) => { setUsers(u ?? []); setTeams(t ?? []) })
  }
  useEffect(() => { reload() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="จัดการผู้ใช้" />
      <UsersClient users={users} teams={teams} onReload={reload} />
    </div>
  )
}
