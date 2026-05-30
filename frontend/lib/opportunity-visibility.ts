// Worldwide opportunity visibility rule (mirrors agents/tools/opportunity_tools.is_visible):
//   US opportunities      -> shown in both online and in-person (offline) form
//   non-US opportunities  -> shown only when online or hybrid (never pure in-person)
//
// Applied at read time so the stored data stays complete (the agent records every
// opportunity it finds worldwide) while the UI only surfaces ones the user can act on.

export type OpportunityMode = 'online' | 'in_person' | 'hybrid'

// PostgREST `.or()` filter string implementing the rule above.
// is_us=true  -> always visible; otherwise delivery_mode must not be in_person.
export const VISIBILITY_OR_FILTER = 'is_us.eq.true,delivery_mode.neq.in_person'

/** Apply the visibility rule to a Supabase query builder. */
export function applyVisibilityFilter<T extends { or: (f: string) => T }>(query: T): T {
  return query.or(VISIBILITY_OR_FILTER)
}

/** In-memory equivalent of the rule, for filtering already-fetched rows (e.g. mock data). */
export function isVisible(opp: { is_us?: boolean | null; delivery_mode?: string | null }): boolean {
  return Boolean(opp.is_us) || (opp.delivery_mode ?? 'online') !== 'in_person'
}

export const MODE_LABELS: Record<OpportunityMode, string> = {
  online: 'Online',
  in_person: 'In person',
  hybrid: 'Hybrid',
}

export type ModeBadge = {
  label: string
  /** Tailwind classes for the badge chip */
  classes: string
}

/** Color-coded badge styles: green=online, amber=in-person, purple=hybrid */
export const MODE_BADGES: Record<OpportunityMode, ModeBadge> = {
  online:    { label: 'Online',    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  in_person: { label: 'In person', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
  hybrid:    { label: 'Hybrid',    classes: 'bg-violet-50 text-violet-700 border border-violet-200' },
}

export function getModeBadge(mode: string | null | undefined): ModeBadge {
  return MODE_BADGES[(mode ?? 'online') as OpportunityMode] ?? MODE_BADGES.online
}

/** Resolved country/location label, e.g. "United States", "Singapore", "Global" */
export function countryLabel(opp: { country?: string | null; is_us?: boolean | null }): string {
  return opp.country?.trim() || (opp.is_us ? 'United States' : 'Global')
}

/** Short human label combining location + delivery mode, e.g. "United States · In person". */
export function locationLabel(opp: {
  country?: string | null
  is_us?: boolean | null
  delivery_mode?: string | null
}): string {
  const mode = (opp.delivery_mode ?? 'online') as OpportunityMode
  const modeLabel = MODE_LABELS[mode] ?? MODE_LABELS.online
  const place = countryLabel(opp)
  return `${place} · ${modeLabel}`
}
