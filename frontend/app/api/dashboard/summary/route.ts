import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALL_CRITERIA } from '@/lib/types'
import { MOCK_SUMMARY } from '@/lib/mock-data'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [evidenceRes, profileRes, outcomesRes, plansRes] = await Promise.all([
    supabase.from('evidence').select('criterion, score').eq('user_id', user.id),
    supabase.from('profiles')
      .select('scan_status, scan_started_at, scan_finished_at, focused_criteria')
      .eq('user_id', user.id)
      .single(),
    supabase.from('outcomes').select('status').eq('user_id', user.id),
    supabase.from('daily_plans')
      .select('plan_date, actions')
      .eq('user_id', user.id)
      .order('plan_date', { ascending: false })
      .limit(30),
  ])

  const evidence = evidenceRes.data ?? []
  const profile = profileRes.data

  if (evidence.length === 0 && !plansRes.data?.length) {
    return NextResponse.json(MOCK_SUMMARY)
  }

  // Per-criterion average scores
  const grouped: Record<string, number[]> = {}
  for (const e of evidence) {
    if (e.score != null) {
      if (!grouped[e.criterion]) grouped[e.criterion] = []
      grouped[e.criterion].push(e.score)
    }
  }

  const focusedCriteria: string[] = profile?.focused_criteria ?? []
  const criteriaToCheck = focusedCriteria.length > 0 ? focusedCriteria : ALL_CRITERIA

  let totalScore = 0
  let strongCount = 0
  for (const c of criteriaToCheck) {
    const scores = grouped[c] ?? []
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    totalScore += avg
    if (avg >= 65) strongCount++
  }
  const profileStrength = Math.round(totalScore / criteriaToCheck.length)

  // Streak: consecutive days with ≥1 done task from today backward
  const plans = plansRes.data ?? []
  const today = new Date().toISOString().slice(0, 10)
  const activeDays = new Set<string>()
  for (const plan of plans) {
    const hasAnyDone = (plan.actions as { done: boolean }[]).some(a => a.done)
    if (hasAnyDone) activeDays.add(plan.plan_date)
  }

  let streak = 0
  const checkDate = new Date()
  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10)
    if (activeDays.has(dateStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (dateStr === today) {
      // Allow today to not count against streak yet
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  const outcomes = outcomesRes.data ?? []
  const outcomesTotal = outcomes.length
  const outcomesAccepted = outcomes.filter(o => o.status === 'accepted').length

  return NextResponse.json({
    profile_strength: profileStrength,
    criteria_strong_count: strongCount,
    total_criteria: ALL_CRITERIA.length,
    focused_criteria_count: criteriaToCheck.length,
    active_streak: streak,
    outcomes_total: outcomesTotal,
    outcomes_accepted: outcomesAccepted,
    scan_status: profile?.scan_status ?? null,
    scan_started_at: profile?.scan_started_at ?? null,
    scan_finished_at: profile?.scan_finished_at ?? null,
  })
}
