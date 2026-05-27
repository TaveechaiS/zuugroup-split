// src/lib/notify.ts
//
// Helpers for sending role-based notifications. Each helper inserts one
// row per recipient user into the notifications table.

import { supabaseAdmin } from './supabase'

export type NotifType = 'info' | 'success' | 'warning' | 'error'
export type Role = 'admin' | 'manager' | 'sales' | 'cfo'

export interface NotifyPayload {
  title: string
  message: string
  type?: NotifType
  entityType?: string
  entityId?: string
}

async function insertMany(userIds: string[], p: NotifyPayload) {
  if (!userIds.length) return
  const rows = userIds.map((uid) => ({
    user_id: uid,
    title: p.title,
    message: p.message,
    type: p.type ?? 'info',
    related_entity_type: p.entityType ?? null,
    related_entity_id: p.entityId ?? null,
  }))
  try {
    await supabaseAdmin.from('notifications').insert(rows)
  } catch (err) {
    console.error('[notify] insert failed:', err)
  }
}

/** Notify a single user. */
export async function notifyUser(userId: string, p: NotifyPayload) {
  await insertMany([userId], p)
}

/** Notify every active user with the given role. */
export async function notifyRole(role: Role | Role[], p: NotifyPayload) {
  const roles = Array.isArray(role) ? role : [role]
  const { data } = await supabaseAdmin
    .from('users').select('id').in('role', roles).eq('is_active', true)
  await insertMany((data ?? []).map((u: any) => u.id), p)
}

/** Notify the manager of the team that `userId` belongs to. */
export async function notifyTeamManager(userId: string, p: NotifyPayload) {
  const { data: u } = await supabaseAdmin
    .from('users').select('team_id').eq('id', userId).single()
  if (!u?.team_id) return
  const { data: mgrs } = await supabaseAdmin
    .from('users').select('id').eq('team_id', u.team_id).eq('role', 'manager').eq('is_active', true)
  await insertMany((mgrs ?? []).map((m: any) => m.id), p)
}
