'use client'

import { signOut } from '@/app/actions/auth'

export default function SignOutButton({ initials, label }: { initials: string; label: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
        }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold flex-shrink-0"
          style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
        >
          {initials}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          <p className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>Sign out</p>
        </div>
      </button>
    </form>
  )
}
