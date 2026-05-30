'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addEvidence, deleteEvidence } from '@/app/actions/evidence'
import { CRITERION_LABELS, ALL_CRITERIA, type CriterionType } from '@/lib/types'
import type { Evidence } from '@/lib/types'
import { getRFEFlags } from '@/lib/rfe-rules'

type PatternAggregate = {
  criterion: string
  total_docs: number
  approval_rate: number | null
  top_patterns: { pattern: string; count: number }[] | null
  rfe_triggers: { trigger: string; frequency: number }[] | null
  updated_at: string
}

const NEXT_ACTIONS: Record<CriterionType, string[]> = {
  awards: ['Apply to Forbes 30 Under 30 (AI & Data)', 'Nominate for IEEE Computer Society Award', 'Submit to ACM Distinguished Member'],
  memberships: ['Apply for IEEE Senior Membership', 'Apply for ACM Senior Member', 'Apply to invitation-only AI advisory council'],
  press: ['Pitch TechCrunch as AI safety source', 'Apply as podcast guest (Lex Fridman, 80k Hours)', 'Write commentary for MIT Technology Review'],
  judging: ['Apply as NeurIPS 2025 Area Chair', 'Join Nature Machine Intelligence reviewer pool', 'Apply as ICML 2025 program committee member'],
  original_contributions: ['File provisional patent for core method', 'Open-source key implementation with documentation', 'Publish technical deep-dive on most-cited paper'],
  scholarly_articles: ['Submit extended version to TPAMI or JMLR', 'Write survey paper positioning your work', 'Respond to IEEE journal review invitations'],
  artistic_exhibitions: ['Document exhibitions with catalog and press coverage', 'Compile portfolio of featured work with citations', 'Apply to selective juried shows in your field'],
  critical_role: ['Document leadership scope with org chart', 'Get company letterhead confirming title and responsibilities', 'Collect evidence of decisions and organizational impact'],
  high_salary: ['Obtain official pay stubs and W-2s', 'Get Levels.fyi or Radford benchmarking report', 'Collect offer letters showing total compensation'],
  commercial_success: ['Document revenue from products you built', 'Collect download/usage metrics for open-source work', 'Get signed letter attributing business impact to your work'],
}

function scoreColor(score: number): string {
  if (score >= 65) return 'var(--criterion-green)'
  if (score >= 40) return 'var(--criterion-blue)'
  if (score >= 20) return 'var(--criterion-amber)'
  return 'var(--criterion-red)'
}

function scoreBg(score: number): string {
  if (score >= 65) return '#E8F7F2'
  if (score >= 40) return '#E8F0FB'
  if (score >= 20) return '#FDF5E0'
  return '#FDEAEA'
}

function tierLabel(score: number): string {
  if (score >= 65) return 'Strong'
  if (score >= 40) return 'Building'
  if (score >= 20) return 'Weak'
  return 'Gap'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CriterionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const criterion = params.criterion as string
  const isValid = ALL_CRITERIA.includes(criterion as CriterionType)

  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [patterns, setPatterns] = useState<PatternAggregate | null>(null)

  useEffect(() => {
    if (!isValid) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('evidence')
        .select('*')
        .eq('user_id', user.id)
        .eq('criterion', criterion)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setEvidence(data ?? [])
          setLoadingData(false)
        })
    })
    // Load USCIS precedent patterns (gracefully absent if KB not yet populated)
    fetch(`/api/criteria/${criterion}/patterns`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPatterns(d) })
      .catch(() => {})
  }, [criterion, isValid])

  const scored = evidence.filter(e => e.score != null)
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, e) => sum + (e.score ?? 0), 0) / scored.length)
    : 0

  async function handleAdd(formData: FormData) {
    setFormError(null)
    startTransition(async () => {
      const result = await addEvidence(formData)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setShowForm(false)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('evidence')
            .select('*')
            .eq('user_id', user.id)
            .eq('criterion', criterion)
            .order('created_at', { ascending: false })
          const items: Evidence[] = data ?? []
          setEvidence(items)

          // Auto-score the newest item (first after re-fetch)
          const newest = items[0]
          if (newest && newest.score == null) {
            try {
              const scoreRes = await fetch('/api/evidence/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  criterion,
                  title: newest.title,
                  description: newest.description,
                  evidence_id: newest.id,
                }),
              })
              if (scoreRes.ok) {
                const { score, tier } = await scoreRes.json()
                setEvidence(prev => prev.map(e =>
                  e.id === newest.id ? { ...e, score, strength_tier: tier } : e
                ))
              }
            } catch { /* scoring failure is non-fatal */ }
          }
        }
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteEvidence(id)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setEvidence(prev => prev.filter(e => e.id !== id))
      }
    })
  }

  if (!isValid) {
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Unknown criterion.</p>
        <button onClick={() => router.back()} className="text-xs underline" style={{ color: 'var(--criterion-blue)' }}>
          ← Go back
        </button>
      </div>
    )
  }

  const label = CRITERION_LABELS[criterion as CriterionType]
  const nextActions = NEXT_ACTIONS[criterion as CriterionType]
  const inputStyle = {
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    border: '0.5px solid var(--card-border-color)',
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-3 flex items-center gap-1 text-xs hover:underline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          ← Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{label}</h1>
          {evidence.length > 0 && (
            <span
              className="rounded-full px-3 py-1 text-sm font-semibold"
              style={{ background: scoreBg(avgScore), color: scoreColor(avgScore) }}
            >
              {avgScore} · {tierLabel(avgScore)}
            </span>
          )}
        </div>

        {evidence.length > 0 && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--secondary-bg)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${avgScore}%`, background: scoreColor(avgScore) }}
            />
          </div>
        )}
      </div>

      {/* ── Evidence History ─────────────────────── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Evidence History
            {evidence.length > 0 && (
              <span className="ml-2 font-normal" style={{ color: 'var(--text-tertiary)' }}>
                ({evidence.length} {evidence.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: '#111827', color: '#fff' }}
          >
            {showForm ? 'Cancel' : '+ Add Evidence'}
          </button>
        </div>

        {formError && (
          <p className="rounded-lg px-3 py-2 text-xs" style={{ background: '#FDEAEA', color: 'var(--criterion-red)' }}>
            {formError}
          </p>
        )}

        {/* Add form */}
        {showForm && (
          <form
            action={handleAdd}
            className="space-y-3 rounded-lg p-4"
            style={{ background: 'var(--secondary-bg)', border: '0.5px solid var(--card-border-color)' }}
          >
            <input type="hidden" name="criterion" value={criterion} />

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Title</label>
              <input
                name="title"
                type="text"
                required
                placeholder={`e.g. ${criterion === 'awards' ? 'Forbes 30 Under 30 nomination' : criterion === 'judging' ? 'NeurIPS 2025 Area Chair' : 'Evidence title'}`}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Description <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Brief description"
                className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                URL <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
              </label>
              <input
                name="url"
                type="url"
                placeholder="https://..."
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
              style={{ background: '#111827', color: '#fff' }}
            >
              {isPending ? 'Saving…' : 'Save evidence'}
            </button>
          </form>
        )}

        {/* History list */}
        {loadingData ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--secondary-bg)' }} />
            ))}
          </div>
        ) : evidence.length === 0 ? (
          <div className="rounded-lg px-4 py-10 text-center" style={{ background: 'var(--secondary-bg)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No evidence recorded yet.</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Click "+ Add Evidence" to start building this criterion.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {evidence.map(item => (
              <div
                key={item.id}
                className="rounded-lg p-4"
                style={{ background: 'var(--secondary-bg)', border: '0.5px solid var(--card-border-color)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      {item.score != null && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ background: scoreBg(item.score), color: scoreColor(item.score) }}
                        >
                          {item.score} · {tierLabel(item.score)}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {item.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Added {formatDate(item.created_at)}
                      </span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                          style={{ color: 'var(--criterion-blue)' }}
                        >
                          View source →
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                    className="shrink-0 text-xs disabled:opacity-50 hover:underline"
                    style={{ color: 'var(--criterion-red)' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RFE Risk Alerts ─────────────────────── */}
      {(() => {
        const flags = getRFEFlags(criterion as CriterionType, evidence, avgScore)
        if (flags.length === 0) return null
        return (
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>RFE Risk Alerts</h2>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#FDEAEA', color: 'var(--criterion-red)' }}>
                {flags.length} {flags.length === 1 ? 'flag' : 'flags'}
              </span>
            </div>
            <div className="space-y-3">
              {flags.map((flag, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 space-y-1"
                  style={{
                    background: flag.level === 'high' ? '#FDEAEA' : '#FDF5E0',
                    border: `0.5px solid ${flag.level === 'high' ? 'var(--criterion-red)' : 'var(--criterion-amber)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: flag.level === 'high' ? 'var(--criterion-red)' : 'var(--criterion-amber)' }}>
                      {flag.level === 'high' ? '▲ High' : '⚠ Moderate'}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{flag.flag}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{flag.detail}</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Fix: {flag.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Precedent Insights ──────────────────── */}
      {patterns && patterns.total_docs > 0 && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Precedent Insights
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: 'var(--urgency-green-bg)', color: 'var(--urgency-green-text)' }}
            >
              {patterns.total_docs} AAO decisions
            </span>
          </div>

          {patterns.approval_rate != null && (
            <div className="flex items-center gap-3">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full"
                style={{ background: 'var(--secondary-bg)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.round(patterns.approval_rate * 100)}%`, background: 'var(--criterion-green)' }}
                />
              </div>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--criterion-green)' }}>
                {Math.round(patterns.approval_rate * 100)}% approval rate
              </span>
            </div>
          )}

          {(patterns.top_patterns ?? []).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                What USCIS approves:
              </p>
              <ul className="space-y-1">
                {(patterns.top_patterns ?? []).slice(0, 3).map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span style={{ color: 'var(--criterion-green)' }}>✓</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(patterns.rfe_triggers ?? []).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Common RFE triggers:
              </p>
              <ul className="space-y-1">
                {(patterns.rfe_triggers ?? []).slice(0, 3).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span style={{ color: 'var(--criterion-amber)' }}>⚠</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.trigger}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Suggested Next Actions ───────────────── */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Suggested Next Actions</h2>
        <ul className="space-y-2">
          {nextActions.map((action, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sm" style={{ color: scoreColor(avgScore) }}>→</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
