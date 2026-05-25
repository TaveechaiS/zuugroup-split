'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface UIContextValue {
  mobileSidebarOpen: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <UIContext.Provider
      value={{
        mobileSidebarOpen: open,
        openMobileSidebar: () => setOpen(true),
        closeMobileSidebar: () => setOpen(false),
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
