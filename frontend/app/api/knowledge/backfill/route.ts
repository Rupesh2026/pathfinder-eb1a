import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const renderUrl = process.env.RENDER_SERVICE_URL
  const cronKey = process.env.CRON_API_KEY

  if (!renderUrl || !cronKey) {
    return NextResponse.json(
      { error: 'RENDER_SERVICE_URL and CRON_API_KEY must be set' },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(`${renderUrl}/run-knowledge-base?backfill=true`, {
      method: 'POST',
      headers: { 'x-api-key': cronKey },
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Agent server returned ${res.status}: ${text}` }, { status: 502 })
    }
    return NextResponse.json({ status: 'queued', backfill: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
