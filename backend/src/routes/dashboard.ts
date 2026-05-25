// src/routes/dashboard.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(requireAuth)

router.get('/admin', asyncHandler(async (_req, res) => {
  const [
    { count: userCount },
    { count: customerCount },
    { count: productCount },
    { count: teamCount },
    { count: orderCount },
    { count: pendingOrders },
    { count: pendingCustomerRequests },
    { data: lowStock },
    { data: recentOrders },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabaseAdmin.from('customer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('products').select('id, name, quantity, unit').lt('quantity', 10).order('quantity').limit(10),
    supabaseAdmin.from('orders')
      .select('*, customer:customers(company_name)')
      .order('created_at', { ascending: false }).limit(10),
  ])

  res.json({
    data: {
      stats: {
        userCount, customerCount, productCount, teamCount,
        orderCount,
        pendingOrderCount: pendingOrders,
        pendingCustomerRequests,
        lowStockProducts: lowStock ?? [],
        recentOrders: recentOrders ?? [],
      },
    },
  })
}))

router.get('/manager', asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user!.team_id) return res.json({ data: null })

  const { data: members } = await supabaseAdmin
    .from('users').select('id').eq('team_id', req.user!.team_id)
  const memberIds = (members ?? []).map((m: any) => m.id)

  const [
    { count: teamQuotationCount },
    { count: teamOrderCount },
    { count: pendingQuotations },
    { count: pendingOrders },
    { count: rejectedCount },
    { data: teamSales },
  ] = await Promise.all([
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }).in('created_by', memberIds),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('created_by', memberIds),
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }).in('created_by', memberIds).eq('status', 'pending'),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('created_by', memberIds).eq('status', 'pending_review'),
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }).in('created_by', memberIds).eq('status', 'rejected'),
    supabaseAdmin.from('orders').select('total_amount').in('created_by', memberIds).eq('status', 'completed'),
  ])

  const totalSales = (teamSales ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)

  res.json({
    data: { teamQuotationCount, teamOrderCount, pendingQuotations, pendingOrders, rejectedCount, totalSales },
  })
}))

router.get('/cfo', asyncHandler(async (_req, res) => {
  const [
    { count: quotationCount },
    { count: orderCount },
    { data: completedOrders },
    { data: orderItems },
    { data: teams },
  ] = await Promise.all([
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders')
      .select('total_amount, created_at, customer_id, customer:customers(company_name)')
      .eq('status', 'completed'),
    supabaseAdmin.from('order_items')
      .select('quantity, total_price, product:products(name), order:orders!inner(status)')
      .eq('order.status', 'completed'),
    supabaseAdmin.from('teams').select('id, name'),
  ])

  const totalSales = (completedOrders ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)

  const productMap = new Map<string, { name: string; quantity: number; sales: number }>()
  ;(orderItems ?? []).forEach((item: any) => {
    const name = item.product?.name ?? 'unknown'
    const prev = productMap.get(name) ?? { name, quantity: 0, sales: 0 }
    productMap.set(name, { name, quantity: prev.quantity + item.quantity, sales: prev.sales + item.total_price })
  })
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 5)

  const customerMap = new Map<string, { name: string; sales: number }>()
  ;(completedOrders ?? []).forEach((o: any) => {
    const name = o.customer?.company_name ?? 'unknown'
    const prev = customerMap.get(name) ?? { name, sales: 0 }
    customerMap.set(name, { name, sales: prev.sales + o.total_amount })
  })
  const topCustomers = Array.from(customerMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 5)

  const monthlyMap = new Map<string, number>()
  ;(completedOrders ?? []).forEach((o: any) => {
    const m = new Date(o.created_at).toLocaleDateString('th-TH', { month: 'short' })
    monthlyMap.set(m, (monthlyMap.get(m) ?? 0) + o.total_amount)
  })
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, sales]) => ({ month, sales }))

  res.json({
    data: {
      stats: { quotationCount, orderCount, totalSales, customerCount: customerMap.size },
      topProducts,
      topCustomers,
      monthlyData,
      teams: teams ?? [],
    },
  })
}))

export default router
