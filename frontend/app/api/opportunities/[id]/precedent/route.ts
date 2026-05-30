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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: opportunityId } = await params

  // Look up the opportunity to get its title and criterion
  const { data: opp } = await supabase
    .from('opportunities')
    .select('title, criterion')
    .eq('id', opportunityId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!opp) return NextResponse.json([])

  const query = opp.title ?? ''
  const embedding = await embedText(query)
  if (!embedding) return NextResponse.json([])

  const db = getServiceClient()
  const { data, error } = await db.rpc('match_chunks', {
    query_embedding: embedding,
    match_criterion: opp.criterion ?? null,
    match_count: 3,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
