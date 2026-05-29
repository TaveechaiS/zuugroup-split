// src/routes/customers.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logActivity } from '../lib/activityLog'
import { z } from 'zod'

const router = Router()

router.use(requireAuth)

const customerSchema = z.object({
  company_name: z.string().min(1),
  customer_code: z.string().optional().nullable(),
  zone_id: z.string().uuid().nullable().optional(),
  address: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  has_tax_id: z.boolean().optional(),
  tax_id: z.string().optional().nullable(),
  drug_license_number: z.string().optional(),
  location_image_url: z.string().optional().or(z.literal('')),
  drug_license_image_url: z.string().optional().or(z.literal('')),
  hospital_license_image_url: z.string().optional().or(z.literal('')),
})

/** GET /api/customers - any authenticated role can view */
router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*, zone:sales_zones(id, code, name, region, province)')
    .order('customer_code', { ascending: true })
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('customers').select('*, zone:sales_zones(id, code, name, region, province)').eq('id', req.params.id).single()
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
  await logActivity({
    userId: req.user!.id,
    action: 'customer.create',
    entityType: 'customer',
    entityId: data.id,
    description: `เพิ่มลูกค้า ${data.company_name}`,
  })
  res.status(201).json({ data })
}))

router.patch('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = customerSchema.partial().parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('customers').update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) throw error
  await logActivity({
    userId: req.user!.id,
    action: 'customer.update',
    entityType: 'customer',
    entityId: data.id,
    description: `แก้ไขลูกค้า ${data.company_name}`,
  })
  res.json({ data })
}))

router.delete('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: existing } = await supabaseAdmin.from('customers').select('company_name').eq('id', req.params.id).single()
  const { error } = await supabaseAdmin.from('customers').delete().eq('id', req.params.id)
  if (error) throw error
  await logActivity({
    userId: req.user!.id,
    action: 'customer.delete',
    entityType: 'customer',
    entityId: req.params.id,
    description: `ลบลูกค้า ${existing?.company_name ?? req.params.id}`,
  })
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
