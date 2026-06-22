'use client'

import { useState, type ReactNode } from 'react'
import type { IntakeData } from '../types'

const TOTAL_STEPS = 9

interface Props {
  onSubmit: (data: IntakeData) => Promise<void>
  submitting?: boolean
}

const STEP_TITLES = [
  'Who You Are',
  'Your Work & Role',
  'Publications & Research',
  'Recognition & Awards',
  'Judging & Peer Review',
  'Media & Recognition',
  'Speaking & Community',
  'Original Contributions',
  'Readiness Context',
]

const STEP_HELPERS = [
  'USCIS needs to understand your professional identity and immigration context.',
  'Your seniority and role impact signal your critical importance to your field.',
  'Scholarly articles and citations are among the strongest EB-1A evidence.',
  'External recognition — especially from outside your employer — carries significant weight.',
  'Judging others\' work is one of the fastest criteria to earn and often overlooked.',
  'Media coverage about you (not by you) demonstrates field-wide recognition.',
  'Speaking at recognized venues shows the field values your expertise.',
  'Original contributions that others have adopted are powerful evidence of major significance.',
  'Helps us calibrate your roadmap to your actual timeline and situation.',
]

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '11px 15px',
            borderRadius: 10,
            border: `1px solid ${value === opt.value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
            background: value === opt.value ? 'var(--accent-subtle)' : 'var(--bg-surface)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: value === opt.value ? 500 : 400, letterSpacing: '-0.01em' }}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  )
}

function CheckGroup({
  options,
  values,
  onChange,
}: {
  options: { label: string; value: string }[]
  values: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => {
        const checked = values.includes(opt.value)
        return (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 15px',
              borderRadius: 10,
              border: `1px solid ${checked ? 'var(--accent-border)' : 'var(--border-strong)'}`,
              background: checked ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (checked) onChange(values.filter(v => v !== opt.value))
                else onChange([...values, opt.value])
              }}
            />
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: checked ? 500 : 400, letterSpacing: '-0.01em' }}>
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
  helper,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  helper?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderRadius: 12,
        border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
        background: value ? 'var(--accent-subtle)' : 'var(--bg-surface)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        gap: 16,
      }}
      onClick={() => onChange(!value)}
    >
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{label}</div>
        {helper && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, letterSpacing: '-0.01em' }}>{helper}</div>}
      </div>
      <div
        style={{
          width: 42, height: 24, borderRadius: 12,
          background: value ? 'var(--accent)' : 'var(--bg-overlay)',
          position: 'relative', flexShrink: 0,
          transition: 'background 0.2s ease',
          boxShadow: value ? '0 2px 8px rgba(232,100,58,0.3)' : 'none',
        }}
      >
        <div
          style={{
            width: 18, height: 18, borderRadius: '50%', background: 'white',
            position: 'absolute', top: 3, left: value ? 21 : 3,
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  )
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {helper && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '-2px 0 6px' }}>{helper}</p>}
      {children}
    </div>
  )
}

const EMPTY: Partial<IntakeData> = {
  fullName: '',
  email: '',
  country: '',
  visaStatus: '',
  expertiseField: '',
  subSpecialization: '',
  yearsExperience: 0,
  currentTitle: '',
  employerType: '',
  isSeniorOrLeadership: '',
  managesTeam: '',
  citedAsKeyPerson: '',
  salaryBracket: '',
  hasPublications: false,
  publicationCount: '',
  publicationVenues: [],
  totalCitations: '',
  hasPatents: '',
  hasBook: false,
  hasAwards: false,
  awardDescription: '',
  awardScope: '',
  onMajorList: false,
  hasEliteCerts: false,
  hasJudged: false,
  judgingCount: '',
  judgingScope: '',
  hasPeerReviewed: false,
  peerReviewVenues: '',
  hasServedOnPanel: false,
  hasPressCorver: false,
  pressType: [],
  hasBeenQuoted: false,
  onlinePresence: [],
  hasSpeaking: false,
  speakingScope: '',
  speakingCount: '',
  inProfAssociation: false,
  organizesComm: false,
  hasMajorContrib: false,
  contribDescription: '',
  hasOpenSource: false,
  githubStars: '',
  hasStandardsWork: false,
  priorPetition: '',
  hasAttorney: '',
  targetTimeline: '',
  biggestGap: '',
}

export default function EvaluatorForm({ onSubmit, submitting }: Props) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Partial<IntakeData>>(EMPTY)
  const [errors, setErrors] = useState<string[]>([])

  function update<K extends keyof IntakeData>(key: K, value: IntakeData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
    setErrors([])
  }

  function validateStep(): string[] {
    const errs: string[] = []
    if (step === 1) {
      if (!data.fullName?.trim()) errs.push('Full name is required')
      if (!data.email?.includes('@')) errs.push('Valid email address is required')
      if (!data.expertiseField) errs.push('Primary field of expertise is required')
    }
    if (step === 2) {
      if (!data.currentTitle?.trim()) errs.push('Current job title is required')
      if (!data.employerType) errs.push('Employer type is required')
      if (!data.isSeniorOrLeadership) errs.push('Please answer the seniority question')
      if (!data.managesTeam) errs.push('Please answer the team management question')
      if (!data.salaryBracket) errs.push('Salary bracket is required')
    }
    if (step === 9) {
      if (!data.targetTimeline) errs.push('Target timeline is required')
    }
    return errs
  }

  function next() {
    const errs = validateStep()
    if (errs.length) { setErrors(errs); return }
    setErrors([])
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else handleSubmit()
  }

  function back() {
    setErrors([])
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    const errs = validateStep()
    if (errs.length) { setErrors(errs); return }
    await onSubmit(data as IntakeData)
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Progress */}
      <div
        style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
            Step {step} of {TOTAL_STEPS} — {STEP_TITLES[step - 1]}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '-0.01em' }}>{Math.round(progress)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, letterSpacing: '-0.01em' }}>
          {STEP_HELPERS[step - 1]}
        </p>
      </div>

      {/* Step content */}
      <div className="card" style={{ padding: '28px 24px' }}>

        {/* ── Step 1: Who You Are ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Full name *">
              <input
                className="input"
                type="text"
                placeholder="Alex Chen"
                value={data.fullName ?? ''}
                onChange={e => update('fullName', e.target.value)}
              />
            </Field>
            <Field label="Email address *" helper="We'll send your full assessment results here.">
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={data.email ?? ''}
                onChange={e => update('email', e.target.value)}
              />
            </Field>
            <Field label="Country of residence">
              <input
                className="input"
                type="text"
                placeholder="United States"
                value={data.country ?? ''}
                onChange={e => update('country', e.target.value)}
              />
            </Field>
            <Field label="Current visa status" helper="Helps calibrate urgency of your roadmap.">
              <select
                className="input"
                value={data.visaStatus ?? ''}
                onChange={e => update('visaStatus', e.target.value)}
              >
                <option value="">Select...</option>
                {['H-1B', 'L-1', 'F-1 / OPT', 'TN', 'O-1A', 'Already have GC', 'Other'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Primary field of expertise *">
              <select
                className="input"
                value={data.expertiseField ?? ''}
                onChange={e => update('expertiseField', e.target.value)}
              >
                <option value="">Select your field...</option>
                {['AI / ML Engineering', 'Data Engineering', 'Data / AI Product Management', 'Software Engineering', 'Research / Academia', 'Biotech / Life Sciences', 'Business / Finance / Strategy', 'Other'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Sub-specialization" helper="Be specific — this shapes every recommendation (e.g. 'LLM infrastructure', 'real-time data pipelines').">
              <input
                className="input"
                type="text"
                placeholder="e.g. LLM inference optimization, AI product strategy"
                value={data.subSpecialization ?? ''}
                onChange={e => update('subSpecialization', e.target.value)}
              />
            </Field>
            <Field label="Years of professional experience in this field">
              <select
                className="input"
                value={data.yearsExperience?.toString() ?? ''}
                onChange={e => update('yearsExperience', Number(e.target.value))}
              >
                <option value="">Select...</option>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '15', '20'].map(o => (
                  <option key={o} value={o}>{o}+ years</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* ── Step 2: Work & Role ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Current job title *">
              <input
                className="input"
                type="text"
                placeholder="Senior ML Engineer, Staff Data Scientist..."
                value={data.currentTitle ?? ''}
                onChange={e => update('currentTitle', e.target.value)}
              />
            </Field>
            <Field label="Type of employer *">
              <select
                className="input"
                value={data.employerType ?? ''}
                onChange={e => update('employerType', e.target.value)}
              >
                <option value="">Select...</option>
                {['FAANG (Meta, Apple, Amazon, Netflix, Google)', 'Large tech (non-FAANG)', 'Mid-size company', 'Startup (Series A or later)', 'Early-stage startup / pre-Series A', 'Self-employed / Founder', 'Academia / Research institution', 'Consulting / Agency'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Is your role considered senior or leadership? *" helper="Senior title or staff+ level matters for the 'critical role' criterion.">
              <RadioGroup
                name="isSenior"
                value={data.isSeniorOrLeadership ?? ''}
                onChange={v => update('isSeniorOrLeadership', v)}
                options={[
                  { label: 'Yes — senior, staff, principal, or director+', value: 'yes' },
                  { label: "No — mid-level or IC", value: 'no' },
                  { label: "It's complicated", value: 'complicated' },
                ]}
              />
            </Field>
            <Field label="Do you manage or lead a team? *">
              <RadioGroup
                name="managesTeam"
                value={data.managesTeam ?? ''}
                onChange={v => update('managesTeam', v)}
                options={[
                  { label: 'Yes, large team (5+ people)', value: 'large' },
                  { label: 'Yes, small team (1-4 people)', value: 'small' },
                  { label: 'No, individual contributor', value: 'no' },
                ]}
              />
            </Field>
            <Field label="Have you been cited as critical/key person in major initiatives?" helper="Think: product launches, patents, reorgs, major papers where your name was listed as lead.">
              <RadioGroup
                name="citedKey"
                value={data.citedAsKeyPerson ?? ''}
                onChange={v => update('citedAsKeyPerson', v)}
                options={[
                  { label: 'Yes, documented in multiple projects', value: 'yes_multiple' },
                  { label: 'Yes, in one major initiative', value: 'yes_one' },
                  { label: 'No', value: 'no' },
                  { label: 'Unsure', value: 'unsure' },
                ]}
              />
            </Field>
            <Field label="Approximate salary bracket vs. peers in your field *" helper="High salary relative to peers is a standalone EB-1A criterion.">
              <select
                className="input"
                value={data.salaryBracket ?? ''}
                onChange={e => update('salaryBracket', e.target.value)}
              >
                <option value="">Select...</option>
                {['Top 10% or above', 'Top 25%', 'Average / median', 'Below average', 'Prefer not to say'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* ── Step 3: Publications ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              label="Have you authored published articles, papers, or technical posts in recognized venues?"
              value={data.hasPublications ?? false}
              onChange={v => update('hasPublications', v)}
              helper="Peer-reviewed journals, major conferences, or industry publications"
            />
            {data.hasPublications && (
              <>
                <Field label="How many publications?">
                  <select className="input" value={data.publicationCount ?? ''} onChange={e => update('publicationCount', e.target.value)}>
                    <option value="">Select...</option>
                    {['1', '2-3', '4-6', '7-10', '10-20', '20+'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Where have you published? (select all that apply)" helper="Venue prestige matters more than quantity.">
                  <CheckGroup
                    values={data.publicationVenues ?? []}
                    onChange={v => update('publicationVenues', v)}
                    options={[
                      { label: 'Peer-reviewed journals (IEEE, ACM, Nature, etc.)', value: 'peer_reviewed_journals' },
                      { label: 'Top-tier AI/ML conferences (NeurIPS, ICML, ICLR, KDD, etc.)', value: 'top_tier_conferences' },
                      { label: 'Other academic conferences (non-top-tier)', value: 'other_academic' },
                      { label: 'Industry publications (Towards Data Science, Harvard Business Review)', value: 'industry_publications' },
                      { label: 'Company engineering blog (Google, Netflix, Airbnb, etc.)', value: 'company_blog' },
                      { label: 'My own blog or Medium', value: 'personal_blog' },
                    ]}
                  />
                </Field>
                <Field label="Approximate total citations across all work" helper="Google Scholar citations count. Zero is fine — it helps calibrate.">
                  <select className="input" value={data.totalCitations ?? ''} onChange={e => update('totalCitations', e.target.value)}>
                    <option value="">Select...</option>
                    {['0', '1-10', '11-50', '51-200', '201-500', '500+'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </>
            )}
            <Field label="Do you have any patents?">
              <RadioGroup
                name="patents"
                value={data.hasPatents ?? ''}
                onChange={v => update('hasPatents', v)}
                options={[
                  { label: 'Yes, granted', value: 'granted' },
                  { label: 'Yes, pending', value: 'pending' },
                  { label: 'No', value: 'no' },
                ]}
              />
            </Field>
            <Toggle
              label="Have you written a book, chapter, or contributed to published technical documentation?"
              value={data.hasBook ?? false}
              onChange={v => update('hasBook', v)}
            />
          </div>
        )}

        {/* ── Step 4: Awards ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              label="Have you received awards, prizes, or honors for professional work?"
              value={data.hasAwards ?? false}
              onChange={v => update('hasAwards', v)}
              helper="Hackathon wins, best paper awards, company awards, professional recognition"
            />
            {data.hasAwards && (
              <>
                <Field label="Briefly describe the award(s)" helper="e.g. 'Best paper award at KDD 2024', 'Forbes 30 Under 30 AI category'">
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Describe your most significant awards..."
                    value={data.awardDescription ?? ''}
                    onChange={e => update('awardDescription', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </Field>
                <Field label="Award scope" helper="International scope carries the most weight with USCIS.">
                  <RadioGroup
                    name="awardScope"
                    value={data.awardScope ?? ''}
                    onChange={v => update('awardScope', v)}
                    options={[
                      { label: 'International recognition', value: 'international' },
                      { label: 'National recognition', value: 'national' },
                      { label: 'Regional / local', value: 'regional' },
                      { label: 'Company-level', value: 'company' },
                    ]}
                  />
                </Field>
              </>
            )}
            <Toggle
              label="Have you been on a prestigious list? (Forbes 30 Under 30, LinkedIn Top Voices, Gartner Ambassadors, etc.)"
              value={data.onMajorList ?? false}
              onChange={v => update('onMajorList', v)}
            />
            <Toggle
              label="Do you hold any elite professional certifications considered top-tier in your field?"
              value={data.hasEliteCerts ?? false}
              onChange={v => update('hasEliteCerts', v)}
            />
          </div>
        )}

        {/* ── Step 5: Judging ── */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              label="Have you served as a judge for any competitions, hackathons, or award programs?"
              value={data.hasJudged ?? false}
              onChange={v => update('hasJudged', v)}
              helper="This is one of the most achievable EB-1A criteria for tech professionals"
            />
            {data.hasJudged && (
              <>
                <Field label="How many times have you judged?">
                  <select className="input" value={data.judgingCount ?? ''} onChange={e => update('judgingCount', e.target.value)}>
                    <option value="">Select...</option>
                    {['1', '2-3', '4-6', '7-10', '10+'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Highest scope of judging" helper="International hackathons (DeveloperWeek, TechCrunch Disrupt) outweigh local events.">
                  <RadioGroup
                    name="judgingScope"
                    value={data.judgingScope ?? ''}
                    onChange={v => update('judgingScope', v)}
                    options={[
                      { label: 'International competition or conference', value: 'international' },
                      { label: 'National competition', value: 'national' },
                      { label: 'Regional / local event', value: 'regional' },
                      { label: 'Internal company hackathon only', value: 'internal' },
                    ]}
                  />
                </Field>
              </>
            )}
            <Toggle
              label="Have you peer-reviewed papers for journals or conferences?"
              value={data.hasPeerReviewed ?? false}
              onChange={v => update('hasPeerReviewed', v)}
            />
            {data.hasPeerReviewed && (
              <Field label="Which venues?" helper="NeurIPS reviewer, ICML program committee, IEEE reviewer, etc.">
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. NeurIPS, ICML, IEEE Transactions on..."
                  value={data.peerReviewVenues ?? ''}
                  onChange={e => update('peerReviewVenues', e.target.value)}
                />
              </Field>
            )}
            <Toggle
              label="Have you served on a panel, advisory board, or grant evaluation committee?"
              value={data.hasServedOnPanel ?? false}
              onChange={v => update('hasServedOnPanel', v)}
            />
          </div>
        )}

        {/* ── Step 6: Media ── */}
        {step === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              label="Has your work been covered in press or media?"
              value={data.hasPressCorver ?? false}
              onChange={v => update('hasPressCorver', v)}
              helper="Coverage about you specifically — not just your company"
            />
            {data.hasPressCorver && (
              <Field label="What type of media coverage? (select all that apply)">
                <CheckGroup
                  values={data.pressType ?? []}
                  onChange={v => update('pressType', v)}
                  options={[
                    { label: 'Major tech media (TechCrunch, Wired, VentureBeat, MIT Tech Review)', value: 'major_tech' },
                    { label: 'Industry publications (IEEE Spectrum, ACM Queue, etc.)', value: 'industry' },
                    { label: 'General news (NYT, Forbes, Bloomberg, WSJ)', value: 'general_news' },
                    { label: 'Podcasts or YouTube interviews', value: 'podcast' },
                    { label: 'Company press releases mentioning you by name', value: 'company_pr' },
                    { label: 'Social media mentions / LinkedIn features only', value: 'social_only' },
                  ]}
                />
              </Field>
            )}
            <Toggle
              label="Have you been interviewed or quoted as an expert in any publication or media?"
              value={data.hasBeenQuoted ?? false}
              onChange={v => update('hasBeenQuoted', v)}
              helper="Quotes in articles, expert commentary, expert roundups, etc."
            />
            <Field label="Online presence as a thought leader (select all that apply)">
              <CheckGroup
                values={data.onlinePresence ?? []}
                onChange={v => update('onlinePresence', v)}
                options={[
                  { label: 'LinkedIn: 5,000+ followers', value: 'linkedin_5k' },
                  { label: 'LinkedIn: 1,000-4,999 followers', value: 'linkedin_1k' },
                  { label: 'GitHub: 500+ stars on my projects', value: 'github_500' },
                  { label: 'Active technical blog (100+ subscribers)', value: 'blog' },
                  { label: 'YouTube / Podcast with notable following', value: 'youtube_podcast' },
                  { label: 'None of the above', value: 'none' },
                ]}
              />
            </Field>
          </div>
        )}

        {/* ── Step 7: Speaking ── */}
        {step === 7 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              label="Have you spoken at conferences, panels, or professional events?"
              value={data.hasSpeaking ?? false}
              onChange={v => update('hasSpeaking', v)}
              helper="Invited talks and conference presentations demonstrate that peers value your expertise"
            />
            {data.hasSpeaking && (
              <>
                <Field label="Highest scope of speaking" helper="International conferences (NeurIPS, ICML, AWS re:Invent) outweigh local meetups.">
                  <RadioGroup
                    name="speakingScope"
                    value={data.speakingScope ?? ''}
                    onChange={v => update('speakingScope', v)}
                    options={[
                      { label: 'International conference (1,000+ attendees)', value: 'international' },
                      { label: 'National conference', value: 'national' },
                      { label: 'Local meetup or company event', value: 'local' },
                    ]}
                  />
                </Field>
                <Field label="How many speaking engagements in the last 3 years?">
                  <select className="input" value={data.speakingCount ?? ''} onChange={e => update('speakingCount', e.target.value)}>
                    <option value="">Select...</option>
                    {['1', '2-3', '4-6', '7-10', '10+'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </>
            )}
            <Toggle
              label="Are you a member of any professional association that requires demonstrated expertise to join?"
              value={data.inProfAssociation ?? false}
              onChange={v => update('inProfAssociation', v)}
              helper="IEEE Senior Member, ACM Distinguished Member, etc. — not free-signup associations"
            />
            <Toggle
              label="Do you organize professional communities, meetups, or open-source projects with contributors?"
              value={data.organizesComm ?? false}
              onChange={v => update('organizesComm', v)}
            />
          </div>
        )}

        {/* ── Step 8: Contributions ── */}
        {step === 8 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              label="Have you made a contribution that has been widely adopted or significantly influenced your field?"
              value={data.hasMajorContrib ?? false}
              onChange={v => update('hasMajorContrib', v)}
              helper="Frameworks, methodologies, tools, or findings that others have built upon"
            />
            {data.hasMajorContrib && (
              <Field label="Describe it briefly" helper="Be specific: what you built, who uses it, what impact it had.">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="e.g. 'Built open-source LLM eval framework used by 200+ organizations...' or 'Developed causal inference methodology adopted in 3 major industry papers'"
                  value={data.contribDescription ?? ''}
                  onChange={e => update('contribDescription', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </Field>
            )}
            <Toggle
              label="Have you open-sourced tools, frameworks, or datasets that others actively use?"
              value={data.hasOpenSource ?? false}
              onChange={v => update('hasOpenSource', v)}
            />
            {data.hasOpenSource && (
              <Field label="Approximate GitHub stars (your most starred project)">
                <select className="input" value={data.githubStars ?? ''} onChange={e => update('githubStars', e.target.value)}>
                  <option value="">Select...</option>
                  {['Under 100', '100-499', '500-999', '1,000-4,999', '5,000-9,999', '10,000+'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            )}
            <Toggle
              label="Have you contributed to industry standards, working groups, or policy documents?"
              value={data.hasStandardsWork ?? false}
              onChange={v => update('hasStandardsWork', v)}
              helper="IEEE standards, NIST frameworks, W3C specs, government advisory roles, etc."
            />
          </div>
        )}

        {/* ── Step 9: Context ── */}
        {step === 9 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Have you started an EB-1A petition before?">
              <RadioGroup
                name="priorPetition"
                value={data.priorPetition ?? ''}
                onChange={v => update('priorPetition', v)}
                options={[
                  { label: 'No, this is my first time', value: 'no' },
                  { label: 'Started but stopped / attorney dropped it', value: 'stopped' },
                  { label: 'Filed and received an RFE', value: 'rfe' },
                  { label: 'Filed and was denied', value: 'denied' },
                  { label: 'Currently pending', value: 'pending' },
                ]}
              />
            </Field>
            <Field label="Are you working with an immigration attorney?">
              <RadioGroup
                name="attorney"
                value={data.hasAttorney ?? ''}
                onChange={v => update('hasAttorney', v)}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                  { label: 'Planning to engage one', value: 'planning' },
                ]}
              />
            </Field>
            <Field label="Target timeline to file *" helper="We'll adjust the roadmap length based on your urgency.">
              <select
                className="input"
                value={data.targetTimeline ?? ''}
                onChange={e => update('targetTimeline', e.target.value)}
              >
                <option value="">Select...</option>
                {['ASAP / within 3 months', '3-6 months', '6-12 months', '12+ months', 'Not sure yet'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="What do you think is your biggest gap right now? (optional)" helper="Free text — helps us personalize your roadmap further.">
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. 'I have no press coverage', 'I haven't judged anything', 'Not sure which criteria I actually meet'"
                value={data.biggestGap ?? ''}
                onChange={e => update('biggestGap', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>
        )}

      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--red-subtle)',
            border: '1px solid var(--red-border)',
            borderRadius: 12,
          }}
        >
          {errors.map(e => (
            <p key={e} style={{ margin: 0, fontSize: 13.5, color: 'var(--red)', letterSpacing: '-0.01em' }}>{e}</p>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="r-rowcol" style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        {step > 1 ? (
          <button
            className="btn-secondary"
            onClick={back}
            disabled={submitting}
            style={{ letterSpacing: '-0.01em' }}
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={next}
          disabled={submitting}
          style={{
            minWidth: 180, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 24px',
            background: submitting ? 'var(--bg-raised)' : 'var(--accent)',
            color: submitting ? 'var(--text-muted)' : 'white',
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.02em',
            boxShadow: submitting ? 'none' : '0 4px 16px rgba(232,100,58,0.28)',
            transition: 'all 0.15s ease',
          }}
        >
          {submitting
            ? 'Submitting…'
            : step === TOTAL_STEPS
            ? 'Evaluate My Profile →'
            : `Next: ${STEP_TITLES[step] ?? 'Continue'} →`}
        </button>
      </div>
    </div>
  )
}
