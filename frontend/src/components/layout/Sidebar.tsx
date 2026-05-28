'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, FileBarChart, FolderOpen, ShoppingCart,
  Users, UserPlus, Package, UsersRound, ClipboardList, Activity,
  FilePlus, Plus, LogOut, X, MapPin, ChevronDown, ChevronRight,
} from 'lucide-react'
import { logout } from '@/lib/api/auth'
import { badgesApi } from '@/lib/api/services'
import { useUI } from '@/lib/ui-context'

interface Props {
  role: 'admin' | 'manager' | 'sales' | 'cfo'
  user: any
  mobileOpen: boolean
  onMobileClose: () => void
}

// Map a nav href to the badge key from /api/badges
const BADGE_KEY: Record<string, string> = {
  '/dashboard/admin/customer-requests':      'customer_requests',
  '/dashboard/admin/orders':                 'pending_orders',
  '/dashboard/manager/quotations-pending':   'pending_quotations',
  '/dashboard/manager/orders-pending':       'pending_orders',
}

const SEEN_KEY = 'zuugroup_badge_seen'

interface NavItem { href: string; label: string; icon: any }
interface NavGroup { id: string; label: string; items: NavItem[] }

const NAV: Record<string, NavGroup[]> = {
  admin: [
    { id: 'main', label: 'หลัก', items: [
      { href: '/dashboard/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { href: '/dashboard/admin/reports', label: 'รายงาน', icon: FileBarChart },
    ]},
    { id: 'docs', label: 'เอกสาร', items: [
      { href: '/dashboard/admin/customer-requests', label: 'คำขอเพิ่มลูกค้า', icon: ClipboardList },
      { href: '/dashboard/admin/orders', label: 'คำสั่งซื้อ', icon: ShoppingCart },
    ]},
    { id: 'master', label: 'ข้อมูลหลัก', items: [
      { href: '/dashboard/admin/customers', label: 'จัดการลูกค้า', icon: UserPlus },
      { href: '/dashboard/admin/products', label: 'จัดการสินค้า', icon: Package },
    ]},
    { id: 'org', label: 'องค์กร', items: [
      { href: '/dashboard/admin/users', label: 'จัดการผู้ใช้', icon: Users },
      { href: '/dashboard/admin/teams', label: 'จัดการทีม', icon: UsersRound },
      { href: '/dashboard/admin/zones', label: 'เขตการขาย', icon: MapPin },
    ]},
    { id: 'system', label: 'ระบบ', items: [
      { href: '/dashboard/admin/activity-logs', label: 'บันทึกการใช้งาน', icon: Activity },
    ]},
  ],
  manager: [
    { id: 'main', label: 'หลัก', items: [
      { href: '/dashboard/manager', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { href: '/dashboard/manager/reports', label: 'รายงานทีม', icon: FileBarChart },
    ]},
    { id: 'pending', label: 'รออนุมัติ', items: [
      { href: '/dashboard/manager/quotations-pending', label: 'ใบเสนอราคารออนุมัติ', icon: FileText },
      { href: '/dashboard/manager/orders-pending', label: 'คำสั่งซื้อรอตรวจสอบ', icon: ShoppingCart },
    ]},
    { id: 'create', label: 'สร้างเอกสาร', items: [
      { href: '/dashboard/manager/create-quotation', label: 'สร้างใบเสนอราคา', icon: FilePlus },
      { href: '/dashboard/manager/create-order', label: 'สร้างคำสั่งซื้อ', icon: Plus },
      { href: '/dashboard/manager/request-customer', label: 'ขอเพิ่มลูกค้า', icon: ClipboardList },
    ]},
    { id: 'docs', label: 'เอกสาร', items: [
      { href: '/dashboard/manager/my-documents', label: 'เอกสารของฉัน', icon: FolderOpen },
      { href: '/dashboard/manager/team-documents', label: 'เอกสารทีม', icon: FolderOpen },
    ]},
    { id: 'master', label: 'ข้อมูลหลัก', items: [
      { href: '/dashboard/manager/customers', label: 'ข้อมูลลูกค้า', icon: UserPlus },
      { href: '/dashboard/manager/products', label: 'ข้อมูลสินค้า', icon: Package },
    ]},
    { id: 'team', label: 'ทีม', items: [
      { href: '/dashboard/manager/team-members', label: 'สมาชิกทีม', icon: UsersRound },
      { href: '/dashboard/manager/zones', label: 'เขตการขาย', icon: MapPin },
    ]},
  ],
  sales: [
    { id: 'docs', label: 'เอกสาร', items: [
      { href: '/dashboard/sales', label: 'เอกสารของฉัน', icon: FolderOpen },
    ]},
    { id: 'create', label: 'สร้างเอกสาร', items: [
      { href: '/dashboard/sales/create-quotation', label: 'สร้างใบเสนอราคา', icon: FilePlus },
      { href: '/dashboard/sales/create-order', label: 'สร้างคำสั่งซื้อ', icon: Plus },
      { href: '/dashboard/sales/request-customer', label: 'ขอเพิ่มลูกค้า', icon: ClipboardList },
    ]},
    { id: 'master', label: 'ข้อมูลหลัก', items: [
      { href: '/dashboard/sales/customers', label: 'ข้อมูลลูกค้า', icon: UserPlus },
      { href: '/dashboard/sales/products', label: 'ข้อมูลสินค้า', icon: Package },
    ]},
  ],
  cfo: [
    { id: 'main', label: 'หลัก', items: [
      { href: '/dashboard/cfo', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { href: '/dashboard/cfo/reports', label: 'รายงาน', icon: FileBarChart },
    ]},
    { id: 'master', label: 'ข้อมูลทั้งหมด', items: [
      { href: '/dashboard/cfo/customers', label: 'ลูกค้าทั้งหมด', icon: UserPlus },
      { href: '/dashboard/cfo/products', label: 'สินค้าทั้งหมด', icon: Package },
      { href: '/dashboard/cfo/users', label: 'ผู้ใช้ทั้งหมด', icon: Users },
      { href: '/dashboard/cfo/teams', label: 'ทีมทั้งหมด', icon: UsersRound },
    ]},
  ],
}

const GROUP_STATE_KEY = 'zuugroup_sidebar_groups'

const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการทีม', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร',
}

export default function Sidebar({ role, user, mobileOpen, onMobileClose }: Props) {
  const { sidebarCollapsed: collapsed } = useUI()
  const pathname = usePathname()
  const router = useRouter()
  const groups = NAV[role] ?? []
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [seen, setSeen] = useState<Record<string, number>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // Restore group expand state. Default: all open.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUP_STATE_KEY)
      if (raw) {
        setOpenGroups(JSON.parse(raw))
      } else {
        const defaults: Record<string, boolean> = {}
        groups.forEach((g) => { defaults[g.id] = true })
        setOpenGroups(defaults)
      }
    } catch {
      const defaults: Record<string, boolean> = {}
      groups.forEach((g) => { defaults[g.id] = true })
      setOpenGroups(defaults)
    }
  }, [role]) // eslint-disable-line

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !(prev[id] ?? true) }
      try { localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  // Load badge counts + poll every 20s
  useEffect(() => {
    const load = () => badgesApi.get().then(setBadges).catch(() => { /* ignore */ })
    load()
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [])

  // Restore "seen" counts from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      if (raw) setSeen(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  // When user visits a path, mark its current badge count as "seen"
  useEffect(() => {
    const key = BADGE_KEY[pathname]
    if (!key) return
    const current = badges[key] ?? 0
    if ((seen[pathname] ?? -1) !== current) {
      const next = { ...seen, [pathname]: current }
      setSeen(next)
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    }
  }, [pathname, badges]) // eslint-disable-line

  const hasUnseen = (href: string): { show: boolean; count: number } => {
    const key = BADGE_KEY[href]
    if (!key) return { show: false, count: 0 }
    const current = badges[key] ?? 0
    const seenCount = seen[href] ?? 0
    return { show: current > seenCount && current > 0, count: current }
  }

  // Close mobile drawer on route change
  useEffect(() => { onMobileClose() }, [pathname]) // eslint-disable-line

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          bg-white border-r border-gray-200 flex flex-col transition-all duration-200
          fixed lg:relative inset-y-0 left-0 z-50
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Logo / Header (toggle button lives in TopBar) */}
        <div className="border-b border-gray-100">
          {collapsed ? (
            <div className="flex justify-center py-4">
              <img src="/images/logo.png" alt="ZUUGROUP" className="w-9 h-9 object-contain" />
            </div>
          ) : (
            <div className="p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/images/logo.png" alt="ZUUGROUP" className="w-9 h-9 object-contain shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-[#2563EB] leading-tight">ZUUGROUP</h1>
                  <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[role]}</p>
                </div>
              </div>
              {/* Mobile close — keep only on mobile drawer */}
              <button
                onClick={onMobileClose}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg shrink-0 text-gray-500"
                aria-label="ปิดเมนู"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Nav (collapsible groups) */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {groups.map((group) => {
            const isOpen = openGroups[group.id] ?? true
            // Aggregate unseen badge counts across group's items
            const groupUnseenCount = group.items.reduce((sum, it) => {
              const u = hasUnseen(it.href)
              return sum + (u.show ? u.count : 0)
            }, 0)
            return (
              <div key={group.id}>
                {/* Group header (hidden when collapsed) */}
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                  >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span className="flex-1 text-left">{group.label}</span>
                    {!isOpen && groupUnseenCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                        {groupUnseenCount > 9 ? '9+' : groupUnseenCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Group items */}
                {(collapsed || isOpen) && (
                  <div className={`${collapsed ? '' : 'mt-0.5'} space-y-0.5`}>
                    {group.items.map((item) => {
                      const active = pathname === item.href
                      const Icon = item.icon
                      const { show: hasDot, count } = hasUnseen(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`relative flex items-center gap-3 ${collapsed ? 'px-2.5' : 'px-3'} py-2 rounded-lg text-sm transition ${
                            active
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          title={collapsed ? `${item.label}${hasDot ? ` (${count} ใหม่)` : ''}` : undefined}
                        >
                          {active && !collapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-600 rounded-r" />}
                          <span className="relative shrink-0 inline-flex">
                            <Icon size={17} />
                            {hasDot && (
                              <span className="absolute -top-1 -left-1 min-w-[14px] h-[14px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                {count > 9 ? '9+' : count}
                              </span>
                            )}
                          </span>
                          {!collapsed && (
                            <span className="flex-1 truncate">{item.label}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-2 px-2 py-2">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                {(role === 'sales' || role === 'manager') && user.team?.name && (
                  <p className="text-[10px] text-blue-600 font-medium truncate mt-0.5">ทีม: {user.team.name}</p>
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
            title="ออกจากระบบ"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
