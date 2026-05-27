// src/routes/products.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const productSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  price_per_unit: z.number().nonnegative(),
  category_id: z.string().uuid().nullable().optional(),
  unit: z.string().optional(),
  image_url: z.string().optional().or(z.literal('')),
  status: z.enum(['available', 'unavailable']).default('available'),
})

router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, category:product_categories(id, name)')
    .order('name')
  if (error) throw error
  res.json({ data })
}))

router.get('/categories', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('product_categories').select('*').order('name')
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('products').select('*, category:product_categories(id, name)')
    .eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data })
}))

router.post('/', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = productSchema.parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(body)
    .select('*, category:product_categories(id, name)')
    .single()
  if (error) throw error
  res.status(201).json({ data })
}))

router.patch('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const body = productSchema.partial().parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('products').update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*, category:product_categories(id, name)').single()
  if (error) throw error
  res.json({ data })
}))

router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
}))

export default router
