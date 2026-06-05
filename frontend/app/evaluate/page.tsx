'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import EvaluatorForm from './components/EvaluatorForm'
import ResultsDashboard from './components/ResultsDashboard'
import type { IntakeData, EvaluationResult, EvaluatorPhase } from './types'

const PROCESSING_MESSAGES = [
  'Analyzing your professional profile…',
  'Evaluating 10 USCIS EB-1A criteria…',
  'Assessing evidence quality and depth…',
  'Calculating your readiness score…',
  'Building your personalized roadmap…',
  'Finalizing your field of expertise statement…',
  'Almost there…',
]

export default function EvaluatePage() {
  const [phase, setPhase] = useState<EvaluatorPhase>('form')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [intake, setIntake] = useState<IntakeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (phase !== 'processing') return
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % PROCESSING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [phase])

  async function handleFormSubmit(data: IntakeData) {
    setIntake(data)
    setError(null)
    setPhase('processing')
    setMsgIndex(0)

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Evaluation failed. Please try again.')
      }

      const evaluation: EvaluationResult = await res.json()
      setResult(evaluation)
      setPhase('results')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setPhase('form')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(91,95,199,0.07) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(245,246,250,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: 'white',
                boxShadow: '0 0 16px rgba(91,95,199,0.35)',
              }}
            >
              P
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Pathfinder
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 20,
                background: 'var(--green-subtle)',
                color: 'var(--green)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Free Evaluator
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              href="/signin"
              style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}
            >
              Already a member? Sign in →
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Form Phase ── */}
        {phase === 'form' && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px',
                  lineHeight: 1.2,
                }}
              >
                Free EB-1A Profile Evaluator
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: 480, marginInline: 'auto' }}>
                Answer 9 steps of questions about your career. Get an honest readiness score, a criteria breakdown, and a personalized month-by-month roadmap — in under 10 minutes.
              </p>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: 'var(--red-subtle)',
                  border: '1px solid var(--red-border)',
                  borderRadius: 8,
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>
              </div>
            )}

            <EvaluatorForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {/* ── Processing Phase ── */}
        {phase === 'processing' && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              gap: 24,
            }}
          >
            {/* Spinner */}
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: '3px solid var(--accent-border)',
                  borderTopColor: 'var(--accent)',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 8,
                  borderRadius: '50%',
                  border: '2px solid var(--accent-border)',
                  borderBottomColor: 'var(--accent)',
                  animation: 'spin 1.4s linear infinite reverse',
                  opacity: 0.5,
                }}
              />
            </div>

            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px',
                  transition: 'opacity 0.3s',
                }}
              >
                {PROCESSING_MESSAGES[msgIndex]}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                This usually takes 15–25 seconds. Don't close this tab.
              </p>
            </div>

            {/* Progress steps */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                width: '100%',
                maxWidth: 360,
              }}
            >
              {[
                'AI is reading your profile',
                'Evaluating 10 USCIS criteria',
                'Generating personalized roadmap',
                'Preparing your results',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: msgIndex > i ? 'var(--green)' : msgIndex === i ? 'var(--accent)' : 'var(--border-strong)',
                      flexShrink: 0,
                      transition: 'background 0.4s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: msgIndex >= i ? 'var(--text-secondary)' : 'var(--text-muted)',
                      transition: 'color 0.4s',
                    }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results Phase ── */}
        {phase === 'results' && result && intake && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Your EB-1A Assessment
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Results sent to {intake.email}
              </p>
            </div>
            <ResultsDashboard result={result} email={intake.email} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 24px',
          textAlign: 'center',
          marginTop: 40,
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          Pathfinder · Free EB-1A Evaluator · Not legal advice ·{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Join the platform
          </Link>
        </p>
      </footer>
    </div>
  )
}
