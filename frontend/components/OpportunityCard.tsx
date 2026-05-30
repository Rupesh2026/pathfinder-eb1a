'use client'

import { useTransition } from 'react'
import { dismissOpportunity, markApplied } from '@/app/actions/opportunities'
import type { Opportunity } from '@/lib/types'
import { CRITERION_LABELS } from '@/lib/types'
import { getModeBadge, countryLabel } from '@/lib/opportunity-visibility'

type Props = {
  opportunity: Opportunity
}

const TYPE_LABELS: Record<string, string> = {
  cfp: 'CFP', judging: 'Judging', speaking: 'Speaking',
  award: 'Award', podcast: 'Podcast', grant: 'Grant', peer_review: 'Peer Review',
}

const TYPE_COLORS: Record<string, string> = {
  cfp: 'bg-blue-100 text-blue-700',
  judging: 'bg-purple-100 text-purple-700',
  speaking: 'bg-green-100 text-green-700',
  award: 'bg-yellow-100 text-yellow-700',
  podcast: 'bg-pink-100 text-pink-700',
  grant: 'bg-orange-100 text-orange-700',
  peer_review: 'bg-indigo-100 text-indigo-700',
}

export default function OpportunityCard({ opportunity: opp }: Props) {
  const [isPending, startTransition] = useTransition()
  const modeBadge = getModeBadge(opp.delivery_mode)
  const place = countryLabel(opp)

  function handleDismiss() {
    startTransition(async () => { await dismissOpportunity(opp.id) })
  }

  function handleApply() {
    startTransition(async () => { await markApplied(opp.id) })
  }

  if (opp.dismissed || opp.applied) return null

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-5 transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">

          {/* Tag row: type · criterion · mode badge · score */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[opp.type] ?? 'bg-gray-100 text-gray-600'}`}>
              {TYPE_LABELS[opp.type] ?? opp.type}
            </span>
            {opp.criterion && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                {CRITERION_LABELS[opp.criterion] ?? opp.criterion}
              </span>
            )}
            {/* Mode badge — green=online, amber=in-person, purple=hybrid */}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${modeBadge.classes}`}>
              {modeBadge.label}
            </span>
            {opp.priority_score != null && (
              <span className="ml-auto text-xs font-semibold text-indigo-600">
                Score: {Math.round(opp.priority_score)}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-gray-900">{opp.title}</h3>

          {opp.description && (
            <p className="text-sm text-gray-500">{opp.description}</p>
          )}

          {/* Location + deadline + link row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span>{opp.is_us ? '📍' : '🌐'}</span>
              <span className="text-gray-500">{place}</span>
            </span>
            {opp.deadline && (
              <span>Deadline: {opp.deadline}</span>
            )}
            {opp.url && (
              <a href={opp.url} target="_blank" rel="noopener noreferrer"
                className="text-indigo-500 hover:underline">
                View →
              </a>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            onClick={handleApply}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Mark applied
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
