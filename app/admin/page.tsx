import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const [userCount, notifCount, queueStats, recentNotifs] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
    supabase.from('notify_queue').select('status'),
    supabase.from('notifications').select('id, application, money, user_id, created_at, forwarded').order('created_at', { ascending: false }).limit(20),
  ])

  const queueCounts = { pending: 0, processing: 0, done: 0, failed: 0 }
  for (const item of queueStats.data ?? []) {
    const s = item.status as keyof typeof queueCounts
    if (s in queueCounts) queueCounts[s]++
  }

  const stats = [
    { label: 'Tổng user', value: userCount.count ?? 0 },
    { label: 'Tổng thông báo', value: notifCount.count ?? 0 },
    { label: 'Queue pending', value: queueCounts.pending },
    { label: 'Queue failed', value: queueCounts.failed },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Thông báo gần đây (hệ thống)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500">
                <th className="p-3">User ID</th>
                <th className="p-3">Ứng dụng</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Forward</th>
                <th className="p-3">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {(recentNotifs.data ?? []).map((n) => (
                <tr key={n.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3 font-mono text-xs text-zinc-500 max-w-[120px] truncate">{n.user_id}</td>
                  <td className="p-3 font-medium text-zinc-900 dark:text-white">{n.application}</td>
                  <td className="p-3 text-zinc-700 dark:text-zinc-300">{n.money?.toLocaleString()}đ</td>
                  <td className="p-3">
                    {n.forwarded ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">OK</span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-zinc-500 text-xs">{new Date(n.created_at).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
              {(!recentNotifs.data || recentNotifs.data.length === 0) && (
                <tr><td colSpan={5} className="p-6 text-center text-zinc-400">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
