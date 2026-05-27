// src/routes/users.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logActivity } from '../lib/activityLog'
import { notifyUser, notifyRole } from '../lib/notify'
import { z } from 'zod'

const router = Router()

router.use(requireAuth)

/** GET /api/users - list (Admin/CFO) — only active users by default.
 *  Pass ?include_inactive=true to see deleted users too. */
router.get('/', requireRole('admin', 'cfo'), asyncHandler(async (req, res) => {
  const includeInactive = String((req.query as any).include_inactive ?? '') === 'true'
  let q = supabaseAdmin
    .from('users')
    .select('*, team:teams(name)')
    .order('created_at', { ascending: false })
  if (!includeInactive) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) throw error
  res.json({ data })
}))

/** GET /api/users/:id */
router.get('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, team:teams(id, name)')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'User not found' })
  res.json({ data })
}))

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['admin', 'manager', 'sales', 'cfo']),
  team_id: z.string().uuid().nullable().optional(),
  phone: z.string().optional(),
})

/** POST /api/users - create (Admin) */
router.post('/', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = createUserSchema.parse(req.body)

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })
  if (authError) return res.status(400).json({ error: authError.message })

  // Insert profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      role: body.role,
      team_id: body.team_id ?? null,
      phone: body.phone,
      is_active: true,
    })
    .select()
    .single()

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return res.status(400).json({ error: profileError.message })
  }

  await logActivity({
    userId: req.user!.id,
    action: 'user.create',
    entityType: 'user',
    entityId: profile.id,
    description: `สร้างผู้ใช้ ${profile.first_name} ${profile.last_name} (${profile.email}) บทบาท: ${profile.role}`,
  })

  // Welcome notification to the new user
  await notifyUser(profile.id, {
    title: 'ยินดีต้อนรับสู่ ZUUGROUP',
    message: `บัญชีของคุณถูกสร้างเรียบร้อย ในบทบาท ${profile.role}`,
    type: 'success',
    entityType: 'user',
    entityId: profile.id,
  })

  res.status(201).json({ data: profile })
}))

const updateUserSchema = createUserSchema.partial().omit({ email: true }).extend({
  password: z.string().min(6).optional(),
})

/** PATCH /api/users/:id */
router.patch('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = updateUserSchema.parse(req.body)
  const { password, ...rest } = body

  if (password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { password })
    if (authError) return res.status(400).json({ error: authError.message })
  }

  const { data, error } = await supabaseAdmin
    .from('users').update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) throw error

  await logActivity({
    userId: req.user!.id,
    action: password ? 'user.update+password' : 'user.update',
    entityType: 'user',
    entityId: req.params.id,
    description: `แก้ไขผู้ใช้ ${data.first_name} ${data.last_name}${password ? ' (เปลี่ยนรหัสผ่าน)' : ''}`,
  })

  // Notify the affected user when admin updates them (esp. on password change)
  if (req.params.id !== req.user!.id) {
    await notifyUser(req.params.id, {
      title: password ? 'รหัสผ่านของคุณถูกเปลี่ยน' : 'ข้อมูลบัญชีของคุณถูกแก้ไข',
      message: password
        ? 'ผู้ดูแลระบบเปลี่ยนรหัสผ่านบัญชีของคุณ — กรุณาเข้าสู่ระบบใหม่'
        : 'ข้อมูลบัญชีของคุณถูกอัปเดตโดยผู้ดูแลระบบ',
      type: password ? 'warning' : 'info',
      entityType: 'user',
      entityId: req.params.id,
    })
  }

  res.json({ data })
}))

/** DELETE /api/users/:id — soft delete: mark inactive + sign out any
 *  active sessions. Their documents (quotations/orders) stay intact
 *  via the created_by FK (ON DELETE RESTRICT). */
router.delete('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'ลบบัญชีของตัวเองไม่ได้' })
  }

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('first_name, last_name, email, is_active')
    .eq('id', req.params.id).single()

  if (!existing) return res.status(404).json({ error: 'ไม่พบผู้ใช้' })

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      is_active: false,
      team_id: null,              // free up the team slot (1 user per 1 team)
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
  if (error) throw error

  // Force sign-out of any active sessions for this user.
  try {
    await supabaseAdmin.auth.admin.signOut(req.params.id, 'global' as any)
  } catch { /* ignore — best-effort */ }

  await logActivity({
    userId: req.user!.id,
    action: 'user.deactivate',
    entityType: 'user',
    entityId: req.params.id,
    description: `ลบผู้ใช้ ${existing?.first_name ?? ''} ${existing?.last_name ?? ''} (${existing?.email ?? req.params.id}) — เอกสารยังเก็บไว้`,
  })

  res.json({ success: true })
}))

export default router
