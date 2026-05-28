// src/routes/auth.ts
import { Router } from 'express'
import { translateError } from '../lib/translateError'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logActivity } from '../lib/activityLog'
import { z } from 'zod'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/** POST /api/auth/login - email/password login */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body)
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: translateError(error.message) })

  // Load profile + check active
  const { data: profile } = await supabaseAdmin
    .from('users').select('*, team:teams(id, name)').eq('id', data.user.id).single()

  if (!profile) {
    return res.status(404).json({ error: 'ไม่พบโปรไฟล์ผู้ใช้' })
  }
  if (profile.is_active === false) {
    // Sign them out of the session that was just created
    try { await supabaseAdmin.auth.admin.signOut(data.session?.access_token ?? '') } catch { /* ignore */ }
    return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' })
  }

  await logActivity({
    userId: data.user.id,
    action: 'login',
    description: `เข้าสู่ระบบ (${profile?.email ?? data.user.email})`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] ?? null,
  })

  res.json({
    session: data.session,
    user: profile,
  })
}))

/** POST /api/auth/logout - revoke session */
router.post('/logout', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await supabaseAdmin.auth.admin.signOut(req.user!.jwt)
  await logActivity({
    userId: req.user!.id,
    action: 'logout',
    description: `ออกจากระบบ (${req.user!.email})`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] ?? null,
  })
  res.json({ success: true })
}))

/** GET /api/auth/me - get current user profile */
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user })
})

// =============================================================
// In-memory rate-limiter for password-reset requests
// (2 minutes between attempts, max 10 per day per email).
// Note: this is per-process so it resets on server restart.
// For production with multiple instances use Redis/DB-backed.
// =============================================================
const RESET_COOLDOWN_MS = 2 * 60 * 1000      // 2 minutes between requests
const RESET_DAILY_CAP = 10                    // max 10 requests / day / email
const RESET_DAY_MS = 24 * 60 * 60 * 1000

interface ResetAttempt { count: number; firstAt: number; lastAt: number }
const resetAttempts = new Map<string, ResetAttempt>()

function checkResetRateLimit(email: string): { ok: true } | { ok: false; message: string } {
  const now = Date.now()
  const key = email.toLowerCase().trim()
  const entry = resetAttempts.get(key)

  if (!entry || now - entry.firstAt > RESET_DAY_MS) {
    resetAttempts.set(key, { count: 1, firstAt: now, lastAt: now })
    return { ok: true }
  }

  if (entry.count >= RESET_DAILY_CAP) {
    const hoursLeft = Math.ceil((RESET_DAY_MS - (now - entry.firstAt)) / (60 * 60 * 1000))
    return {
      ok: false,
      message: `ขอลิงก์รีเซ็ตเกิน ${RESET_DAILY_CAP} ครั้งต่อวันแล้ว กรุณารออีก ${hoursLeft} ชั่วโมง`,
    }
  }

  const sinceLast = now - entry.lastAt
  if (sinceLast < RESET_COOLDOWN_MS) {
    const secsLeft = Math.ceil((RESET_COOLDOWN_MS - sinceLast) / 1000)
    return {
      ok: false,
      message: `กรุณารออีก ${secsLeft} วินาทีก่อนขอลิงก์รีเซ็ตอีกครั้ง`,
    }
  }

  entry.count += 1
  entry.lastAt = now
  return { ok: true }
}

/** POST /api/auth/forgot-password */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)

  // Our own throttle first — friendlier Thai message + protects us from
  // hitting Supabase's hard limit too quickly.
  const limit = checkResetRateLimit(email)
  if (!limit.ok) return res.status(429).json({ error: limit.message })

  // Send the user to our own reset-password page so we can show the
  // same-styled form (instead of Supabase's default hosted page).
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (req.headers.origin as string | undefined) ||
    'http://localhost:3000'
  const redirectTo = `${frontendUrl.replace(/\/$/, '')}/auth/reset-password`

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) {
    // Translate Supabase's rate-limit message into Thai
    const msg = (error.message ?? '').toLowerCase()
    if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
      return res.status(429).json({
        error: 'ระบบส่งอีเมลถูกจำกัดชั่วคราว กรุณารอประมาณ 60 นาที หรือติดต่อผู้ดูแลระบบเพื่อเพิ่ม SMTP custom',
      })
    }
    return res.status(400).json({ error: translateError(error.message) })
  }

  res.json({ success: true })
}))

/** POST /api/auth/reset-password
 *  Body: { access_token, new_password }
 *  Used by the /auth/reset-password page after the user clicks the
 *  recovery link in their email. The access_token comes from the URL
 *  hash that Supabase appends to the redirect.
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { access_token, new_password } = z.object({
    access_token: z.string().min(10),
    new_password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  }).parse(req.body)

  // Identify the user from the recovery token
  const { data: userData, error: getErr } = await supabaseAdmin.auth.getUser(access_token)
  if (getErr || !userData?.user) {
    return res.status(400).json({ error: 'ลิงก์รีเซ็ตหมดอายุหรือไม่ถูกต้อง กรุณาขอใหม่' })
  }

  // Update via admin (bypasses needing the user's full session)
  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
    userData.user.id,
    { password: new_password }
  )
  if (updErr) return res.status(400).json({ error: updErr.message })

  await logActivity({
    userId: userData.user.id,
    action: 'user.reset_password',
    description: `รีเซ็ตรหัสผ่าน (${userData.user.email})`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] ?? null,
  })

  res.json({ success: true })
}))

export default router
