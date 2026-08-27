import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkApiKeyQuota } from '@/lib/usage'
import { randomUUID, createHash } from 'crypto'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const quotaError = await checkApiKeyQuota(user.id)
  if (quotaError) {
    return NextResponse.json({ error: quotaError.message, code: quotaError.code }, { status: 429 })
  }

  const rawKey = `wmn_live_${randomUUID().replace(/-/g, '').slice(0, 24)}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12) + '...'

  const serviceRole = createServiceRoleClient()
  const { data: inserted, error } = await serviceRole
    .from('api_keys')
    .insert({ user_id: user.id, key_hash: keyHash, key_prefix: keyPrefix })
    .select('id')
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.id, raw_key: rawKey })
}
