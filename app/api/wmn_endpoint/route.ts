import { NextResponse, after } from 'next/server'
import { validateAndInsert, forwardWebhook } from '@/lib/queue'
import type { NotifyPayload } from '@/lib/types'

export async function POST(request: Request) {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 })
  }

  const { createHash } = await import('crypto')
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex')

  let payload: NotifyPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!payload.application || !payload.time || payload.money === undefined) {
    return NextResponse.json({ error: 'Missing required fields: application, time, money' }, { status: 400 })
  }

  // Validate key + insert notification ngay (nhanh, ~80ms). Không forward.
  const result = await validateAndInsert(apiKeyHash, payload)

  if ('error' in result) {
    if ('quota' in result && result.quota) {
      return NextResponse.json({ error: result.error, code: 'quota_exceeded' }, { status: 429 })
    }
    const status = result.error === 'Invalid or inactive API key' ? 401 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  // Forward webhook sau khi response đã gửi - KHÔNG block endpoint,
  // điện thoại không phải chờ webhook. Vercel dùng waitUntil giữ invocation.
  after(async () => {
    await forwardWebhook(result.userId, result.apiKeyId, result.notificationId, payload)
  })

  return NextResponse.json({ status: 'accepted' }, { status: 202 })
}
