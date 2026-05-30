'use client'

import { useState, useCallback, useEffect } from 'react'

export type CriterionData = {
  criterion: string
  label: string
  score: number
  evidence_count: number
  evidence_items: {
    id: string
    title: string
    description: string | null
    url: string | null
    score: number | null
    strength_tier: string | null
  }[]
  next_actions: string[]
  _is_mock?: boolean
}

export type TaskAction = {
  rank: number
  title: string
  why: string
  criterion: string
  evidence_gain: number
  deadline: string
  time_required: string
  done: boolean
  carried_forward: boolean
}

export type TasksData = {
  plan_id: string | null
  plan_date: string
  actions: TaskAction[]
  _is_mock?: boolean
}

export type OpportunityItem = {
  id: string
  type: string
  title: string
  description: string | null
  url: string | null
  deadline: string | null
  criterion: string | null
  priority_score: number | null
  country: string | null
  is_us: boolean
  delivery_mode: 'online' | 'in_person' | 'hybrid'
  dismissed: boolean
  applied: boolean
  urgency: 'urgent' | 'soon' | 'open'
  created_at: string
  _is_mock?: boolean
}

export type OutcomeItem = {
  id: string
  opportunity_id: string
  opportunity_title: string
  opportunity_type: string
  criterion: string | null
  status: string
  notes: string | null
  decided_at: string | null
  created_at: string
  _is_mock?: boolean
}

export type SummaryData = {
  profile_strength: number
  criteria_strong_count: number
  total_criteria: number
  focused_criteria_count: number
  active_streak: number
  outcomes_total: number
  outcomes_accepted: number
  scan_status: string | null
  scan_started_at: string | null
  scan_finished_at: string | null
  _is_mock?: boolean
}

export type ProfileData = {
  domain: string
  role: string
  salary_band: string
  country_of_origin: string
  target_field: string
  strategy_weights: { filing_urgency: string; actions_per_day: number }
  focused_criteria: string[] | null
  education: { degree: string; field: string; institution: string; year: string }[]
  criterion_scores: Record<string, number>
  target_filing_date: string | null
}

type DashboardState = {
  summary: SummaryData | null
  profile: ProfileData | null
  criteria: CriterionData[]
  tasks: TasksData | null
  opportunities: OpportunityItem[]
  outcomes: OutcomeItem[]
  loading: boolean
  errors: string[]
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    summary: null,
    profile: null,
    criteria: [],
    tasks: null,
    opportunities: [],
    outcomes: [],
    loading: true,
    errors: [],
  })

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, errors: [] }))

    const [summary, profile, criteria, tasks, opportunities, outcomes] = await Promise.all([
      safeFetch<SummaryData>('/api/dashboard/summary'),
      safeFetch<ProfileData>('/api/dashboard/profile'),
      safeFetch<CriterionData[]>('/api/dashboard/criteria'),
      safeFetch<TasksData>('/api/dashboard/tasks/today'),
      safeFetch<OpportunityItem[]>('/api/dashboard/opportunities?show=applied'),
      safeFetch<OutcomeItem[]>('/api/dashboard/outcomes'),
    ])

    const errors: string[] = []
    if (!summary) errors.push('Failed to load summary')
    if (!criteria) errors.push('Failed to load criteria')
    if (!tasks) errors.push('Failed to load tasks')

    setState({
      summary,
      profile,
      criteria: criteria ?? [],
      tasks,
      opportunities: opportunities ?? [],
      outcomes: outcomes ?? [],
      loading: false,
      errors,
    })
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const updateTask = useCallback((rank: number, done: boolean) => {
    setState(prev => {
      if (!prev.tasks) return prev
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          actions: prev.tasks.actions.map(a => a.rank === rank ? { ...a, done } : a),
        },
      }
    })
  }, [])

  const dismissOpportunity = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      opportunities: prev.opportunities.filter(o => o.id !== id),
    }))
  }, [])

  const markOpportunityApplied = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      opportunities: prev.opportunities.map(o => o.id === id ? { ...o, applied: true } : o),
    }))
  }, [])

  const updateOutcomeStatus = useCallback((id: string, status: string) => {
    setState(prev => ({
      ...prev,
      outcomes: prev.outcomes.map(o => o.id === id ? { ...o, status } : o),
    }))
  }, [])

  const addOutcome = useCallback((outcome: OutcomeItem) => {
    setState(prev => ({
      ...prev,
      outcomes: [outcome, ...prev.outcomes],
    }))
  }, [])

  return {
    ...state,
    refresh: fetchAll,
    updateTask,
    dismissOpportunity,
    markOpportunityApplied,
    updateOutcomeStatus,
    addOutcome,
  }
}
