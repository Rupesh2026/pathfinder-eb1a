import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALL_CRITERIA } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profileRes, evidenceRes, lettersRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('focused_criteria, target_filing_date')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('evidence')
      .select('criterion, score')
      .eq('user_id', user.id),
    supabase
      .from('recommendation_letters')
      .select('status')
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const evidence = evidenceRes.data ?? []
  const letters = lettersRes.data ?? []

  const focusedCriteria: string[] = profile?.focused_criteria ?? []
  const criteriaToCheck = focusedCriteria.length > 0 ? focusedCriteria : ALL_CRITERIA

  // Criteria score: how many are Strong (≥65)
  const grouped: Record<string, number[]> = {}
  for (const e of evidence) {
    if (e.score != null) {
      if (!grouped[e.criterion]) grouped[e.criterion] = []
      grouped[e.criterion].push(e.score)
    }
  }

  let strongCount = 0
  const criteriaWithEvidence = new Set<string>()
  for (const c of criteriaToCheck) {
    const scores = grouped[c] ?? []
    if (scores.length > 0) criteriaWithEvidence.add(c)
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    if (avg >= 65) strongCount++
  }

  // Component scores
  const criteriaScore = Math.min(strongCount / 3, 1) * 100
  const evidenceScore = criteriaToCheck.length > 0
    ? (criteriaWithEvidence.size / criteriaToCheck.length) * 100
    : 0

  // Letters score: out of 3 received letters needed
  const receivedLetters = letters.filter(l => l.status === 'received').length
  const totalLetters = letters.length
  const lettersScore = Math.min(receivedLetters / 3, 1) * 100
  const hasLettersData = totalLetters > 0

  // Weighted overall — adjust weights based on whether letters are tracked
  let overallScore: number
  if (hasLettersData) {
    overallScore = criteriaScore * 0.45 + evidenceScore * 0.20 + lettersScore * 0.35
  } else {
    overallScore = criteriaScore * 0.60 + evidenceScore * 0.40
  }
  overallScore = Math.round(overallScore)

  // Blockers
  const blockers: string[] = []
  if (strongCount < 3) {
    blockers.push(`${strongCount} of 3 required criteria are Strong (≥65)`)
  }
  const uncoveredCount = criteriaToCheck.length - criteriaWithEvidence.size
  if (uncoveredCount > 0) {
    blockers.push(`${uncoveredCount} focused ${uncoveredCount === 1 ? 'criterion has' : 'criteria have'} no evidence`)
  }
  if (hasLettersData && receivedLetters < 3) {
    blockers.push(`${receivedLetters} of 3 recommendation letters received`)
  } else if (!hasLettersData) {
    blockers.push('Recommendation letters not yet tracked')
  }

  // Filing date countdown
  const targetDate = profile?.target_filing_date ?? null
  let daysUntilFiling: number | null = null
  if (targetDate) {
    const diff = new Date(targetDate).getTime() - Date.now()
    daysUntilFiling = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return NextResponse.json({
    readiness_score: overallScore,
    criteria_score: Math.round(criteriaScore),
    evidence_score: Math.round(evidenceScore),
    letters_score: Math.round(lettersScore),
    strong_count: strongCount,
    evidence_covered: criteriaWithEvidence.size,
    evidence_total: criteriaToCheck.length,
    received_letters: receivedLetters,
    total_letters: totalLetters,
    target_filing_date: targetDate,
    days_until_filing: daysUntilFiling,
    blockers,
  })
}
