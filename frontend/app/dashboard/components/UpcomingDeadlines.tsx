'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'
import { Calendar, ArrowRight } from 'lucide-react'

type DeadlineOpp = { id: string; title: string; criterion: string | null; deadline: string }

function urgencyColor(days: number): string {
  if (days <= 7)  return 'var(--red)'
  if (days <= 30) return 'var(--amber)'
  return 'var(--green)'
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

  if (!loading && opps.length === 0) return null

  const now = new Date()

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Deadlines</h2>
        </div>
        <Link href="/dashboard/calendar" className="btn-ghost py-1">
          Calendar <ArrowRight size={11} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-5 w-12 rounded-md" />
              <div className="skeleton h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {opps.map(opp => {
            const daysAway = Math.ceil((new Date(opp.deadline).getTime() - now.getTime()) / 86_400_000)
            const color = urgencyColor(daysAway)
            const dateLabel = new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const criterionLabel = opp.criterion ? CRITERION_LABELS[opp.criterion as CriterionType] ?? opp.criterion : null

            return (
              <div key={opp.id} className="flex items-center gap-3 rounded-lg p-2.5" style={{ background: 'var(--bg-raised)' }}>
                <div
                  className="flex-shrink-0 rounded-md px-2 py-1 text-[10px] font-bold tabular-nums text-center min-w-[48px]"
                  style={{ background: `${color}18`, color }}
                >
                  {dateLabel}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{opp.title}</p>
                  {criterionLabel && (
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{criterionLabel}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold flex-shrink-0 tabular-nums" style={{ color }}>
                  {daysAway === 0 ? 'Today'
                    : daysAway < 0 ? `${Math.abs(daysAway)}d late`
                    : `${daysAway}d`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
