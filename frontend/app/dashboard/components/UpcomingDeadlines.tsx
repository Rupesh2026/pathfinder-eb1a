'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'

type DeadlineOpp = {
  id: string
  title: string
  criterion: string | null
  deadline: string
}

function urgencyColor(daysAway: number): string {
  if (daysAway <= 7)  return 'var(--criterion-red)'
  if (daysAway <= 30) return 'var(--criterion-amber)'
  return 'var(--criterion-green)'
}

export default function UpcomingDeadlines() {
  const [opps, setOpps] = useState<DeadlineOpp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/deadlines', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setOpps(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || opps.length === 0) return null

  const now = new Date()

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming Deadlines</h2>
        <Link href="/dashboard/calendar" className="text-xs underline" style={{ color: 'var(--criterion-blue)' }}>
          Full calendar →
        </Link>
      </div>
      <div className="space-y-2">
        {opps.map(opp => {
          const daysAway = Math.ceil(
            (new Date(opp.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
          const color = urgencyColor(daysAway)
          const label = new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const criterionLabel = opp.criterion
            ? CRITERION_LABELS[opp.criterion as CriterionType] ?? opp.criterion
            : null
          return (
            <div key={opp.id} className="flex items-center gap-3">
              <div
                className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold tabular-nums"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
              >
                {label}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{opp.title}</p>
                {criterionLabel && (
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>{criterionLabel}</p>
                )}
              </div>
              <span className="shrink-0 text-xs" style={{ color }}>
                {daysAway === 0 ? 'Today'
                  : daysAway < 0 ? `${Math.abs(daysAway)}d late`
                  : `${daysAway}d`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
