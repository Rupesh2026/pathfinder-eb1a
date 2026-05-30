import { createClient } from '@/lib/supabase/server'
import OpportunityCard from '@/components/OpportunityCard'
import ScanButton from '../components/ScanButton'
import { CRITERION_LABELS, type CriterionType, type OpportunityType } from '@/lib/types'
import { VISIBILITY_OR_FILTER, MODE_BADGES, type OpportunityMode } from '@/lib/opportunity-visibility'

const TYPE_LABELS: Record<OpportunityType, string> = {
  cfp: 'CFP', judging: 'Judging', speaking: 'Speaking',
  award: 'Award', podcast: 'Podcast', grant: 'Grant', peer_review: 'Peer Review',
}

const MODE_FILTER_OPTIONS: { key: string; label: string; badge: string }[] = [
  { key: '', label: 'All formats', badge: '' },
  { key: 'online',    label: 'Online',    badge: MODE_BADGES.online.classes },
  { key: 'in_person', label: 'In person', badge: MODE_BADGES.in_person.classes },
  { key: 'hybrid',    label: 'Hybrid',    badge: MODE_BADGES.hybrid.classes },
]

type Props = {
  searchParams: Promise<{ criterion?: string; type?: string; show?: string; mode?: string }>
}

export default async function OpportunitiesPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const showApplied = params.show === 'applied'
  const modeFilter = params.mode ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('focused_criteria')
    .eq('user_id', user!.id)
    .single()

  const focusedCriteria: string[] = profile?.focused_criteria ?? []

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('user_id', user!.id)
    .eq('dismissed', false)
    // Worldwide visibility: US shown online+offline, non-US online/hybrid only.
    .or(VISIBILITY_OR_FILTER)
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Opportunities
            {opportunities && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({opportunities.length})
              </span>
            )}
          </h2>
          {focusedCriteria.length > 0 && !params.criterion && (
            <p className="mt-0.5 text-xs text-gray-400">
              Filtered to {focusedCriteria.length} focused criteria ·{' '}
              <a href="/dashboard/profile" className="underline hover:text-gray-600">change focus</a>
            </p>
          )}
        </div>
        <ScanButton
          redirectTo="/dashboard/opportunities"
          subtitle="for opportunities"
        />
      </div>

      {/* Visibility note */}
      <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <span className="mt-0.5 shrink-0">ℹ️</span>
        <span>
          <span className="font-medium text-gray-700">How opportunities are filtered: </span>
          US opportunities show in all formats (online and in-person). Non-US opportunities show only
          when they can be attended <span className="font-medium text-emerald-700">online</span> or{' '}
          <span className="font-medium text-violet-700">hybrid</span> — non-US in-person events are
          hidden since they require travel that may not be safe during a visa/petition process.
        </span>
      </div>

      {/* Mode filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Format:</span>
        {MODE_FILTER_OPTIONS.map(opt => {
          const isActive = modeFilter === opt.key
          const href = opt.key
            ? `/dashboard/opportunities?mode=${opt.key}${params.criterion ? `&criterion=${params.criterion}` : ''}${params.type ? `&type=${params.type}` : ''}`
            : `/dashboard/opportunities${params.criterion ? `?criterion=${params.criterion}` : ''}${params.type ? `${params.criterion ? '&' : '?'}type=${params.type}` : ''}`
          return (
            <a
              key={opt.key}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                isActive
                  ? opt.badge || 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
              }`}
            >
              {opt.label}
            </a>
          )
        })}
      </div>

      {/* Criterion / type / applied filters */}
      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href="/dashboard/opportunities"
          className={`rounded-full px-3 py-1 border ${!params.criterion && !params.type && !showApplied && !modeFilter ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
        >
          All
        </a>
        {criterionKeys.map((c) => (
          <a
            key={c}
            href={`/dashboard/opportunities?criterion=${c}${modeFilter ? `&mode=${modeFilter}` : ''}`}
            className={`rounded-full px-3 py-1 border ${params.criterion === c ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            {CRITERION_LABELS[c]}
          </a>
        ))}
        <div className="h-6 w-px bg-gray-200 self-center" />
        {typeKeys.map((t) => (
          <a
            key={t}
            href={`/dashboard/opportunities?type=${t}${modeFilter ? `&mode=${modeFilter}` : ''}`}
            className={`rounded-full px-3 py-1 border ${params.type === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            {TYPE_LABELS[t]}
          </a>
        ))}
        <div className="h-6 w-px bg-gray-200 self-center" />
        <a
          href="/dashboard/opportunities?show=applied"
          className={`rounded-full px-3 py-1 border ${showApplied ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
        >
          Applied
        </a>
      </div>

      {/* List */}
      {opportunities && opportunities.length > 0 ? (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center space-y-4">
          <div>
            <p className="text-sm text-gray-500">No opportunities found.</p>
            <p className="mt-1 text-xs text-gray-400">
              Run a scan to discover opportunities for your criteria.
            </p>
          </div>
          <div className="flex justify-center">
            <ScanButton
              redirectTo="/dashboard/opportunities"
              subtitle="for opportunities"
            />
          </div>
        </div>
      )}
    </div>
  )
}
