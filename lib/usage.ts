import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getPlanName, PLANS, type PlanName } from '@/lib/plans'

function dayStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function monthStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

async function countToday(userId: string): Promise<number> {
  const supabase = createServiceRoleClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dayStart())
  if (error) return 0
  return count ?? 0
}

async function countMonth(userId: string): Promise<number> {
  const supabase = createServiceRoleClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart())
  if (error) return 0
  return count ?? 0
}

async function countForwardsToday(userId: string): Promise<number> {
  const supabase = createServiceRoleClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('forwarded', true)
    .gte('created_at', dayStart())
  if (error) return 0
  return count ?? 0
}

async function countActiveApiKeys(userId: string): Promise<number> {
  const supabase = createServiceRoleClient()
  const { count, error } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) return 0
  return count ?? 0
}

export interface UsageSnapshot {
  notificationsToday: number
  notificationsThisMonth: number
  forwardsToday: number
  activeApiKeys: number
}

export async function getUsage(userId: string): Promise<UsageSnapshot> {
  const [notificationsToday, notificationsThisMonth, forwardsToday, activeApiKeys] = await Promise.all([
    countToday(userId),
    countMonth(userId),
    countForwardsToday(userId),
    countActiveApiKeys(userId),
  ])
  return { notificationsToday, notificationsThisMonth, forwardsToday, activeApiKeys }
}

export type QuotaError = {
  code: 'quota_exceeded' | 'key_limit_exceeded'
  message: string
}

export async function getPlanForUser(userId: string): Promise<PlanName> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single()
  return getPlanName(data?.plan)
}

/**
 * Kiểm tra giới hạn thông báo theo ngày/tháng của gói.
 * Trả về error nếu vượt quota, ngược lại null.
 */
export async function checkNotificationQuota(userId: string): Promise<QuotaError | null> {
  const plan = await getPlanForUser(userId)
  const limits = PLANS[plan]

  if (limits.maxNotificationsPerDay === null && limits.maxNotificationsPerMonth === null) {
    return null
  }

  const [today, month] = await Promise.all([countToday(userId), countMonth(userId)])

  if (limits.maxNotificationsPerDay !== null && today >= limits.maxNotificationsPerDay) {
    return {
      code: 'quota_exceeded',
      message: `Daily notification limit (${limits.maxNotificationsPerDay}) reached. Upgrade your plan.`,
    }
  }
  if (limits.maxNotificationsPerMonth !== null && month >= limits.maxNotificationsPerMonth) {
    return {
      code: 'quota_exceeded',
      message: `Monthly notification limit (${limits.maxNotificationsPerMonth}) reached. Upgrade your plan.`,
    }
  }
  return null
}

/**
 * Kiểm tra giới hạn API key của gói. Trả về error nếu vượt.
 */
export async function checkApiKeyQuota(userId: string): Promise<QuotaError | null> {
  const plan = await getPlanForUser(userId)
  const limits = PLANS[plan]

  if (limits.maxApiKeys === null) return null

  const count = await countActiveApiKeys(userId)
  if (count >= limits.maxApiKeys) {
    return {
      code: 'key_limit_exceeded',
      message: `API key limit (${limits.maxApiKeys}) reached for your plan. Upgrade to add more keys.`,
    }
  }
  return null
}

/**
 * Kiểm tra giới hạn forward webhook theo ngày. Trả về error nếu vượt.
 */
export async function checkForwardQuota(userId: string): Promise<QuotaError | null> {
  const plan = await getPlanForUser(userId)
  const limits = PLANS[plan]

  if (limits.maxWebhookForwardsPerDay === null) return null

  const count = await countForwardsToday(userId)
  if (count >= limits.maxWebhookForwardsPerDay) {
    return {
      code: 'quota_exceeded',
      message: `Daily webhook forward limit (${limits.maxWebhookForwardsPerDay}) reached. Upgrade your plan.`,
    }
  }
  return null
}

/**
 * Xoá log notifications cũ hơn số ngày giữ log của từng gói.
 * - free: 7 ngày, premium: 30 ngày, unlimited: giữ mãi.
 * Chạy từ cron. Trả về số bản ghi đã xoá.
 */
export async function cleanupExpiredLogs(): Promise<number> {
  const supabase = createServiceRoleClient()

  let deleted = 0
  for (const [planName, limits] of Object.entries(PLANS)) {
    if (limits.logRetentionDays === null) continue
    const cutoff = new Date(Date.now() - limits.logRetentionDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: planUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('plan', planName)
    if (!planUsers || planUsers.length === 0) continue

    const userIds = planUsers.map((p) => p.id)
    // xoá theo từng chunk user để tránh query quá dài
    const CHUNK = 50
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const chunk = userIds.slice(i, i + CHUNK)
      const { count } = await supabase
        .from('notifications')
        .delete({ count: 'exact' })
        .in('user_id', chunk)
        .lt('created_at', cutoff)
      deleted += count ?? 0
    }
  }

  return deleted
}
