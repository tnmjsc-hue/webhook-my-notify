import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Kiểm tra user hiện tại có phải admin không.
 * Trả về userId nếu admin, ngược lại null.
 */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceRole = createServiceRoleClient()
  const { data: profile } = await serviceRole
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin ? user.id : null
}
