'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ApiKey {
  id: string
  key_prefix: string
  is_active: boolean
  created_at: string
}

interface SessionKey {
  id: string
  raw: string
}

const SESSION_KEYS_KEY = 'wmn_session_keys'

function readSessionKeys(): SessionKey[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeSessionKeys(keys: SessionKey[]) {
  try {
    sessionStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(keys))
  } catch {
    // sessionStorage không sẵn - bỏ qua, key chỉ hiện 1 lần
  }
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>('free')
  const [usage, setUsage] = useState({ activeApiKeys: 0 })
  const supabase = createClient()

  useEffect(() => {
    loadKeys()
    loadPlan()
  }, [])

  async function loadPlan() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    setPlan(profile?.plan ?? 'free')
  }

  async function loadKeys() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('api_keys')
      .select('id, key_prefix, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const active = (data ?? []).filter((k) => k.is_active).length
    setKeys(data ?? [])
    setUsage({ activeApiKeys: active })
    setLoading(false)
  }

  async function createKey() {
    setError(null)
    const resp = await fetch('/api/keys', { method: 'POST' })
    const body = await resp.json()
    if (!resp.ok) {
      setError(body.error ?? 'Không thể tạo key')
      return
    }
    setNewKey(body.raw_key)
    const sessionKeys = readSessionKeys()
    sessionKeys.push({ id: body.id, raw: body.raw_key })
    writeSessionKeys(sessionKeys)
    setUsage((u) => ({ ...u, activeApiKeys: u.activeApiKeys + 1 }))
    loadKeys()
  }

  function getSessionKey(id: string): string | null {
    const found = readSessionKeys().find((k) => k.id === id)
    return found?.raw ?? null
  }

  async function revokeKey(id: string) {
    if (!confirm('Thu hồi API key này?')) return
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id)
    setUsage((u) => ({ ...u, activeApiKeys: Math.max(0, u.activeApiKeys - 1) }))
    loadKeys()
  }

  if (loading) return <div className="p-6 text-zinc-500">Đang tải...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">API Keys</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            Gói: <span className="font-semibold uppercase text-zinc-700 dark:text-zinc-300">{plan}</span>
            {' · '}{usage.activeApiKeys} key đang dùng
          </span>
          <button onClick={createKey}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Tạo key mới
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {newKey && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Lưu key này — nó sẽ không hiển thị lại:
          </p>
          <code className="block bg-white dark:bg-zinc-900 rounded-lg p-3 text-sm font-mono break-all border border-amber-200 dark:border-amber-800">
            {newKey}
          </code>
          <button onClick={() => { navigator.clipboard.writeText(newKey); }}
            className="mt-2 text-sm text-amber-700 dark:text-amber-300 underline">
            Copy
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500">
              <th className="p-3">Key</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Ngày tạo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const sessionRaw = getSessionKey(k.id)
              return (
                <tr key={k.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="p-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {revealedId === k.id && sessionRaw ? (
                      <div className="flex items-center gap-2">
                        <code className="break-all">{sessionRaw}</code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(sessionRaw) }}
                          className="text-xs text-blue-600 hover:underline shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      k.key_prefix
                    )}
                  </td>
                  <td className="p-3">
                    {k.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Hoạt động</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Đã thu hồi</span>
                    )}
                  </td>
                  <td className="p-3 text-zinc-500 text-xs">{new Date(k.created_at).toLocaleString('vi-VN')}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {sessionRaw && (
                        <button
                          onClick={() => setRevealedId(revealedId === k.id ? null : k.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {revealedId === k.id ? 'Ẩn' : 'Xem lại'}
                        </button>
                      )}
                      {k.is_active && (
                        <button onClick={() => revokeKey(k.id)}
                          className="text-xs text-red-600 hover:underline">
                          Thu hồi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {keys.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-zinc-400">Chưa có API key nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
        <p className="font-medium text-zinc-900 dark:text-white">Lưu ý về key:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Key chỉ hiển thị đầy đủ <strong>một lần</strong> sau khi tạo (bảo mật — không lưu bản rõ ở server).</li>
          <li>Trong phiên duyệt web hiện tại (tab chưa đóng), bạn có thể bấm <strong>"Xem lại"</strong> để lấy key vừa tạo.</li>
          <li>Nếu mất key, hãy thu hồi và tạo key mới — không thể khôi phục key cũ.</li>
        </ul>
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
        <p className="font-medium text-zinc-900 dark:text-white">Cách sử dụng:</p>
        <pre className="bg-white dark:bg-zinc-900 rounded-lg p-3 font-mono text-xs overflow-x-auto">
{`POST https://webhook-my-notify.vercel.app/api/wmn_endpoint
Header: X-API-Key: <your-api-key>
Body: {
  "application": "MBBank",
  "time": "2026-08-27T10:15:00Z",
  "money": 500000,
  "detail": "Chuyen tien..."
}`}
        </pre>
      </div>
    </div>
  )
}
