import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MOCK_OPPORTUNITIES } from '@/lib/mock-data'
import {
  VISIBILITY_OR_FILTER,
  isVisible,
  futureDeadlineOrFilter,
  isNotExpired,
} from '@/lib/opportunity-visibility'

function computeUrgency(deadline: string | null): 'urgent' | 'soon' | 'open' {
  if (!deadline) return 'open'
  // Expired opportunities are filtered out at the query level, so a past
  // deadline shouldn't reach here; treat any as non-urgent if it does.
  const daysUntil = Math.floor((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (daysUntil < 0) return 'open'
  if (daysUntil <= 7) return 'urgent'
  if (daysUntil <= 30) return 'soon'
  return 'open'
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('type')
  const showApplied = searchParams.get('show') === 'applied'

  const { data: profile } = await supabase
    .from('profiles')
    .select('focused_criteria')
    .eq('user_id', user.id)
    .single()

  const focusedCriteria: string[] = profile?.focused_criteria ?? []

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('user_id', user.id)
    .eq('dismissed', false)
    // Worldwide visibility: US shown online+offline, non-US online/hybrid only.
    .or(VISIBILITY_OR_FILTER)
    // Date relevance: hide opportunities whose deadline has already passed
    // (keep undated/rolling ones). Mirrors the agent read/write guards.
    .or(futureDeadlineOrFilter())
    .order('priority_score', { ascending: false })

  if (!showApplied) query = query.eq('applied', false)
  if (typeFilter) query = query.eq('type', typeFilter)
  if (focusedCriteria.length > 0) query = query.in('criterion', focusedCriteria)

  const { data: opportunities } = await query

  if (!opportunities || opportunities.length === 0) {
    const filtered = (typeFilter
      ? MOCK_OPPORTUNITIES.filter(o => o.type === typeFilter)
      : MOCK_OPPORTUNITIES
    ).filter(o => isVisible(o) && isNotExpired(o))
    return NextResponse.json({ opportunities: filtered, is_example: true })
  }

  return NextResponse.json({
    opportunities: opportunities.map(o => ({
      ...o,
      urgency: computeUrgency(o.deadline),
    })),
    is_example: false,
  })
}
