'use client'

import { useTransition } from 'react'
import { dismissOpportunity, markApplied } from '@/app/actions/opportunities'
import type { Opportunity } from '@/lib/types'
import { CRITERION_LABELS } from '@/lib/types'
import { getModeBadge, countryLabel } from '@/lib/opportunity-visibility'
import { ExternalLink, Globe, MapPin, CheckCircle, X, Star } from 'lucide-react'

type Props = { opportunity: Opportunity }

const TYPE_LABELS: Record<string, string> = {
  cfp: 'CFP', judging: 'Judging', speaking: 'Speaking',
  award: 'Award', podcast: 'Podcast', grant: 'Grant', peer_review: 'Peer Review',
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  cfp:        { bg: 'rgba(59,130,246,0.12)',  color: 'var(--c-scholarly)' },
  judging:    { bg: 'rgba(52,211,153,0.12)',  color: 'var(--c-judging)' },
  speaking:   { bg: 'rgba(251,146,60,0.12)',  color: 'var(--c-critical_role)' },
  award:      { bg: 'rgba(245,158,11,0.12)',  color: 'var(--c-awards)' },
  podcast:    { bg: 'rgba(167,139,250,0.12)', color: 'var(--c-memberships)' },
  grant:      { bg: 'rgba(34,211,238,0.12)',  color: 'var(--c-press)' },
  peer_review:{ bg: 'rgba(129,140,248,0.12)', color: 'var(--c-contributions)' },
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
}

export default function OpportunityCard({ opportunity: opp }: Props) {
  const [isPending, startTransition] = useTransition()
  const modeBadge = getModeBadge(opp.delivery_mode)
  const place = countryLabel(opp)
  const typeStyle = TYPE_COLORS[opp.type] ?? { bg: 'var(--bg-overlay)', color: 'var(--text-muted)' }
  const criterionColor = opp.criterion ? (CRITERION_COLORS[opp.criterion] ?? 'var(--accent)') : null

  function handleDismiss() {
    startTransition(async () => { await dismissOpportunity(opp.id) })
  }

  // "Mark as completed" — record that the user applied, moving this opportunity
  // into the Applied bucket. (Applying itself happens via the Apply link below.)
  function handleMarkComplete() {
    startTransition(async () => { await markApplied(opp.id) })
  }

  if (opp.dismissed) return null

  const score = opp.priority_score != null ? Math.round(opp.priority_score) : null

  return (
    <div
      className="card-interactive p-5 transition-opacity"
      style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? 'none' : 'auto' }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type */}
            <span
              className="badge"
              style={{ background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.color}30` }}
            >
              {TYPE_LABELS[opp.type] ?? opp.type}
            </span>

            {/* Criterion */}
            {opp.criterion && (
              <span
                className="badge"
                style={{
                  background: `${criterionColor}15`,
                  color: criterionColor ?? 'var(--text-muted)',
                  border: `1px solid ${criterionColor}30`,
                }}
              >
                {CRITERION_LABELS[opp.criterion] ?? opp.criterion}
              </span>
            )}

            {/* Mode */}
            <span
              className="badge"
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

            {/* Applied badge */}
            {opp.applied && (
              <span className="badge badge-green">
                <CheckCircle size={9} /> Applied
              </span>
            )}

            {/* Priority score */}
            {score != null && score > 0 && (
              <span
                className="ml-auto flex items-center gap-1 text-[11px] font-bold tabular-nums"
                style={{ color: score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--text-muted)' }}
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
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {opp.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              {opp.is_us ? <MapPin size={11} /> : <Globe size={11} />}
              {place}
            </span>
            {opp.deadline && (
              <span>
                Deadline: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{opp.deadline}</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!opp.applied && (
          <div className="flex w-[150px] flex-shrink-0 flex-col gap-2">
            {opp.url ? (
              <a
                href={opp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary justify-center text-xs px-3 py-1.5"
              >
                Apply <ExternalLink size={12} />
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
            <button onClick={handleMarkComplete} className="btn-secondary justify-center text-xs px-3 py-1.5">
              <CheckCircle size={12} />
              Mark as completed
            </button>
            <button
              onClick={handleDismiss}
              className="btn-ghost justify-center text-xs px-3 py-1.5"
            >
              <X size={11} />
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
