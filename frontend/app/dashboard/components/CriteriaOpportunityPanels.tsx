'use client'

import { useState } from 'react'
import type { CriterionData, OpportunityItem } from '../hooks/useDashboard'
import ScanButton from './ScanButton'

function formatDeadline(deadline: string | null): string {
  if (!deadline) return ''
  return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function urgencyStyle(urgency: 'urgent' | 'soon' | 'open'): React.CSSProperties {
  const map = {
    urgent: { background: 'var(--urgency-red-bg)', color: 'var(--urgency-red-text)' },
    soon: { background: 'var(--urgency-amber-bg)', color: 'var(--urgency-amber-text)' },
    open: { background: 'var(--urgency-green-bg)', color: 'var(--urgency-green-text)' },
  }
  return map[urgency]
}

type Props = {
  criteria: CriterionData[]
  opportunities: OpportunityItem[]
  loading: boolean
  lastScannedAt: string | null
  onApplied: (id: string) => void
  onIgnore: (id: string) => void
  onError: (msg: string) => void
}

export default function CriteriaOpportunityPanels({
  criteria, opportunities, loading, lastScannedAt, onApplied, onIgnore, onError,
}: Props) {
  const [pending, setPending] = useState<Set<string>>(new Set())

  // Manual override sets: user can collapse auto-expanded panels or expand auto-collapsed ones
  const [collapsedManually, setCollapsedManually] = useState<Set<string>>(new Set())
  const [expandedManually, setExpandedManually] = useState<Set<string>>(new Set())

  // Group opportunities by criterion
  const byCriterion: Record<string, OpportunityItem[]> = {}
  for (const opp of opportunities) {
    const key = opp.criterion ?? '__none__'
    if (!byCriterion[key]) byCriterion[key] = []
    byCriterion[key].push(opp)
  }

  function isExpanded(criterion: string, openCount: number): boolean {
    if (collapsedManually.has(criterion)) return false
    if (expandedManually.has(criterion)) return true
    return openCount > 0
  }

  function togglePanel(criterion: string, currentlyExpanded: boolean) {
    if (currentlyExpanded) {
      setCollapsedManually(prev => new Set([...prev, criterion]))
      setExpandedManually(prev => { const s = new Set(prev); s.delete(criterion); return s })
    } else {
      setExpandedManually(prev => new Set([...prev, criterion]))
      setCollapsedManually(prev => { const s = new Set(prev); s.delete(criterion); return s })
    }
  }

  async function handleApply(opp: OpportunityItem) {
    if (pending.has(opp.id)) return
    setPending(prev => new Set([...prev, opp.id]))

    if (opp.url) {
      window.open(opp.url, '_blank', 'noopener,noreferrer')
    } else {
      onError('No link available for this opportunity')
    }

    try {
      const res = await fetch(`/api/dashboard/opportunities/${opp.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
      if (!res.ok) {
        const err = await res.json()
        onError(err.error ?? 'Failed to mark as applied')
      } else {
        onApplied(opp.id)
      }
    } catch {
      onError('Failed to mark as applied')
    } finally {
      setPending(prev => { const s = new Set(prev); s.delete(opp.id); return s })
    }
  }

  async function handleIgnore(id: string) {
    if (pending.has(id)) return
    setPending(prev => new Set([...prev, id]))
    onIgnore(id) // optimistic
    try {
      await fetch(`/api/dashboard/opportunities/${id}/skip`, { method: 'POST' })
    } catch {
      onError('Failed to dismiss opportunity')
    } finally {
      setPending(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const scannedLabel = lastScannedAt
    ? `Scanned ${new Date(lastScannedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
    : null

  if (loading) {
    return (
      <div className="card p-5">
        <div className="mb-4 h-5 w-40 animate-pulse rounded" style={{ background: 'var(--card-border-color)' }} />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 animate-pulse rounded-lg" style={{ background: 'var(--secondary-bg)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (criteria.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Opportunities</h2>
        <div className="rounded-lg px-4 py-8 text-center" style={{ background: 'var(--secondary-bg)' }}>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No criteria selected.</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Set your focus in{' '}
            <a href="/dashboard/profile" className="underline" style={{ color: 'var(--criterion-blue)' }}>
              Profile
            </a>{' '}
            to see opportunities here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Opportunities</h2>
        {scannedLabel && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{scannedLabel}</span>
        )}
      </div>

      <div className="space-y-1.5">
        {criteria.map(c => {
          const opps = byCriterion[c.criterion] ?? []
          const openOpps = opps.filter(o => !o.applied)
          const appliedOpps = opps.filter(o => o.applied)
          const expanded = isExpanded(c.criterion, openOpps.length)

          return (
            <div
              key={c.criterion}
              className="overflow-hidden rounded-lg"
              style={{ border: '0.5px solid var(--card-border-color)' }}
            >
              {/* ── Accordion header ─────────────────── */}
              <button
                onClick={() => togglePanel(c.criterion, expanded)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:opacity-80 transition-opacity"
                style={{ background: 'var(--secondary-bg)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold transition-transform duration-200"
                    style={{
                      color: 'var(--text-tertiary)',
                      display: 'inline-block',
                      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▶
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {c.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {openOpps.length > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: 'var(--urgency-green-bg)', color: 'var(--urgency-green-text)' }}
                    >
                      {openOpps.length} open
                    </span>
                  )}
                  {appliedOpps.length > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        background: 'transparent',
                        color: 'var(--text-tertiary)',
                        border: '0.5px solid var(--card-border-color)',
                      }}
                    >
                      {appliedOpps.length} applied
                    </span>
                  )}
                  {openOpps.length === 0 && appliedOpps.length === 0 && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>0 open</span>
                  )}
                </div>
              </button>

              {/* ── Accordion body ────────────────────── */}
              {expanded && (
                <div style={{ borderTop: '0.5px solid var(--card-border-color)' }}>
                  {opps.length === 0 ? (
                    <div className="px-4 py-6 text-center space-y-3">
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        No opportunities yet. Run a scan to discover.
                      </p>
                      <div className="flex justify-center">
                        <ScanButton
                          redirectTo="/dashboard/opportunities"
                          subtitle="for opportunities"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Active (not yet applied) */}
                      {openOpps.map((opp, idx) => (
                        <div
                          key={opp.id}
                          className="flex items-start gap-3 p-4"
                          style={{
                            background: 'var(--card-bg)',
                            borderTop: idx > 0 ? '0.5px solid var(--divider)' : undefined,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {opp.title}
                              </span>
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                                style={urgencyStyle(opp.urgency)}
                              >
                                {opp.urgency === 'urgent' ? 'Urgent' : opp.urgency === 'soon' ? 'Soon' : 'Open'}
                              </span>
                            </div>
                            {opp.description && (
                              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {opp.description}
                              </p>
                            )}
                            {opp.deadline && (
                              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                Due {formatDeadline(opp.deadline)}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-1.5">
                            <button
                              onClick={() => handleApply(opp)}
                              disabled={pending.has(opp.id)}
                              className="whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                              style={{ background: '#111827', color: '#fff' }}
                            >
                              Apply →
                            </button>
                            <button
                              onClick={() => handleIgnore(opp.id)}
                              disabled={pending.has(opp.id)}
                              className="whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                              style={{ background: 'var(--secondary-bg)', color: 'var(--text-secondary)' }}
                            >
                              Ignore
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Applied history */}
                      {appliedOpps.length > 0 && (
                        <>
                          {openOpps.length > 0 && (
                            <div
                              className="px-4 py-1.5"
                              style={{
                                background: 'var(--secondary-bg)',
                                borderTop: '0.5px solid var(--divider)',
                              }}
                            >
                              <span
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                Applied
                              </span>
                            </div>
                          )}
                          {appliedOpps.map((opp, idx) => (
                            <div
                              key={opp.id}
                              className="flex items-start gap-3 p-4"
                              style={{
                                background: 'var(--card-bg)',
                                opacity: 0.65,
                                borderTop: '0.5px solid var(--divider)',
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    {opp.title}
                                  </span>
                                  <span
                                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                                    style={{ background: 'var(--urgency-green-bg)', color: 'var(--criterion-green)' }}
                                  >
                                    ✓ Applied
                                  </span>
                                </div>
                                {opp.deadline && (
                                  <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Due {formatDeadline(opp.deadline)}
                                  </p>
                                )}
                              </div>
                              {opp.url && (
                                <a
                                  href={opp.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium"
                                  style={{
                                    background: 'var(--secondary-bg)',
                                    color: 'var(--text-secondary)',
                                    border: '0.5px solid var(--card-border-color)',
                                  }}
                                >
                                  Open →
                                </a>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
