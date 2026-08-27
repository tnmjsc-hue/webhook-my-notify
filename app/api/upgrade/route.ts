import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { PLAN_NAMES, type PlanName } from '@/lib/plans'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.plan || !PLAN_NAMES.includes(body.plan as PlanName)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  const newPlan = body.plan as PlanName

  const serviceRole = createServiceRoleClient()
  const { data: profile } = await serviceRole
    .from('profiles')
    .select('plan, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  const current = profile.plan as PlanName
  const rank: Record<PlanName, number> = { free: 0, premium: 1, unlimited: 2 }

  // Không cho hạ cấp bằng endpoint này (phòng abuse); admin quản lý qua Super Admin
  if (rank[newPlan] < rank[current] && newPlan !== current) {
    return NextResponse.json(
      { error: 'Cannot downgrade here. Contact support.' },
      { status: 400 },
    )
  }

  const { error } = await serviceRole
    .from('profiles')
    .update({ plan: newPlan })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan: newPlan })
}
