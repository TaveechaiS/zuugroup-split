// src/routes/auth.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
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
  if (error) return res.status(401).json({ error: error.message })

  // Load profile
  const { data: profile } = await supabaseAdmin
    .from('users').select('*, team:teams(id, name)').eq('id', data.user.id).single()

  res.json({
    session: data.session,
    user: profile,
  })
}))

/** POST /api/auth/logout - revoke session */
router.post('/logout', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await supabaseAdmin.auth.admin.signOut(req.user!.jwt)
  res.json({ success: true })
}))

/** GET /api/auth/me - get current user profile */
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user })
})

/** POST /api/auth/forgot-password */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
}))

export default router
