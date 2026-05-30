'use client'

import { useState } from 'react'
import type { TasksData, TaskAction } from '../hooks/useDashboard'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'

function getCriterionColor(criterion: string): string {
  // Map to the spec color by score proxy — tasks use criterion key directly
  const colors: Record<string, string> = {
    judging: 'var(--criterion-red)',
    awards: 'var(--criterion-amber)',
    press: 'var(--criterion-red)',
    memberships: 'var(--criterion-blue)',
    original_contributions: 'var(--criterion-green)',
    scholarly_articles: 'var(--criterion-green)',
    critical_role: 'var(--criterion-blue)',
    high_salary: 'var(--criterion-green)',
    commercial_success: 'var(--criterion-amber)',
    artistic_exhibitions: 'var(--criterion-tertiary)',
  }
  return colors[criterion] ?? 'var(--criterion-blue)'
}

function CriterionTag({ criterion }: { criterion: string }) {
  const label = CRITERION_LABELS[criterion as CriterionType] ?? criterion
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: 'var(--secondary-bg)', color: 'var(--text-secondary)' }}
    >
      {label}
    </span>
  )
}

type Props = {
  tasks: TasksData | null
  loading: boolean
  onToggle: (rank: number, done: boolean) => void
  onError: (msg: string) => void
}

export default function TaskList({ tasks, loading, onToggle, onError }: Props) {
  const [pending, setPending] = useState<Set<number>>(new Set())

  async function handleToggle(action: TaskAction) {
    const newDone = !action.done
    // Optimistic update
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
      }
    } catch {
      onError('Failed to update task')
    } finally {
      setPending(prev => {
        const next = new Set(prev)
        next.delete(action.rank)
        return next
      })
    }
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const completedCount = tasks?.actions.filter(a => a.done).length ?? 0
  const totalCount = tasks?.actions.length ?? 0

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Today's Tasks</h2>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{today}</p>
        </div>
        {!loading && tasks && (
          <span className="text-xs font-semibold" style={{ color: completedCount === totalCount ? 'var(--criterion-green)' : 'var(--text-tertiary)' }}>
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: 'var(--card-border-color)' }} />
              <div className="h-3 w-1/2 animate-pulse rounded" style={{ background: 'var(--card-border-color)' }} />
            </div>
          ))}
        </div>
      ) : !tasks || tasks.actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No tasks today yet.</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>Run a scan to generate your daily plan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.actions.map((action) => (
            <label
              key={action.rank}
              className="flex cursor-pointer gap-3 rounded-lg p-3 transition-colors"
              style={{
                background: action.done ? 'var(--secondary-bg)' : 'transparent',
                opacity: action.done ? 0.7 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={action.done}
                disabled={pending.has(action.rank)}
                onChange={() => handleToggle(action)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded"
                style={{ accentColor: getCriterionColor(action.criterion) }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium leading-snug"
                  style={{
                    color: 'var(--text-primary)',
                    textDecoration: action.done ? 'line-through' : 'none',
                  }}
                >
                  {action.carried_forward && (
                    <span className="mr-1 text-xs" title="Carried forward from yesterday">↩</span>
                  )}
                  {action.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {action.why}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <CriterionTag criterion={action.criterion} />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{action.time_required}</span>
                  {action.deadline && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>· {action.deadline}</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
