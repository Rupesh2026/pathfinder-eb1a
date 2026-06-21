'use client'

import Link from 'next/link'
import type { CriterionData } from '../hooks/useDashboard'
import { ChevronRight, AlertCircle, TrendingUp, Minus } from 'lucide-react'

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

function scoreColor(score: number) {
  if (score >= 65) return 'var(--green)'
  if (score >= 40) return 'var(--amber)'
  if (score > 0)  return 'var(--c-critical_role)'
  return 'var(--text-muted)' // empty criterion — neutral, not alarming red
}

function TierChip({ score }: { score: number }) {
  if (score >= 65) return <span className="badge badge-green">Strong</span>
  if (score >= 40) return <span className="badge badge-amber">Building</span>
  if (score > 0)  return <span className="badge" style={{ background: 'var(--amber-subtle)', color: 'var(--amber)', border: '1px solid var(--amber-border)' }}>Weak</span>
  return <span className="badge" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}>No evidence</span>
}

type Props = { criteria: CriterionData[]; loading: boolean; focused?: boolean }

export default function CriteriaPanel({ criteria, loading, focused }: Props) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="mb-4 skeleton h-5 w-32" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-raised)' }}>
              <div className="skeleton h-4 w-36" />
              <div className="skeleton h-2 w-full" />
              <div className="flex justify-between">
                <div className="skeleton h-3 w-10" />
                <div className="skeleton h-4 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const strongCount = criteria.filter(c => c.score >= 65).length
  const gapCount = criteria.filter(c => c.score < 40).length

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Evidence Health</h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {focused ? `${criteria.length} focused criteria` : '10 EB-1A criteria'} ·{' '}
            <span style={{ color: 'var(--green)' }}>{strongCount} strong</span>
            {gapCount > 0 && <span>, <span style={{ color: 'var(--amber)' }}>{gapCount} need work</span></span>}
          </p>
        </div>
        <Link
          href="/dashboard/evidence"
          className="btn-ghost text-xs"
        >
          View all <ChevronRight size={12} />
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {criteria.map((c) => {
          const accentColor = CRITERION_COLORS[c.criterion] ?? 'var(--accent)'
          const color = scoreColor(c.score)
          const needsWork = c.score < 40

          return (
            <Link
              key={c.criterion}
              href={`/dashboard/evidence/${c.criterion}`}
              className="group relative flex flex-col gap-3 rounded-xl p-4 transition-all"
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = accentColor + '50'
                el.style.background = 'var(--bg-overlay)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--border)'
                el.style.background = 'var(--bg-raised)'
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Criterion color dot */}
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: accentColor }}
                  />
                  <span className="text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {c.label}
                  </span>
                </div>
                {c.score >= 65 ? (
                  <TrendingUp size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                ) : needsWork ? (
                  <AlertCircle size={13} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                ) : (
                  <Minus size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${c.score}%`, background: color }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tabular-nums" style={{ color }}>
                  {c.score}/100
                </span>
                <div className="flex items-center gap-2">
                  {c.evidence_count > 0 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {c.evidence_count} items
                    </span>
                  )}
                  <TierChip score={c.score} />
                </div>
              </div>

              {/* Hover arrow */}
              <ChevronRight
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
