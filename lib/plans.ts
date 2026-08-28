export type PlanName = 'free' | 'premium' | 'unlimited'
export type BillingCycle = 'monthly' | 'yearly'

export const YEARLY_DISCOUNT_PERCENT = 20

export interface PlanLimits {
  label: string
  pricePerMonth: number
  priceLabel: string
  maxApiKeys: number | null
  maxNotificationsPerMonth: number | null
  maxNotificationsPerDay: number | null
  maxWebhookForwardsPerDay: number | null
  logRetentionDays: number | null
  tagline: string
  features: string[]
  popular?: boolean
}

export const PLANS: Record<PlanName, PlanLimits> = {
  free: {
    label: 'Free',
    pricePerMonth: 0,
    priceLabel: '0đ',
    maxApiKeys: 1,
    maxNotificationsPerMonth: 3000,
    maxNotificationsPerDay: 100,
    maxWebhookForwardsPerDay: 100,
    logRetentionDays: 7,
    tagline: 'Dành cho cá nhân thử nghiệm',
    features: [
      '1 API key',
      '3.000 thông báo / tháng',
      '100 thông báo / ngày',
      '100 webhook forward / ngày',
      'Log 7 ngày',
    ],
  },
  premium: {
    label: 'Premium',
    pricePerMonth: 50000,
    priceLabel: '50.000đ',
    maxApiKeys: 3,
    maxNotificationsPerMonth: 10000,
    maxNotificationsPerDay: 3000,
    maxWebhookForwardsPerDay: 3000,
    logRetentionDays: 30,
    tagline: 'Dành cho cửa hàng / team nhỏ',
    popular: true,
    features: [
      '3 API keys',
      '10.000 thông báo / tháng',
      '3.000 thông báo / ngày',
      '3.000 webhook forward / ngày',
      'Log 30 ngày',
      'Ưu tiên hỗ trợ',
    ],
  },
  unlimited: {
    label: 'Unlimited',
    pricePerMonth: 199000,
    priceLabel: '199.000đ',
    maxApiKeys: null,
    maxNotificationsPerMonth: null,
    maxNotificationsPerDay: null,
    maxWebhookForwardsPerDay: null,
    logRetentionDays: null,
    tagline: 'Dành cho doanh nghiệp lớn',
    features: [
      'Không giới hạn API keys',
      'Không giới hạn thông báo',
      'Không giới hạn forward',
      'Giữ log vĩnh viễn',
      'Hỗ trợ riêng',
    ],
  },
}

export const PLAN_NAMES: PlanName[] = ['free', 'premium', 'unlimited']

export function getPlanPrice(plan: PlanName, billingCycle: BillingCycle): number {
  const monthlyPrice = PLANS[plan].pricePerMonth
  if (billingCycle === 'monthly') return monthlyPrice

  return Math.round(monthlyPrice * 12 * (100 - YEARLY_DISCOUNT_PERCENT) / 100)
}

export function formatPlanPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')}đ`
}

export function getMonthlyEquivalent(plan: PlanName): string {
  return formatPlanPrice(Math.round(getPlanPrice(plan, 'yearly') / 12))
}

export function getPlanName(plan: string | null | undefined): PlanName {
  return plan === 'premium' || plan === 'unlimited' ? plan : 'free'
}

export function isUnlimited(plan: PlanName): boolean {
  return plan === 'unlimited'
}
