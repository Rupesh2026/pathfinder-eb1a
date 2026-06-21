'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { OpportunityItem } from '../hooks/useDashboard'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'
import { getModeBadge, countryLabel } from '@/lib/opportunity-visibility'
import ScanButton from './ScanButton'
import { ExternalLink, CheckCircle2, X, Clock, Sparkles, Star, MapPin, Globe, ArrowRight } from 'lucide-react'

const MAX_VISIBLE = 6

const TYPE_LABELS: Record<string, string> = {
  cfp: 'CFP', judging: 'Judging', speaking: 'Speaking',
  award: 'Award', podcast: 'Podcast', grant: 'Grant', peer_review: 'Peer Review',
}

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
  opportunities: OpportunityItem[]
  isExampleOpportunities: boolean
  loading: boolean
  lastScannedAt: string | null
  onApplied: (id: string) => void
  onIgnore: (id: string) => void
  onError: (msg: string) => void
}

export default function CriteriaOpportunityPanels({
  opportunities, isExampleOpportunities, loading, lastScannedAt, onApplied, onIgnore, onError,
}: Props) {
  const [pending, setPending] = useState<Set<string>>(new Set())

  const openOpps = opportunities
    .filter(o => !o.applied)
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
  const appliedCount = opportunities.filter(o => o.applied).length
  const visible = openOpps.slice(0, MAX_VISIBLE)
  const hiddenCount = openOpps.length - visible.length

  // Apply happens by opening the opportunity's link. "Mark as completed" records
  // that the user applied, moving the opportunity into the Applied bucket.
  async function handleMarkComplete(opp: OpportunityItem) {
    if (pending.has(opp.id)) return
    setPending(prev => new Set(Array.from(prev).concat(opp.id)))
    try {
      const res = await fetch(`/api/dashboard/opportunities/${opp.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
      if (!res.ok) { const e = await res.json(); onError(e.error ?? 'Failed to update') }
      else onApplied(opp.id)
    } catch { onError('Failed to mark as completed') }
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
      <div className="card p-5 space-y-3">
        <div className="skeleton h-5 w-48 mb-2" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recommended Opportunities
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {openOpps.length > 0
              ? `${openOpps.length} open · ranked by fit with your case`
              : 'Discover real opportunities matched to your gaps'}
            {appliedCount > 0 && ` · ${appliedCount} applied`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastScannedAt && (
            <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock size={10} />
              {new Date(lastScannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <Link href="/dashboard/opportunities" className="btn-ghost text-xs">
            View all <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Example banner */}
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

      {/* List */}
      {openOpps.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {appliedCount > 0 ? "You're all caught up" : 'No open opportunities yet'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Run a scan to discover opportunities matching your criteria gaps
          </p>
          <ScanButton redirectTo="/dashboard/opportunities" />
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(opp => {
            const criterionColor = opp.criterion ? (CRITERION_COLORS[opp.criterion] ?? 'var(--accent)') : null
            const score = opp.priority_score != null ? Math.round(opp.priority_score) : null
            const modeBadge = getModeBadge(opp.delivery_mode)
            const isPending = pending.has(opp.id)

            return (
              <div
                key={opp.id}
                className="rounded-xl p-4 transition-opacity"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  opacity: isPending ? 0.5 : 1,
                  pointerEvents: isPending ? 'none' : 'auto',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-muted">{TYPE_LABELS[opp.type] ?? opp.type}</span>
                      {opp.criterion && (
                        <span
                          className="badge"
                          style={{
                            background: `${criterionColor}15`,
                            color: criterionColor ?? 'var(--text-muted)',
                            border: `1px solid ${criterionColor}30`,
                          }}
                        >
                          {CRITERION_LABELS[opp.criterion as CriterionType] ?? opp.criterion}
                        </span>
                      )}
                      <span className={`badge ${modeBadge.classes}`}>{modeBadge.label}</span>
                      {opp.urgency === 'urgent' && (
                        <span
                          className="badge"
                          style={{ background: 'rgba(234,88,12,0.1)', color: 'var(--c-critical_role)', border: '1px solid rgba(234,88,12,0.25)' }}
                        >
                          Urgent
                        </span>
                      )}
                      {opp.urgency === 'soon' && <span className="badge badge-amber">Soon</span>}
                      {score != null && score > 0 && (
                        <span
                          className="ml-auto flex items-center gap-1 text-[11px] font-bold tabular-nums"
                          style={{ color: score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--text-muted)' }}
                          title="Priority score"
                        >
                          <Star size={9} />
                          {score}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {opp.title}
                    </h3>

                    {/* Description */}
                    {opp.description && (
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {opp.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        {opp.is_us ? <MapPin size={11} /> : <Globe size={11} />}
                        {countryLabel(opp)}
                      </span>
                      {opp.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Due {formatDeadline(opp.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex w-[150px] flex-shrink-0 flex-col gap-1.5">
                    {opp.url ? (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary justify-center text-xs px-3 py-1.5"
                      >
                        Apply <ExternalLink size={10} />
                      </a>
                    ) : (
                      <button
                        disabled
                        title="No application link available"
                        className="btn-primary justify-center text-xs px-3 py-1.5"
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        Apply
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkComplete(opp)}
                      disabled={isPending}
                      className="btn-secondary justify-center text-xs px-3 py-1.5"
                    >
                      <CheckCircle2 size={11} /> Mark as completed
                    </button>
                    <button
                      onClick={() => handleIgnore(opp.id)}
                      disabled={isPending}
                      className="btn-ghost justify-center text-xs px-3 py-1.5"
                    >
                      <X size={10} /> Skip
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* More link */}
          {hiddenCount > 0 && (
            <Link
              href="/dashboard/opportunities"
              className="flex items-center justify-center gap-1 rounded-xl py-3 text-xs font-medium transition-colors"
              style={{ border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}
            >
              View {hiddenCount} more {hiddenCount === 1 ? 'opportunity' : 'opportunities'} <ArrowRight size={12} />
            </Link>
          )}

          {appliedCount > 0 && (
            <div className="flex items-center justify-center gap-1.5 pt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--green)' }} />
              {appliedCount} already applied
            </div>
          )}
        </div>
      )}
    </div>
  )
}
