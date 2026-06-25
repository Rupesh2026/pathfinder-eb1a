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

  const endpoint = `${agentUrl.replace(/\/$/, '')}/run-daily-agent`
  const trigger = () =>
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cronKey,
      },
      body: JSON.stringify({ user_id: user.id }),
    })

  // The agent server runs on a free plan that spins down when idle. The first
  // request while it cold-starts comes back as a 502/503/504 from the platform
  // proxy (an HTML error page), so retry a couple of times to let the container
  // wake before giving up. ~30s isn't enough to fully wake it, but a quick retry
  // covers the common "just woke" case.
  const isColdStart = (s: number) => s === 502 || s === 503 || s === 504

  try {
    let res = await trigger()
    for (let attempt = 0; attempt < 2 && isColdStart(res.status); attempt++) {
      await new Promise((r) => setTimeout(r, 3000))
      res = await trigger()
    }

    if (!res.ok) {
      // Never surface the upstream HTML error page to the user — give a clean,
      // actionable message instead.
      const error = isColdStart(res.status)
        ? 'The agent server is waking up (it sleeps when idle on the free plan). Wait ~30s and try again.'
        : `Agent server error (${res.status}). Please try again shortly.`
      return NextResponse.json({ error }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ status: data.status ?? 'queued', started_at: new Date().toISOString() })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the agent server. It may be waking up — wait ~30s and try again.' },
      { status: 502 }
    )
  }
}
