'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

const SIDEBAR_WIDTH = 224
const STORAGE_KEY = 'pf-sidebar-open'
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

/**
 * Client shell for the dashboard: holds the collapsible left menu (slide in/out)
 * and offsets the main content. The sidebar's inner content is passed in from the
 * server layout so data fetching stays on the server.
 */
export default function DashboardShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Restore the persisted state (and default to collapsed on small screens),
  // applied without animation so there's no slide on first paint.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) setOpen(saved === '1')
      else if (window.innerWidth < 1024) setOpen(false)
    } catch { /* ignore */ }
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function toggle() {
    setOpen(prev => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Backdrop (mobile only) */}
      {open && (
        <div
          onClick={toggle}
          aria-hidden
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 flex w-[224px] flex-col"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          boxShadow: '1px 0 0 rgba(0,0,0,0.04)',
          transform: open ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH}px)`,
          transition: mounted ? `transform 0.28s ${EASE}` : 'none',
        }}
      >
        {sidebar}
      </aside>

      {/* Toggle handle — slides with the sidebar edge */}
      <button
        onClick={toggle}
        aria-label={open ? 'Collapse menu' : 'Open menu'}
        aria-expanded={open}
        title={open ? 'Collapse menu' : 'Open menu'}
        className="fixed top-3.5 z-40 flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          left: open ? SIDEBAR_WIDTH - 16 : 12,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--text-secondary)',
          transition: mounted ? `left 0.28s ${EASE}` : 'none',
        }}
      >
        {open ? <PanelLeftClose size={15} strokeWidth={1.9} /> : <PanelLeftOpen size={15} strokeWidth={1.9} />}
      </button>

      {/* Main */}
      <main
        className={`flex-1 min-w-0 ml-0 ${open ? 'lg:ml-[224px]' : 'lg:ml-0'} ${mounted ? 'transition-[margin] duration-300' : ''}`}
      >
        {/* Mobile: smaller side padding + extra top space so the floating menu
            toggle never overlaps page content. Desktop (lg+) keeps px-8 py-8. */}
        <div className="mx-auto max-w-[1200px] px-4 pt-14 pb-8 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
