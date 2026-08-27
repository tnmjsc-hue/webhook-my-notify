import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { PLANS } from '@/lib/plans'

export async function GET() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceRoleClient()

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)

  const [
    userCount,
    notifCount,
    queueStats,
    profiles,
    recentNotifs,
    todayNotifs,
    todayForwards,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
    supabase.from('notify_queue').select('status'),
    supabase.from('profiles').select('id, plan, is_admin'),
    supabase.from('notifications').select('id, application, money, user_id, created_at, forwarded').order('created_at', { ascending: false }).limit(20),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', dayStart.toISOString()),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('forwarded', true).gte('created_at', dayStart.toISOString()),
  ])

  const planCounts: Record<string, number> = { free: 0, premium: 0, unlimited: 0 }
  for (const p of profiles.data ?? []) {
    const plan = (p.plan as string) || 'free'
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }

  const queueCounts = { pending: 0, processing: 0, done: 0, failed: 0 }
  for (const item of queueStats.data ?? []) {
    const s = item.status as keyof typeof queueCounts
    if (s in queueCounts) queueCounts[s]++
  }

  const planConfig = Object.fromEntries(
    Object.entries(PLANS).map(([name, limits]) => [name, limits])
  )

  return NextResponse.json({
    stats: {
      totalUsers: userCount.count ?? 0,
      totalNotifications: notifCount.count ?? 0,
      todayNotifications: todayNotifs.count ?? 0,
      todayForwards: todayForwards.count ?? 0,
      planCounts,
      queueCounts,
    },
    planConfig,
    recentNotifications: recentNotifs.data ?? [],
  })
}
