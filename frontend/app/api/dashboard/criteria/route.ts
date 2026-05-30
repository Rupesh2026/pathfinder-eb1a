import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALL_CRITERIA, CRITERION_LABELS, type CriterionType } from '@/lib/types'
import { MOCK_CRITERIA } from '@/lib/mock-data'

const NEXT_ACTIONS: Record<CriterionType, string[]> = {
  awards: ['Apply to Forbes 30 Under 30 (AI & Data)', 'Nominate for IEEE Computer Society Award', 'Submit to ACM Distinguished Member'],
  memberships: ['Apply for IEEE Senior Membership', 'Apply for ACM Senior Member', 'Apply to invitation-only AI advisory council'],
  press: ['Pitch TechCrunch as AI safety source', 'Apply as podcast guest (Lex Fridman, 80k Hours)', 'Write commentary for MIT Technology Review'],
  judging: ['Apply as NeurIPS 2025 Area Chair', 'Join Nature Machine Intelligence reviewer pool', 'Apply as ICML 2025 program committee member'],
  original_contributions: ['File provisional patent for core method', 'Open-source key implementation with documentation', 'Publish technical deep-dive on most-cited paper'],
  scholarly_articles: ['Submit extended version to TPAMI or JMLR', 'Write survey paper positioning your work', 'Respond to IEEE journal review invitations'],
  artistic_exhibitions: ['This criterion is not typically relevant for AI/ML professionals', 'Focus on original_contributions as alternative pathway'],
  critical_role: ['Document leadership scope with org chart', 'Get company letterhead confirming title and responsibilities', 'Collect evidence of decisions and organizational impact'],
  high_salary: ['Obtain official pay stubs and W-2s', 'Get Levels.fyi or Radford benchmarking report', 'Collect offer letters showing total compensation'],
  commercial_success: ['Document revenue from products you built', 'Collect download/usage metrics for open-source work', 'Get signed letter attributing business impact to your work'],
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [evidenceRes, profileRes] = await Promise.all([
    supabase
      .from('evidence')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('focused_criteria')
      .eq('user_id', user.id)
      .single(),
  ])

  const evidence = evidenceRes.data
  const focusedCriteria: string[] = profileRes.data?.focused_criteria ?? []

  if (!evidence || evidence.length === 0) {
    return NextResponse.json(MOCK_CRITERIA)
  }

  const grouped: Record<string, typeof evidence> = {}
  for (const item of evidence) {
    if (!grouped[item.criterion]) grouped[item.criterion] = []
    grouped[item.criterion].push(item)
  }

  const result = ALL_CRITERIA.map((criterion) => {
    const items = grouped[criterion] ?? []
    const scored = items.filter(i => i.score != null)
    const avgScore = scored.length > 0
      ? Math.round(scored.reduce((a, b) => a + (b.score ?? 0), 0) / scored.length)
      : 0

    return {
      criterion,
      label: CRITERION_LABELS[criterion],
      score: avgScore,
      evidence_count: items.length,
      evidence_items: items.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        url: i.url,
        score: i.score,
        strength_tier: i.strength_tier,
      })),
      next_actions: NEXT_ACTIONS[criterion],
    }
  })

  const filtered = focusedCriteria.length > 0
    ? result.filter(c => focusedCriteria.includes(c.criterion))
    : result

  return NextResponse.json(filtered)
}
