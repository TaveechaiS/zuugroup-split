import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZUUGROUP - ระบบจัดการตัวแทนขายยา',
  description: 'Sales agent management system',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
