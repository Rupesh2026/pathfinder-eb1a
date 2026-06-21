'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addEvidence, deleteEvidence } from '@/app/actions/evidence'
import { CRITERION_LABELS, ALL_CRITERIA, type CriterionType } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import type { Evidence } from '@/lib/types'
import { Shield, Plus, X, ExternalLink, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react'

const CRITERION_COLORS: Record<string, string> = {
  judging: 'var(--c-judging)',
  awards: 'var(--c-awards)',
  press: 'var(--c-press)',
  memberships: 'var(--c-memberships)',
  original_contributions: 'var(--c-contributions)',
  scholarly_articles: 'var(--c-scholarly)',
  critical_role: 'var(--c-critical_role)',
  high_salary: 'var(--c-high_salary)',
  commercial_success: 'var(--c-commercial)',
  artistic_exhibitions: 'var(--c-exhibitions)',
}

function ScoreBadge({ score, tier }: { score: number | null; tier: string | null }) {
  if (score == null) return <span className="badge badge-muted">Unscored</span>
  if (tier === 'strong') return <span className="badge badge-green">{score}/100 · Strong</span>
  if (tier === 'medium') return <span className="badge badge-amber">{score}/100 · Medium</span>
  return <span className="badge" style={{ background: 'rgba(234,88,12,0.1)', color: 'var(--c-critical_role)', border: '1px solid rgba(234,88,12,0.25)' }}>{score}/100 · Weak</span>
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
      if (result?.error) setError(result.error)
      else setEvidence(prev => prev.filter(e => e.id !== id))
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
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('evidence').select('*').eq('user_id', user.id).order('criterion')
          setEvidence(data ?? [])
        }
      }
    })
  }

  const grouped = ALL_CRITERIA.reduce<Record<CriterionType, Evidence[]>>((acc, c) => {
    acc[c] = evidence.filter(e => e.criterion === c)
    return acc
  }, {} as Record<CriterionType, Evidence[]>)

  const visibleCriteria = focusedCriteria.length > 0 ? ALL_CRITERIA.filter(c => focusedCriteria.includes(c)) : ALL_CRITERIA
  const totalCount = evidence.length
  const coveredCount = visibleCriteria.filter(c => grouped[c].length > 0).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
          >
            <Shield size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Evidence</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {coveredCount}/{visibleCriteria.length} criteria covered · {totalCount} total items
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Add evidence'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs"
          style={{ background: 'var(--red-subtle)', color: 'var(--red)', border: '1px solid var(--red-border)' }}
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card p-5 animate-slide-up">
          <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New evidence item</h3>
          <form action={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">EB-1A Criterion</label>
                <select name="criterion" required defaultValue="" className="input">
                  <option value="" disabled>Select a criterion</option>
                  {visibleCriteria.map(c => (
                    <option key={c} value={c}>{CRITERION_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input name="title" type="text" required placeholder="e.g. NeurIPS 2024 paper" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" rows={2} placeholder="Brief description of this evidence" className="input resize-none" />
            </div>
            <div>
              <label className="label">URL <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input name="url" type="url" placeholder="https://..." className="input" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? 'Saving…' : 'Save evidence'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evidence by criterion */}
      <div className="space-y-4">
        {visibleCriteria.map(criterion => {
          const items = grouped[criterion]
          const accentColor = CRITERION_COLORS[criterion] ?? 'var(--accent)'
          const hasCoverage = items.length > 0
          const avgScore = hasCoverage ? Math.round(items.reduce((s, i) => s + (i.score ?? 0), 0) / items.length) : 0

          return (
            <div key={criterion} className="card overflow-hidden">
              {/* Criterion header */}
              <Link
                href={`/dashboard/evidence/${criterion}`}
                className="flex items-center gap-3 p-4 transition-colors group"
                style={{ borderBottom: hasCoverage ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ background: accentColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {CRITERION_LABELS[criterion]}
                  </p>
                  {hasCoverage && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {items.length} {items.length === 1 ? 'item' : 'items'} · avg {avgScore}/100
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!hasCoverage ? (
                    <span className="badge" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}>No evidence</span>
                  ) : avgScore >= 65 ? (
                    <span className="badge badge-green flex items-center gap-1">
                      <TrendingUp size={9} /> Strong
                    </span>
                  ) : avgScore >= 40 ? (
                    <span className="badge badge-amber">Building</span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(234,88,12,0.1)', color: 'var(--c-critical_role)', border: '1px solid rgba(234,88,12,0.25)' }}>Weak</span>
                  )}
                  <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>

              {/* Evidence items */}
              {hasCoverage && (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {items.map(item => (
                    <div key={item.id} className="flex items-start gap-4 px-4 py-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                          <ScoreBadge score={item.score} tier={item.strength_tier} />
                        </div>
                        {item.description && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs"
                            style={{ color: 'var(--accent)' }}
                          >
                            View source <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="btn-ghost px-2 py-1 flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--red)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty slot */}
              {!hasCoverage && (
                <div className="px-4 pb-4">
                  <div
                    className="flex items-center justify-center rounded-lg py-4 text-xs"
                    style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
                  >
                    No evidence yet — add some above or{' '}
                    <Link href={`/dashboard/evidence/${criterion}`} style={{ color: 'var(--accent)', marginLeft: 4 }}>
                      view suggestions
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
