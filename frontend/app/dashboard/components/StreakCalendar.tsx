'use client'

import type { StreakData } from '../hooks/useDashboard'

type Props = {
  streak: StreakData | null
  loading: boolean
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.getDate().toString()
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export default function StreakCalendar({ streak, loading }: Props) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Activity</h2>
        {!loading && streak && (
          <span className="text-xs font-semibold" style={{ color: streak.streak_days > 0 ? 'var(--criterion-green)' : 'var(--text-tertiary)' }}>
            {streak.streak_days > 0
              ? `${streak.streak_days}-day streak 🔥`
              : 'Start your streak today'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-sm"
              style={{ background: 'var(--secondary-bg)' }}
            />
          ))}
        </div>
      ) : streak ? (
        <>
          <div className="grid grid-cols-10 gap-1.5">
            {streak.calendar.map(({ date, active }) => (
              <div
                key={date}
                title={`${date}${active ? ' ✓ active' : ''}`}
                className="relative aspect-square rounded-sm transition-colors"
                style={{
                  background: active ? 'var(--criterion-green)' : 'var(--secondary-bg)',
                  outline: isToday(date) ? '2px solid var(--criterion-blue)' : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span>{streak.calendar[0]?.date ? new Date(streak.calendar[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--secondary-bg)' }} /> Missed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--criterion-green)' }} /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm outline outline-2" style={{ outline: '2px solid var(--criterion-blue)', background: 'transparent' }} /> Today
              </span>
            </div>
            <span>Today</span>
          </div>
        </>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No activity data yet.</p>
      )}
    </div>
  )
}
