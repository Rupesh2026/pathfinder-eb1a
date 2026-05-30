import { CRITERION_LABELS, ALL_CRITERIA, type CriterionType } from './types'

export const MOCK_CRITERIA = ALL_CRITERIA.map((criterion, i) => {
  const scores: Record<CriterionType, number> = {
    awards: 35,
    memberships: 52,
    press: 18,
    judging: 0,
    original_contributions: 78,
    scholarly_articles: 65,
    artistic_exhibitions: 0,
    critical_role: 55,
    high_salary: 72,
    commercial_success: 28,
  }
  const score = scores[criterion]
  const evidenceCounts: Record<CriterionType, number> = {
    awards: 1,
    memberships: 2,
    press: 1,
    judging: 0,
    original_contributions: 3,
    scholarly_articles: 5,
    artistic_exhibitions: 0,
    critical_role: 2,
    high_salary: 1,
    commercial_success: 1,
  }
  return {
    criterion,
    label: CRITERION_LABELS[criterion],
    score,
    evidence_count: evidenceCounts[criterion],
    evidence_items: [] as {
      id: string
      title: string
      description: string | null
      url: string | null
      score: number | null
      strength_tier: string | null
    }[],
    next_actions: getDefaultNextActions(criterion, score),
    _is_mock: true,
  }
})

export const MOCK_SUMMARY = {
  profile_strength: 40,
  criteria_strong_count: 3,
  total_criteria: 10,
  focused_criteria_count: 10,
  active_streak: 4,
  outcomes_total: 7,
  outcomes_accepted: 2,
  scan_status: 'done' as string | null,
  scan_started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  scan_finished_at: new Date(Date.now() - 2.9 * 60 * 60 * 1000).toISOString(),
  _is_mock: true,
}

export const MOCK_TASKS = {
  plan_id: 'mock-plan-1',
  plan_date: new Date().toISOString().slice(0, 10),
  actions: [
    {
      rank: 1,
      title: 'Apply as NeurIPS 2025 Area Chair',
      why: 'Judging is at 0% — your biggest RFE risk. One NeurIPS area chair role moves this to 65%+.',
      criterion: 'judging',
      evidence_gain: 65,
      deadline: 'Jun 15',
      time_required: '45 minutes',
      done: false,
      carried_forward: false,
    },
    {
      rank: 2,
      title: 'Submit to Forbes 30 Under 30 AI & Data category',
      why: 'Awards criterion is at 35%. This is a nationally recognized award with strong EB-1A precedent.',
      criterion: 'awards',
      evidence_gain: 40,
      deadline: 'Jun 30',
      time_required: '2 hours',
      done: false,
      carried_forward: false,
    },
    {
      rank: 3,
      title: 'Pitch to TechCrunch for an AI safety story feature',
      why: 'Press criterion at 18% is a critical gap. Tier-1 tech media coverage directly satisfies Criterion 3.',
      criterion: 'press',
      evidence_gain: 55,
      deadline: 'This week',
      time_required: '1 hour',
      done: false,
      carried_forward: false,
    },
  ],
  _is_mock: true,
}

export const MOCK_OPPORTUNITIES = [
  {
    id: 'mock-opp-1',
    type: 'judging',
    title: 'NeurIPS 2025 Program Committee Reviewer',
    description: 'Review submissions for NeurIPS 2025. Strong EB-1A evidence for judging criterion.',
    url: null,
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    criterion: 'judging',
    priority_score: 92.5,
    country: 'United States',
    is_us: true,
    delivery_mode: 'in_person' as const,
    dismissed: false,
    applied: false,
    urgency: 'soon' as const,
    created_at: new Date().toISOString(),
    _is_mock: true,
  },
  {
    id: 'mock-opp-2',
    type: 'award',
    title: 'Forbes 30 Under 30: AI & Data 2026',
    description: 'Annual list of top innovators under 30 in AI and data science.',
    url: null,
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    criterion: 'awards',
    priority_score: 88.0,
    country: 'United States',
    is_us: true,
    delivery_mode: 'online' as const,
    dismissed: false,
    applied: false,
    urgency: 'open' as const,
    created_at: new Date().toISOString(),
    _is_mock: true,
  },
  {
    id: 'mock-opp-3',
    type: 'cfp',
    title: 'ICML 2025 Workshop on Efficient ML',
    description: 'Call for papers: 8-page submissions on efficiency and scalability.',
    url: null,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    criterion: 'scholarly_articles',
    priority_score: 84.0,
    country: 'Canada',
    is_us: false,
    delivery_mode: 'hybrid' as const,
    dismissed: false,
    applied: false,
    urgency: 'urgent' as const,
    created_at: new Date().toISOString(),
    _is_mock: true,
  },
  {
    id: 'mock-opp-4',
    type: 'speaking',
    title: 'AI Summit London: Call for Speakers',
    description: 'Speaking slot at 2000+ attendee AI conference. Podcast-style format.',
    url: null,
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    criterion: 'press',
    priority_score: 76.0,
    country: 'United Kingdom',
    is_us: false,
    delivery_mode: 'hybrid' as const,
    dismissed: false,
    applied: false,
    urgency: 'soon' as const,
    created_at: new Date().toISOString(),
    _is_mock: true,
  },
  {
    id: 'mock-opp-5',
    type: 'peer_review',
    title: 'Nature Machine Intelligence — Reviewer Pool',
    description: 'Join the reviewer pool for one of the top ML journals.',
    url: null,
    deadline: null,
    criterion: 'judging',
    priority_score: 71.0,
    country: 'Global',
    is_us: false,
    delivery_mode: 'online' as const,
    dismissed: false,
    applied: false,
    urgency: 'open' as const,
    created_at: new Date().toISOString(),
    _is_mock: true,
  },
]

export const MOCK_OUTCOMES = [
  {
    id: 'mock-out-1',
    opportunity_id: 'mock-opp-a',
    opportunity_title: 'ICLR 2024 Workshop Reviewer',
    opportunity_type: 'judging',
    criterion: 'judging',
    status: 'accepted',
    notes: null,
    decided_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    _is_mock: true,
  },
  {
    id: 'mock-out-2',
    opportunity_id: 'mock-opp-b',
    opportunity_title: 'ACM FAccT 2025 Paper Submission',
    opportunity_type: 'cfp',
    criterion: 'scholarly_articles',
    status: 'pending',
    notes: null,
    decided_at: null,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    _is_mock: true,
  },
  {
    id: 'mock-out-3',
    opportunity_id: 'mock-opp-c',
    opportunity_title: 'MIT Technology Review: AI Innovators 35 Under 35',
    opportunity_type: 'award',
    criterion: 'awards',
    status: 'rejected',
    notes: null,
    decided_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    _is_mock: true,
  },
]

export const MOCK_STREAK = {
  streak_days: 4,
  calendar: Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const active = [0, 1, 2, 3, 5, 6, 8, 10, 11, 13, 14, 15, 17, 18, 20, 22, 25, 26, 27, 28, 29].includes(i)
    return { date: d.toISOString().slice(0, 10), active }
  }),
  _is_mock: true,
}

function getDefaultNextActions(criterion: CriterionType, score: number): string[] {
  const actions: Record<CriterionType, string[]> = {
    awards: [
      'Apply to Forbes 30 Under 30 (AI & Data category)',
      'Nominate for IEEE Computer Society Technical Achievement Award',
      'Submit to ACM Distinguished Member program',
    ],
    memberships: [
      'Apply for IEEE Senior Membership',
      'Apply for ACM Senior Member grade',
      'Apply to invitation-only AI advisory council',
    ],
    press: [
      'Pitch to TechCrunch as a source on AI safety',
      'Apply as podcast guest to Lex Fridman / 80k Hours',
      'Write expert commentary for MIT Technology Review',
    ],
    judging: [
      'Apply as NeurIPS 2025 Area Chair (deadline Jun 15)',
      'Join Nature Machine Intelligence reviewer pool',
      'Apply as ICML 2025 program committee member',
    ],
    original_contributions: [
      'File provisional patent for your core method',
      'Publish technical deep-dive on your most-cited paper',
      'Open-source a key implementation with detailed documentation',
    ],
    scholarly_articles: [
      'Submit extended version of workshop paper to TPAMI',
      'Write survey paper positioning your work in the field',
      'Respond to review invitations from IEEE journals',
    ],
    artistic_exhibitions: [
      'This criterion is typically not relevant for AI/ML professionals',
      'Focus on original_contributions as an alternative pathway',
    ],
    critical_role: [
      'Document your team leadership scope in writing (org chart, reports)',
      'Get company letterhead confirmation of your title and responsibilities',
      'Collect evidence of decisions made and their organizational impact',
    ],
    high_salary: [
      'Obtain official pay stubs and W-2s for documentation',
      'Get a salary benchmarking report (Levels.fyi, Radford)',
      'Collect offer letters showing total compensation',
    ],
    commercial_success: [
      'Document revenue attribution from products you built',
      'Collect download/usage metrics for open-source work',
      'Get signed letter from employer attributing business impact to your work',
    ],
  }
  return score >= 65 ? actions[criterion].slice(0, 1) : actions[criterion]
}
