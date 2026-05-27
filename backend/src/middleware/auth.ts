// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { supabaseAdmin } from '../lib/supabase'

export type Role = 'admin' | 'manager' | 'sales' | 'cfo'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: Role
    team_id: string | null
    team?: { id: string; name: string } | null
    first_name: string
    last_name: string
    jwt: string
  }
}

// Supabase ใหม่ใช้ JWT Signing Keys (RS256/ES256) — ดึง public keys จาก JWKS endpoint
const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const JWKS = SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null

// Fallback: HS256 legacy secret (รองรับ project เก่า)
const legacySecret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET ?? '')

/**
 * ตรวจ Supabase JWT — รองรับทั้ง new RS256/ES256 (ผ่าน JWKS) และ legacy HS256
 */
async function verifyToken(token: string) {
  // ลอง JWKS ก่อน (RS256/ES256) — Supabase ใหม่
  if (JWKS) {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        algorithms: ['RS256', 'ES256'],
      })
      return payload
    } catch {
      // ไม่ผ่าน → ลอง legacy
    }
  }
  // Legacy HS256
  const { payload } = await jwtVerify(token, legacySecret, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }
    const token = header.slice(7)

    const payload = await verifyToken(token)
    const userId = payload.sub as string
    if (!userId) return res.status(401).json({ error: 'Invalid token: no sub' })

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, team_id, first_name, last_name, is_active, team:teams(id, name)')
      .eq('id', userId)
      .single()

    if (error || !profile) return res.status(401).json({ error: 'User profile not found' })
    if (!profile.is_active) return res.status(403).json({ error: 'User is inactive' })

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      team_id: profile.team_id,
      team: (profile as any).team ?? null,
      first_name: profile.first_name,
      last_name: profile.last_name,
      jwt: token,
    }
    next()
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired token', detail: err.message })
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` })
    }
    next()
  }
}