import { createClient } from '@/lib/supabase/server'
import SidebarNav from './components/SidebarNav'
import SignOutButton from './components/SignOutButton'
import DashboardShell from './components/DashboardShell'

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

  const sidebar = (
    <>
      {/* Logo */}
      <div
        className="flex h-[60px] items-center gap-3 px-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 10, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: 'white',
            boxShadow: '0 3px 10px rgba(232,100,58,0.28)',
            flexShrink: 0,
          }}
        >
          P
        </div>
        <div>
          <p
            style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
              margin: 0, lineHeight: 1.2, letterSpacing: '-0.03em',
            }}
          >
            Pathfinder
          </p>
          <p
            style={{
              fontSize: 11, color: 'var(--text-muted)',
              margin: 0, letterSpacing: '-0.01em',
            }}
          >
            EB-1A Builder
          </p>
        </div>
      </div>

      {/* Navigation */}
      <SidebarNav needsFocusSetup={needsFocusSetup} />

      {/* User footer */}
      <div
        className="p-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <SignOutButton initials={initials} label={profile?.role ?? user?.email ?? ''} />
      </div>
    </>
  )

  return <DashboardShell sidebar={sidebar}>{children}</DashboardShell>
}
