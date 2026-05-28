// src/routes/quotations.ts
import { Router } from 'express'
import { translateError } from '../lib/translateError'
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
  negotiated_price: z.number().nonnegative().nullable().optional(),
})

const createSchema = z.object({
  customer_id: z.string().uuid(),
  vat_percent: z.number().nonnegative().default(7),
  include_vat: z.boolean().default(true),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().nonnegative().default(0),
  other_label: z.string().optional().nullable(),
  other_amount: z.number().default(0),
  contract_period_days: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending']).default('pending'),
  items: z.array(itemSchema).min(1),
})

/** Compute totals given line items + document-level adjustments. */
function computeTotals(opts: {
  itemsSubtotal: number
  include_vat: boolean
  vat_percent: number
  discount_percent: number
  discount_amount: number
  other_amount: number
}) {
  const { itemsSubtotal, include_vat, vat_percent } = opts
  const discountByPct = (itemsSubtotal * opts.discount_percent) / 100
  const totalDiscount = +(discountByPct + opts.discount_amount).toFixed(2)
  const afterDiscount = Math.max(0, itemsSubtotal - totalDiscount)
  const vat_amount = include_vat ? +(afterDiscount * vat_percent / 100).toFixed(2) : 0
  const total_amount = +(afterDiscount + vat_amount + opts.other_amount).toFixed(2)
  return { subtotal: itemsSubtotal, discount: totalDiscount, vat_amount, total_amount }
}

/** Filter helpers based on role */
async function getRoleFilter(user: AuthenticatedRequest['user']) {
  if (!user) return null
  if (user.role === 'admin' || user.role === 'cfo') return { type: 'all' as const }
  if (user.role === 'manager') {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('team_id', user.team_id)
    return { type: 'team' as const, ids: (members ?? []).map((m: any) => m.id) }
  }
  return { type: 'own' as const, id: user.id }
}

/** GET /api/quotations - scoped to role
 *  ?scope=my | team | pending
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { scope = 'visible', status } = req.query as { scope?: string; status?: string }
  let query = supabaseAdmin
    .from('quotations')
    .select('*, customer:customers(company_name), creator:users!created_by(first_name, last_name)')
    .order('created_at', { ascending: false })

  const filter = await getRoleFilter(req.user)
  if (scope === 'my') {
    query = query.eq('created_by', req.user!.id)
  } else if (scope === 'team' && req.user!.role === 'manager') {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('team_id', req.user!.team_id)
    query = query.in('created_by', (members ?? []).map((m: any) => m.id))
  } else if (scope === 'pending' && req.user!.role === 'manager') {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('team_id', req.user!.team_id)
    query = query.in('created_by', (members ?? []).map((m: any) => m.id)).eq('status', 'pending')
  } else if (filter?.type === 'own') {
    query = query.eq('created_by', filter.id)
  } else if (filter?.type === 'team') {
    query = query.in('created_by', filter.ids)
  }

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select('*, customer:customers(*), creator:users!created_by(first_name, last_name, email, role), items:quotation_items(*, product:products(name, unit, image_url))')
    .eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data })
}))

/** POST /api/quotations - sales/manager create */
router.post('/', requireRole('sales', 'manager'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = createSchema.parse(req.body)
  const itemsSubtotal = body.items.reduce((s, i) => s + (i.negotiated_price ?? i.unit_price) * i.quantity, 0)
  const totals = computeTotals({
    itemsSubtotal,
    include_vat: body.include_vat,
    vat_percent: body.vat_percent,
    discount_percent: body.discount_percent,
    discount_amount: body.discount_amount,
    other_amount: body.other_amount,
  })
  const { subtotal, vat_amount, total_amount } = totals

  // Manager-created quotations skip approval workflow
  const autoApprove = req.user!.role === 'manager' && body.status === 'pending'
  const finalStatus = autoApprove ? 'approved' : body.status

  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .insert({
      customer_id: body.customer_id,
      created_by: req.user!.id,
      vat_percent: body.vat_percent,
      include_vat: body.include_vat,
      discount_percent: body.discount_percent,
      discount_amount: body.discount_amount,
      other_label: body.other_label,
      other_amount: body.other_amount,
      subtotal,
      vat_amount,
      total_amount,
      notes: body.notes,
      contract_period_days: body.contract_period_days,
      status: finalStatus,
      approved_by: autoApprove ? req.user!.id : null,
      approved_at: autoApprove ? new Date().toISOString() : null,
    })
    .select().single()

  if (error) throw error

  const items = body.items.map((i) => ({
    quotation_id: quotation.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    negotiated_price: i.negotiated_price,
    total_price: (i.negotiated_price ?? i.unit_price) * i.quantity,
  }))
  await supabaseAdmin.from('quotation_items').insert(items)

  await logActivity({
    userId: req.user!.id,
    action: autoApprove ? 'quotation.create+auto_approve' : `quotation.create.${finalStatus}`,
    entityType: 'quotation',
    entityId: quotation.id,
    description: `สร้างใบเสนอราคา ${quotation.quotation_number} (สถานะ: ${finalStatus}, ยอด ${total_amount})`,
  })

  // Notifications
  if (finalStatus === 'pending') {
    // Sales-created quotation → tell their manager to review
    await notifyTeamManager(req.user!.id, {
      title: 'มีใบเสนอราคารออนุมัติ',
      message: `${req.user!.email ?? 'พนักงาน'} ส่งใบเสนอราคา ${quotation.quotation_number} (฿${total_amount.toLocaleString()}) รออนุมัติ`,
      type: 'info',
      entityType: 'quotation',
      entityId: quotation.id,
    })
  }
  if (autoApprove) {
    // Manager auto-approved → tell admins for visibility
    await notifyRole('admin', {
      title: 'ใบเสนอราคาใหม่ (อนุมัติอัตโนมัติ)',
      message: `ผู้จัดการสร้าง+อนุมัติใบเสนอราคา ${quotation.quotation_number} (฿${total_amount.toLocaleString()})`,
      type: 'success',
      entityType: 'quotation',
      entityId: quotation.id,
    })
  }

  res.status(201).json({ data: quotation })
}))

/** PATCH /api/quotations/:id - update draft */
/** PATCH /api/quotations/:id/meta - admin can edit quotation_number after creation */
router.patch('/:id/meta', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    quotation_number: z.string().min(1).optional(),
    notes: z.string().optional().nullable(),
  })
  const body = schema.parse(req.body)

  const { data, error } = await supabaseAdmin
    .from('quotations')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: translateError(error.message) })

  await logActivity({
    userId: req.user!.id,
    action: 'quotation.edit_meta',
    entityType: 'quotation',
    entityId: req.params.id,
    description: `แก้ไขข้อมูลใบเสนอราคา ${data.quotation_number}`,
  })
  res.json({ data })
}))

router.patch('/:id', requireRole('sales', 'manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: existing } = await supabaseAdmin.from('quotations').select('*').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status !== 'draft' && existing.status !== 'pending') {
    return res.status(400).json({ error: 'Can only edit draft or pending quotations' })
  }
  if (req.user!.role === 'sales' && existing.created_by !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const body = createSchema.parse(req.body)
  const subtotal = body.items.reduce((s, i) => s + (i.negotiated_price ?? i.unit_price) * i.quantity, 0)
  const vat_amount = (subtotal * body.vat_percent) / 100
  const total_amount = subtotal + vat_amount

  const { error } = await supabaseAdmin.from('quotations').update({
    customer_id: body.customer_id,
    vat_percent: body.vat_percent,
    subtotal,
    vat_amount,
    total_amount,
    notes: body.notes,
    contract_period_days: body.contract_period_days,
    status: body.status,
    updated_at: new Date().toISOString(),
  }).eq('id', req.params.id)
  if (error) throw error

  await supabaseAdmin.from('quotation_items').delete().eq('quotation_id', req.params.id)
  const items = body.items.map((i) => ({
    quotation_id: req.params.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    negotiated_price: i.negotiated_price,
    total_price: (i.negotiated_price ?? i.unit_price) * i.quantity,
  }))
  await supabaseAdmin.from('quotation_items').insert(items)

  await logActivity({
    userId: req.user!.id,
    action: 'quotation.update',
    entityType: 'quotation',
    entityId: req.params.id,
    description: `แก้ไขใบเสนอราคา ${existing.quotation_number} (สถานะ: ${body.status})`,
  })

  res.json({ success: true })
}))

/** POST /api/quotations/:id/approve - manager approves */
router.post('/:id/approve', requireRole('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: q } = await supabaseAdmin.from('quotations').select('*').eq('id', req.params.id).single()
  if (!q) return res.status(404).json({ error: 'Not found' })

  const { data: updated, error: updateError } = await supabaseAdmin.from('quotations').update({
    status: 'approved',
    approved_by: req.user!.id,
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', req.params.id).select().single()

  if (updateError) {
    console.error('Quotation approve update error:', updateError)
    return res.status(500).json({ error: `อนุมัติไม่สำเร็จ: ${updateError.message}` })
  }
  if (!updated || updated.status !== 'approved') {
    return res.status(500).json({ error: 'อนุมัติไม่สำเร็จ - ไม่สามารถเปลี่ยนสถานะได้' })
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: q.created_by,
    title: 'ใบเสนอราคาได้รับการอนุมัติ',
    message: `ใบเสนอราคา ${q.quotation_number} ได้รับการอนุมัติแล้ว`,
    type: 'success',
    related_entity_type: 'quotation',
    related_entity_id: q.id,
  })

  await logActivity({
    userId: req.user!.id,
    action: 'quotation.approve',
    entityType: 'quotation',
    entityId: q.id,
    description: `อนุมัติใบเสนอราคา ${q.quotation_number}`,
  })

  res.json({ success: true, data: updated })
}))

/** POST /api/quotations/:id/reject */
router.post('/:id/reject', requireRole('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  const { data: q } = await supabaseAdmin.from('quotations').select('*').eq('id', req.params.id).single()
  if (!q) return res.status(404).json({ error: 'Not found' })

  await supabaseAdmin.from('quotations').update({
    status: 'rejected', reject_reason: reason,
  }).eq('id', req.params.id)

  await supabaseAdmin.from('notifications').insert({
    user_id: q.created_by,
    title: 'ใบเสนอราคาไม่อนุมัติ',
    message: `ใบเสนอราคา ${q.quotation_number} ไม่ผ่านการอนุมัติ: ${reason}`,
    type: 'error',
    related_entity_type: 'quotation',
    related_entity_id: q.id,
  })

  await logActivity({
    userId: req.user!.id,
    action: 'quotation.reject',
    entityType: 'quotation',
    entityId: q.id,
    description: `ปฏิเสธใบเสนอราคา ${q.quotation_number}: ${reason}`,
  })

  res.json({ success: true })
}))

export default router
