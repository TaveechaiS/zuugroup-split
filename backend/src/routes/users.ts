// src/routes/users.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()

router.use(requireAuth)

/** GET /api/users - list (Admin) */
router.get('/', requireRole('admin'), asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, team:teams(name)')
    .order('created_at', { ascending: false })
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
router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
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

  res.status(201).json({ data: profile })
}))

const updateUserSchema = createUserSchema.partial().omit({ password: true, email: true })

/** PATCH /api/users/:id */
router.patch('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const body = updateUserSchema.parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('users').update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) throw error
  res.json({ data })
}))

/** DELETE /api/users/:id - soft delete (set is_active=false) */
router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
}))

export default router
