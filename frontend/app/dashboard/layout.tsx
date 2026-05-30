import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'

const NAV = [
  { href: '/dashboard',               label: 'Command Center' },
  { href: '/dashboard/opportunities', label: 'Opportunities' },
  { href: '/dashboard/evidence',      label: 'Evidence' },
  { href: '/dashboard/advisor',       label: 'AI Advisor' },
  { href: '/dashboard/profile',       label: 'Profile' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, domain, focused_criteria')
    .eq('user_id', user!.id)
    .single()

  const needsFocusSetup = !profile?.focused_criteria || (profile.focused_criteria as string[]).length === 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <header style={{ borderBottom: '0.5px solid var(--card-border-color)', background: 'var(--card-bg)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>EB-1A Agent</span>
            {profile && (
              <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {profile.role} · {profile.domain}
              </span>
            )}
          </div>
          <form action={signOut}>
            <button type="submit" className="text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Sign out
            </button>
          </form>
        </div>

        <nav className="mx-auto max-w-7xl px-6">
          <div className="flex gap-0.5" style={{ borderTop: '0.5px solid var(--divider)', paddingTop: '2px' }}>
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1 rounded-t px-4 py-2 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                {label}
                {label === 'Profile' && needsFocusSetup && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--criterion-amber)' }}
                    title="Set your criteria focus"
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {children}
      </main>
    </div>
  )
}
