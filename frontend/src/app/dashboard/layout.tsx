'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { fetchMe, currentUser } from '@/lib/api/auth'
import Sidebar from '@/components/layout/Sidebar'
import { UIProvider, useUI } from '@/lib/ui-context'

function DashboardInner({ user, children }: { user: any; children: React.ReactNode }) {
  const { mobileSidebarOpen, closeMobileSidebar } = useUI()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role={user.role}
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <main className="flex-1 overflow-y-auto w-full">{children}</main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = currentUser()
    if (!stored) {
      fetchMe().then((u) => {
        if (!u) router.push('/auth/login')
        else {
          setUser(u)
          setLoading(false)
          if (!pathname.includes(`/dashboard/${u.role}`)) {
            router.push(`/dashboard/${u.role}`)
          }
        }
      })
    } else {
      setUser(stored)
      setLoading(false)
      const segs = pathname.split('/')
      const segRole = segs[2]
      if (segRole && segRole !== stored.role) {
        router.push(`/dashboard/${stored.role}`)
      }
    }
  }, [pathname, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <UIProvider>
      <DashboardInner user={user}>{children}</DashboardInner>
    </UIProvider>
  )
}
