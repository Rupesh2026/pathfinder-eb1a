import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updatePassword } from '@/app/actions/auth'

type Props = { searchParams: Promise<{ error?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams

  // The recovery link (via /auth/confirm) must have opened a session. Without
  // one, there's nothing to reset — send the user back to request a fresh link.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent('Open the reset link from your email to set a new password.')}`
    )
  }

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
              Choose a new password
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, letterSpacing: '-0.01em' }}>
              Signed in as {user.email}
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

          <form action={updatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block', fontSize: 13, fontWeight: 500,
                  color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '-0.01em',
                }}
              >
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
                placeholder="At least 8 characters"
                className="input"
                style={{ fontSize: 14 }}
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                style={{
                  display: 'block', fontSize: 13, fontWeight: 500,
                  color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '-0.01em',
                }}
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
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
              Update password
            </button>
          </form>
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
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
