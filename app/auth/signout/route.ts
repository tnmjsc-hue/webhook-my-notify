import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${getSiteUrl()}/login`)
}
