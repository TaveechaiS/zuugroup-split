'use client'

import { useEffect, useState } from 'react'
import { Bell, Search, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { notificationsApi } from '@/lib/api/services'
import { useUI } from '@/lib/ui-context'

interface Props { title: string }

export default function TopBar({ title }: Props) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const { openMobileSidebar, sidebarCollapsed, toggleSidebar } = useUI()

  const loadNotifications = async () => {
    try { setNotifications(await notificationsApi.list()) } catch { /* ignore */ }
  }

  useEffect(() => {
    loadNotifications()
    const id = setInterval(loadNotifications, 30000)
    return () => clearInterval(id)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAllRead = async () => {
    await notificationsApi.markAllRead()
    loadNotifications()
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
      {/* Hamburger (mobile only) */}
      <button
        onClick={openMobileSidebar}
        className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg shrink-0"
        aria-label="เปิดเมนู"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* Desktop sidebar toggle (before title) */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 shrink-0"
        aria-label={sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
        title={sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate flex-1 lg:flex-initial">{title}</h2>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Desktop: search inline. Mobile: icon toggle */}
        <div className="hidden md:block relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="ค้นหา..."
            className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-40 lg:w-56"
          />
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="ค้นหา"
        >
          <Search size={18} className="text-gray-600" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg hover:bg-gray-100"
            aria-label="การแจ้งเตือน"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">อ่านทั้งหมด</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">ไม่มีการแจ้งเตือน</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile search row */}
      {showSearch && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-3 z-30">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              placeholder="ค้นหา..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
