// src/routes/badges.ts
//
// Returns counts of "pending / new" items relevant to the current user.
// The frontend sidebar uses these to show red-dot indicators on nav items.

import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(requireAuth)

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const role = req.user!.role
  const userId = req.user!.id
  const teamId = req.user!.team_id

  // Always include the user's own unread-notification count
  const { count: notifCount } = await supabaseAdmin
    .from('notifications').select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('is_read', false)

  const out: Record<string, number> = {
    notifications: notifCount ?? 0,
  }

  if (role === 'admin') {
    const [
      { count: customerRequests },
      { count: pendingOrders },
    ] = await Promise.all([
      supabaseAdmin.from('customer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending_review', 'processing']),
    ])
    out.customer_requests = customerRequests ?? 0
    out.pending_orders = pendingOrders ?? 0
  }

  if (role === 'manager' && teamId) {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('team_id', teamId)
    const memberIds = (members ?? []).map((m: any) => m.id)

    const [
      { count: pendingQuotations },
      { count: pendingOrders },
    ] = await Promise.all([
      supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true })
        .in('created_by', memberIds).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true })
        .in('created_by', memberIds).eq('status', 'pending_review'),
    ])
    out.pending_quotations = pendingQuotations ?? 0
    out.pending_orders = pendingOrders ?? 0
  }

  res.json({ data: out })
}))

export default router
