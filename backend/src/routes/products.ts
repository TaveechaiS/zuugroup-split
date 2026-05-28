// src/routes/products.ts
import { Router } from 'express'
import { translateError } from '../lib/translateError'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logActivity } from '../lib/activityLog'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const productSchema = z.object({
  name: z.string().min(1),
  product_code: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative(),
  price_per_unit: z.number().nonnegative(),   // = sale price
  cost_price: z.number().nonnegative().optional(),
  category_id: z.string().uuid().nullable().optional(),
  unit: z.string().optional(),
  image_url: z.string().optional().or(z.literal('')),
  status: z.enum(['available', 'unavailable']).default('available'),
  lot_number: z.string().optional().nullable(),
  manufacture_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
})

// =============================================================
// Role-based field stripping:
//   - sales / manager → only see sale price (price_per_unit), NOT cost
//   - cfo            → see cost; cannot see sale-related actions (read-only)
//   - admin          → see everything
// =============================================================
function stripForRole(row: any, role: string): any {
  if (!row) return row
  const { cost_price, ...rest } = row
  if (role === 'sales' || role === 'manager') return rest
  return row  // admin + cfo see all fields
}

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, category:product_categories(id, name)')
    .order('product_code', { ascending: true })
  if (error) throw error
  const role = req.user!.role
  res.json({ data: (data ?? []).map((p: any) => stripForRole(p, role)) })
}))

router.get('/categories', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('product_categories').select('*').order('name')
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('products').select('*, category:product_categories(id, name)')
    .eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data: stripForRole(data, req.user!.role) })
}))

/** GET /api/products/:id/stock-logs - history of quantity changes (admin/cfo/manager) */
router.get('/:id/stock-logs', requireRole('admin', 'cfo', 'manager'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('stock_logs')
      .select('*, performed_by_user:users!performed_by(first_name, last_name)')
      .eq('product_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    res.json({ data })
  })
)

router.post('/', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = productSchema.parse(req.body)
  // Cleanup empty-string codes so trigger auto-assigns
  if (body.product_code === '') body.product_code = null
  if (body.lot_number === '')   body.lot_number   = null
  if (body.manufacture_date === '') body.manufacture_date = null
  if (body.expiry_date === '')      body.expiry_date      = null

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(body as any)
    .select('*, category:product_categories(id, name)')
    .single()
  if (error) return res.status(400).json({ error: translateError(error.message) })

  // Initial stock log entry
  if (data.quantity > 0) {
    await supabaseAdmin.from('stock_logs').insert({
      product_id: data.id,
      change: data.quantity,
      before_qty: 0,
      after_qty: data.quantity,
      action: 'initial',
      reason: 'สต๊อกเริ่มต้นจากการสร้างสินค้า',
      lot_number: data.lot_number,
      expiry_date: data.expiry_date,
      performed_by: req.user!.id,
    })
  }

  await logActivity({
    userId: req.user!.id,
    action: 'product.create',
    entityType: 'product',
    entityId: data.id,
    description: `สร้างสินค้า ${data.product_code ?? ''} ${data.name} (จำนวน ${data.quantity}, ราคา ${data.price_per_unit})`,
  })
  res.status(201).json({ data })
}))

router.patch('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = productSchema.partial().parse(req.body)

  // Fetch current to detect quantity / lot changes
  const { data: prev } = await supabaseAdmin.from('products').select('*').eq('id', req.params.id).single()
  if (!prev) return res.status(404).json({ error: 'ไม่พบสินค้า' })

  const { data, error } = await supabaseAdmin
    .from('products').update({ ...body, updated_at: new Date().toISOString() } as any)
    .eq('id', req.params.id)
    .select('*, category:product_categories(id, name)').single()
  if (error) return res.status(400).json({ error: translateError(error.message) })

  // Log stock change (refill / adjustment)
  if (body.quantity !== undefined && body.quantity !== prev.quantity) {
    const delta = body.quantity - prev.quantity
    await supabaseAdmin.from('stock_logs').insert({
      product_id: data.id,
      change: delta,
      before_qty: prev.quantity,
      after_qty: body.quantity,
      action: delta > 0 ? 'refill' : 'manual_adjust',
      reason: delta > 0 ? 'เติมสินค้าโดยผู้ดูแล' : 'ปรับสต๊อกโดยผู้ดูแล',
      lot_number: data.lot_number,
      expiry_date: data.expiry_date,
      performed_by: req.user!.id,
    })
  }

  await logActivity({
    userId: req.user!.id,
    action: 'product.update',
    entityType: 'product',
    entityId: data.id,
    description: `แก้ไขสินค้า ${data.product_code ?? ''} ${data.name}`,
  })
  res.json({ data })
}))

router.delete('/:id', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: existing } = await supabaseAdmin.from('products').select('name, product_code').eq('id', req.params.id).single()
  const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: translateError(error.message) })
  await logActivity({
    userId: req.user!.id,
    action: 'product.delete',
    entityType: 'product',
    entityId: req.params.id,
    description: `ลบสินค้า ${existing?.product_code ?? ''} ${existing?.name ?? req.params.id}`,
  })
  res.json({ success: true })
}))

export default router
