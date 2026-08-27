'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PLAN_NAMES, type PlanName } from '@/lib/plans'
import { PlanCard } from '@/components/PlanCard'

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState<PlanName>('free')
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
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile?.plan) setCurrentPlan(profile.plan as PlanName)
      setLoading(false)
    })()
  }, [supabase])

  async function upgrade(name: PlanName) {
    setBusy(name)
    setMessage(null)
    const r = await fetch('/api/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: name }),
    })
    const body = await r.json()
    setBusy(null)
    if (r.ok) {
      setCurrentPlan(name)
      setMessage({ type: 'ok', text: `Bạn đã chuyển sang gói ${name}.` })
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLAN_NAMES.map((name) => (
          <PlanCard
            key={name}
            name={name}
            current={currentPlan}
            cta={
              <button
                onClick={() => upgrade(name)}
                disabled={busy !== null || currentPlan === name}
                className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition-opacity ${
                  name === 'premium'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
                    : 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {busy === name ? 'Đang xử lý...' : currentPlan === name ? 'Gói hiện tại' : name === 'free' ? 'Chuyển về Free' : 'Nâng cấp'}
              </button>
            }
          />
        ))}
      </div>

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
