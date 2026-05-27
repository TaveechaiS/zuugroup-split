// src/routes/customers.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()

router.use(requireAuth)

const customerSchema = z.object({
  company_name: z.string().min(1),
  address: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  drug_license_number: z.string().optional(),
  location_image_url: z.string().optional().or(z.literal('')),
  drug_license_image_url: z.string().optional().or(z.literal('')),
  hospital_license_image_url: z.string().optional().or(z.literal('')),
})

/** GET /api/customers - any authenticated role can view */
router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .order('company_name')
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('customers').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data })
}))

/** POST /api/customers - admin only (direct create); others use /customer-requests */
router.post('/', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = customerSchema.parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({ ...body, created_by: req.user!.id })
    .select()
    .single()
  if (error) throw error
  res.status(201).json({ data })
}))

router.patch('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const body = customerSchema.partial().parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('customers').update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) throw error
  res.json({ data })
}))

router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin.from('customers').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
}))

/** GET /api/customers/:id/prices - customer-specific prices */
router.get('/:id/prices', asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('customer_product_prices')
    .select('product_id, custom_price')
    .eq('customer_id', req.params.id)
  if (error) throw error
  res.json({ data })
}))

export default router
