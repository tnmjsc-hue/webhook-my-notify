import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkNotificationQuota, checkForwardQuota } from '@/lib/usage'
import type { NotifyPayload } from '@/lib/types'

/**
 * Validate API key + insert notification vào bảng notifications.
 * Nhanh (~80ms), KHÔNG forward - để endpoint trả response ngay.
 * Trả về error nếu key invalid/inactive hoặc insert lỗi.
 */
export async function validateAndInsert(apiKeyHash: string, payload: NotifyPayload) {
  const supabase = createServiceRoleClient()

  const { data: apiKey, error: keyError } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active')
    .eq('key_hash', apiKeyHash)
    .single()

  if (keyError || !apiKey || !apiKey.is_active) {
    return { error: 'Invalid or inactive API key' as const }
  }

  const userId = apiKey.user_id

  // Kiểm tra quota gói trước khi insert
  const quotaError = await checkNotificationQuota(userId)
  if (quotaError) {
    return { error: quotaError.message, quota: true }
  }

  const { data: inserted, error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      application: payload.application,
      event_time: payload.time,
      money: payload.money,
      detail: payload.detail,
    })
    .select('id')
    .single()

  if (notifError || !inserted) {
    return { error: 'Failed to insert notification' as const }
  }

  return { userId, apiKeyId: apiKey.id, notificationId: inserted.id }
}

const RETRY_DELAYS_MS = [0, 2000, 5000]

/**
 * Forward webhook sau khi response đã gửi (gọi trong after()).
 * Không block endpoint - điện thoại không phải chờ forward.
 * Thử lại (retry) 3 lần với backoff (0s, 2s, 5s); nếu vẫn fail,
 * enqueue vào notify_queue để cron xử lý lại (retry bền vững).
 */
export async function forwardWebhook(
  userId: string,
  apiKeyId: string,
  notificationId: number,
  payload: NotifyPayload,
) {
  const supabase = createServiceRoleClient()

  const { data: config } = await supabase
    .from('webhook_configs')
    .select('target_url, is_enabled')
    .eq('user_id', userId)
    .single()

  if (!config?.is_enabled || !config.target_url) {
    return { userId, forwarded: false, skipped: true }
  }

  // Kiểm tra giới hạn forward/ngày của gói
  const forwardQuota = await checkForwardQuota(userId)
  if (forwardQuota) {
    await supabase
      .from('notifications')
      .update({
        forwarded: false,
        forward_error: forwardQuota.message,
      })
      .eq('id', notificationId)
    return { userId, forwarded: false, skipped: true, quotaExceeded: true }
  }

  let forwarded = false
  let forwardStatusCode: number | null = null
  let forwardBytes: number | null = null
  let forwardError: string | null = null

  for (const delayMs of RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
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
      if (forwarded) break
      forwardError = `HTTP ${resp.status}`
    } catch (err) {
      forwardError = err instanceof Error ? err.message : 'Forward failed'
      forwardStatusCode = 0
    }
  }

  await supabase
    .from('notifications')
    .update({
      forwarded,
      forward_status_code: forwardStatusCode,
      forward_bytes: forwardBytes,
      forward_error: forwarded ? null : forwardError,
    })
    .eq('id', notificationId)

  // Nếu vẫn fail sau retry nhanh → enqueue vào notify_queue để cron retry bền vững
  if (!forwarded) {
    const { error: queueError } = await supabase.from('notify_queue').insert({
      api_key_id: apiKeyId,
      raw_payload: payload,
      status: 'pending',
      retry_count: 0,
    })
    if (queueError) {
      // không đáng chặn; chỉ ghi lỗi
    }
  }

  return { userId, forwarded }
}

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
  const supabase = createServiceRoleClient()

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

    // resolve user_id from api_keys (notify_queue has no user_id column)
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', item.api_key_id)
      .single()
    const userId = apiKey?.user_id

    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: userId,
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
      .eq('user_id', userId)
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
        .eq('user_id', userId)
        .eq('detail', payload.detail)
        .eq('created_at', (await supabase
          .from('notifications')
          .select('created_at')
          .eq('user_id', userId)
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
