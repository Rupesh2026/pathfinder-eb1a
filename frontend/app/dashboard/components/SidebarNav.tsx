'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Shield,
  Compass,
  CheckSquare,
  MessageSquare,
  Calendar,
  Mail,
  Settings,
  Zap,
} from 'lucide-react'

const PRIMARY_NAV = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/evidence',      label: 'Evidence',      icon: Shield },
  { href: '/dashboard/opportunities', label: 'Opportunities', icon: Compass },
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
        <p className="section-header mb-2">Main</p>
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

      <div className="mt-4 space-y-0.5">
        <p className="section-header mb-2">Tools</p>
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
                className="ml-auto h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--amber)' }}
              />
            )}
          </Link>
        ))}
      </div>

      {/* Scan shortcut */}
      <div className="mt-auto">
        <div className="mb-2 h-px" style={{ background: 'var(--border)' }} />
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
            ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <Zap size={13} strokeWidth={1.75} />
          <span>Daily Agent</span>
          <span className="ml-auto rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
            7am
          </span>
        </Link>
      </div>
    </nav>
  )
}
