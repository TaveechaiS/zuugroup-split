// src/lib/activityLog.ts
import { supabaseAdmin } from './supabase'

export async function logActivity(opts: {
  userId: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  description?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}) {
  try {
    await supabaseAdmin.from('activity_logs').insert({
      user_id: opts.userId,
      action: opts.action,
      entity_type: opts.entityType ?? null,
      entity_id: opts.entityId ?? null,
      description: opts.description ?? null,
      ip_address: opts.ipAddress ?? null,
      user_agent: opts.userAgent ?? null,
    })
  } catch (err) {
    console.error('[activity_log] insert failed:', err)
  }
}
