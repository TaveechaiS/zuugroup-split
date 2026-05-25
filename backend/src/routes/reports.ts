// src/routes/reports.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(requireAuth)

/** GET /api/reports/admin - admin & cfo full reports */
router.get('/admin', requireRole('admin', 'cfo'), asyncHandler(async (_req, res) => {
  const [
    { data: orders },
    { data: products },
    { data: customers },
    { data: orderItems },
  ] = await Promise.all([
    supabaseAdmin.from('orders').select('*, customer:customers(company_name)'),
    supabaseAdmin.from('products').select('*'),
    supabaseAdmin.from('customers').select('id, company_name, created_at'),
    supabaseAdmin.from('order_items')
      .select('*, product:products(name), order:orders!inner(status, total_amount)')
      .eq('order.status', 'completed'),
  ])

  res.json({ data: { orders, products, customers, orderItems } })
}))

/** GET /api/reports/manager - team-scoped report */
router.get('/manager', requireRole('manager'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: members } = await supabaseAdmin
    .from('users').select('id, first_name, last_name').eq('team_id', req.user!.team_id)
  const memberIds = (members ?? []).map((m: any) => m.id)

  const [{ data: quotations }, { data: orders }] = await Promise.all([
    supabaseAdmin.from('quotations').select('*').in('created_by', memberIds),
    supabaseAdmin.from('orders').select('*').in('created_by', memberIds),
  ])

  res.json({ data: { quotations, orders, teamMembers: members ?? [] } })
}))

export default router
