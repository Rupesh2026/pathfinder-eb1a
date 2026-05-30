'use client'

import { useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'

type Props = { message: string; onDismiss: () => void }

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm animate-slide-up"
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--red-border)',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: 380,
        color: 'var(--text-primary)',
      }}
    >
      <AlertCircle size={15} style={{ color: 'var(--red)', flexShrink: 0 }} />
      <span className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{message}</span>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 rounded-md p-1 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        <X size={13} />
      </button>
    </div>
  )
}
