// src/routes/teams.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const teamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('*, members:users(id, first_name, last_name, role, email)')
    .order('name')
  if (error) throw error
  res.json({ data })
}))

/** GET /api/teams/my - current user's team members */
router.get('/my', asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user!.team_id) return res.json({ data: { team: null, members: [] } })
  const { data: team } = await supabaseAdmin
    .from('teams').select('*').eq('id', req.user!.team_id).single()
  const { data: members } = await supabaseAdmin
    .from('users').select('*').eq('team_id', req.user!.team_id).order('first_name')
  res.json({ data: { team, members } })
}))

router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const body = teamSchema.parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('teams').insert(body)
    .select('*, members:users(*)').single()
  if (error) throw error
  res.status(201).json({ data })
}))

router.patch('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const body = teamSchema.partial().parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('teams').update(body).eq('id', req.params.id).select().single()
  if (error) throw error
  res.json({ data })
}))

router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin.from('teams').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
}))

export default router
