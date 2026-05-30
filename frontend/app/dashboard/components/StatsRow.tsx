'use client'

import type { SummaryData } from '../hooks/useDashboard'
import { TrendingUp, Award, Clock, Target } from 'lucide-react'

function strengthColor(pct: number): string {
  if (pct >= 65) return 'var(--green)'
  if (pct >= 40) return 'var(--amber)'
  if (pct >= 20) return 'var(--c-critical_role)'
  return 'var(--red)'
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

type Props = {
  summary: SummaryData | null
  loading: boolean
  targetFilingDate?: string | null
}

type StatCardProps = {
  label: string
  value: string
  sub: string
  color: string
  icon: React.ReactNode
  loading: boolean
  highlight?: boolean
}

function StatCard({ label, value, sub, color, icon, loading, highlight }: StatCardProps) {
  return (
    <div
      className="card p-5 flex flex-col gap-3 relative overflow-hidden"
      style={highlight ? { borderColor: 'var(--accent-border)' } : {}}
    >
      {highlight && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
        >
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-8 w-20" />
          <div className="skeleton h-3 w-28" />
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold tracking-tight" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </>
      )}
    </div>
  )
}

export default function StatsRow({ summary, loading, targetFilingDate }: Props) {
  const filingDays = targetFilingDate ? daysUntil(targetFilingDate) : null
  const filingColor = filingDays == null ? 'var(--text-muted)'
    : filingDays <= 30  ? 'var(--red)'
    : filingDays <= 90  ? 'var(--amber)'
    : 'var(--text-primary)'

  const stats = [
    {
      label: 'Case Strength',
      value: summary ? `${summary.profile_strength}%` : '—',
      sub: 'Overall readiness score',
      color: summary ? strengthColor(summary.profile_strength) : 'var(--text-muted)',
      icon: <TrendingUp size={14} />,
      highlight: true,
    },
    {
      label: 'Strong Criteria',
      value: summary ? `${summary.criteria_strong_count} / ${summary.focused_criteria_count ?? summary.total_criteria}` : '—',
      sub: 'Score ≥ 65 threshold',
      color: summary ? (summary.criteria_strong_count >= 3 ? 'var(--green)' : 'var(--amber)') : 'var(--text-muted)',
      icon: <Award size={14} />,
    },
    {
      label: 'Days to File',
      value: filingDays != null ? `${Math.abs(filingDays)}` : '—',
      sub: filingDays == null ? 'Set target in Profile'
        : filingDays < 0 ? 'Past target date'
        : 'days remaining',
      color: filingColor,
      icon: <Clock size={14} />,
    },
    {
      label: 'Applications',
      value: summary ? String(summary.outcomes_total) : '—',
      sub: summary ? `${summary.outcomes_accepted} accepted` : '',
      color: 'var(--text-primary)',
      icon: <Target size={14} />,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(s => (
        <StatCard key={s.label} {...s} loading={loading} />
      ))}
    </div>
  )
}
