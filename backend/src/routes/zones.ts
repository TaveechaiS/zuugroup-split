// src/routes/zones.ts
// Sales territory CRUD.
// - Manager + Admin can create zones
// - Only Admin can edit / delete
// - All authenticated users can read

import { Router } from 'express'
import { translateError } from '../lib/translateError'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logActivity } from '../lib/activityLog'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const zoneSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  region: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

/** GET /api/zones - list all */
router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('sales_zones')
    .select('*')
    .order('code', { ascending: true })
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('sales_zones').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Zone not found' })
  res.json({ data })
}))

/** POST /api/zones - manager + admin */
router.post('/', requireRole('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = zoneSchema.parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('sales_zones')
    .insert({ ...body, created_by: req.user!.id })
    .select().single()
  if (error) return res.status(400).json({ error: translateError(error.message) })

  await logActivity({
    userId: req.user!.id,
    action: 'zone.create',
    entityType: 'sales_zone',
    entityId: data.id,
    description: `สร้างเขตการขาย ${data.code} - ${data.name}`,
  })

  res.status(201).json({ data })
}))

/** PATCH /api/zones/:id - admin only */
router.patch('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = zoneSchema.partial().parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('sales_zones')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: translateError(error.message) })

  await logActivity({
    userId: req.user!.id,
    action: 'zone.update',
    entityType: 'sales_zone',
    entityId: data.id,
    description: `แก้ไขเขตการขาย ${data.code} - ${data.name}`,
  })

  res.json({ data })
}))

/** DELETE /api/zones/:id - admin only */
router.delete('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: existing } = await supabaseAdmin
    .from('sales_zones').select('code, name').eq('id', req.params.id).single()
  const { error } = await supabaseAdmin
    .from('sales_zones').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: translateError(error.message) })

  await logActivity({
    userId: req.user!.id,
    action: 'zone.delete',
    entityType: 'sales_zone',
    entityId: req.params.id,
    description: `ลบเขตการขาย ${existing?.code ?? req.params.id} - ${existing?.name ?? ''}`,
  })

  res.json({ success: true })
}))

export default router
