'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface UIContextValue {
  mobileSidebarOpen: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <UIContext.Provider
      value={{
        mobileSidebarOpen: mobileOpen,
        openMobileSidebar: () => setMobileOpen(true),
        closeMobileSidebar: () => setMobileOpen(false),
        sidebarCollapsed: collapsed,
        toggleSidebar: () => setCollapsed((v) => !v),
        setSidebarCollapsed: setCollapsed,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
