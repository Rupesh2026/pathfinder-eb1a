import Link from 'next/link'
import { requestPasswordReset } from '@/app/actions/auth'

type Props = { searchParams: Promise<{ error?: string; sent?: string }> }

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, sent } = await searchParams

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(232,100,58,0.07) 0%, transparent 65%)',
        }}
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
              Reset your password
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, letterSpacing: '-0.01em' }}>
              We&apos;ll email you a secure link to set a new one
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: '32px 28px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {sent ? (
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--green-subtle)', color: 'var(--green)',
                border: '1px solid var(--green-border)', borderRadius: 10,
                fontSize: 13.5, lineHeight: 1.55, letterSpacing: '-0.01em',
              }}
            >
              If an account exists for that email, a password reset link is on its way.
              Check your inbox (and spam folder) and follow the link to choose a new password.
            </div>
          ) : (
            <>
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

              <form action={requestPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label
                    htmlFor="email"
                    style={{
                      display: 'block', fontSize: 13, fontWeight: 500,
                      color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '-0.01em',
                    }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    className="input"
                    style={{ fontSize: 14 }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '12px 20px',
                    background: 'var(--accent)', color: 'white',
                    border: 'none', borderRadius: 12,
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    letterSpacing: '-0.02em',
                    boxShadow: '0 4px 16px rgba(232,100,58,0.28)',
                    transition: 'background 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  Send reset link
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
          Remembered it?{' '}
          <Link
            href="/signin"
            style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
