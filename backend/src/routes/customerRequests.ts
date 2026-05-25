// src/routes/customerRequests.ts
import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const requestSchema = z.object({
  company_name: z.string().min(1),
  address: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  drug_license_number: z.string().optional(),
  location_image_url: z.string().url().optional().or(z.literal('')),
  drug_license_image_url: z.string().url().optional().or(z.literal('')),
  hospital_license_image_url: z.string().url().optional().or(z.literal('')),
})

/** GET /api/customer-requests - Admin sees all pending */
router.get('/', requireRole('admin'), asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('customer_requests')
    .select('*, requester:users!requested_by(first_name, last_name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  res.json({ data })
}))

router.get('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('customer_requests')
    .select('*, requester:users!requested_by(first_name, last_name, email)')
    .eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json({ data })
}))

/** POST /api/customer-requests - sales/manager submit a request */
router.post('/', requireRole('sales', 'manager'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = requestSchema.parse(req.body)
  const { data, error } = await supabaseAdmin
    .from('customer_requests')
    .insert({ ...body, requested_by: req.user!.id, status: 'pending' })
    .select().single()
  if (error) throw error
  res.status(201).json({ data })
}))

/** POST /api/customer-requests/:id/approve - admin approves */
router.post('/:id/approve', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { data: request } = await supabaseAdmin
    .from('customer_requests').select('*').eq('id', req.params.id).single()
  if (!request) return res.status(404).json({ error: 'Request not found' })

  // Create customer
  await supabaseAdmin.from('customers').insert({
    company_name: request.company_name,
    address: request.address,
    contact_name: request.contact_name,
    phone: request.phone,
    email: request.email,
    drug_license_number: request.drug_license_number,
    location_image_url: request.location_image_url,
    drug_license_image_url: request.drug_license_image_url,
    hospital_license_image_url: request.hospital_license_image_url,
    created_by: request.requested_by,
  })

  await supabaseAdmin.from('customer_requests').update({
    status: 'approved',
    reviewed_by: req.user!.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', req.params.id)

  // Notify requester
  await supabaseAdmin.from('notifications').insert({
    user_id: request.requested_by,
    title: 'คำขอเพิ่มลูกค้าได้รับอนุมัติ',
    message: `คำขอเพิ่ม "${request.company_name}" ได้รับอนุมัติแล้ว`,
    type: 'success',
  })

  res.json({ success: true })
}))

/** POST /api/customer-requests/:id/reject */
router.post('/:id/reject', requireRole('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  const { data: request } = await supabaseAdmin
    .from('customer_requests').select('*').eq('id', req.params.id).single()
  if (!request) return res.status(404).json({ error: 'Not found' })

  await supabaseAdmin.from('customer_requests').update({
    status: 'rejected',
    reviewed_by: req.user!.id,
    reviewed_at: new Date().toISOString(),
    reject_reason: reason,
  }).eq('id', req.params.id)

  await supabaseAdmin.from('notifications').insert({
    user_id: request.requested_by,
    title: 'คำขอเพิ่มลูกค้าถูกปฏิเสธ',
    message: `คำขอเพิ่ม "${request.company_name}" ถูกปฏิเสธ: ${reason}`,
    type: 'error',
  })

  res.json({ success: true })
}))

export default router
