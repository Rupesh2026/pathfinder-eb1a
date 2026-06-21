'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Shield,
  Compass,
  MessageSquare,
  Calendar,
  Mail,
  Settings,
  Zap,
} from 'lucide-react'

const PRIMARY_NAV = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/opportunities', label: 'Opportunities', icon: Compass },
  { href: '/dashboard/evidence',      label: 'Evidence',      icon: Shield },
  { href: '/dashboard/advisor',       label: 'AI Advisor',    icon: MessageSquare },
]

const SECONDARY_NAV = [
  { href: '/dashboard/calendar',      label: 'Calendar',      icon: Calendar },
  { href: '/dashboard/letters',       label: 'Letters',       icon: Mail },
  { href: '/dashboard/profile',       label: 'Profile',       icon: Settings },
]

type Props = { needsFocusSetup?: boolean }

export default function SidebarNav({ needsFocusSetup }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      <div className="space-y-0.5">
        <p
          style={{
            fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase',
            padding: '0 10px', marginBottom: 6,
          }}
        >
          Main
        </p>
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${isActive(href) ? 'active' : ''}`}
          >
            <Icon size={15} strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 space-y-0.5">
        <p
          style={{
            fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase',
            padding: '0 10px', marginBottom: 6,
          }}
        >
          Tools
        </p>
        {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${isActive(href) ? 'active' : ''}`}
          >
            <Icon size={15} strokeWidth={1.75} />
            <span>{label}</span>
            {label === 'Profile' && needsFocusSetup && (
              <span
                style={{
                  marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--amber)', flexShrink: 0,
                }}
              />
            )}
          </Link>
        ))}
      </div>

      {/* Daily Agent shortcut */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
        <Link
          href="/dashboard"
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 10px', borderRadius: 9,
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'background 0.12s ease, color 0.12s ease',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
          }}
        >
          <Zap size={14} strokeWidth={1.75} />
          <span>Daily Agent</span>
          <span
            style={{
              marginLeft: 'auto', borderRadius: 6, padding: '2px 7px',
              fontSize: 10.5, background: 'var(--bg-raised)',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
              letterSpacing: '-0.01em',
            }}
          >
            7am
          </span>
        </Link>
      </div>
    </nav>
  )
}
