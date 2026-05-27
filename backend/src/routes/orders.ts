// src/routes/orders.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logActivity } from '../lib/activityLog'
import { notifyRole, notifyTeamManager } from '../lib/notify'
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
  vat_percent: z.number().nonnegative().optional(),
  notes: z.string().optional(),
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
    .select('*, customer:customers(*), creator:users!created_by(first_name, last_name, email, role), items:order_items(*, product:products(name, unit, image_url))')
    .eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data })
}))

router.post('/', requireRole('sales', 'manager'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = createSchema.parse(req.body)
  const subtotal = body.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const vat_percent = body.vat_percent ?? 7
  const vat_amount = +(subtotal * vat_percent / 100).toFixed(2)
  const total = +(subtotal + vat_amount).toFixed(2)

  // Manager-created orders skip review workflow and go straight to processing
  const autoApprove = req.user!.role === 'manager'
  const finalStatus = autoApprove ? 'processing' : 'pending_review'

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: body.customer_id,
      created_by: req.user!.id,
      subtotal,
      vat_percent,
      vat_amount,
      total_amount: total,
      notes: body.notes ?? null,
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

  await logActivity({
    userId: req.user!.id,
    action: autoApprove ? 'order.create+auto_approve' : 'order.create',
    entityType: 'order',
    entityId: order.id,
    description: `สร้างคำสั่งซื้อ ${order.order_number} (สถานะ: ${finalStatus}, ยอด ${total})`,
  })

  // Notifications
  if (finalStatus === 'pending_review') {
    // Sales-created order → tell their manager to review
    await notifyTeamManager(req.user!.id, {
      title: 'มีคำสั่งซื้อรอตรวจสอบ',
      message: `${req.user!.email ?? 'พนักงาน'} ส่งคำสั่งซื้อ ${order.order_number} (฿${total.toLocaleString()}) รอตรวจสอบ`,
      type: 'info',
      entityType: 'order',
      entityId: order.id,
    })
  }
  // Always notify admins of new orders that reach "processing" — they confirm sale
  if (finalStatus === 'processing') {
    await notifyRole('admin', {
      title: 'มีคำสั่งซื้อรอยืนยันการขาย',
      message: `คำสั่งซื้อ ${order.order_number} (฿${total.toLocaleString()}) พร้อมให้ยืนยันการขาย`,
      type: 'info',
      entityType: 'order',
      entityId: order.id,
    })
  }

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

  await logActivity({
    userId: req.user!.id,
    action: 'order.review_pass',
    entityType: 'order',
    entityId: o.id,
    description: `อนุมัติการตรวจสอบคำสั่งซื้อ ${o.order_number}`,
  })

  // Tell admins so they can confirm the sale
  await notifyRole('admin', {
    title: 'คำสั่งซื้อพร้อมยืนยันการขาย',
    message: `คำสั่งซื้อ ${o.order_number} (฿${(o.total_amount ?? 0).toLocaleString()}) ผ่านการตรวจสอบจากผู้จัดการแล้ว`,
    type: 'info',
    entityType: 'order',
    entityId: o.id,
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

  await logActivity({
    userId: req.user!.id,
    action: 'order.review_reject',
    entityType: 'order',
    entityId: o.id,
    description: `ปฏิเสธคำสั่งซื้อ ${o.order_number}: ${reason}`,
  })

  res.json({ success: true })
}))

/** POST /api/orders/:id/confirm - admin marks complete (triggers stock decrement) */
router.post('/:id/confirm', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single()
  if (!o) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' })

  const { data: updated, error: updateError } = await supabaseAdmin.from('orders').update({
    status: 'completed',
    processed_by: req.user!.id,
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', req.params.id).select().single()

  if (updateError) {
    console.error('Order confirm update error:', updateError)
    return res.status(500).json({ error: `ยืนยันการขายไม่สำเร็จ: ${updateError.message}` })
  }
  if (!updated || updated.status !== 'completed') {
    return res.status(500).json({ error: 'ยืนยันการขายไม่สำเร็จ - ไม่สามารถเปลี่ยนสถานะได้' })
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: o.created_by,
    title: 'คำสั่งซื้อยืนยันเรียบร้อย',
    message: `คำสั่งซื้อ ${o.order_number} ได้รับการยืนยันสำเร็จ`,
    type: 'success',
    related_entity_type: 'order',
    related_entity_id: o.id,
  })

  await logActivity({
    userId: req.user!.id,
    action: 'order.confirm',
    entityType: 'order',
    entityId: o.id,
    description: `ยืนยันการขายคำสั่งซื้อ ${o.order_number}`,
  })

  // Notify creator's manager + CFO that a sale completed
  await notifyTeamManager(o.created_by, {
    title: 'มีคำสั่งซื้อยืนยันการขายแล้ว',
    message: `คำสั่งซื้อ ${o.order_number} (฿${(o.total_amount ?? 0).toLocaleString()}) ยืนยันการขายเรียบร้อย`,
    type: 'success',
    entityType: 'order',
    entityId: o.id,
  })
  await notifyRole('cfo', {
    title: 'มียอดขายใหม่',
    message: `คำสั่งซื้อ ${o.order_number} ยืนยันการขาย ฿${(o.total_amount ?? 0).toLocaleString()}`,
    type: 'success',
    entityType: 'order',
    entityId: o.id,
  })

  res.json({ success: true, data: updated })
}))

router.post('/:id/cancel', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  const { data: o } = await supabaseAdmin.from('orders').select('order_number').eq('id', req.params.id).single()
  if (!o) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' })

  const { data: updated, error: updateError } = await supabaseAdmin.from('orders').update({
    status: 'cancelled',
    reject_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq('id', req.params.id).select().single()

  if (updateError) {
    console.error('Order cancel update error:', updateError)
    return res.status(500).json({ error: `ยกเลิกคำสั่งซื้อไม่สำเร็จ: ${updateError.message}` })
  }
  if (!updated || updated.status !== 'cancelled') {
    return res.status(500).json({ error: 'ยกเลิกคำสั่งซื้อไม่สำเร็จ - ไม่สามารถเปลี่ยนสถานะได้' })
  }

  await logActivity({
    userId: req.user!.id,
    action: 'order.cancel',
    entityType: 'order',
    entityId: req.params.id,
    description: `ยกเลิกคำสั่งซื้อ ${o?.order_number ?? req.params.id}: ${reason}`,
  })
  res.json({ success: true, data: updated })
}))

export default router
