import { NextResponse } from 'next/server'
import { createQueueItem } from '@/lib/queue'
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

  const result = await createQueueItem(apiKeyHash, payload)

  if ('error' in result) {
    const status = result.error === 'Invalid or inactive API key' ? 401 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ status: 'accepted' }, { status: 202 })
}
