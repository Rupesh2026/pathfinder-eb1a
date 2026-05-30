'use client'

import { useState } from 'react'
import { MapPin, Globe } from 'lucide-react'
import type { OpportunityItem, OutcomeItem } from '../hooks/useDashboard'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'
import { getModeBadge, countryLabel } from '@/lib/opportunity-visibility'

const TABS = [
  { key: '', label: 'All' },
  { key: 'cfp', label: 'Publications' },
  { key: 'judging', label: 'Judging' },
  { key: 'peer_review', label: 'Peer Review' },
  { key: 'speaking', label: 'Speaking' },
  { key: 'award', label: 'Awards' },
]

function urgencyStyle(urgency: 'urgent' | 'soon' | 'open'): React.CSSProperties {
  const map = {
    urgent: { background: 'var(--urgency-red-bg)', color: 'var(--urgency-red-text)' },
    soon: { background: 'var(--urgency-amber-bg)', color: 'var(--urgency-amber-text)' },
    open: { background: 'var(--urgency-green-bg)', color: 'var(--urgency-green-text)' },
  }
  return map[urgency]
}

function urgencyLabel(urgency: 'urgent' | 'soon' | 'open'): string {
  return { urgent: 'Urgent', soon: 'Soon', open: 'Open' }[urgency]
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline'
  return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = {
  opportunities: OpportunityItem[]
  loading: boolean
  lastScannedAt: string | null
  focused?: boolean
  onApply: (opp: OpportunityItem) => void
  onSkip: (id: string) => void
  onError: (msg: string) => void
}

export default function OpportunityList({ opportunities, loading, lastScannedAt, focused, onApply, onSkip, onError }: Props) {
  const [activeTab, setActiveTab] = useState('')
  const [pending, setPending] = useState<Set<string>>(new Set())

  const filtered = activeTab ? opportunities.filter(o => o.type === activeTab) : opportunities

  async function handleApply(opp: OpportunityItem) {
    onApply(opp) // optimistic: remove from list
    setPending(prev => { const s = new Set(prev); s.add(opp.id); return s })
    try {
      const res = await fetch(`/api/dashboard/opportunities/${opp.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
      if (!res.ok) {
        const err = await res.json()
        onError(err.error ?? 'Failed to log application')
      }
    } catch {
      onError('Failed to log application')
    } finally {
      setPending(prev => { const s = new Set(prev); s.delete(opp.id); return s })
    }
  }

  async function handleSkip(id: string) {
    onSkip(id) // optimistic
    try {
      await fetch(`/api/dashboard/opportunities/${id}/skip`, { method: 'POST' })
    } catch {
      onError('Failed to dismiss opportunity')
    }
  }

  const scannedLabel = lastScannedAt
    ? `Scanned ${new Date(lastScannedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
    : null

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Opportunities</h2>
          {focused && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>Filtered to your focused criteria</p>
          )}
        </div>
        {scannedLabel && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{scannedLabel}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={
              activeTab === tab.key
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--secondary-bg)', color: 'var(--text-secondary)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--secondary-bg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No opportunities found.</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>DiscoveryAgent will surface new ones after the next scan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(opp => {
            const modeBadge = getModeBadge(opp.delivery_mode)
            const place = countryLabel(opp)
            return (
            <div
              key={opp.id}
              className="rounded-lg p-4"
              style={{ border: '0.5px solid var(--card-border-color)', background: 'var(--card-bg)' }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title row + urgency */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {opp.title}
                    </h3>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={urgencyStyle(opp.urgency)}
                    >
                      {urgencyLabel(opp.urgency)}
                    </span>
                  </div>

                  {opp.description && (
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {opp.description}
                    </p>
                  )}

                  {/* Metadata: criterion · mode badge · location · deadline · link */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {opp.criterion && (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {CRITERION_LABELS[opp.criterion as CriterionType] ?? opp.criterion}
                      </span>
                    )}
                    {/* Mode badge — same palette as OpportunityCard */}
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: opp.delivery_mode === 'online' ? 'var(--green-subtle)'
                          : opp.delivery_mode === 'hybrid' ? 'rgba(167,139,250,0.12)'
                          : 'var(--amber-subtle)',
                        color: opp.delivery_mode === 'online' ? 'var(--green)'
                          : opp.delivery_mode === 'hybrid' ? 'var(--c-memberships)'
                          : 'var(--amber)',
                        border: `1px solid ${opp.delivery_mode === 'online' ? 'var(--green-border)'
                          : opp.delivery_mode === 'hybrid' ? 'rgba(167,139,250,0.3)'
                          : 'var(--amber-border)'}`,
                      }}
                    >
                      {modeBadge.label}
                    </span>
                    {/* Location */}
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {opp.is_us
                        ? <MapPin size={10} />
                        : <Globe size={10} />}
                      {place}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDeadline(opp.deadline)}
                    </span>
                    {opp.url && (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                        style={{ color: 'var(--criterion-blue)' }}
                      >
                        Open →
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    onClick={() => handleApply(opp)}
                    disabled={pending.has(opp.id)}
                    className="rounded px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleSkip(opp.id)}
                    disabled={pending.has(opp.id)}
                    className="rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    style={{ background: 'var(--secondary-bg)', color: 'var(--text-secondary)' }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
