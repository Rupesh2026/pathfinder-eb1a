'use client'

import { useRouter } from 'next/navigation'
import type { CriterionData } from '../hooks/useDashboard'

function getCriterionColor(score: number): string {
  if (score >= 65) return 'var(--criterion-green)'
  if (score >= 40) return 'var(--criterion-blue)'
  if (score >= 20) return 'var(--criterion-amber)'
  return 'var(--criterion-red)'
}

function TierBadge({ score }: { score: number }) {
  const label = score >= 65 ? 'Strong' : score >= 40 ? 'Building' : score >= 20 ? 'Weak' : 'Gap'
  const color = getCriterionColor(score)
  const bg = score >= 65 ? '#E8F7F2' : score >= 40 ? '#E8F0FB' : score >= 20 ? '#FDF5E0' : '#FDEAEA'
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ color, background: bg }}>
      {label}
    </span>
  )
}

type Props = {
  criteria: CriterionData[]
  loading: boolean
  focused?: boolean
}

export default function CriteriaPanel({ criteria, loading, focused }: Props) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="card p-5">
        <div className="mb-4 h-5 w-32 animate-pulse rounded" style={{ background: 'var(--card-border-color)' }} />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-40 animate-pulse rounded" style={{ background: 'var(--card-border-color)' }} />
              <div className="h-2 w-full animate-pulse rounded-full" style={{ background: 'var(--card-border-color)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Evidence Strength</h2>
          {focused && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Showing {criteria.length} focused {criteria.length === 1 ? 'criterion' : 'criteria'}
            </p>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {criteria.filter(c => c.score >= 65).length} of {criteria.length} strong
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {criteria.map((c) => (
          <button
            key={c.criterion}
            onClick={() => router.push(`/dashboard/evidence/${c.criterion}`)}
            className="group rounded-lg p-3 text-left transition-colors hover:opacity-80"
            style={{ background: 'var(--secondary-bg)', border: '0.5px solid var(--card-border-color)' }}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                {c.label}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {c.evidence_count > 0 && (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {c.evidence_count} {c.evidence_count === 1 ? 'item' : 'items'}
                  </span>
                )}
                <TierBadge score={c.score} />
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--card-border-color)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${c.score}%`, background: getCriterionColor(c.score) }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: getCriterionColor(c.score) }}>
                {c.score}/100
              </span>
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }}>
                View history →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
