import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_CRITERIA = new Set([
  'awards', 'memberships', 'press', 'judging', 'original_contributions',
  'scholarly_articles', 'artistic_exhibitions', 'critical_role',
  'high_salary', 'commercial_success',
])

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: criterion } = await params
  if (!VALID_CRITERIA.has(criterion)) {
    return NextResponse.json({ error: 'Unknown criterion' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db
    .from('pattern_aggregates')
    .select('criterion, total_docs, approval_rate, top_patterns, rfe_triggers, updated_at')
    .eq('criterion', criterion)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json(null)
  return NextResponse.json(data)
}
