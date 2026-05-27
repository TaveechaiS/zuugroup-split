// src/routes/quotations.ts
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
  negotiated_price: z.number().nonnegative().nullable().optional(),
})

const createSchema = z.object({
  customer_id: z.string().uuid(),
  vat_percent: z.number().nonnegative().default(7),
  contract_period_days: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending']).default('pending'),
  items: z.array(itemSchema).min(1),
})

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
    .select('*, customer:customers(*), creator:users!created_by(first_name, last_name, email), items:quotation_items(*, product:products(name, unit))')
    .eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data })
}))

/** POST /api/quotations - sales/manager create */
router.post('/', requireRole('sales', 'manager'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = createSchema.parse(req.body)
  const subtotal = body.items.reduce((s, i) => s + (i.negotiated_price ?? i.unit_price) * i.quantity, 0)
  const vat_amount = (subtotal * body.vat_percent) / 100
  const total_amount = subtotal + vat_amount

  // Manager-created quotations skip approval workflow
  const autoApprove = req.user!.role === 'manager' && body.status === 'pending'
  const finalStatus = autoApprove ? 'approved' : body.status

  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .insert({
      customer_id: body.customer_id,
      created_by: req.user!.id,
      vat_percent: body.vat_percent,
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

  res.status(201).json({ data: quotation })
}))

/** PATCH /api/quotations/:id - update draft */
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

  res.json({ success: true })
}))

/** POST /api/quotations/:id/approve - manager approves */
router.post('/:id/approve', requireRole('manager', 'admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: q } = await supabaseAdmin.from('quotations').select('*').eq('id', req.params.id).single()
  if (!q) return res.status(404).json({ error: 'Not found' })

  await supabaseAdmin.from('quotations').update({
    status: 'approved',
    approved_by: req.user!.id,
    approved_at: new Date().toISOString(),
  }).eq('id', req.params.id)

  await supabaseAdmin.from('notifications').insert({
    user_id: q.created_by,
    title: 'ใบเสนอราคาได้รับการอนุมัติ',
    message: `ใบเสนอราคา ${q.quotation_number} ได้รับการอนุมัติแล้ว`,
    type: 'success',
    related_entity_type: 'quotation',
    related_entity_id: q.id,
  })

  res.json({ success: true })
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

  res.json({ success: true })
}))

export default router
