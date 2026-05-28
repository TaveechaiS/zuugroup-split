// src/routes/reports.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(requireAuth)

/** GET /api/reports/admin - admin & cfo full reports
 *  Filters (all optional, AND-combined):
 *    ?from=YYYY-MM-DD   - start date
 *    ?to=YYYY-MM-DD     - end date (inclusive)
 *    ?zone_id=...       - filter by sales zone (uses customers.zone_id)
 *    ?team_id=...       - filter by creator's team
 *    ?province=...      - filter by zone.province
 *    ?region=...        - filter by zone.region
 *    ?status=...        - order status filter
 */
router.get('/admin', requireRole('admin', 'cfo'), asyncHandler(async (req, res) => {
  const q = req.query as Record<string, string | undefined>

  // Resolve filter by team → memberIds
  let memberIds: string[] | null = null
  if (q.team_id) {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('team_id', q.team_id)
    memberIds = (members ?? []).map((m: any) => m.id)
  }

  // Resolve filter by zone/province/region → customer ids
  let customerIds: string[] | null = null
  if (q.zone_id || q.province || q.region) {
    let cQuery = supabaseAdmin.from('customers').select('id, zone:sales_zones(id, code, province, region)')
    const { data: custs } = await cQuery
    customerIds = (custs ?? []).filter((c: any) => {
      if (q.zone_id && c.zone?.id !== q.zone_id) return false
      if (q.province && c.zone?.province !== q.province) return false
      if (q.region && c.zone?.region !== q.region) return false
      return true
    }).map((c: any) => c.id)
  }

  let oQ = supabaseAdmin
    .from('orders')
    .select('*, customer:customers(id, company_name, zone:sales_zones(code, name, province, region)), creator:users!created_by(first_name, last_name, team_id)')

  if (q.from) oQ = oQ.gte('created_at', new Date(q.from).toISOString())
  if (q.to)   oQ = oQ.lte('created_at', new Date(q.to + 'T23:59:59').toISOString())
  if (q.status) oQ = oQ.eq('status', q.status)
  if (memberIds)   oQ = oQ.in('created_by', memberIds)
  if (customerIds) oQ = oQ.in('customer_id', customerIds)

  const [
    { data: orders },
    { data: products },
    { data: customers },
    { data: orderItems },
    { data: zones },
    { data: teams },
  ] = await Promise.all([
    oQ,
    supabaseAdmin.from('products').select('*'),
    supabaseAdmin.from('customers').select('id, company_name, created_at, zone:sales_zones(id, code, name, province, region)'),
    supabaseAdmin.from('order_items')
      .select('*, product:products(name), order:orders!inner(status, total_amount)')
      .eq('order.status', 'completed'),
    supabaseAdmin.from('sales_zones').select('*').order('code'),
    supabaseAdmin.from('teams').select('id, name'),
  ])

  res.json({ data: { orders, products, customers, orderItems, zones, teams } })
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
