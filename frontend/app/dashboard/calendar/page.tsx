import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CRITERION_LABELS, type CriterionType } from '@/lib/types'
import { todayISO } from '@/lib/opportunity-visibility'
import { Calendar, ExternalLink, CheckCircle2 } from 'lucide-react'

function urgencyColor(daysAway: number): string {
  if (daysAway <= 7)  return 'var(--c-critical_role)' // warm coral — legible, not alarm red
  if (daysAway <= 30) return 'var(--amber)'
  return 'var(--green)'
}

function groupByMonth<T extends { deadline: string }>(opps: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
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
    .select('id, title, criterion, type, deadline, url, applied')
    .eq('user_id', user!.id)
    .eq('dismissed', false)
    .not('deadline', 'is', null)
    // Upcoming only — never list a deadline that has already passed.
    .gte('deadline', todayISO())
    .order('deadline', { ascending: true })

  if (focusedCriteria.length > 0) query = query.in('criterion', focusedCriteria)

  const { data: allOpps } = await query
  const now = new Date()

  const opportunities = (allOpps ?? []).map(opp => ({
    ...opp,
    daysAway: Math.ceil((new Date(opp.deadline!).getTime() - now.getTime()) / 86_400_000),
  }))

  const upcoming = opportunities.filter(o => o.daysAway >= -7)
  const byMonth = groupByMonth(upcoming as (typeof upcoming[0])[])

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
          >
            <Calendar size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Calendar</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {upcoming.length} upcoming deadline{upcoming.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link href="/dashboard/opportunities" className="btn-ghost text-xs">
          All opportunities <ExternalLink size={11} />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ border: '1px dashed var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-raised)' }}>
            <Calendar size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No upcoming deadlines</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Run a scan to discover opportunities with deadlines</p>
        </div>
      ) : (
        Object.entries(byMonth).map(([month, opps]) => (
          <div key={month}>
            <p className="section-header mb-3">{month}</p>
            <div className="card overflow-hidden">
              {opps.map((opp, idx) => {
                const color = urgencyColor(opp.daysAway)
                const criterionLabel = opp.criterion
                  ? CRITERION_LABELS[opp.criterion as CriterionType] ?? opp.criterion
                  : null
                const isUrgent = opp.daysAway <= 7

                return (
                  <div
                    key={opp.id}
                    className="flex items-center gap-4 px-4 py-3.5"
                    style={{
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      borderLeft: isUrgent ? `3px solid ${color}` : '3px solid transparent',
                    }}
                  >
                    {/* Date block */}
                    <div
                      className="flex w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg py-1.5"
                      style={{ background: `${color}15` }}
                    >
                      <p className="text-[9px] font-bold uppercase" style={{ color }}>
                        {new Date(opp.deadline!).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-lg font-bold leading-tight" style={{ color }}>
                        {new Date(opp.deadline!).getDate()}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: opp.applied ? 'var(--text-muted)' : 'var(--text-primary)' }}
                        >
                          {opp.title}
                        </p>
                        {opp.applied && (
                          <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {criterionLabel && <span>{criterionLabel}</span>}
                        {criterionLabel && <span>·</span>}
                        <span style={{ color }}>
                          {opp.daysAway === 0 ? 'Today'
                            : opp.daysAway < 0 ? `${Math.abs(opp.daysAway)}d ago`
                            : `${opp.daysAway}d away`}
                        </span>
                      </div>
                    </div>

                    {opp.url && !opp.applied && (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex-shrink-0 text-xs px-3 py-1.5"
                      >
                        Apply <ExternalLink size={10} />
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
