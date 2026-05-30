'use client'

import { useState, useTransition } from 'react'
import { markActionDone } from '@/app/actions/plans'
import type { DailyPlanAction } from '@/lib/types'
import { RotateCcw, Clock, Calendar } from 'lucide-react'

type Props = { action: DailyPlanAction; planId: string }

const CRITERION_COLORS: Record<string, string> = {
  judging: 'var(--c-judging)',
  awards: 'var(--c-awards)',
  press: 'var(--c-press)',
  memberships: 'var(--c-memberships)',
  original_contributions: 'var(--c-contributions)',
  scholarly_articles: 'var(--c-scholarly)',
  critical_role: 'var(--c-critical_role)',
  high_salary: 'var(--c-high_salary)',
}

export default function DailyPlanCard({ action, planId }: Props) {
  const [done, setDone] = useState(action.done)
  const [isPending, startTransition] = useTransition()
  const accentColor = CRITERION_COLORS[action.criterion] ?? 'var(--accent)'

  function handleCheck(checked: boolean) {
    setDone(checked)
    startTransition(async () => { await markActionDone(planId, action.rank, checked) })
  }

  return (
    <div
      className="card-interactive p-5 transition-opacity"
      style={{
        opacity: done ? 0.55 : 1,
        borderLeft: done ? 'none' : `2px solid ${accentColor}`,
        paddingLeft: done ? '20px' : '18px',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{ background: done ? 'var(--bg-overlay)' : `${accentColor}20`, color: done ? 'var(--text-muted)' : accentColor }}
        >
          {action.rank}
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {action.carried_forward && (
                <span className="badge badge-amber mb-1.5 inline-flex">
                  <RotateCcw size={9} /> Carried forward
                </span>
              )}
              <h3
                className="text-sm font-semibold leading-snug"
                style={{
                  color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: done ? 'line-through' : 'none',
                }}
              >
                {action.title}
              </h3>
            </div>
            <input
              type="checkbox"
              checked={done}
              disabled={isPending}
              onChange={e => handleCheck(e.target.checked)}
              className="mt-0.5 flex-shrink-0"
            />
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{action.why}</p>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="badge"
              style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {action.criterion}
            </span>
            {action.deadline && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={10} /> {action.deadline}
              </span>
            )}
            {action.time_required && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <Clock size={10} /> {action.time_required}
              </span>
            )}
            {action.evidence_gain > 0 && (
              <span className="text-[11px] font-medium" style={{ color: 'var(--green)' }}>
                +{action.evidence_gain} pts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
