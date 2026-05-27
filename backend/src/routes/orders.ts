// src/routes/orders.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
})

const createSchema = z.object({
  customer_id: z.string().uuid(),
  items: z.array(itemSchema).min(1),
})

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { scope = 'visible', status } = req.query as { scope?: string; status?: string }
  let query = supabaseAdmin
    .from('orders')
    .select('*, customer:customers(company_name), creator:users!created_by(first_name, last_name)')
    .order('created_at', { ascending: false })

  if (scope === 'my') {
    query = query.eq('created_by', req.user!.id)
  } else if ((scope === 'team' || scope === 'pending') && req.user!.role === 'manager') {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('team_id', req.user!.team_id)
    query = query.in('created_by', (members ?? []).map((m: any) => m.id))
    if (scope === 'pending') query = query.eq('status', 'pending_review')
  } else if (req.user!.role === 'sales') {
    query = query.eq('created_by', req.user!.id)
  } else if (req.user!.role === 'manager') {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('team_id', req.user!.team_id)
    query = query.in('created_by', (members ?? []).map((m: any) => m.id))
  }

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, customer:customers(*), creator:users!created_by(first_name, last_name, email), items:order_items(*, product:products(name, unit))')
    .eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data })
}))

router.post('/', requireRole('sales', 'manager'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = createSchema.parse(req.body)
  const total = body.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  // Manager-created orders skip review workflow and go straight to processing
  const autoApprove = req.user!.role === 'manager'
  const finalStatus = autoApprove ? 'processing' : 'pending_review'

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: body.customer_id,
      created_by: req.user!.id,
      total_amount: total,
      status: finalStatus,
      reviewed_by: autoApprove ? req.user!.id : null,
      reviewed_at: autoApprove ? new Date().toISOString() : null,
    })
    .select().single()

  if (error) throw error

  await supabaseAdmin.from('order_items').insert(
    body.items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.unit_price * i.quantity,
    }))
  )

  res.status(201).json({ data: order })
}))

/** POST /api/orders/:id/review-pass - manager passes review */
router.post('/:id/review-pass', requireRole('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single()
  if (!o) return res.status(404).json({ error: 'Not found' })

  await supabaseAdmin.from('orders').update({
    status: 'processing',
    reviewed_by: req.user!.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', req.params.id)

  await supabaseAdmin.from('notifications').insert({
    user_id: o.created_by,
    title: 'คำสั่งซื้อผ่านการตรวจสอบ',
    message: `คำสั่งซื้อ ${o.order_number} ผ่านการตรวจสอบ กำลังดำเนินการ`,
    type: 'success',
    related_entity_type: 'order',
    related_entity_id: o.id,
  })

  res.json({ success: true })
}))

router.post('/:id/review-reject', requireRole('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single()
  if (!o) return res.status(404).json({ error: 'Not found' })

  await supabaseAdmin.from('orders').update({
    status: 'rejected',
    reject_reason: reason,
  }).eq('id', req.params.id)

  await supabaseAdmin.from('notifications').insert({
    user_id: o.created_by,
    title: 'คำสั่งซื้อไม่ผ่าน',
    message: `คำสั่งซื้อ ${o.order_number} ไม่ผ่าน: ${reason}`,
    type: 'error',
    related_entity_type: 'order',
    related_entity_id: o.id,
  })

  res.json({ success: true })
}))

/** POST /api/orders/:id/confirm - admin marks complete (triggers stock decrement) */
router.post('/:id/confirm', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single()
  if (!o) return res.status(404).json({ error: 'Not found' })

  await supabaseAdmin.from('orders').update({
    status: 'completed',
    confirmed_by: req.user!.id,
    confirmed_at: new Date().toISOString(),
  }).eq('id', req.params.id)

  await supabaseAdmin.from('notifications').insert({
    user_id: o.created_by,
    title: 'คำสั่งซื้อยืนยันเรียบร้อย',
    message: `คำสั่งซื้อ ${o.order_number} ได้รับการยืนยันสำเร็จ`,
    type: 'success',
    related_entity_type: 'order',
    related_entity_id: o.id,
  })

  res.json({ success: true })
}))

router.post('/:id/cancel', requireRole('admin'), asyncHandler(async (req, res) => {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  await supabaseAdmin.from('orders').update({
    status: 'cancelled', reject_reason: reason,
  }).eq('id', req.params.id)
  res.json({ success: true })
}))

export default router
