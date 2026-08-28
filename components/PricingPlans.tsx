'use client'

import { useState } from 'react'
import { PlanCard } from '@/components/PlanCard'
import {
  YEARLY_DISCOUNT_PERCENT,
  PLAN_NAMES,
  type BillingCycle,
  type PlanName,
} from '@/lib/plans'

export function PricingPlans({
  current,
  defaultBillingCycle = 'monthly',
  onUpgrade,
  busy,
}: {
  current?: PlanName
  defaultBillingCycle?: BillingCycle
  onUpgrade?: (name: PlanName, billingCycle: BillingCycle) => void
  busy?: PlanName | null
}) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(defaultBillingCycle)

  return (
    <>
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${billingCycle === 'monthly'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
          >
            Theo tháng
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${billingCycle === 'yearly'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
          >
            Theo năm
            <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">-{YEARLY_DISCOUNT_PERCENT}%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLAN_NAMES.map((name) => (
          <PlanCard
            key={name}
            name={name}
            current={current}
            billingCycle={billingCycle}
            cta={onUpgrade ? (
              <button
                onClick={() => onUpgrade(name, billingCycle)}
                disabled={busy !== null || current === name}
                className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition-opacity ${name === 'premium'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
                  : 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {busy === name ? 'Đang xử lý...' : current === name ? 'Gói hiện tại' : name === 'free' ? 'Chuyển về Free' : 'Nâng cấp'}
              </button>
            ) : undefined}
          />
        ))}
      </div>
    </>
  )
}
