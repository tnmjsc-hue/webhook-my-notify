'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ApiKeyRow {
  id: string
  key_prefix: string
  is_active: boolean
}

interface WebhookConfigRow {
  api_key_id: string | null
  target_url: string | null
  is_enabled: boolean
}

export default function WebhookPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [selectedKeyId, setSelectedKeyId] = useState<string>('')
  const [targetUrl, setTargetUrl] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: keyData } = await supabase
      .from('api_keys')
      .select('id, key_prefix, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    const activeKeys = (keyData ?? []) as ApiKeyRow[]
    setKeys(activeKeys)

    const { data: cfg } = await supabase
      .from('webhook_configs')
      .select('api_key_id, target_url, is_enabled')
      .eq('user_id', user.id)
      .maybeSingle()
    if (cfg) {
      const c = cfg as WebhookConfigRow
      if (c.api_key_id) setSelectedKeyId(c.api_key_id)
      setTargetUrl(c.target_url ?? '')
      setIsEnabled(c.is_enabled)
    }
    setLoading(false)
  }

  async function saveConfig() {
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (!selectedKeyId) {
      setError('Bạn phải chọn một API key để gắn webhook.')
      return
    }

    const { error } = await supabase.from('webhook_configs').upsert({
      user_id: user.id,
      api_key_id: selectedKeyId,
      target_url: targetUrl || null,
      is_enabled: isEnabled,
    }, { onConflict: 'api_key_id' })

    if (error) {
      // Vi phạm unique -> key đã được gắn webhook khác
      if (error.code === '23505') {
        setError('API key này đã được gắn với một webhook khác. Mỗi API key chỉ dùng cho 1 webhook URL.')
      } else {
        setError(error.message)
      }
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="p-6 text-zinc-500">Đang tải...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Webhook Config</h1>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">API Key gắn webhook</label>
          <select
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="">-- Chọn API key --</option>
            {keys.map((k) => (
              <option key={k.id} value={k.id}>{k.key_prefix}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            Mỗi webhook URL được gắn với duy nhất 1 API key. Khi thông báo đến qua key đó, nó sẽ forward về URL này.
          </p>
        </div>

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

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

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
          <li>Chỉ thông báo đến <strong>từ API key đã chọn</strong> mới được forward về URL này.</li>
          <li>Mỗi API key chỉ gắn được 1 webhook URL (không trùng lặp).</li>
          <li>Body: <code className="bg-white dark:bg-zinc-900 px-1 rounded">{`{"application":"MBBank","time":"...","money":500000,"detail":"..."}`}</code></li>
          <li>Trạng thái gửi được ghi lại trong log thông báo.</li>
        </ul>
      </div>
    </div>
  )
}
