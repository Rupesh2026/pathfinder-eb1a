import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentUrl = process.env.AGENT_SERVER_URL
  const cronKey = process.env.CRON_API_KEY

  // If agent server is configured, get authoritative status from it
  if (agentUrl && cronKey) {
    try {
      const res = await fetch(
        `${agentUrl.replace(/\/$/, '')}/scan-status/${user.id}`,
        { headers: { 'X-Api-Key': cronKey }, cache: 'no-store' }
      )
      if (res.ok) {
        return NextResponse.json(await res.json())
      }
    } catch {
      // fall through to DB fallback
    }
  }

  // Fallback: read from profiles table directly
  const { data: profile } = await supabase
    .from('profiles')
    .select('scan_status, scan_started_at, scan_finished_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    status: profile?.scan_status ?? 'idle',
    started_at: profile?.scan_started_at ?? null,
    finished_at: profile?.scan_finished_at ?? null,
  })
}
