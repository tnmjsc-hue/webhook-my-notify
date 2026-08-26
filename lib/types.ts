export interface NotifyPayload {
  application: string
  time: string
  money: number
  detail: string
}

export interface ApiKeyRow {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string
  is_active: boolean
}

export interface NotifyQueueRow {
  id: number
  api_key_id: string | null
  user_id: string | null
  raw_payload: NotifyPayload
  status: 'pending' | 'processing' | 'done' | 'failed'
  retry_count: number
  received_at: string
  processed_at: string | null
}

export interface NotificationRow {
  id: number
  user_id: string | null
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

export interface WebhookConfigRow {
  user_id: string
  target_url: string | null
  is_enabled: boolean
}
