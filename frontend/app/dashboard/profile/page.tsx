'use client'

import { useState, useEffect } from 'react'
import {
  ALL_CRITERIA, CRITERION_LABELS, SALARY_BAND_LABELS,
  type CriterionType, type SalaryBand, type FilingUrgency,
} from '@/lib/types'
import { Settings, Plus, X, Check, AlertCircle } from 'lucide-react'

type EducationEntry = { degree: string; field: string; institution: string; year: string }

const CRITERION_DESCRIPTIONS: Record<CriterionType, string> = {
  awards: 'National or international prizes (Forbes 30U30, IEEE, Nobel)',
  memberships: 'Invitation-only panels, advisory boards, selective organizations',
  press: 'Major media coverage written about you (TechCrunch, Wired, MIT Tech Review)',
  judging: 'Conference program committees, journal reviewer roles (NeurIPS, Nature)',
  original_contributions: 'Patents, breakthrough methods, or foundational research',
  scholarly_articles: 'First/co-author publications in peer-reviewed journals',
  artistic_exhibitions: 'Exhibitions, performances, or showcases of creative work',
  critical_role: 'Leadership roles with measurable organizational impact',
  high_salary: 'Top compensation relative to peers in your field',
  commercial_success: 'Revenue, wide adoption, or measurable product impact',
}

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

function scoreColor(score: number) {
  if (score >= 65) return 'var(--green)'
  if (score >= 40) return 'var(--amber)'
  if (score > 0)  return 'var(--c-critical_role)'
  return 'var(--text-muted)'
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
    setFocusedCriteria(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  async function handleSave() {
    if (focusedCriteria.length > 0 && focusedCriteria.length < 3) {
      setError('Select at least 3 criteria, or leave all unselected to show all 10.')
      return
    }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain, role, salary_band: salaryBand, country_of_origin: countryOfOrigin,
          target_field: targetField, filing_urgency: filingUrgency,
          focused_criteria: focusedCriteria, education,
          target_filing_date: targetFilingDate || null,
        }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.error ?? 'Save failed') }
      else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch { setError('Save failed') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-6 space-y-4">
            <div className="skeleton h-5 w-32" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(j => <div key={j} className="skeleton h-10 rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
          >
            <Settings size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="badge badge-green"><Check size={10} /> Saved</span>}
          {error && <span className="text-xs" style={{ color: 'var(--red)' }}>{error}</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Personal info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Domain', value: domain, setter: setDomain, placeholder: 'e.g. AI/ML Research' },
            { label: 'Role', value: role, setter: setRole, placeholder: 'e.g. Senior ML Engineer' },
            { label: 'Country of origin', value: countryOfOrigin, setter: setCountryOfOrigin, placeholder: 'e.g. India' },
            { label: 'Target field (USCIS)', value: targetField, setter: setTargetField, placeholder: 'e.g. Artificial Intelligence' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="label">{label}</label>
              <input
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                className="input"
              />
            </div>
          ))}
          <div>
            <label className="label">Salary band</label>
            <select value={salaryBand} onChange={e => setSalaryBand(e.target.value as SalaryBand)} className="input">
              {(Object.entries(SALARY_BAND_LABELS) as [SalaryBand, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Filing urgency</label>
            <select value={filingUrgency} onChange={e => setFilingUrgency(e.target.value as FilingUrgency)} className="input">
              <option value="aggressive">Aggressive — file ASAP</option>
              <option value="balanced">Balanced — standard pace</option>
              <option value="building">Building — wide discovery net</option>
            </select>
          </div>
          <div>
            <label className="label">Target filing date <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
            <input type="date" value={targetFilingDate} onChange={e => setTargetFilingDate(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Education</h2>
          <button
            onClick={() => setEducation(prev => [...prev, { degree: '', field: '', institution: '', year: '' }])}
            className="btn-ghost text-xs"
            style={{ color: 'var(--accent)' }}
          >
            <Plus size={12} /> Add degree
          </button>
        </div>
        {education.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No education added yet.</p>
        ) : (
          <div className="space-y-3">
            {education.map((entry, i) => (
              <div key={i} className="r-edu-row grid grid-cols-9 gap-2 items-center">
                {[
                  { key: 'degree', placeholder: 'PhD/MS/BS', cols: 2 },
                  { key: 'field', placeholder: 'Computer Science', cols: 2 },
                  { key: 'institution', placeholder: 'MIT, Stanford…', cols: 3 },
                  { key: 'year', placeholder: '2020', cols: 1 },
                ].map(({ key, placeholder, cols }) => (
                  <input
                    key={key}
                    value={entry[key as keyof EducationEntry]}
                    onChange={e => setEducation(prev => prev.map((ed, idx) => idx === i ? { ...ed, [key]: e.target.value } : ed))}
                    placeholder={placeholder}
                    className={`input col-span-${cols} text-xs py-1.5`}
                  />
                ))}
                <button
                  onClick={() => setEducation(prev => prev.filter((_, idx) => idx !== i))}
                  className="col-span-1 btn-ghost justify-center p-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Criteria focus */}
      <div className="card p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Criteria focus</h2>
            {focusedCriteria.length > 0 && (
              <span className="badge badge-indigo">{focusedCriteria.length} selected</span>
            )}
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Select at least 3 criteria to focus your dashboard, opportunities, and scans.
            Leave all unselected to show all 10.
          </p>
        </div>

        {focusedCriteria.length > 0 && focusedCriteria.length < 3 && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
            style={{ background: 'var(--amber-subtle)', color: 'var(--amber)', border: '1px solid var(--amber-border)' }}
          >
            <AlertCircle size={12} />
            Select at least 3 criteria or clear all to show all 10.
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_CRITERIA.map(c => {
            const score = criterionScores[c] ?? 0
            const isSelected = focusedCriteria.includes(c)
            const accentColor = CRITERION_COLORS[c] ?? 'var(--accent)'

            return (
              <button
                key={c}
                onClick={() => toggleCriterion(c)}
                className="flex items-start gap-3 rounded-xl p-3 text-left transition-all"
                style={{
                  border: `1px solid ${isSelected ? accentColor + '60' : 'var(--border)'}`,
                  background: isSelected ? `${accentColor}08` : 'var(--bg-raised)',
                }}
              >
                <div
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                  style={{
                    background: isSelected ? accentColor : 'transparent',
                    border: `1.5px solid ${isSelected ? accentColor : 'var(--border-strong)'}`,
                    transition: 'all 0.12s ease',
                  }}
                >
                  {isSelected && <Check size={9} color="white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {CRITERION_LABELS[c]}
                    </span>
                    {score > 0 ? (
                      <span className="shrink-0 text-[10px] font-bold" style={{ color: scoreColor(score) }}>
                        {score}/100
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-muted)' }}>No evidence</span>
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {CRITERION_DESCRIPTIONS[c]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {focusedCriteria.length === 0 && (
          <div
            className="rounded-xl px-4 py-3 text-xs"
            style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
          >
            All 10 criteria will be shown across your dashboard.
          </div>
        )}
      </div>
    </div>
  )
}
