export type PlanName = 'free' | 'premium' | 'unlimited'

export interface PlanLimits {
  label: string
  maxApiKeys: number | null
  maxNotificationsPerMonth: number | null
  maxNotificationsPerDay: number | null
  maxWebhookForwardsPerDay: number | null
  logRetentionDays: number | null
}

export const PLANS: Record<PlanName, PlanLimits> = {
  free: {
    label: 'Free',
    maxApiKeys: 1,
    maxNotificationsPerMonth: 3000,
    maxNotificationsPerDay: 100,
    maxWebhookForwardsPerDay: 100,
    logRetentionDays: 7,
  },
  premium: {
    label: 'Premium',
    maxApiKeys: 10,
    maxNotificationsPerMonth: 10000,
    maxNotificationsPerDay: 3000,
    maxWebhookForwardsPerDay: 3000,
    logRetentionDays: 30,
  },
  unlimited: {
    label: 'Unlimited',
    maxApiKeys: null,
    maxNotificationsPerMonth: null,
    maxNotificationsPerDay: null,
    maxWebhookForwardsPerDay: null,
    logRetentionDays: null,
  },
}

export const PLAN_NAMES: PlanName[] = ['free', 'premium', 'unlimited']

export function getPlanName(plan: string | null | undefined): PlanName {
  return plan === 'premium' || plan === 'unlimited' ? plan : 'free'
}

export function isUnlimited(plan: PlanName): boolean {
  return plan === 'unlimited'
}
