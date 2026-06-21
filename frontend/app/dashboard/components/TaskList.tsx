'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TasksData, TaskAction, OpportunityItem } from '../hooks/useDashboard'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'
import { RotateCcw, Clock, Calendar, ExternalLink, ArrowRight } from 'lucide-react'

const CRITERION_COLORS: Record<string, string> = {
  judging: 'var(--c-judging)',
  awards: 'var(--c-awards)',
  press: 'var(--c-press)',
  memberships: 'var(--c-memberships)',
  original_contributions: 'var(--c-contributions)',
  scholarly_articles: 'var(--c-scholarly)',
  critical_role: 'var(--c-critical_role)',
  high_salary: 'var(--c-high_salary)',
  commercial_success: 'var(--c-commercial)',
  artistic_exhibitions: 'var(--c-exhibitions)',
}

type Props = {
  tasks: TasksData | null
  opportunities?: OpportunityItem[]
  loading: boolean
  onToggle: (rank: number, done: boolean) => void
  onError: (msg: string) => void
}

/** Build the task's action links. "View details" always opens the in-app
 *  opportunities list filtered to this criterion (full details + Apply buttons).
 *  When the task maps to a specific open opportunity with a URL, also expose a
 *  direct external "Apply" link. */
function linksFor(action: TaskAction, opportunities: OpportunityItem[]): { detailsHref: string; applyUrl: string | null } {
  const open = opportunities.filter(o => !o.applied && o.criterion === action.criterion)
  const tl = action.title.toLowerCase()
  const direct = open.find(o => !!o.url && (tl.includes(o.title.toLowerCase()) || o.title.toLowerCase().includes(tl)))
  return {
    detailsHref: `/dashboard/opportunities?criterion=${action.criterion}`,
    applyUrl: direct?.url ?? null,
  }
}

function TaskItem({ action, pending, onToggle, opportunities }: {
  action: TaskAction
  pending: boolean
  onToggle: () => void
  opportunities: OpportunityItem[]
}) {
  const criterionColor = CRITERION_COLORS[action.criterion] ?? 'var(--accent)'
  const label = CRITERION_LABELS[action.criterion as CriterionType] ?? action.criterion
  const links = linksFor(action, opportunities)

  return (
    <div
      className="group relative flex gap-3 rounded-xl p-4 transition-all"
      style={{
        background: action.done ? 'var(--bg-raised)' : 'transparent',
        opacity: action.done ? 0.6 : 1,
        borderLeft: action.done ? 'none' : `2px solid ${criterionColor}`,
        paddingLeft: action.done ? '16px' : '14px',
      }}
    >
      {/* Rank number */}
      <div
        className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold flex-shrink-0 mt-0.5"
        style={{
          background: action.done ? 'var(--bg-overlay)' : `${criterionColor}20`,
          color: action.done ? 'var(--text-muted)' : criterionColor,
        }}
      >
        {action.rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug"
              style={{
                color: action.done ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: action.done ? 'line-through' : 'none',
              }}
            >
              {action.carried_forward && (
                <span
                  className="mr-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5"
                  style={{ background: 'var(--amber-subtle)', color: 'var(--amber)' }}
                  title="Carried forward from yesterday"
                >
                  <RotateCcw size={9} />
                  Yesterday
                </span>
              )}
              {action.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {action.why}
            </p>
          </div>
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={action.done}
            disabled={pending}
            onChange={onToggle}
            className="mt-0.5 flex-shrink-0"
          />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className="badge"
            style={{
              background: `${criterionColor}15`,
              color: criterionColor,
              border: `1px solid ${criterionColor}30`,
            }}
          >
            {label}
          </span>
          {action.time_required && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <Clock size={10} />
              {action.time_required}
            </span>
          )}
          {action.deadline && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={10} />
              {action.deadline}
            </span>
          )}
          {action.evidence_gain > 0 && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--green)' }}>
              +{action.evidence_gain} pts
            </span>
          )}
          {!action.done && (
            <span className="ml-auto flex items-center gap-3">
              <Link
                href={links.detailsHref}
                className="flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                View details <ArrowRight size={10} />
              </Link>
              {links.applyUrl && (
                <a
                  href={links.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  Apply <ExternalLink size={10} />
                </a>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TaskList({ tasks, opportunities = [], loading, onToggle, onError }: Props) {
  const [pending, setPending] = useState<Set<number>>(new Set())

  async function handleToggle(action: TaskAction) {
    const newDone = !action.done
    onToggle(action.rank, newDone)
    setPending(prev => { const s = new Set(prev); s.add(action.rank); return s })

    try {
      const res = await fetch(`/api/dashboard/tasks/${action.rank}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: newDone }),
      })
      if (!res.ok) {
        const err = await res.json()
        onError(err.error ?? 'Failed to update task')
        onToggle(action.rank, !newDone)
      }
    } catch {
      onError('Failed to update task')
      onToggle(action.rank, !newDone)
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(action.rank); return n })
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const completedCount = tasks?.actions.filter(a => a.done).length ?? 0
  const totalCount = tasks?.actions.length ?? 0
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Today's Actions</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{today}</p>
        </div>
        {!loading && tasks && totalCount > 0 && (
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: completedCount === totalCount ? 'var(--green)' : 'var(--text-muted)' }}
            >
              {completedCount}/{totalCount}
            </span>
            <div className="w-16">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressPct}%`,
                    background: completedCount === totalCount ? 'var(--green)' : 'var(--accent)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      ) : !tasks || tasks.actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'var(--bg-raised)' }}
          >
            <span className="text-lg">🎯</span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No tasks today yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Run a scan to generate your daily plan</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.actions.map((action) => (
            <TaskItem
              key={action.rank}
              action={action}
              opportunities={opportunities}
              pending={pending.has(action.rank)}
              onToggle={() => handleToggle(action)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
