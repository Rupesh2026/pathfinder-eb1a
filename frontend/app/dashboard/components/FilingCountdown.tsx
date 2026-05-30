'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function FilingCountdown() {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/readiness', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.days_until_filing != null) setDays(d.days_until_filing)
      })
      .catch(() => {})
  }, [])

  if (days === null) return null

  const color = days <= 30 ? 'var(--criterion-red)'
    : days <= 90 ? 'var(--criterion-amber)'
    : 'var(--criterion-green)'

  const bg = days <= 30 ? '#FDEAEA'
    : days <= 90 ? '#FDF5E0'
    : '#E8F7F2'

  const label = days === 0 ? 'Filing today'
    : days < 0 ? `${Math.abs(days)}d overdue`
    : `${days}d to filing`

  return (
    <Link
      href="/dashboard/profile"
      title="Set or update your target filing date"
      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
      style={{ background: bg, color }}
    >
      {label}
    </Link>
  )
}
