'use client'

import { useState, useEffect } from 'react'

interface PlanConfig {
  label: string
  maxApiKeys: number | null
  maxNotificationsPerMonth: number | null
  maxNotificationsPerDay: number | null
  maxWebhookForwardsPerDay: number | null
  logRetentionDays: number | null
}

interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  plan: string
  is_admin: boolean
  balance: number
  created_at: string
  usage: {
    notificationsToday: number
    notificationsThisMonth: number
    forwardsToday: number
    activeApiKeys: number
  }
}

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [planConfig, setPlanConfig] = useState<Record<string, PlanConfig>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
    ]).then(([s, u]) => {
      if (s.error) { setError(s.error); setLoading(false); return }
      setStats(s.stats)
      setPlanConfig(s.planConfig ?? {})
      setUsers(u.users ?? [])
      setLoading(false)
    }).catch(() => {
      setError('Không thể tải dữ liệu')
      setLoading(false)
    })
  }, [])

  async function changePlan(userId: string, plan: string) {
    setChanging(userId)
    const r = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, plan }),
    })
    const body = await r.json()
    if (r.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan } : u)))
    } else {
      alert(body.error ?? 'Đổi gói thất bại')
    }
    setChanging(null)
  }

  if (loading) return <div className="p-6 text-zinc-500">Đang tải...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  const statCards = [
    { label: 'Tổng user', value: stats?.totalUsers ?? 0 },
    { label: 'Tổng thông báo', value: stats?.totalNotifications ?? 0 },
    { label: 'Thông báo hôm nay', value: stats?.todayNotifications ?? 0 },
    { label: 'Forward hôm nay', value: stats?.todayForwards ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Super Admin</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-3">Người dùng theo gói</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(planConfig).map(([name, cfg]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-sm font-medium uppercase text-zinc-700 dark:text-zinc-300">{cfg.label}</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">
                {stats?.planCounts?.[name] ?? 0}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          Queue: pending {stats?.queueCounts?.pending ?? 0} · processing {stats?.queueCounts?.processing ?? 0} · failed {stats?.queueCounts?.failed ?? 0}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Quản lý người dùng ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500">
                <th className="p-3">Email</th>
                <th className="p-3">Gói</th>
                <th className="p-3">Key đang dùng</th>
                <th className="p-3">TB hôm nay</th>
                <th className="p-3">TB tháng này</th>
                <th className="p-3">Forward hôm nay</th>
                <th className="p-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3">
                    <div className="font-medium text-zinc-900 dark:text-white">{u.email ?? '—'}</div>
                    <div className="text-xs text-zinc-500">{u.full_name ?? u.id.slice(0, 8)}</div>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.plan}
                      disabled={changing === u.id}
                      onChange={(e) => changePlan(u.id, e.target.value)}
                      className="border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white capitalize"
                    >
                      {Object.keys(planConfig).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {u.is_admin && <span className="ml-2 text-xs text-blue-600">admin</span>}
                  </td>
                  <td className="p-3 text-zinc-700 dark:text-zinc-300">{u.usage.activeApiKeys}</td>
                  <td className="p-3 text-zinc-700 dark:text-zinc-300">{u.usage.notificationsToday}</td>
                  <td className="p-3 text-zinc-700 dark:text-zinc-300">{u.usage.notificationsThisMonth}</td>
                  <td className="p-3 text-zinc-700 dark:text-zinc-300">{u.usage.forwardsToday}</td>
                  <td className="p-3 text-zinc-500 text-xs">{new Date(u.created_at).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
