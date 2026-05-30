'use client'

type StreakDay = { date: string; active: boolean }
type StreakData = { streak_days: number; calendar: StreakDay[] }
type Props = { streak: StreakData | null; loading: boolean }

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export default function StreakCalendar({ streak, loading }: Props) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Activity</h2>
        {!loading && streak && (
          <span
            className="text-xs font-semibold"
            style={{ color: streak.streak_days > 0 ? 'var(--green)' : 'var(--text-muted)' }}
          >
            {streak.streak_days > 0 ? `${streak.streak_days}-day streak 🔥` : 'Start your streak today'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-md" />
          ))}
        </div>
      ) : streak ? (
        <>
          <div className="grid grid-cols-10 gap-1.5">
            {streak.calendar.map(({ date, active }: StreakDay) => {
              const today = isToday(date)
              return (
                <div
                  key={date}
                  title={`${date}${active ? ' · completed' : ''}`}
                  className="aspect-square rounded-md transition-colors"
                  style={{
                    background: active ? 'var(--green)' : 'var(--bg-raised)',
                    outline: today ? '2px solid var(--accent)' : 'none',
                    outlineOffset: 1,
                    boxShadow: active ? '0 0 8px rgba(34,197,94,0.2)' : 'none',
                  }}
                />
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>
              {streak.calendar[0]?.date
                ? new Date(streak.calendar[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--bg-raised)' }} />
                Missed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--green)' }} />
                Done
              </span>
            </div>
            <span>Today</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No activity yet</p>
      )}
    </div>
  )
}
