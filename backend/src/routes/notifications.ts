// src/routes/notifications.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(requireAuth)

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  res.json({ data })
}))

router.patch('/:id/read', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { error } = await supabaseAdmin
    .from('notifications').update({ is_read: true })
    .eq('id', req.params.id).eq('user_id', req.user!.id)
  if (error) throw error
  res.json({ success: true })
}))

router.patch('/mark-all-read', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { error } = await supabaseAdmin
    .from('notifications').update({ is_read: true })
    .eq('user_id', req.user!.id).eq('is_read', false)
  if (error) throw error
  res.json({ success: true })
}))

export default router
