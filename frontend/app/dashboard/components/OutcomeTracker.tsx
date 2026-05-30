'use client'

import { useState } from 'react'
import type { OutcomeItem } from '../hooks/useDashboard'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'

const STATUS_OPTIONS = ['pending', 'accepted', 'rejected', 'withdrawn'] as const

function statusStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    accepted: { color: 'var(--criterion-green)', background: '#E8F7F2' },
    rejected: { color: 'var(--criterion-red)', background: '#FDEAEA' },
    withdrawn: { color: 'var(--text-tertiary)', background: 'var(--secondary-bg)' },
    pending: { color: 'var(--criterion-amber)', background: '#FDF5E0' },
  }
  return map[status] ?? map.pending
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = {
  outcomes: OutcomeItem[]
  loading: boolean
  onStatusChange: (id: string, status: string) => void
  onError: (msg: string) => void
}

export default function OutcomeTracker({ outcomes, loading, onStatusChange, onError }: Props) {
  const [pending, setPending] = useState<Set<string>>(new Set())

  async function handleStatusChange(id: string, status: string) {
    onStatusChange(id, status) // optimistic
    setPending(prev => { const s = new Set(prev); s.add(id); return s })

    try {
      const res = await fetch(`/api/dashboard/outcomes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json()
        onError(err.error ?? 'Failed to update outcome')
      }
    } catch {
      onError('Failed to update outcome')
    } finally {
      setPending(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Outcome Tracker</h2>
        {!loading && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {outcomes.filter(o => o.status === 'accepted').length} accepted
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 animate-pulse rounded" style={{ background: 'var(--secondary-bg)' }} />
          ))}
        </div>
      ) : outcomes.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No outcomes yet. Apply to opportunities to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {outcomes.map(o => (
            <div
              key={o.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: 'var(--secondary-bg)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {o.opportunity_title}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  {o.criterion && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {CRITERION_LABELS[o.criterion as CriterionType] ?? o.criterion}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDate(o.created_at)}
                  </span>
                </div>
              </div>

              <select
                value={o.status}
                disabled={pending.has(o.id)}
                onChange={e => handleStatusChange(o.id, e.target.value)}
                className="shrink-0 cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none disabled:opacity-50"
                style={{ ...statusStyle(o.status), appearance: 'auto' }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
