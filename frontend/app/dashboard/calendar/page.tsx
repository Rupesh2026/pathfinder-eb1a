import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'

function urgencyStyle(daysAway: number): { bg: string; color: string; label: string } {
  if (daysAway <= 7)  return { bg: 'var(--urgency-red-bg)',   color: 'var(--urgency-red-text)',   label: 'Urgent' }
  if (daysAway <= 30) return { bg: 'var(--urgency-amber-bg)', color: 'var(--urgency-amber-text)', label: 'Soon' }
  return                     { bg: 'var(--urgency-green-bg)', color: 'var(--urgency-green-text)', label: 'Open' }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function groupByMonth(opps: { deadline: string }[]): Record<string, typeof opps> {
  const groups: Record<string, typeof opps> = {}
  for (const opp of opps) {
    const key = new Date(opp.deadline).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(opp)
  }
  return groups
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('focused_criteria')
    .eq('user_id', user!.id)
    .single()

  const focusedCriteria: string[] = profile?.focused_criteria ?? []

  let query = supabase
    .from('opportunities')
    .select('id, title, criterion, type, deadline, urgency:deadline, url, applied')
    .eq('user_id', user!.id)
    .eq('dismissed', false)
    .not('deadline', 'is', null)
    .order('deadline', { ascending: true })

  if (focusedCriteria.length > 0) {
    query = query.in('criterion', focusedCriteria)
  }

  const { data: allOpps } = await query

  const now = new Date()
  const opportunities = (allOpps ?? []).map(opp => {
    const daysAway = Math.ceil(
      (new Date(opp.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return { ...opp, daysAway }
  })

  const upcoming = opportunities.filter(o => o.daysAway >= -7) // include up to 1 week past
  const byMonth = groupByMonth(upcoming as { deadline: string }[])

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Deadline Calendar</h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Upcoming opportunity deadlines across your focused criteria
          </p>
        </div>
        <Link
          href="/dashboard/opportunities"
          className="text-xs underline"
          style={{ color: 'var(--criterion-blue)' }}
        >
          All opportunities →
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="card px-6 py-12 text-center space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No upcoming deadlines.</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Run a scan to discover opportunities with deadlines.
          </p>
        </div>
      ) : (
        Object.entries(byMonth).map(([month, opps]) => (
          <div key={month}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              {month}
            </h2>
            <div className="card divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {(opps as typeof upcoming).map(opp => {
                const style = urgencyStyle(opp.daysAway)
                const criterionLabel = opp.criterion
                  ? CRITERION_LABELS[opp.criterion as CriterionType] ?? opp.criterion
                  : null
                return (
                  <div key={opp.id} className="flex items-center gap-4 px-4 py-3">
                    {/* Date block */}
                    <div
                      className="shrink-0 w-12 rounded-lg py-1.5 text-center"
                      style={{ background: style.bg }}
                    >
                      <p className="text-[10px] font-bold uppercase" style={{ color: style.color }}>
                        {new Date(opp.deadline!).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-base font-bold leading-tight" style={{ color: style.color }}>
                        {new Date(opp.deadline!).getDate()}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: opp.applied ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                        {opp.title}
                        {opp.applied && (
                          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--criterion-green)' }}>✓ Applied</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {criterionLabel && (
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{criterionLabel}</span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
                        <span className="text-xs" style={{ color: style.color }}>
                          {opp.daysAway === 0 ? 'Today'
                            : opp.daysAway < 0 ? `${Math.abs(opp.daysAway)}d ago`
                            : `${opp.daysAway}d away`}
                        </span>
                      </div>
                    </div>

                    {/* Link */}
                    {opp.url && !opp.applied && (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded px-3 py-1.5 text-xs font-semibold"
                        style={{ background: '#111827', color: '#fff' }}
                      >
                        Apply →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
