'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signUp } from '@/app/actions/auth'
import { Check, ArrowRight } from 'lucide-react'

function SignUpForm() {
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get('email') ?? ''
  const assessmentId = searchParams.get('assessment_id') ?? ''

  const [email, setEmail] = useState(prefillEmail)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordStrong = password.length >= 8
  const passwordsMatch = password === confirm && confirm.length > 0

  async function handleSubmit(formData: FormData) {
    if (password !== confirm) { setError('Passwords do not match'); return }
    setError(null)
    setLoading(true)
    const result = await signUp(formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '-0.01em',
  } as const

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-page)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(232,100,58,0.07) 0%, transparent 65%)' }}
      />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div
            style={{
              width: 44, height: 44, borderRadius: 13, background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'white',
              boxShadow: '0 6px 24px rgba(232,100,58,0.32)',
            }}
          >
            P
          </div>
          <div className="text-center">
            <h1
              style={{
                fontSize: 22, fontWeight: 800, color: 'var(--text-primary)',
                letterSpacing: '-0.04em', margin: '0 0 5px',
              }}
            >
              Start your case
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, letterSpacing: '-0.01em' }}>
              {prefillEmail
                ? 'Create your account to unlock your full roadmap'
                : 'Create your Pathfinder account'}
            </p>
          </div>
        </div>

        {/* Main card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: '32px 28px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: 20, padding: '12px 16px',
                background: 'var(--red-subtle)', color: 'var(--red)',
                border: '1px solid var(--red-border)', borderRadius: 10,
                fontSize: 13.5, letterSpacing: '-0.01em',
              }}
            >
              {error}
            </div>
          )}

          <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {assessmentId && (
              <input type="hidden" name="assessment_id" value={assessmentId} />
            )}

            <div>
              <label htmlFor="email" style={labelStyle}>Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus={!prefillEmail}
                placeholder="you@example.com"
                className="input"
                style={{ fontSize: 14 }}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="input"
                style={{ fontSize: 14 }}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {password.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="progress-track" style={{ flex: 1 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: passwordStrong ? '100%' : `${(password.length / 8) * 100}%`,
                        background: passwordStrong ? 'var(--green)' : 'var(--amber)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: passwordStrong ? 'var(--green)' : 'var(--text-muted)', letterSpacing: '-0.01em' }}>
                    {passwordStrong ? 'Strong' : 'Too short'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" style={labelStyle}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="input"
                  style={{ fontSize: 14, paddingRight: 40 }}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                {passwordsMatch && (
                  <div
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--green-subtle)', border: '1px solid var(--green-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Check size={11} style={{ color: 'var(--green)' }} />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px 20px',
                background: loading ? 'var(--bg-raised)' : 'var(--accent)',
                color: loading ? 'var(--text-muted)' : 'white',
                border: loading ? '1px solid var(--border)' : 'none',
                borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.02em',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(232,100,58,0.28)',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        {/* Feature highlights */}
        <div
          style={{
            marginTop: 16, borderRadius: 14, padding: '18px 20px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <p
            style={{
              marginBottom: 12, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: 'var(--text-muted)',
            }}
          >
            What you get
          </p>
          {[
            'Daily AI-powered action plans',
            'Worldwide opportunity discovery',
            'USCIS precedent-informed scoring',
            'Recommendation letter tracker',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
              <div
                style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--green-subtle)', border: '1px solid var(--green-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Check size={9} style={{ color: 'var(--green)' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{f}</span>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
          Already have an account?{' '}
          <Link href="/signin" style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
            Sign in
          </Link>
          {' · '}
          <Link href="/evaluate" style={{ fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
            Free evaluator
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  )
}
