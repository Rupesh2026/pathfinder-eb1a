'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CriterionData, OpportunityItem } from '../hooks/useDashboard'
import ScanButton from './ScanButton'
import { ChevronRight, ExternalLink, CheckCircle2, X, Clock, Sparkles } from 'lucide-react'

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

function formatDeadline(deadline: string | null): string {
  if (!deadline) return ''
  return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = {
  criteria: CriterionData[]
  opportunities: OpportunityItem[]
  isExampleOpportunities: boolean
  loading: boolean
  lastScannedAt: string | null
  onApplied: (id: string) => void
  onIgnore: (id: string) => void
  onError: (msg: string) => void
}

export default function CriteriaOpportunityPanels({
  criteria, opportunities, isExampleOpportunities, loading, lastScannedAt, onApplied, onIgnore, onError,
}: Props) {
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [collapsedManually, setCollapsedManually] = useState<Set<string>>(new Set())
  const [expandedManually, setExpandedManually] = useState<Set<string>>(new Set())

  const byCriterion: Record<string, OpportunityItem[]> = {}
  for (const opp of opportunities) {
    const key = opp.criterion ?? '__none__'
    if (!byCriterion[key]) byCriterion[key] = []
    byCriterion[key].push(opp)
  }

  function isExpanded(criterion: string, openCount: number) {
    if (collapsedManually.has(criterion)) return false
    if (expandedManually.has(criterion)) return true
    return openCount > 0
  }

  function togglePanel(criterion: string, currentlyExpanded: boolean) {
    if (currentlyExpanded) {
      setCollapsedManually(prev => new Set(Array.from(prev).concat(criterion)))
      setExpandedManually(prev => { const s = new Set(prev); s.delete(criterion); return s })
    } else {
      setExpandedManually(prev => new Set(Array.from(prev).concat(criterion)))
      setCollapsedManually(prev => { const s = new Set(prev); s.delete(criterion); return s })
    }
  }

  async function handleApply(opp: OpportunityItem) {
    if (pending.has(opp.id)) return
    setPending(prev => new Set(Array.from(prev).concat(opp.id)))
    if (opp.url) window.open(opp.url, '_blank', 'noopener,noreferrer')
    else onError('No link available')
    try {
      const res = await fetch(`/api/dashboard/opportunities/${opp.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
      if (!res.ok) { const e = await res.json(); onError(e.error ?? 'Failed'); }
      else onApplied(opp.id)
    } catch { onError('Failed to mark as applied') }
    finally { setPending(prev => { const s = new Set(prev); s.delete(opp.id); return s }) }
  }

  async function handleIgnore(id: string) {
    if (pending.has(id)) return
    setPending(prev => new Set(Array.from(prev).concat(id)))
    onIgnore(id)
    try { await fetch(`/api/dashboard/opportunities/${id}/skip`, { method: 'POST' }) }
    catch { onError('Failed to dismiss') }
    finally { setPending(prev => { const s = new Set(prev); s.delete(id); return s }) }
  }

  if (loading) {
    return (
      <div className="card p-5 space-y-2">
        <div className="skeleton h-5 w-36 mb-4" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
      </div>
    )
  }

  if (criteria.length === 0) {
    return (
      <div className="card p-5 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No criteria selected.</p>
        <Link href="/dashboard/profile" className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>
          Set your focus in Profile →
        </Link>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Opportunities by Criterion</h2>
        {lastScannedAt && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Clock size={10} />
            {new Date(lastScannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>

      {isExampleOpportunities && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--accent-border)' }}
        >
          <Sparkles size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>These are example opportunities.</span>
            {' '}Use the <span className="font-medium" style={{ color: 'var(--accent)' }}>Scan Now</span> button above to discover real opportunities matched to your specific profile and EB-1A criteria gaps.
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        {criteria.map(c => {
          const opps = byCriterion[c.criterion] ?? []
          const openOpps = opps.filter(o => !o.applied)
          const appliedOpps = opps.filter(o => o.applied)
          const expanded = isExpanded(c.criterion, openOpps.length)
          const accentColor = CRITERION_COLORS[c.criterion] ?? 'var(--accent)'

          return (
            <div
              key={c.criterion}
              className="overflow-hidden rounded-xl transition-all"
              style={{ border: '1px solid var(--border)' }}
            >
              {/* Header */}
              <button
                onClick={() => togglePanel(c.criterion, expanded)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: expanded ? 'var(--bg-raised)' : 'var(--bg-surface)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)' }}
                onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)' }}
              >
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: accentColor }}
                />
                <span className="flex-1 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {c.label}
                </span>
                <div className="flex items-center gap-2">
                  {openOpps.length > 0 && (
                    <span className="badge badge-green">{openOpps.length} open</span>
                  )}
                  {appliedOpps.length > 0 && (
                    <span className="badge badge-muted">{appliedOpps.length} applied</span>
                  )}
                  {openOpps.length === 0 && appliedOpps.length === 0 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>0 open</span>
                  )}
                  <ChevronRight
                    size={13}
                    style={{
                      color: 'var(--text-muted)',
                      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </div>
              </button>

              {/* Body */}
              {expanded && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {opps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No opportunities yet</p>
                      <ScanButton redirectTo="/dashboard/opportunities" />
                    </div>
                  ) : (
                    <>
                      {openOpps.map((opp, idx) => (
                        <div
                          key={opp.id}
                          className="flex items-start gap-3 px-4 py-3"
                          style={{
                            borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {opp.title}
                              </span>
                              {opp.urgency === 'urgent' && (
                                <span className="badge badge-red">Urgent</span>
                              )}
                              {opp.urgency === 'soon' && (
                                <span className="badge badge-amber">Soon</span>
                              )}
                            </div>
                            {opp.description && (
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {opp.description}
                              </p>
                            )}
                            {opp.deadline && (
                              <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <Clock size={10} />
                                Due {formatDeadline(opp.deadline)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 flex-col gap-1.5">
                            <button
                              onClick={() => handleApply(opp)}
                              disabled={pending.has(opp.id)}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              Apply <ExternalLink size={10} />
                            </button>
                            <button
                              onClick={() => handleIgnore(opp.id)}
                              disabled={pending.has(opp.id)}
                              className="btn-ghost justify-center text-xs px-3 py-1.5"
                            >
                              <X size={10} /> Skip
                            </button>
                          </div>
                        </div>
                      ))}

                      {appliedOpps.length > 0 && (
                        <>
                          <div
                            className="px-4 py-2"
                            style={{ background: 'var(--bg-raised)', borderTop: '1px solid var(--border)' }}
                          >
                            <span className="section-header">Applied</span>
                          </div>
                          {appliedOpps.map((opp, idx) => (
                            <div
                              key={opp.id}
                              className="flex items-center gap-3 px-4 py-2.5"
                              style={{
                                opacity: 0.65,
                                borderTop: idx > 0 ? '1px solid var(--border-subtle)' : '1px solid var(--border)',
                              }}
                            >
                              <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                              <span className="flex-1 min-w-0 truncate text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {opp.title}
                              </span>
                              {opp.deadline && (
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {formatDeadline(opp.deadline)}
                                </span>
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
