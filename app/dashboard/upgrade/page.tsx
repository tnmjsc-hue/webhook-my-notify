'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type BillingCycle, type PlanName } from '@/lib/plans'
import { PricingPlans } from '@/components/PricingPlans'

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState<PlanName>('free')
  const [currentBillingCycle, setCurrentBillingCycle] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<PlanName | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, billing_cycle')
        .eq('id', user.id)
        .single()
      if (profile?.plan) setCurrentPlan(profile.plan as PlanName)
      if (profile?.billing_cycle === 'monthly' || profile?.billing_cycle === 'yearly') {
        setCurrentBillingCycle(profile.billing_cycle)
      }
      setLoading(false)
    })()
  }, [supabase])

  async function upgrade(name: PlanName, billingCycle: BillingCycle) {
    setBusy(name)
    setMessage(null)
    const r = await fetch('/api/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: name, billingCycle }),
    })
    const body = await r.json()
    setBusy(null)
    if (r.ok) {
      setCurrentPlan(name)
      setMessage({ type: 'ok', text: `Bạn đã chuyển sang gói ${name} theo chu kỳ ${billingCycle === 'yearly' ? 'năm' : 'tháng'}.` })
    } else {
      setMessage({ type: 'err', text: body.error ?? 'Nâng cấp thất bại' })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Nâng cấp gói</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gói hiện tại: <span className="font-semibold uppercase text-zinc-700 dark:text-zinc-300">{loading ? '...' : currentPlan}</span>
        </p>
      </div>

      {message && (
        <div className={`rounded-xl p-4 text-sm ${message.type === 'ok'
          ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'}`}>
          {message.text}
        </div>
      )}

      <PricingPlans
        key={currentBillingCycle}
        current={currentPlan}
        defaultBillingCycle={currentBillingCycle}
        onUpgrade={upgrade}
        busy={busy}
      />

      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
        <p className="font-medium text-zinc-900 dark:text-white">Lưu ý</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Bạn có thể nâng cấp ngay lập tức, giới hạn gói mới áp dụng tức thì.</li>
          <li>Hạ cấp gói hoặc thay đổi gói đặc biệt: liên hệ hỗ trợ.</li>
          <li>Thanh toán tự động sẽ được bật trong thời gian tới.</li>
        </ul>
        <Link href="/dashboard" className="inline-block mt-2 text-sm text-zinc-900 dark:text-white underline">
          ← Quay lại Dashboard
        </Link>
      </div>
    </div>
  )
}
