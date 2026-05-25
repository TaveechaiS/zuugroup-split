// src/lib/supabase.ts
// Service-role Supabase client. Bypasses RLS - use carefully.
// Authorization is enforced in middleware/routes instead.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Per-request scoped client that respects RLS (uses the user's JWT)
export function supabaseForUser(jwt: string) {
  return createClient(url, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
