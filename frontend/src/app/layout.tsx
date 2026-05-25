import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZUUGROUP - ระบบจัดการตัวแทนขายยา',
  description: 'Sales agent management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
