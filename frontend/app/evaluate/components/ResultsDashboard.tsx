'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import RadialGauge from './RadialGauge'
import RoadmapTimeline from './RoadmapTimeline'
import type { EvaluationResult, CriterionEvaluation } from '../types'

// Per-criterion CSS variable colors (matches globals.css :root)
const CRITERION_COLORS: Record<string, string> = {
  awards: 'var(--c-awards)',
  memberships: 'var(--c-memberships)',
  press: 'var(--c-press)',
  judging: 'var(--c-judging)',
  original_contributions: 'var(--c-contributions)',
  scholarly_articles: 'var(--c-scholarly)',
  artistic_exhibitions: 'var(--c-exhibitions)',
  critical_role: 'var(--c-critical_role)',
  high_salary: 'var(--c-high_salary)',
  commercial_success: 'var(--c-commercial)',
}

function statusBadge(status: CriterionEvaluation['status']) {
  if (status === 'met') return <span className="badge badge-green">Met</span>
  if (status === 'partial') return <span className="badge badge-amber">Partial</span>
  return <span className="badge badge-red">Not Met</span>
}

function effortBadge(level: string) {
  if (level === 'low') return <span className="badge badge-green">Low effort</span>
  if (level === 'medium') return <span className="badge badge-amber">Medium effort</span>
  return <span className="badge badge-red">High effort</span>
}

function verdictInfo(verdict: EvaluationResult['holisticVerdict']) {
  if (verdict === 'strong') return { label: 'Strong Profile', badge: 'badge-green', icon: <TrendingUp size={14} /> }
  if (verdict === 'developing') return { label: 'Developing Profile', badge: 'badge-amber', icon: <Clock size={14} /> }
  return { label: 'Early Stage', badge: 'badge-red', icon: <AlertTriangle size={14} /> }
}

function CriterionCard({ c }: { c: CriterionEvaluation }) {
  const [expanded, setExpanded] = useState(false)
  const color = CRITERION_COLORS[c.id] ?? 'var(--accent)'

  return (
    <div
      className="card"
      style={{
        borderLeft: `3px solid ${color}`,
        padding: '14px 16px',
        cursor: c.evidenceMapping?.length || c.gapExplanation ? 'pointer' : 'default',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {c.label}
            </span>
          </div>
          {!expanded && c.gapExplanation && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {c.gapExplanation}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {statusBadge(c.status)}
          {(c.evidenceMapping?.length > 0 || c.gapExplanation) && (
            expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {c.evidenceMapping?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
                Evidence found
              </p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {c.evidenceMapping.map((e, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {c.gapExplanation && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
                What's missing
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{c.gapExplanation}</p>
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <span className="badge badge-muted" style={{ fontSize: 10 }}>
              Confidence: {c.confidence}
            </span>
            <span className="badge badge-muted" style={{ fontSize: 10 }}>
              Quality: {c.qualityFlag.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  result: EvaluationResult
  email: string
}

export default function ResultsDashboard({ result, email }: Props) {
  const verdict = verdictInfo(result.holisticVerdict)
  const ctaHref = `/signup?email=${encodeURIComponent(email)}&assessment_id=${result.assessmentId}`

  const PLATFORM_FEATURES = [
    'Daily AI-powered action plans tailored to your criteria gaps',
    'Worldwide judging, CFP, and speaking opportunity discovery',
    'USCIS precedent-informed evidence scoring',
    'Recommendation letter tracker and manager',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>

      {/* ── Section 1: Score Hero ── */}
      <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <RadialGauge score={result.readinessScore} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span className={`badge ${verdict.badge}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px' }}>
            {verdict.icon}
            {verdict.label}
          </span>
        </div>
        <div
          style={{
            display: 'inline-block',
            maxWidth: 480,
            padding: '14px 20px',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            borderRadius: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
            &ldquo;{result.foeStatement}&rdquo;
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Field of Extraordinary Ability
          </p>
        </div>
      </div>

      {/* ── Section 2: Criteria Breakdown ── */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
          Criteria Breakdown <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— click to expand</span>
        </h2>
        <div className="r-stack" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {result.criteria.map(c => (
            <CriterionCard key={c.id} c={c} />
          ))}
        </div>
      </div>

      {/* ── Section 3: Top 3 Gaps ── */}
      {result.topGaps.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
            Top Gaps to Close First
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.topGaps.map((gap, i) => (
              <div
                key={gap.criterionId}
                className="card"
                style={{ padding: '16px 18px', borderLeft: `3px solid ${CRITERION_COLORS[gap.criterionId] ?? 'var(--accent)'}` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                    {gap.label}
                  </span>
                  {effortBadge(gap.effortLevel)}
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {gap.actions.map((action, j) => (
                    <li key={j} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 4: Roadmap ── */}
      {result.roadmap.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
            Your Personalized Roadmap
          </h2>
          <RoadmapTimeline roadmap={result.roadmap} />
        </div>
      )}

      {/* ── Section 5: Timeline Statement ── */}
      <div
        style={{
          padding: '18px 20px',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)',
          borderRadius: 12,
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
          Estimated Timeline to File
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {result.timelineStatement}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          Estimated months to file-readiness: <strong>{result.estimatedMonths} months</strong>
        </p>
      </div>

      {/* ── Section 6: CTA ── */}
      <div className="card" style={{ padding: '28px 24px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {result.paidPlatformBridge.headline}
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-muted)' }}>
          Your roadmap is ready. Pathfinder finds these opportunities for you automatically every day.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {[...result.paidPlatformBridge.categories, ...PLATFORM_FEATURES].slice(0, 6).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--green-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Check size={10} style={{ color: 'var(--green)' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>

        <a
          href={ctaHref}
          className="btn-primary"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '13px 24px',
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 10,
            textDecoration: 'none',
          }}
        >
          Start my EB-1A journey →
        </a>
        <p style={{ textAlign: 'center', margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Free to join · No credit card required
        </p>
      </div>

      {/* ── Section 7: Legal Disclaimer ── */}
      <div
        style={{
          padding: '14px 16px',
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong>Legal Disclaimer:</strong> This AI-generated assessment is for informational and strategic planning purposes only. It does not constitute legal advice and does not create an attorney-client relationship. EB-1A petitions involve complex legal standards and USCIS eligibility is determined solely by immigration officers. Always consult a qualified immigration attorney before filing any petition.
        </p>
      </div>
    </div>
  )
}
