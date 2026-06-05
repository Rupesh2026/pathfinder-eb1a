'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signUp } from '@/app/actions/auth'
import { Check } from 'lucide-react'

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

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold"
            style={{ background: 'var(--accent)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
          >
            P
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Start your case
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {prefillEmail
                ? 'Create your account to unlock your full roadmap'
                : 'Create your Pathfinder account'}
            </p>
          </div>
        </div>

        <div className="card p-6">
          {error && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-xs"
              style={{ background: 'var(--red-subtle)', color: 'var(--red)', border: '1px solid var(--red-border)' }}
            >
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            {/* Hidden field for conversion tracking */}
            {assessmentId && (
              <input type="hidden" name="assessment_id" value={assessmentId} />
            )}

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus={!prefillEmail}
                placeholder="you@example.com"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {password.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="flex-1 progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: passwordStrong ? '100%' : `${(password.length / 8) * 100}%`,
                        background: passwordStrong ? 'var(--green)' : 'var(--amber)',
                      }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: passwordStrong ? 'var(--green)' : 'var(--text-muted)' }}>
                    {passwordStrong ? 'Good' : 'Too short'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="label">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="input pr-9"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                {passwordsMatch && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={14} style={{ color: 'var(--green)' }} />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        {/* Feature highlights */}
        <div
          className="mt-4 rounded-xl p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            What you get
          </p>
          {[
            'Daily AI-powered action plans',
            'Worldwide opportunity discovery',
            'USCIS precedent-informed scoring',
            'Recommendation letter tracker',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 py-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'var(--green-subtle)' }}>
                <Check size={9} style={{ color: 'var(--green)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f}</span>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/signin" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
            Sign in
          </Link>
          {' · '}
          <Link href="/evaluate" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
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
