'use client'

import { CRITERION_LABELS, ALL_CRITERIA, type CriterionType } from '@/lib/types'

type Props = {
  scores: Partial<Record<CriterionType, number | null>>
}

function barColor(score: number | null | undefined): string {
  if (score == null) return 'bg-gray-200'
  if (score >= 65) return 'bg-green-500'
  if (score >= 40) return 'bg-yellow-400'
  return 'bg-red-400'
}

function labelColor(score: number | null | undefined): string {
  if (score == null) return 'text-gray-400'
  if (score >= 65) return 'text-green-700'
  if (score >= 40) return 'text-yellow-700'
  return 'text-red-700'
}

export default function CriteriaScoreChart({ scores }: Props) {
  return (
    <div className="space-y-3">
      {ALL_CRITERIA.map((criterion) => {
        const score = scores[criterion]
        const width = score != null ? `${score}%` : '0%'

        return (
          <div key={criterion}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {CRITERION_LABELS[criterion]}
              </span>
              <span className={`text-xs font-semibold ${labelColor(score)}`}>
                {score != null ? `${score}/100` : 'No evidence'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${barColor(score)}`}
                style={{ width }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
