import { NextResponse } from 'next/server'
import { processPendingItems } from '@/lib/queue'
import { cleanupExpiredLogs } from '@/lib/usage'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processPendingItems()
  const deletedLogs = await cleanupExpiredLogs()

  return NextResponse.json({ processed: result.processed, deletedLogs })
}
