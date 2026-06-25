'use client'

// Route-segment error boundary for the dashboard. If any dashboard component
// throws during render (as happened with a stale `greeting` reference that took
// down the whole page including the Scan button), this shows a recoverable
// fallback instead of a blank crash.
import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard render error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 animate-fade-in">
      <div className="card max-w-md p-8 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)' }}
        >
          <AlertTriangle size={20} style={{ color: 'var(--amber)' }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Something went wrong
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          This part of the dashboard hit an error and couldn&apos;t load. Your data is safe —
          try again or reload.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button onClick={reset} className="btn-primary">
            <RotateCw size={13} /> Try again
          </button>
          <a href="/dashboard" className="btn-ghost">Reload dashboard</a>
        </div>
        {error.digest && (
          <p className="mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
