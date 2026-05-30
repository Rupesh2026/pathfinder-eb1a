import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALL_CRITERIA } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profileRes, evidenceRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('domain, role, salary_band, country_of_origin, target_field, strategy_weights, focused_criteria, education, target_filing_date')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('evidence')
      .select('criterion, score')
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const evidence = evidenceRes.data ?? []

  // Compute per-criterion scores across all 10 criteria (unfiltered, for profile page display)
  const grouped: Record<string, number[]> = {}
  for (const e of evidence) {
    if (e.score != null) {
      if (!grouped[e.criterion]) grouped[e.criterion] = []
      grouped[e.criterion].push(e.score)
    }
  }
  const criterion_scores: Record<string, number> = {}
  for (const c of ALL_CRITERIA) {
    const scores = grouped[c] ?? []
    criterion_scores[c] = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
  }

  return NextResponse.json({ ...profile, criterion_scores })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    domain, role, salary_band, country_of_origin, target_field,
    filing_urgency, focused_criteria, education, target_filing_date,
  } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (domain !== undefined) updates.domain = domain
  if (role !== undefined) updates.role = role
  if (salary_band !== undefined) updates.salary_band = salary_band
  if (country_of_origin !== undefined) updates.country_of_origin = country_of_origin
  if (target_field !== undefined) updates.target_field = target_field
  if (education !== undefined) updates.education = education
  if (target_filing_date !== undefined) updates.target_filing_date = target_filing_date
  if (focused_criteria !== undefined) {
    updates.focused_criteria = Array.isArray(focused_criteria) && focused_criteria.length > 0
      ? focused_criteria
      : null
  }

  if (filing_urgency !== undefined) {
    const { data: current } = await supabase
      .from('profiles')
      .select('strategy_weights')
      .eq('user_id', user.id)
      .single()
    updates.strategy_weights = { ...(current?.strategy_weights ?? {}), filing_urgency }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
