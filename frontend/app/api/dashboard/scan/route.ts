import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentUrl = process.env.AGENT_SERVER_URL
  const cronKey = process.env.CRON_API_KEY

  if (!agentUrl || !cronKey) {
    return NextResponse.json(
      { error: 'Agent server not configured. Set AGENT_SERVER_URL and CRON_API_KEY.' },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(`${agentUrl.replace(/\/$/, '')}/run-daily-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cronKey,
      },
      body: JSON.stringify({ user_id: user.id }),
    })

    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: `Agent server error: ${detail}` }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ status: data.status ?? 'queued', started_at: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: 'Could not reach agent server' }, { status: 502 })
  }
}
