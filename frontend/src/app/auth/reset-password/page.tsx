'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import { resetPassword } from '@/lib/api/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState('')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Supabase appends the recovery tokens in the URL hash on redirect:
  // ...?#access_token=...&refresh_token=...&type=recovery
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace(/^#/, '')
    const params = new URLSearchParams(hash)
    const at = params.get('access_token')
    const type = params.get('type')
    const errDesc = params.get('error_description')
    if (errDesc) {
      setTokenError(decodeURIComponent(errDesc).replace(/\+/g, ' '))
      return
    }
    if (!at || (type && type !== 'recovery')) {
      setTokenError('ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์รีเซ็ตใหม่จากหน้าเข้าสู่ระบบ')
      return
    }
    setAccessToken(at)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!accessToken) {
      setError('ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน')
      return
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }
    setLoading(true)
    try {
      await resetPassword(accessToken, password)
      setDone(true)
      // Clear the URL hash so the token isn't sitting around
      try { history.replaceState(null, '', window.location.pathname) } catch {}
      setTimeout(() => router.push('/auth/login'), 2500)
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — same as login */}
      <div className="hidden md:flex flex-col justify-between bg-[#2563EB] text-white p-12 w-1/2">
        <div className="flex items-center gap-3">
          <img src="/images/logo-white.png" alt="ZUUGROUP" className="w-14 h-14 object-contain shrink-0" />
          <div>
            <h1 className="text-3xl font-bold leading-none">ZUUGROUP</h1>
            <p className="text-blue-100 mt-1 text-sm">ระบบจัดการตัวแทนขายยา</p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-tight">
            ตั้งรหัสผ่านใหม่
          </h2>
          <p className="text-blue-100 mt-3 text-sm leading-relaxed">
            กรอกรหัสผ่านใหม่สองครั้งเพื่อยืนยัน<br />
            แล้วเข้าสู่ระบบด้วยรหัสใหม่ได้ทันที
          </p>
        </div>
        <p className="text-xs text-blue-200">© 2026 ZUUGROUP. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 mb-6">
            <img src="/images/logo.png" alt="ZUUGROUP" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-[#2563EB]">ZUUGROUP</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">ตั้งรหัสผ่านใหม่</h2>
          <p className="text-sm text-gray-500 mb-8">กรอกรหัสผ่านใหม่ที่ต้องการใช้ในการเข้าสู่ระบบ</p>

          {tokenError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {tokenError}
              <div className="mt-2">
                <a href="/auth/login" className="text-red-700 underline">กลับไปหน้าเข้าสู่ระบบ</a>
              </div>
            </div>
          )}

          {done && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2">
              <Check size={18} className="shrink-0 mt-0.5" />
              <div>
                เปลี่ยนรหัสผ่านเรียบร้อย กำลังพากลับไปหน้าเข้าสู่ระบบ...
                <div className="mt-1"><a href="/auth/login" className="text-green-700 underline">เข้าสู่ระบบทันที</a></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          {!tokenError && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่านใหม่</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type={showPw2 ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-xs text-red-600 mt-1">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !accessToken}
                className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium transition"
              >
                {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>

              <a href="/auth/login" className="block text-center text-sm text-gray-600 hover:underline">
                กลับไปหน้าเข้าสู่ระบบ
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
