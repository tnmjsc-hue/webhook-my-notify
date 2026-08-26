'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WebhookPage() {
  const [targetUrl, setTargetUrl] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('webhook_configs')
      .select('target_url, is_enabled')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setTargetUrl(data.target_url ?? '')
      setIsEnabled(data.is_enabled)
    }
    setLoading(false)
  }

  async function saveConfig() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('webhook_configs').upsert({
      user_id: user.id,
      target_url: targetUrl || null,
      is_enabled: isEnabled,
    }, { onConflict: 'user_id' })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading) return <div className="p-6 text-zinc-500">Đang tải...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Webhook Config</h1>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target URL</label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <p className="mt-1 text-xs text-zinc-500">URL sẽ nhận POST request với body là nội dung thông báo</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {isEnabled ? 'Đang bật' : 'Đang tắt'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={saveConfig}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Lưu
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Đã lưu!</span>}
        </div>
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
        <p className="font-medium text-zinc-900 dark:text-white">Khi webhook được bật:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Mỗi thông báo mới sẽ được POST sang Target URL</li>
          <li>Body: <code className="bg-white dark:bg-zinc-900 px-1 rounded">{`{"application":"MBBank","time":"...","money":500000,"detail":"..."}`}</code></li>
          <li>Trạng thái gửi được ghi lại trong log thông báo</li>
        </ul>
      </div>
    </div>
  )
}
