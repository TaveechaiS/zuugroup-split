'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, FileBarChart, FolderOpen, ShoppingCart,
  Users, UserPlus, Package, UsersRound, ClipboardList, Activity,
  FilePlus, Plus, LogOut, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { logout } from '@/lib/api/auth'

interface Props {
  role: 'admin' | 'manager' | 'sales' | 'cfo'
  user: any
  mobileOpen: boolean
  onMobileClose: () => void
}

const NAV: Record<string, { href: string; label: string; icon: any }[]> = {
  admin: [
    { href: '/dashboard/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/dashboard/admin/reports', label: 'รายงาน', icon: FileBarChart },
    { href: '/dashboard/admin/users', label: 'จัดการผู้ใช้', icon: Users },
    { href: '/dashboard/admin/customers', label: 'จัดการลูกค้า', icon: UserPlus },
    { href: '/dashboard/admin/products', label: 'จัดการสินค้า', icon: Package },
    { href: '/dashboard/admin/teams', label: 'จัดการทีม', icon: UsersRound },
    { href: '/dashboard/admin/customer-requests', label: 'คำขอเพิ่มลูกค้า', icon: ClipboardList },
    { href: '/dashboard/admin/orders', label: 'คำสั่งซื้อ', icon: ShoppingCart },
    { href: '/dashboard/admin/activity-logs', label: 'บันทึกการใช้งาน', icon: Activity },
  ],
  manager: [
    { href: '/dashboard/manager', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/dashboard/manager/reports', label: 'รายงานทีม', icon: FileBarChart },
    { href: '/dashboard/manager/team-documents', label: 'เอกสารทีม', icon: FolderOpen },
    { href: '/dashboard/manager/quotations-pending', label: 'ใบเสนอราคารออนุมัติ', icon: FileText },
    { href: '/dashboard/manager/orders-pending', label: 'คำสั่งซื้อรอตรวจสอบ', icon: ShoppingCart },
    { href: '/dashboard/manager/team-members', label: 'สมาชิกทีม', icon: UsersRound },
    { href: '/dashboard/manager/my-documents', label: 'เอกสารของฉัน', icon: FolderOpen },
    { href: '/dashboard/manager/create-quotation', label: 'สร้างใบเสนอราคา', icon: FilePlus },
    { href: '/dashboard/manager/create-order', label: 'สร้างคำสั่งซื้อ', icon: Plus },
    { href: '/dashboard/manager/customers', label: 'ข้อมูลลูกค้า', icon: UserPlus },
    { href: '/dashboard/manager/products', label: 'ข้อมูลสินค้า', icon: Package },
    { href: '/dashboard/manager/request-customer', label: 'ขอเพิ่มลูกค้า', icon: ClipboardList },
  ],
  sales: [
    { href: '/dashboard/sales', label: 'เอกสารของฉัน', icon: FolderOpen },
    { href: '/dashboard/sales/create-quotation', label: 'สร้างใบเสนอราคา', icon: FilePlus },
    { href: '/dashboard/sales/create-order', label: 'สร้างคำสั่งซื้อ', icon: Plus },
    { href: '/dashboard/sales/customers', label: 'ข้อมูลลูกค้า', icon: UserPlus },
    { href: '/dashboard/sales/products', label: 'ข้อมูลสินค้า', icon: Package },
    { href: '/dashboard/sales/request-customer', label: 'ขอเพิ่มลูกค้า', icon: ClipboardList },
  ],
  cfo: [
    { href: '/dashboard/cfo', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/dashboard/cfo/reports', label: 'รายงาน', icon: FileBarChart },
    { href: '/dashboard/cfo/users', label: 'ผู้ใช้ทั้งหมด', icon: Users },
    { href: '/dashboard/cfo/teams', label: 'ทีมทั้งหมด', icon: UsersRound },
    { href: '/dashboard/cfo/products', label: 'สินค้าทั้งหมด', icon: Package },
    { href: '/dashboard/cfo/customers', label: 'ลูกค้าทั้งหมด', icon: UserPlus },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการทีม', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร',
}

export default function Sidebar({ role, user, mobileOpen, onMobileClose }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const items = NAV[role] ?? []

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
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-[#2563EB]">ZUUGROUP</h1>
              <p className="text-xs text-gray-500">{ROLE_LABELS[role]}</p>
            </div>
          )}
          {/* Mobile: close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
            aria-label="ปิดเมนู"
          >
            <X size={18} />
          </button>
          {/* Desktop: collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1.5 hover:bg-gray-100 rounded-lg"
            aria-label={collapsed ? 'ขยาย' : 'ย่อ'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
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
