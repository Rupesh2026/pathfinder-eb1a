'use client'

import { useState } from 'react'
import type { OutcomeItem } from '../hooks/useDashboard'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'
import { CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'accepted', 'rejected', 'withdrawn'] as const

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: React.ReactNode; className: string }> = {
    accepted:  { icon: <CheckCircle2 size={10} />, className: 'badge-green' },
    rejected:  { icon: <XCircle size={10} />,     className: 'badge-red' },
    pending:   { icon: <Clock size={10} />,        className: 'badge-amber' },
    withdrawn: { icon: <MinusCircle size={10} />,  className: 'badge-muted' },
  }
  const cfg = configs[status] ?? configs.pending
  return (
    <span className={`badge ${cfg.className}`}>
      {cfg.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
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
  const [editing, setEditing] = useState<string | null>(null)

  async function handleStatusChange(id: string, status: string) {
    onStatusChange(id, status)
    setEditing(null)
    setPending(prev => { const s = new Set(prev); s.add(id); return s })

    try {
      const res = await fetch(`/api/dashboard/outcomes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) onError('Failed to update outcome')
    } catch {
      onError('Failed to update outcome')
    } finally {
      setPending(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const accepted = outcomes.filter(o => o.status === 'accepted').length

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Applications</h2>
        {!loading && accepted > 0 && (
          <span className="badge badge-green">{accepted} accepted</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : outcomes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--bg-raised)' }}>
            <span className="text-lg">📝</span>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>No applications yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Apply to opportunities to track results</p>
        </div>
      ) : (
        <div className="space-y-2">
          {outcomes.map(o => (
            <div
              key={o.id}
              className="rounded-xl p-3 transition-colors"
              style={{ background: 'var(--bg-raised)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {o.opportunity_title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {o.criterion && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {CRITERION_LABELS[o.criterion as CriterionType] ?? o.criterion}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(o.created_at)}
                    </span>
                  </div>
                </div>

                {/* Status selector */}
                {editing === o.id ? (
                  <select
                    value={o.status}
                    disabled={pending.has(o.id)}
                    onChange={e => handleStatusChange(o.id, e.target.value)}
                    onBlur={() => setEditing(null)}
                    autoFocus
                    className="input text-xs py-1 px-2 w-auto"
                    style={{ width: '110px' }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                ) : (
                  <button onClick={() => setEditing(o.id)} className="flex-shrink-0">
                    <StatusBadge status={o.status} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
