import { createClient } from '@/lib/supabase/server'
import OpportunityCard from '@/components/OpportunityCard'
import ScanButton from '../components/ScanButton'
import { CRITERION_LABELS, type CriterionType, type OpportunityType } from '@/lib/types'
import { VISIBILITY_OR_FILTER, futureDeadlineOrFilter } from '@/lib/opportunity-visibility'
import { Compass, Info } from 'lucide-react'

const TYPE_LABELS: Record<OpportunityType, string> = {
  cfp: 'CFP', judging: 'Judging', speaking: 'Speaking',
  award: 'Award', podcast: 'Podcast', grant: 'Grant', peer_review: 'Peer Review',
}

type Props = {
  searchParams: Promise<{ criterion?: string; type?: string; show?: string; mode?: string }>
}

type FilterPillProps = {
  href: string
  label: string
  active: boolean
  dot?: string
}

function FilterPill({ href, label, active, dot }: FilterPillProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
      style={{
        background: active ? 'var(--accent-subtle)' : 'var(--bg-raised)',
        color: active ? 'var(--accent-hover)' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
      }}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      )}
      {label}
    </a>
  )
}

export default async function OpportunitiesPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const showApplied = params.show === 'applied'
  const modeFilter = params.mode ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('focused_criteria, scan_status, scan_completed_at')
    .eq('user_id', user!.id)
    .single()

  const focusedCriteria: string[] = profile?.focused_criteria ?? []

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('user_id', user!.id)
    .eq('dismissed', false)
    .or(VISIBILITY_OR_FILTER)
    // Hide opportunities whose deadline has passed (keep undated/rolling ones).
    .or(futureDeadlineOrFilter())
    .order('priority_score', { ascending: false })

  if (!showApplied) query = query.eq('applied', false)
  if (params.criterion) query = query.eq('criterion', params.criterion)
  else if (focusedCriteria.length > 0) query = query.in('criterion', focusedCriteria)
  if (params.type) query = query.eq('type', params.type)
  if (modeFilter) query = query.eq('delivery_mode', modeFilter)

  const { data: opportunities } = await query

  const criterionKeys = (focusedCriteria.length > 0
    ? Object.keys(CRITERION_LABELS).filter(c => focusedCriteria.includes(c))
    : Object.keys(CRITERION_LABELS)) as CriterionType[]

  const typeKeys = Object.keys(TYPE_LABELS) as OpportunityType[]
  const count = opportunities?.length ?? 0

  const modeOptions = [
    { key: '', label: 'All formats' },
    { key: 'online',    label: 'Online' },
    { key: 'in_person', label: 'In-person' },
    { key: 'hybrid',    label: 'Hybrid' },
  ]

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = { criterion: params.criterion, type: params.type, show: params.show, mode: modeFilter, ...overrides }
    const qs = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&')
    return `/dashboard/opportunities${qs ? '?' + qs : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
          >
            <Compass size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Opportunities
              <span className="ml-2 text-base font-normal" style={{ color: 'var(--text-muted)' }}>
                {count > 0 && `(${count})`}
              </span>
            </h1>
            {focusedCriteria.length > 0 && !params.criterion && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Filtered to {focusedCriteria.length} focused criteria ·{' '}
                <a href="/dashboard/profile" style={{ color: 'var(--accent)' }}>change</a>
              </p>
            )}
          </div>
        </div>
        <ScanButton
          initialStatus={profile?.scan_status}
          initialFinishedAt={profile?.scan_completed_at}
          redirectTo="/dashboard/opportunities"
        />
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3 text-xs"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
      >
        <Info size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-muted)' }}>
          US opportunities show in all formats. Non-US shows only{' '}
          <span className="font-medium" style={{ color: 'var(--c-judging)' }}>online</span> &amp;{' '}
          <span className="font-medium" style={{ color: 'var(--c-memberships)' }}>hybrid</span>{' '}
          — in-person non-US events are hidden (require travel during visa process).
        </span>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Mode */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="section-header">Format</span>
          {modeOptions.map(opt => (
            <FilterPill
              key={opt.key}
              href={buildHref({ mode: opt.key || undefined })}
              label={opt.label}
              active={modeFilter === opt.key}
            />
          ))}
        </div>

        {/* Criteria */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="section-header">Criteria</span>
          <FilterPill href={buildHref({ criterion: undefined, type: undefined, show: undefined })} label="All" active={!params.criterion && !params.type && !showApplied} />
          {criterionKeys.map(c => (
            <FilterPill
              key={c}
              href={buildHref({ criterion: c })}
              label={CRITERION_LABELS[c]}
              active={params.criterion === c}
            />
          ))}
        </div>

        {/* Types + Applied */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="section-header">Type</span>
          {typeKeys.map(t => (
            <FilterPill
              key={t}
              href={buildHref({ type: t })}
              label={TYPE_LABELS[t]}
              active={params.type === t}
            />
          ))}
          <div className="h-4 w-px mx-1" style={{ background: 'var(--border)' }} />
          <FilterPill
            href={buildHref({ show: 'applied' })}
            label="Applied"
            active={showApplied}
            dot="var(--green)"
          />
        </div>
      </div>

      {/* List */}
      {opportunities && opportunities.length > 0 ? (
        <div className="space-y-3">
          {opportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ border: '1px dashed var(--border)', background: 'var(--bg-surface)' }}
        >
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--bg-raised)' }}
          >
            <Compass size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No opportunities yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Run a scan to discover opportunities matching your criteria gaps
          </p>
          <div className="mt-5">
            <ScanButton redirectTo="/dashboard/opportunities" />
          </div>
        </div>
      )}
    </div>
  )
}
