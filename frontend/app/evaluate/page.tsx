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
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(232,100,58,0.07) 0%, transparent 65%)' }}
      />

      {/* Header */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(250,249,247,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: 720, margin: '0 auto', height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 10, background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: 'white',
                boxShadow: '0 4px 14px rgba(232,100,58,0.3)',
              }}
            >
              P
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Pathfinder
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: 'var(--green-subtle)', color: 'var(--green)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: '1px solid var(--green-border)',
              }}
            >
              Free Evaluator
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              href="/signin"
              style={{ fontSize: 13.5, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, letterSpacing: '-0.01em' }}
            >
              Already a member? Sign in →
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>

        {/* ── Form Phase ── */}
        {phase === 'form' && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: 36, textAlign: 'center' }}>
              <h1
                style={{
                  fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
                  margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.04em',
                }}
              >
                Free EB-1A Profile Evaluator
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, maxWidth: 480, marginInline: 'auto', lineHeight: 1.75, letterSpacing: '-0.01em' }}>
                Answer 9 steps of questions about your career. Get an honest readiness score, a criteria breakdown, and a personalized month-by-month roadmap — in under 10 minutes.
              </p>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 20, padding: '13px 18px',
                  background: 'var(--red-subtle)', border: '1px solid var(--red-border)',
                  borderRadius: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--red)', letterSpacing: '-0.01em' }}>{error}</p>
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
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '60vh',
              textAlign: 'center', gap: 32,
            }}
          >
            {/* Animated rings */}
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <div
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  border: '2.5px solid var(--accent-border)',
                  borderTopColor: 'var(--accent)',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute', inset: 10, borderRadius: '50%',
                  border: '2px solid var(--accent-border)',
                  borderBottomColor: 'var(--accent)',
                  animation: 'spin 1.5s linear infinite reverse',
                  opacity: 0.5,
                }}
              />
              <div
                style={{
                  position: 'absolute', inset: '50%', transform: 'translate(-50%, -50%)',
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--accent)', opacity: 0.6,
                }}
              />
            </div>

            <div>
              <p
                style={{
                  fontSize: 17, fontWeight: 600, color: 'var(--text-primary)',
                  margin: '0 0 8px', letterSpacing: '-0.02em',
                }}
              >
                {PROCESSING_MESSAGES[msgIndex]}
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, letterSpacing: '-0.01em' }}>
                This usually takes 15–25 seconds. Don&apos;t close this tab.
              </p>
            </div>

            {/* Progress steps */}
            <div
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 12,
                width: '100%', maxWidth: 340,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {[
                'AI is reading your profile',
                'Evaluating 10 USCIS criteria',
                'Generating personalized roadmap',
                'Preparing your results',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: msgIndex > i
                        ? 'var(--green)'
                        : msgIndex === i
                        ? 'var(--accent)'
                        : 'var(--border-strong)',
                      transition: 'background 0.4s ease',
                      boxShadow: msgIndex === i ? '0 0 8px rgba(232,100,58,0.5)' : 'none',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13, letterSpacing: '-0.01em',
                      color: msgIndex >= i ? 'var(--text-secondary)' : 'var(--text-muted)',
                      transition: 'color 0.4s ease',
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
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <h1
                style={{
                  fontSize: 24, fontWeight: 800, color: 'var(--text-primary)',
                  margin: '0 0 6px', letterSpacing: '-0.04em',
                }}
              >
                Your EB-1A Assessment
              </h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, letterSpacing: '-0.01em' }}>
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
          borderTop: '1px solid var(--border)', padding: '24px 24px',
          textAlign: 'center', marginTop: 48,
          background: 'var(--bg-surface)',
        }}
      >
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
          Pathfinder · Free EB-1A Evaluator · Not legal advice ·{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Join the platform
          </Link>
        </p>
      </footer>
    </div>
  )
}
