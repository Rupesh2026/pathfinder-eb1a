'use client'

import type { SummaryData } from '../hooks/useDashboard'

function strengthColor(pct: number): string {
  if (pct >= 65) return 'var(--criterion-green)'
  if (pct >= 40) return 'var(--criterion-blue)'
  if (pct >= 20) return 'var(--criterion-amber)'
  return 'var(--criterion-red)'
}

type Props = {
  summary: SummaryData | null
  loading: boolean
  targetFilingDate?: string | null
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function StatsRow({ summary, loading, targetFilingDate }: Props) {
  const skeletonClass = 'animate-pulse rounded' as const

  const filingDays = targetFilingDate ? daysUntil(targetFilingDate) : null
  const filingColor = filingDays == null ? 'var(--text-tertiary)'
    : filingDays <= 30 ? 'var(--criterion-red)'
    : filingDays <= 90 ? 'var(--criterion-amber)'
    : 'var(--criterion-green)'
  const filingSub = filingDays == null ? 'Set in Profile'
    : filingDays < 0 ? 'Overdue'
    : 'days remaining'

  const stats = [
    {
      label: 'Profile Strength',
      value: summary ? `${summary.profile_strength}%` : '—',
      sub: summary ? `Case readiness score` : '',
      color: summary ? strengthColor(summary.profile_strength) : 'var(--text-tertiary)',
    },
    {
      label: 'Criteria Strong',
      value: summary ? `${summary.criteria_strong_count} / ${summary.focused_criteria_count ?? summary.total_criteria}` : '—',
      sub: summary ? `≥65 score threshold` : '',
      color: summary ? (summary.criteria_strong_count >= 3 ? 'var(--criterion-green)' : 'var(--criterion-amber)') : 'var(--text-tertiary)',
    },
    {
      label: 'Days to File',
      value: filingDays != null ? `${Math.abs(filingDays)}d` : '—',
      sub: filingSub,
      color: filingColor,
    },
    {
      label: 'Outcomes',
      value: summary ? String(summary.outcomes_total) : '—',
      sub: summary ? `${summary.outcomes_accepted} accepted` : '',
      color: 'var(--text-primary)',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, sub, color }) => (
        <div key={label} className="stat-card rounded-xl p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          {loading ? (
            <div className={`${skeletonClass} mt-2 h-7 w-16`} style={{ background: 'var(--card-border-color)' }} />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color }}>{value}</p>
          )}
          {sub && !loading && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
