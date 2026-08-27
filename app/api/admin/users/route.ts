import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getUsage } from '@/lib/usage'
import { PLAN_NAMES } from '@/lib/plans'

export async function GET() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceRoleClient()

  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 200 })
  const { data: profiles } = await supabase.from('profiles').select('id, plan, is_admin, full_name, balance, created_at')

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const users = await Promise.all(
    (authUsers?.users ?? []).map(async (u) => {
      const prof = profileMap.get(u.id)
      const usage = await getUsage(u.id).catch(() => ({
        notificationsToday: 0,
        notificationsThisMonth: 0,
        forwardsToday: 0,
        activeApiKeys: 0,
      }))
      return {
        id: u.id,
        email: u.email,
        full_name: prof?.full_name ?? null,
        plan: prof?.plan ?? 'free',
        is_admin: prof?.is_admin ?? false,
        balance: prof?.balance ?? 0,
        created_at: prof?.created_at ?? u.created_at,
        usage,
      }
    }),
  )

  return NextResponse.json({ users })
}

export async function PATCH(request: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { user_id?: string; plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.user_id || !body.plan || !PLAN_NAMES.includes(body.plan as (typeof PLAN_NAMES)[number])) {
    return NextResponse.json({ error: 'Invalid user_id or plan' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('profiles')
    .update({ plan: body.plan })
    .eq('id', body.user_id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ ok: true, user_id: body.user_id, plan: body.plan })
}
