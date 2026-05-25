'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { login, forgotPassword } from '@/lib/api/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      if (!res.user) {
        setError('ไม่พบข้อมูลผู้ใช้ในระบบ')
        setLoading(false)
        return
      }
      const role = res.user.role
      router.push(`/dashboard/${role}`)
    } catch (err: any) {
      setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotMsg('')
    try {
      await forgotPassword(forgotEmail)
      setForgotMsg('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว')
    } catch (err: any) {
      setForgotMsg(err.message || 'ไม่สามารถส่งอีเมลได้')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden md:flex flex-col justify-between bg-[#2563EB] text-white p-12 w-1/2">
        <div>
          <h1 className="text-3xl font-bold">ZUUGROUP</h1>
          <p className="text-blue-100 mt-1 text-sm">ระบบจัดการตัวแทนขายยา</p>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            ยินดีต้อนรับสู่<br />ZUUGROUP
          </h2>
          <p className="text-blue-100 mt-3 text-sm leading-relaxed">
            ระบบจัดการตัวแทนขายยาที่ครบครัน<br />
            สำหรับทุกบทบาทในองค์กร
          </p>
        </div>
        <p className="text-xs text-blue-200">© 2026 ZUUGROUP. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {!forgotMode ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h2>
              <p className="text-sm text-gray-500 mb-8">กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded text-blue-600" />
                    จดจำฉัน
                  </label>
                  <button type="button" onClick={() => setForgotMode(true)} className="text-sm text-blue-600 hover:underline">
                    ลืมรหัสผ่าน?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-60"
                >
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ลืมรหัสผ่าน</h2>
              <p className="text-sm text-gray-500 mb-8">กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>

              {forgotMsg && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-4">{forgotMsg}</div>
              )}

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                  <input
                    required type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <button type="submit" className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition">
                  ส่งลิงก์รีเซ็ต
                </button>
                <button type="button" onClick={() => setForgotMode(false)} className="w-full py-2.5 text-sm text-gray-600 hover:underline">
                  กลับไปเข้าสู่ระบบ
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
