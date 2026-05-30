import { createClient } from '@/lib/supabase/server'
import SidebarNav from './components/SidebarNav'
import SignOutButton from './components/SignOutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, domain, focused_criteria')
    .eq('user_id', user!.id)
    .single()

  const needsFocusSetup = !profile?.focused_criteria || (profile.focused_criteria as string[]).length === 0
  const initials = (profile?.role ?? user?.email ?? 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold"
            style={{ background: 'var(--accent)' }}
          >
            P
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Pathfinder</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>EB-1A Builder</p>
          </div>
        </div>

        {/* Navigation */}
        <SidebarNav needsFocusSetup={needsFocusSetup} />

        {/* User footer */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <SignOutButton initials={initials} label={profile?.role ?? user?.email ?? ''} />
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="ml-[220px] flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
