'use client'

import { useState, useEffect } from 'react'
import {
  ALL_CRITERIA, CRITERION_LABELS, SALARY_BAND_LABELS,
  type CriterionType, type SalaryBand, type FilingUrgency,
} from '@/lib/types'

type EducationEntry = { degree: string; field: string; institution: string; year: string }

const CRITERION_DESCRIPTIONS: Record<CriterionType, string> = {
  awards: 'National or international prizes in your field (Forbes, IEEE, Nobel, etc.)',
  memberships: 'Invitation-only panels, advisory boards, and selective organizations',
  press: 'Major media coverage of you or your work (TechCrunch, MIT Tech Review, etc.)',
  judging: 'Conference program committees, journal reviewer roles (NeurIPS, Nature, etc.)',
  original_contributions: 'Patents, breakthrough methods, or foundational research',
  scholarly_articles: 'First/co-author publications in peer-reviewed journals or conferences',
  artistic_exhibitions: 'Exhibitions, performances, or showcases of creative work',
  critical_role: 'Leadership roles with measurable organizational or industry impact',
  high_salary: 'Top compensation relative to peers in your field ($300K+ benchmark)',
  commercial_success: 'Revenue, wide adoption, or measurable impact from products you built',
}

function getScoreColor(score: number): string {
  if (score >= 65) return 'var(--criterion-green)'
  if (score >= 40) return 'var(--criterion-blue)'
  if (score >= 20) return 'var(--criterion-amber)'
  return 'var(--criterion-red)'
}

function getScoreLabel(score: number): string {
  if (score >= 65) return 'Strong'
  if (score >= 40) return 'Building'
  if (score > 0) return 'Weak'
  return ''
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [domain, setDomain] = useState('')
  const [role, setRole] = useState('')
  const [salaryBand, setSalaryBand] = useState<SalaryBand>('300k_plus')
  const [countryOfOrigin, setCountryOfOrigin] = useState('')
  const [targetField, setTargetField] = useState('')
  const [filingUrgency, setFilingUrgency] = useState<FilingUrgency>('balanced')
  const [focusedCriteria, setFocusedCriteria] = useState<CriterionType[]>([])
  const [education, setEducation] = useState<EducationEntry[]>([])
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>({})
  const [targetFilingDate, setTargetFilingDate] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/profile', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setDomain(data.domain ?? '')
        setRole(data.role ?? '')
        setSalaryBand(data.salary_band ?? '300k_plus')
        setCountryOfOrigin(data.country_of_origin ?? '')
        setTargetField(data.target_field ?? '')
        setFilingUrgency(data.strategy_weights?.filing_urgency ?? 'balanced')
        setFocusedCriteria(data.focused_criteria ?? [])
        setEducation(data.education ?? [])
        setCriterionScores(data.criterion_scores ?? {})
        setTargetFilingDate(data.target_filing_date ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function toggleCriterion(c: CriterionType) {
    setFocusedCriteria(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  function addEducation() {
    setEducation(prev => [...prev, { degree: '', field: '', institution: '', year: '' }])
  }

  function updateEducation(i: number, key: keyof EducationEntry, value: string) {
    setEducation(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: value } : e))
  }

  function removeEducation(i: number) {
    setEducation(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (focusedCriteria.length > 0 && focusedCriteria.length < 3) {
      setError('Select at least 3 criteria, or leave all unselected to show all 10.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain, role,
          salary_band: salaryBand,
          country_of_origin: countryOfOrigin,
          target_field: targetField,
          filing_urgency: filingUrgency,
          focused_criteria: focusedCriteria,
          education,
          target_filing_date: targetFilingDate || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Save failed')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--secondary-bg)',
    color: 'var(--text-primary)',
    border: '0.5px solid var(--card-border-color)',
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-6">
            <div className="h-4 w-32 animate-pulse rounded" style={{ background: 'var(--card-border-color)' }} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-10 animate-pulse rounded-lg" style={{ background: 'var(--card-border-color)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-medium" style={{ color: 'var(--criterion-green)' }}>Saved</span>
          )}
          {error && (
            <span className="text-xs" style={{ color: 'var(--criterion-red)' }}>{error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: '#111827', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* ── Personal Info ─────────────────────── */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Personal Info</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Domain</label>
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. AI/ML Research"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Role</label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Senior ML Engineer"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Country of Origin</label>
            <input
              value={countryOfOrigin}
              onChange={e => setCountryOfOrigin(e.target.value)}
              placeholder="e.g. India"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Target Field</label>
            <input
              value={targetField}
              onChange={e => setTargetField(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Salary Band</label>
            <select
              value={salaryBand}
              onChange={e => setSalaryBand(e.target.value as SalaryBand)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              {(Object.entries(SALARY_BAND_LABELS) as [SalaryBand, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Filing Urgency</label>
            <select
              value={filingUrgency}
              onChange={e => setFilingUrgency(e.target.value as FilingUrgency)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              <option value="aggressive">Aggressive — file ASAP</option>
              <option value="balanced">Balanced — standard pace</option>
              <option value="building">Building — wide discovery net</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Target Filing Date <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <input
              type="date"
              value={targetFilingDate}
              onChange={e => setTargetFilingDate(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ── Education ─────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Education</h2>
          <button
            onClick={addEducation}
            className="text-xs font-medium"
            style={{ color: 'var(--criterion-blue)' }}
          >
            + Add
          </button>
        </div>

        {education.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            No education added. Click + Add to include your degrees.
          </p>
        ) : (
          <div className="space-y-3">
            {education.map((entry, i) => (
              <div key={i} className="grid grid-cols-9 gap-2 items-center">
                <input
                  value={entry.degree}
                  onChange={e => updateEducation(i, 'degree', e.target.value)}
                  placeholder="Degree"
                  className="col-span-2 rounded-lg px-3 py-2 text-xs outline-none"
                  style={inputStyle}
                />
                <input
                  value={entry.field}
                  onChange={e => updateEducation(i, 'field', e.target.value)}
                  placeholder="Field"
                  className="col-span-2 rounded-lg px-3 py-2 text-xs outline-none"
                  style={inputStyle}
                />
                <input
                  value={entry.institution}
                  onChange={e => updateEducation(i, 'institution', e.target.value)}
                  placeholder="Institution"
                  className="col-span-3 rounded-lg px-3 py-2 text-xs outline-none"
                  style={inputStyle}
                />
                <input
                  value={entry.year}
                  onChange={e => updateEducation(i, 'year', e.target.value)}
                  placeholder="Year"
                  className="col-span-1 rounded-lg px-3 py-2 text-xs outline-none"
                  style={inputStyle}
                />
                <button
                  onClick={() => removeEducation(i)}
                  className="col-span-1 text-sm leading-none text-center"
                  style={{ color: 'var(--criterion-red)' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Criteria Focus ────────────────────── */}
      <div className="card p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Criteria Focus</h2>
            {focusedCriteria.length > 0 && (
              <span className="text-xs font-medium" style={{ color: 'var(--criterion-blue)' }}>
                {focusedCriteria.length} selected
              </span>
            )}
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Choose the EB-1A criteria you are actively building toward (minimum 3).
            Only selected criteria will appear in your dashboard, opportunities, and scans.
            Leave all unselected to show all 10.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALL_CRITERIA.map(c => {
            const score = criterionScores[c] ?? 0
            const isSelected = focusedCriteria.includes(c)
            const scoreLabel = getScoreLabel(score)
            return (
              <button
                key={c}
                onClick={() => toggleCriterion(c)}
                className="flex items-start gap-3 rounded-lg p-3 text-left transition-all"
                style={{
                  border: isSelected
                    ? '1.5px solid var(--criterion-blue)'
                    : '0.5px solid var(--card-border-color)',
                  background: isSelected ? 'rgba(66,133,244,0.06)' : 'var(--secondary-bg)',
                }}
              >
                <div
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                  style={{
                    background: isSelected ? 'var(--criterion-blue)' : 'transparent',
                    border: isSelected ? 'none' : '1.5px solid var(--card-border-color)',
                  }}
                >
                  {isSelected && (
                    <span className="text-[10px] leading-none text-white font-bold">✓</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {CRITERION_LABELS[c]}
                    </span>
                    {score > 0 ? (
                      <span className="shrink-0 text-xs font-semibold" style={{ color: getScoreColor(score) }}>
                        {score} · {scoreLabel}
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        No evidence
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    {CRITERION_DESCRIPTIONS[c]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {focusedCriteria.length === 0 && (
          <p className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--secondary-bg)', color: 'var(--text-tertiary)' }}>
            No criteria selected — all 10 will be shown across your dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
