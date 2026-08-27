import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Client dùng SUPABASE_SERVICE_ROLE_KEY - vượt qua RLS.
 * CHỈ dùng ở server-side cho các thao tác cần bỏ qua auth,
 * vd: kiểm tra API key trong endpoint public /api/wmn_endpoint.
 * KHÔNG bao giờ lộ service role key xuống client/browser.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
