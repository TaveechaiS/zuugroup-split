// src/routes/activityLogs.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(requireAuth, requireRole('admin'))

router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('activity_logs')
    .select('*, user:users(first_name, last_name, role)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  res.json({ data })
}))

export default router
