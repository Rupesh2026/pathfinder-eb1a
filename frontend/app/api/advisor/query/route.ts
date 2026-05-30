import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data?.[0]?.embedding ?? null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, criterion } = await request.json() as {
    message: string
    criterion?: string | null
  }

  if (!message) return NextResponse.json({ chunks: [], context: '' })

  const embedding = await embedText(message)
  if (!embedding) {
    // No OPENAI_API_KEY — graceful degradation
    return NextResponse.json({ chunks: [], context: '' })
  }

  const db = getServiceClient()
  const { data, error } = await db.rpc('match_chunks', {
    query_embedding: embedding,
    match_criterion: criterion ?? null,
    match_count: 5,
  })

  if (error || !data?.length) return NextResponse.json({ chunks: [], context: '' })

  const context = data
    .map((chunk: { content: string; source: string; title: string }) =>
      `[${chunk.source.toUpperCase()} — ${chunk.title ?? 'Decision'}]\n${chunk.content}`
    )
    .join('\n\n---\n\n')

  return NextResponse.json({ chunks: data, context })
}
