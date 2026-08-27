import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'
import type { NotifyPayload } from '@/lib/types'

export async function createQueueItem(apiKeyHash: string, payload: NotifyPayload) {
  const supabase = createServiceRoleClient()

  const { data: apiKey, error: keyError } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active')
    .eq('key_hash', apiKeyHash)
    .single()

  if (keyError || !apiKey || !apiKey.is_active) {
    return { error: 'Invalid or inactive API key' as const }
  }

  const { error: insertError } = await supabase.from('notify_queue').insert({
    api_key_id: apiKey.id,
    user_id: apiKey.user_id,
    raw_payload: payload,
    status: 'pending',
  })

  if (insertError) {
    return { error: 'Failed to enqueue' as const }
  }

  return { userId: apiKey.user_id }
}

const MAX_RETRIES = 3

export async function processPendingItems() {
  const supabase = await createClient()

  const { data: items, error } = await supabase
    .from('notify_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('retry_count', MAX_RETRIES)
    .order('received_at', { ascending: true })
    .limit(50)

  if (error || !items || items.length === 0) {
    return { processed: 0 }
  }

  for (const item of items) {
    await supabase
      .from('notify_queue')
      .update({ status: 'processing' })
      .eq('id', item.id)

    const payload = item.raw_payload as NotifyPayload

    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: item.user_id,
      application: payload.application,
      event_time: payload.time,
      money: payload.money,
      detail: payload.detail,
    })

    if (notifError) {
      await supabase
        .from('notify_queue')
        .update({
          status: 'failed',
          retry_count: item.retry_count + 1,
        })
        .eq('id', item.id)
      continue
    }

    const { data: config } = await supabase
      .from('webhook_configs')
      .select('target_url, is_enabled')
      .eq('user_id', item.user_id)
      .single()

    let forwarded = false
    let forwardStatusCode: number | null = null
    let forwardBytes: number | null = null
    let forwardError: string | null = null

    if (config?.is_enabled && config.target_url) {
      try {
        const resp = await fetch(config.target_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        })
        forwarded = resp.ok
        forwardStatusCode = resp.status
        const body = await resp.text()
        forwardBytes = new TextEncoder().encode(body).length
      } catch (err) {
        forwardError = err instanceof Error ? err.message : 'Forward failed'
        forwardStatusCode = 0
      }

      await supabase
        .from('notifications')
        .update({
          forwarded,
          forward_status_code: forwardStatusCode,
          forward_bytes: forwardBytes,
          forward_error: forwardError,
        })
        .eq('user_id', item.user_id)
        .eq('detail', payload.detail)
        .eq('created_at', (await supabase
          .from('notifications')
          .select('created_at')
          .eq('user_id', item.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        ).data?.created_at ?? '')
    }

    await supabase
      .from('notify_queue')
      .update({
        status: 'done',
        processed_at: new Date().toISOString(),
      })
      .eq('id', item.id)
  }

  return { processed: items.length }
}
