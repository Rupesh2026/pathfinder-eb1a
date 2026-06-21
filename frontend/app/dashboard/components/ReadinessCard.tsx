'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ExternalLink } from 'lucide-react'

type ReadinessData = {
  readiness_score: number
  strong_count: number
  evidence_covered: number
  evidence_total: number
  received_letters: number
  total_letters: number
  target_filing_date: string | null
  days_until_filing: number | null
  blockers: string[]
}

function readinessColor(score: number): string {
  if (score >= 70) return 'var(--green)'
  if (score >= 40) return 'var(--amber)'
  return 'var(--c-critical_role)' // warm coral — gentler than alarm red
}

function readinessLabel(score: number): string {
  if (score >= 70) return 'On Track'
  if (score >= 40) return 'Building'
  return 'Needs Work'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReadinessCard() {
  const [data, setData] = useState<ReadinessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/readiness', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card p-5 space-y-3">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-2 w-full" />
        <div className="flex gap-4">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const color = readinessColor(data.readiness_score)
  const label = readinessLabel(data.readiness_score)

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Filing Readiness</h2>
        <span
          className="badge"
          style={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}40`,
          }}
        >
          {label}
        </span>
      </div>

      {/* Score + bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {data.readiness_score}%
          </span>
          {data.target_filing_date ? (
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(data.target_filing_date)}
              </p>
              {data.days_until_filing !== null && (
                <p
                  className="text-[10px]"
                  style={{
                    color: data.days_until_filing <= 30 ? 'var(--c-critical_role)'
                      : data.days_until_filing <= 90 ? 'var(--amber)'
                      : 'var(--text-muted)',
                  }}
                >
                  {data.days_until_filing > 0 ? `${data.days_until_filing}d away`
                    : data.days_until_filing === 0 ? 'Today'
                    : `${Math.abs(data.days_until_filing)}d overdue`}
                </p>
              )}
            </div>
          ) : (
            <Link href="/dashboard/profile" className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
              Set date <ExternalLink size={10} />
            </Link>
          )}
        </div>
        <div className="progress-track" style={{ height: '6px' }}>
          <div
            className="progress-fill"
            style={{ width: `${data.readiness_score}%`, background: color, height: '6px' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {[
          { label: 'Strong criteria', value: `${data.strong_count}/3`, good: data.strong_count >= 3 },
          { label: 'With evidence', value: `${data.evidence_covered}/${data.evidence_total}`, good: data.evidence_covered >= 6 },
          ...(data.total_letters > 0 ? [
            { label: 'Letters received', value: `${data.received_letters}/${Math.max(data.total_letters, 3)}`, good: data.received_letters >= 3 },
          ] : []),
        ].map(stat => (
          <div key={stat.label} className="rounded-lg p-2.5" style={{ background: 'var(--bg-raised)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p
              className="mt-0.5 text-sm font-bold tabular-nums"
              style={{ color: stat.good ? 'var(--green)' : 'var(--text-primary)' }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Blockers */}
      {data.blockers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Blockers
          </p>
          {data.blockers.slice(0, 3).map((b, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--amber-subtle)' }}>
              <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--amber)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
