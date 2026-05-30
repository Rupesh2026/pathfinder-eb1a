'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  if (score >= 70) return 'var(--criterion-green)'
  if (score >= 40) return 'var(--criterion-amber)'
  return 'var(--criterion-red)'
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
      <div className="card p-5">
        <div className="h-4 w-40 animate-pulse rounded" style={{ background: 'var(--card-border-color)' }} />
        <div className="mt-3 h-2 w-full animate-pulse rounded-full" style={{ background: 'var(--card-border-color)' }} />
      </div>
    )
  }

  if (!data) return null

  const color = readinessColor(data.readiness_score)

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: score + bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Filing Readiness</h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background: data.readiness_score >= 70 ? '#E8F7F2' : data.readiness_score >= 40 ? '#FDF5E0' : '#FDEAEA',
                color,
              }}
            >
              {data.readiness_score}% · {readinessLabel(data.readiness_score)}
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full mb-3" style={{ background: 'var(--secondary-bg)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${data.readiness_score}%`, background: color }}
            />
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: data.strong_count >= 3 ? 'var(--criterion-green)' : 'var(--text-primary)' }}>
                {data.strong_count}/3
              </span>
              {' '}criteria strong
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {data.evidence_covered}/{data.evidence_total}
              </span>
              {' '}criteria with evidence
            </div>
            {data.total_letters > 0 && (
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: data.received_letters >= 3 ? 'var(--criterion-green)' : 'var(--text-primary)' }}>
                  {data.received_letters}/{Math.max(data.total_letters, 3)}
                </span>
                {' '}letters received
              </div>
            )}
          </div>
        </div>

        {/* Right: filing date / blockers */}
        <div className="shrink-0 text-right space-y-1">
          {data.target_filing_date ? (
            <>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Target: {formatDate(data.target_filing_date)}
              </p>
              {data.days_until_filing !== null && (
                <p className="text-xs" style={{
                  color: data.days_until_filing <= 30 ? 'var(--criterion-red)'
                    : data.days_until_filing <= 90 ? 'var(--criterion-amber)'
                    : 'var(--text-tertiary)'
                }}>
                  {data.days_until_filing > 0
                    ? `${data.days_until_filing} days away`
                    : data.days_until_filing === 0
                    ? 'Today'
                    : `${Math.abs(data.days_until_filing)} days overdue`}
                </p>
              )}
            </>
          ) : (
            <Link href="/dashboard/profile" className="text-xs underline" style={{ color: 'var(--criterion-blue)' }}>
              Set target date →
            </Link>
          )}
        </div>
      </div>

      {/* Blockers */}
      {data.blockers.length > 0 && (
        <div className="mt-3 space-y-1">
          {data.blockers.map((b, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 text-xs shrink-0" style={{ color: 'var(--criterion-amber)' }}>▲</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
