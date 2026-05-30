import Link from 'next/link'
import { signIn } from '@/app/actions/auth'

type Props = { searchParams: Promise<{ error?: string }> }

export default async function SignInPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Subtle background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
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
              Welcome back
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Sign in to your Pathfinder account
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-6">
          {error && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-xs"
              style={{ background: 'var(--red-subtle)', color: 'var(--red)', border: '1px solid var(--red-border)' }}
            >
              {error}
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5 text-sm">
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium"
            style={{ color: 'var(--accent-hover)' }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
