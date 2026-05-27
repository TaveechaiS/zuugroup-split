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
    // Only redirect when the user lands on ANOTHER role's dashboard ROOT
    // (e.g. /dashboard/sales for a manager). Sub-pages like
    // /dashboard/sales/quotations/{id} are accessible cross-role
    // because the backend enforces permissions.
    const segs = pathname.split('/').filter(Boolean)  // ['dashboard', '<role>', ...]
    const segRole = segs[1]
    const isRoleRoot = segs.length === 2

    const stored = currentUser()
    if (stored) {
      setUser(stored)
      setLoading(false)
      if (isRoleRoot && segRole && segRole !== stored.role) {
        router.push(`/dashboard/${stored.role}`)
      }
    }
    fetchMe().then((u) => {
      if (!u) {
        if (!stored) router.push('/auth/login')
        return
      }
      setUser(u)
      setLoading(false)
      if (isRoleRoot && segRole && segRole !== u.role) {
        router.push(`/dashboard/${u.role}`)
      }
    })
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
