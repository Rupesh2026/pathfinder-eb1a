'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addLetter, updateLetterStatus, deleteLetter } from '@/app/actions/letters'
import { CRITERION_LABELS, ALL_CRITERIA, type CriterionType } from '@/lib/types'

type LetterStatus = 'not_asked' | 'asked' | 'agreed' | 'draft_sent' | 'received'

type Letter = {
  id: string
  recommender_name: string
  recommender_title: string | null
  recommender_institution: string | null
  relationship: string | null
  criteria: CriterionType[] | null
  status: LetterStatus
  notes: string | null
  target_date: string | null
  requested_at: string | null
  received_at: string | null
  created_at: string
}

const STATUS_LABELS: Record<LetterStatus, string> = {
  not_asked: 'Not asked',
  asked: 'Asked',
  agreed: 'Agreed',
  draft_sent: 'Draft sent',
  received: 'Received',
}

const STATUS_COLORS: Record<LetterStatus, { bg: string; color: string }> = {
  not_asked: { bg: 'var(--bg-raised)',    color: 'var(--text-muted)' },
  asked:     { bg: 'var(--amber-subtle)', color: 'var(--amber)' },
  agreed:    { bg: 'var(--blue-subtle)',  color: 'var(--blue)' },
  draft_sent:{ bg: 'var(--blue-subtle)',  color: 'var(--blue)' },
  received:  { bg: 'var(--green-subtle)', color: 'var(--green)' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedCriteria, setSelectedCriteria] = useState<CriterionType[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('recommendation_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setLetters((data as Letter[]) ?? [])
          setLoading(false)
        })
    })
  }, [])

  async function handleAdd(formData: FormData) {
    formData.set('criteria', selectedCriteria.join(','))
    setError(null)
    startTransition(async () => {
      const result = await addLetter(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setShowForm(false)
        setSelectedCriteria([])
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('recommendation_letters')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          setLetters((data as Letter[]) ?? [])
        }
      }
    })
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      setLetters(prev => prev.map(l => l.id === id ? { ...l, status: status as LetterStatus } : l))
      await updateLetterStatus(id, status)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteLetter(id)
      if (result?.error) setError(result.error)
      else setLetters(prev => prev.filter(l => l.id !== id))
    })
  }

  const receivedCount = letters.filter(l => l.status === 'received').length
  const inputStyle = {
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    border: '0.5px solid var(--card-border-color)',
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recommendation Letters</h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Track expert letters for your EB-1A petition. USCIS expects 3–10 strong letters.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {letters.length > 0 && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: receivedCount >= 3 ? 'var(--green-subtle)' : 'var(--amber-subtle)',
                color: receivedCount >= 3 ? 'var(--green)' : 'var(--amber)',
              }}
            >
              {receivedCount}/3 received
            </span>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {showForm ? 'Cancel' : '+ Add Recommender'}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--red-subtle)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
          {error}
        </p>
      )}

      {/* Add form */}
      {showForm && (
        <form
          action={handleAdd}
          className="card p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Add Recommender</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
              <input name="recommender_name" required placeholder="Dr. Jane Smith"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Title</label>
              <input name="recommender_title" placeholder="Professor, CTO, Director"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Institution</label>
              <input name="recommender_institution" placeholder="MIT, Google, OpenAI"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Relationship</label>
              <input name="relationship" placeholder="Collaborator, Manager, Colleague"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Need by</label>
              <input name="target_date" type="date"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Criteria multi-select */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Criteria this letter strengthens
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CRITERIA.map(c => {
                const selected = selectedCriteria.includes(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCriteria(prev =>
                      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                    )}
                    className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{
                      background: selected ? 'var(--criterion-blue)' : 'var(--secondary-bg)',
                      color: selected ? '#fff' : 'var(--text-secondary)',
                      border: selected ? 'none' : '0.5px solid var(--card-border-color)',
                    }}
                  >
                    {CRITERION_LABELS[c]}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Notes <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <textarea name="notes" rows={2} placeholder="What evidence to highlight, preferred format, etc."
              className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {isPending ? 'Saving…' : 'Add recommender'}
          </button>
        </form>
      )}

      {/* Letters list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'var(--secondary-bg)' }} />
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="card px-4 py-12 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No recommenders added yet.</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Add the experts you plan to ask for recommendation letters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map(letter => {
            const statusStyle = STATUS_COLORS[letter.status]
            return (
              <div
                key={letter.id}
                className="card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {letter.recommender_name}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {STATUS_LABELS[letter.status]}
                      </span>
                    </div>

                    {(letter.recommender_title || letter.recommender_institution) && (
                      <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {[letter.recommender_title, letter.recommender_institution].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {letter.relationship && (
                      <p className="text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                        Relationship: {letter.relationship}
                      </p>
                    )}

                    {letter.criteria && letter.criteria.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {letter.criteria.map(c => (
                          <span
                            key={c}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{ background: 'var(--secondary-bg)', color: 'var(--text-tertiary)', border: '0.5px solid var(--card-border-color)' }}
                          >
                            {CRITERION_LABELS[c]}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {letter.target_date && (
                        <span>Need by {formatDate(letter.target_date)}</span>
                      )}
                      {letter.received_at && (
                        <span style={{ color: 'var(--criterion-green)' }}>Received {formatDate(letter.received_at)}</span>
                      )}
                    </div>

                    {letter.notes && (
                      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {letter.notes}
                      </p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <select
                      value={letter.status}
                      onChange={e => handleStatusChange(letter.id, e.target.value)}
                      disabled={isPending}
                      className="rounded-lg px-2 py-1 text-xs outline-none disabled:opacity-50"
                      style={{ background: 'var(--secondary-bg)', color: 'var(--text-primary)', border: '0.5px solid var(--card-border-color)' }}
                    >
                      {(Object.entries(STATUS_LABELS) as [LetterStatus, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(letter.id)}
                      disabled={isPending}
                      className="text-xs disabled:opacity-50 hover:underline"
                      style={{ color: 'var(--criterion-red)' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
