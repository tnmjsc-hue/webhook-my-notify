'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: number
  application: string | null
  event_time: string | null
  money: number | null
  detail: string | null
  forwarded: boolean
  forward_status_code: number | null
  forward_bytes: number | null
  forward_error: string | null
  created_at: string
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadNotifs()

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifs((prev) => [payload.new as Notification, ...prev].slice(0, 100))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadNotifs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setNotifs(data ?? [])
    setLoading(false)
  }

  if (loading) return <div className="p-6 text-zinc-500">Đang tải...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Thông báo</h1>
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Realtime
        </span>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500">
                <th className="p-3">Ứng dụng</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Chi tiết</th>
                <th className="p-3">Thời gian gửi</th>
                <th className="p-3">Forward</th>
                <th className="p-3">Mã</th>
                <th className="p-3">Dung lượng</th>
                <th className="p-3">Nhận lúc</th>
              </tr>
            </thead>
            <tbody>
              {notifs.map((n) => (
                <tr key={n.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3 font-medium text-zinc-900 dark:text-white">{n.application}</td>
                  <td className="p-3 text-zinc-700 dark:text-zinc-300">{n.money?.toLocaleString()}đ</td>
                  <td className="p-3 text-zinc-500 max-w-[200px] truncate">{n.detail}</td>
                  <td className="p-3 text-xs text-zinc-500">{n.event_time ? new Date(n.event_time).toLocaleString('vi-VN') : '-'}</td>
                  <td className="p-3">
                    {n.forwarded ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">OK</span>
                    ) : n.forward_error ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" title={n.forward_error}>Lỗi</span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-zinc-500">{n.forward_status_code ?? '-'}</td>
                  <td className="p-3 text-xs text-zinc-500">{n.forward_bytes ? `${n.forward_bytes}B` : '-'}</td>
                  <td className="p-3 text-xs text-zinc-500">{new Date(n.created_at).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
              {notifs.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-zinc-400">Chưa có thông báo nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
