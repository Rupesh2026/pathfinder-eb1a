'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addEvidence, deleteEvidence } from '@/app/actions/evidence'
import { CRITERION_LABELS, ALL_CRITERIA, type CriterionType } from '@/lib/types'

// This page fetches data via a server component wrapper below.
// The interactive form and delete buttons need client-side state.

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { Evidence } from '@/lib/types'

const TIER_COLORS = {
  strong: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  weak: 'bg-red-100 text-red-700',
}

function ScoreBadge({ score, tier }: { score: number | null; tier: string | null }) {
  if (score == null) return <span className="text-xs text-gray-400">Unscored</span>
  const color = tier ? (TIER_COLORS[tier as keyof typeof TIER_COLORS] ?? 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-600'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}/100 {tier ? `· ${tier}` : ''}
    </span>
  )
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [focusedCriteria, setFocusedCriteria] = useState<CriterionType[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      Promise.all([
        supabase.from('evidence').select('*').eq('user_id', user.id).order('criterion'),
        supabase.from('profiles').select('focused_criteria').eq('user_id', user.id).single(),
      ]).then(([evidenceRes, profileRes]) => {
        setEvidence(evidenceRes.data ?? [])
        const fc = profileRes.data?.focused_criteria
        if (fc && fc.length > 0) setFocusedCriteria(fc as CriterionType[])
      })
    })
  }, [])

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteEvidence(id)
      if (result?.error) {
        setError(result.error)
      } else {
        setEvidence((prev) => prev.filter((e) => e.id !== id))
      }
    })
  }

  async function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addEvidence(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setShowForm(false)
        router.refresh()
        // Re-fetch
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('evidence').select('*').eq('user_id', user.id).order('criterion')
          setEvidence(data ?? [])
        }
      }
    })
  }

  // Group by criterion
  const grouped = ALL_CRITERIA.reduce<Record<CriterionType, Evidence[]>>((acc, c) => {
    acc[c] = evidence.filter((e) => e.criterion === c)
    return acc
  }, {} as Record<CriterionType, Evidence[]>)

  const visibleCriteria = focusedCriteria.length > 0
    ? ALL_CRITERIA.filter(c => focusedCriteria.includes(c))
    : ALL_CRITERIA

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Evidence</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {showForm ? 'Cancel' : '+ Add evidence'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <form action={handleAdd} className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="font-medium text-gray-900">New evidence item</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">EB-1A Criterion</label>
            <select name="criterion" required defaultValue=""
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="" disabled>Select a criterion</option>
              {visibleCriteria.map((c) => (
                <option key={c} value={c}>{CRITERION_LABELS[c]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input name="title" type="text" required
              placeholder="e.g. NeurIPS 2024 paper"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows={2}
              placeholder="Brief description of this evidence"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL <span className="text-gray-400">(optional)</span>
            </label>
            <input name="url" type="url" placeholder="https://..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <button type="submit" disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
            {isPending ? 'Saving...' : 'Save evidence'}
          </button>
        </form>
      )}

      {/* Evidence grouped by criterion */}
      <div className="space-y-6">
        {visibleCriteria.map((criterion) => {
          const items = grouped[criterion]
          return (
            <div key={criterion}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700">{CRITERION_LABELS[criterion]}</h3>
                {items.length === 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">No evidence</span>
                )}
              </div>

              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{item.title}</span>
                          <ScoreBadge score={item.score} tier={item.strength_tier} />
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-500 hover:underline">
                            View source
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="shrink-0 text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-400">
                  No evidence for this criterion yet.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
