'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { Target, Check, Sparkles, TrendingUp, SlidersHorizontal, ArrowUpRight } from 'lucide-react'
import { CRITERION_LABELS, ALL_CRITERIA, type CriterionType } from '@/lib/types'
import type { ProfileData } from '../hooks/useDashboard'

// ── criterion → theme color (from globals.css :root) ─────────────────────────
const CRIT_COLOR: Record<string, string> = {
  awards: 'var(--c-awards)',
  memberships: 'var(--c-memberships)',
  press: 'var(--c-press)',
  judging: 'var(--c-judging)',
  original_contributions: 'var(--c-contributions)',
  scholarly_articles: 'var(--c-scholarly)',
  artistic_exhibitions: 'var(--c-exhibitions)',
  critical_role: 'var(--c-critical_role)',
  high_salary: 'var(--c-high_salary)',
  commercial_success: 'var(--c-commercial)',
}

// Generic fit order used to round out a suggestion when the user has little evidence yet.
const FIT_ORDER: CriterionType[] = [
  'judging', 'scholarly_articles', 'original_contributions', 'awards',
  'critical_role', 'high_salary', 'memberships', 'press',
  'commercial_success', 'artistic_exhibitions',
]

const STRONG_LINE = 65   // score at/above which a criterion is "Met / Strong"
const QUALIFY_GATE = 3   // USCIS requires meeting at least 3 of 10 criteria

type Crit = {
  criterion: string
  label: string
  score: number
  evidence_count: number
  next_actions: string[]
}

// ── localStorage progress history (per-browser tracking metric) ───────────────
const HIST_KEY = 'eb1a_roadmap_history_v1'
type Point = { t: number; s: number }
type Hist = Record<string, Point[]>

function loadHist(): Hist {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}') } catch { return {} }
}
function recordScores(scores: Record<string, number>): Hist {
  const h = loadHist()
  const now = Date.now()
  for (const [c, s] of Object.entries(scores)) {
    const arr = (h[c] ||= [])
    const last = arr[arr.length - 1]
    if (!last || last.s !== s) {
      arr.push({ t: now, s })
      while (arr.length > 12) arr.shift()
    }
  }
  try { localStorage.setItem(HIST_KEY, JSON.stringify(h)) } catch { /* quota / privacy mode */ }
  return h
}
function deltaSinceStart(arr: Point[] | undefined): number | null {
  if (!arr || arr.length < 2) return null
  return arr[arr.length - 1].s - arr[0].s
}

// ── small helpers ─────────────────────────────────────────────────────────────
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const tierName = (s: number) => (s >= STRONG_LINE ? 'Strong' : s >= 40 ? 'Building' : s >= 20 ? 'Weak' : 'Gap')
const tierColor = (s: number) => (s >= STRONG_LINE ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--c-critical_role)')

function stageInfo(strong: number): { label: string; note: string } {
  if (strong >= 6) return { label: 'Petition-Ready', note: 'well above the USCIS minimum' }
  if (strong >= 4) return { label: 'Competitive', note: 'a strong petition is taking shape' }
  if (strong >= QUALIFY_GATE) return { label: 'Qualifying', note: 'you meet the 3-criteria minimum' }
  if (strong >= 1) return { label: 'Building', note: 'gaining momentum' }
  return { label: 'Foundation', note: 'just getting started' }
}

function suggestFocus(items: Crit[]): string[] {
  const traction = items
    .filter(i => i.score > 0 || i.evidence_count > 0)
    .sort((a, b) => (b.score - a.score) || (b.evidence_count - a.evidence_count))
    .map(i => i.criterion)
  const out: string[] = []
  for (const c of traction) if (out.length < 6) out.push(c)
  for (const c of FIT_ORDER) {
    if (out.length >= 5) break
    if (!out.includes(c) && c !== 'artistic_exhibitions') out.push(c)
  }
  return out.slice(0, 6)
}

function Sparkline({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null
  const w = 84, h = 20
  const step = w / (pts.length - 1)
  const y = (s: number) => h - (s / 100) * h
  const d = pts.map((s, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(s).toFixed(1)}`).join(' ')
  const up = pts[pts.length - 1] >= pts[0]
  const stroke = up ? 'var(--green)' : 'var(--c-critical_role)'
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(pts.length - 1) * step} cy={y(pts[pts.length - 1])} r={2} fill={stroke} />
    </svg>
  )
}

type Props = {
  profile: ProfileData | null
  loading: boolean
  onRefresh: () => Promise<void> | void
}

export default function ReadinessRoadmap({ profile, loading, onRefresh }: Props) {
  const [items, setItems] = useState<Crit[] | null>(null)
  const [hist, setHist] = useState<Hist>({})
  const [active, setActive] = useState<string | null>(null)   // hovered dot
  const [pinned, setPinned] = useState<string | null>(null)   // tapped dot (mobile/keyboard)
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const loadCriteria = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/criteria?all=1', { cache: 'no-store' })
      if (!res.ok) return
      const data: Crit[] = await res.json()
      setItems(data)
      const scoreMap: Record<string, number> = {}
      for (const c of data) scoreMap[c.criterion] = c.score
      setHist(recordScores(scoreMap))
    } catch { /* leave items null → skeleton */ }
  }, [])

  useEffect(() => { loadCriteria() }, [loadCriteria, loading])

  const focusList: string[] = useMemo(() => {
    const saved = profile?.focused_criteria ?? []
    if (saved.length > 0) return saved
    if (items) return suggestFocus(items)
    return []
  }, [profile?.focused_criteria, items])

  const usingSuggestion = (profile?.focused_criteria?.length ?? 0) === 0

  const byKey = useMemo(() => {
    const m: Record<string, Crit> = {}
    for (const c of items ?? []) m[c.criterion] = c
    return m
  }, [items])

  const suited = useMemo(
    () => focusList.map(k => byKey[k]).filter(Boolean) as Crit[],
    [focusList, byKey]
  )

  const overall = useMemo(() => {
    const base = suited.length ? suited : (items ?? [])
    return Math.round(avg(base.map(i => i.score)))
  }, [suited, items])

  const strongCount = useMemo(
    () => (items ?? []).filter(i => i.score >= STRONG_LINE).length,
    [items]
  )

  const stage = stageInfo(strongCount)
  const activeKey = pinned ?? active

  // Filing date helper
  const filingNote = useMemo(() => {
    const d = profile?.target_filing_date
    if (!d) return null
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
    const months = Math.max(0, Math.round(days / 30))
    return days < 0 ? 'target date passed' : `~${months} mo to target`
  }, [profile?.target_filing_date])

  function openEditor() {
    setDraft(focusList)
    setEditing(true)
  }
  function toggleDraft(c: string) {
    setDraft(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }
  async function saveFocus() {
    setSaving(true)
    try {
      await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focused_criteria: draft }),
      })
      setEditing(false)
      await Promise.all([loadCriteria(), onRefresh()])
    } finally {
      setSaving(false)
    }
  }

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading || !items) {
    return (
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-24 w-full rounded-xl" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 sm:p-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Your EB-1A roadmap
          </h2>
          <span
            className="badge"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
          >
            {stage.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: tierColor(overall) }}>{overall}%</strong> overall · {stage.note}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {filingNote && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Target size={12} /> {filingNote}
            </span>
          )}
          <button onClick={openEditor} className="btn-ghost" title="Choose which criteria to focus on">
            <SlidersHorizontal size={12} /> Customize
          </button>
        </div>
      </div>

      {/* ── The track ───────────────────────────────────────── */}
      <div className="relative px-1 pt-7 pb-1" style={{ overflow: 'visible' }}>
        {/* "You are here" marker */}
        <div
          className="pointer-events-none absolute z-20"
          style={{ left: `${overall}%`, top: 0, transform: 'translateX(-50%)' }}
        >
          <div
            className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: 'var(--text-primary)', color: 'var(--text-inverted)' }}
          >
            You · {overall}%
          </div>
          <div className="mx-auto" style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--text-primary)' }} />
        </div>

        {/* Band with stage zones */}
        <div className="relative" style={{ height: 46 }}>
          {/* zones */}
          <div className="absolute inset-y-0 rounded-l-lg" style={{ left: '0%', width: '40%', background: 'rgba(234,88,12,0.06)' }} />
          <div className="absolute inset-y-0" style={{ left: '40%', width: '25%', background: 'rgba(180,83,9,0.06)' }} />
          <div className="absolute inset-y-0 rounded-r-lg" style={{ left: '65%', width: '35%', background: 'rgba(22,163,74,0.08)' }} />

          {/* center axis line */}
          <div className="absolute" style={{ left: 0, right: 0, top: '50%', height: 1, background: 'var(--border)' }} />

          {/* Strong / MET line at 65 */}
          <div className="absolute z-10" style={{ left: '65%', top: -5, bottom: -5, width: 0, borderLeft: '1.5px dashed var(--green)' }} />

          {/* dots */}
          {suited.map((c, i) => {
            const left = Math.max(0, Math.min(100, c.score))
            const dy = i % 2 === 0 ? -8 : 8           // alternate rows to de-overlap
            const color = CRIT_COLOR[c.criterion] ?? 'var(--accent)'
            const isStrong = c.score >= STRONG_LINE
            const isQuickWin = c.score >= 50 && c.score < STRONG_LINE
            const isActive = activeKey === c.criterion
            const d = deltaSinceStart(hist[c.criterion])
            return (
              <button
                key={c.criterion}
                onMouseEnter={() => setActive(c.criterion)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(c.criterion)}
                onBlur={() => setActive(null)}
                onClick={() => setPinned(p => (p === c.criterion ? null : c.criterion))}
                aria-label={`${c.label}: ${c.score} out of 100, ${tierName(c.score)}${d && d > 0 ? `, up ${d} since you started` : ''}`}
                className="absolute"
                style={{
                  left: `${left}%`, top: '50%',
                  transform: `translate(-50%, calc(-50% + ${dy}px))`,
                  zIndex: isActive ? 30 : 15,
                  cursor: 'pointer', background: 'transparent', border: 'none', padding: 6,
                }}
              >
                {isQuickWin && (
                  <span
                    className="absolute rounded-full"
                    style={{
                      inset: 0, margin: 'auto', width: 21, height: 21,
                      border: `2px solid ${color}`, opacity: 0.45,
                      animation: 'pulse 1.8s ease-in-out infinite',
                    }}
                  />
                )}
                <span
                  className="block rounded-full"
                  style={{
                    width: isActive ? 16 : 13, height: isActive ? 16 : 13,
                    background: color,
                    border: '2px solid var(--bg-surface)',
                    boxShadow: isActive ? `0 0 0 3px ${color}33, var(--shadow-sm)` : 'var(--shadow-sm)',
                    transition: 'width .12s ease, height .12s ease',
                  }}
                />
                {isStrong && (
                  <Check size={9} strokeWidth={3.5} className="absolute" style={{ inset: 0, margin: 'auto', color: '#fff', pointerEvents: 'none' }} />
                )}
                {d != null && d > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex items-center rounded-full px-1 text-[8px] font-bold"
                    style={{ background: 'var(--green)', color: '#fff', lineHeight: '12px', height: 12 }}
                  >
                    +{d}
                  </span>
                )}
              </button>
            )
          })}

          {/* ghost dots for non-suited criteria (optional) */}
          {showAll && (items ?? []).filter(c => !focusList.includes(c.criterion)).map(c => (
            <button
              key={c.criterion}
              onMouseEnter={() => setActive(c.criterion)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setPinned(p => (p === c.criterion ? null : c.criterion))}
              aria-label={`${c.label}: ${c.score} out of 100 (not in focus)`}
              className="absolute"
              style={{ left: `${Math.max(0, Math.min(100, c.score))}%`, top: '50%', transform: 'translate(-50%,-50%)', background: 'transparent', border: 'none', padding: 5, cursor: 'pointer', zIndex: 12 }}
            >
              <span className="block rounded-full" style={{ width: 11, height: 11, background: 'var(--bg-overlay)', border: '1.5px dashed var(--border-strong)' }} />
            </button>
          ))}

          {/* tooltip */}
          {activeKey && byKey[activeKey] && (() => {
            const c = byKey[activeKey]
            const left = Math.max(14, Math.min(86, c.score))
            const d = deltaSinceStart(hist[c.criterion])
            const pts = (hist[c.criterion] ?? []).map(p => p.s)
            return (
              <div
                className="absolute z-40"
                style={{ left: `${left}%`, top: 'calc(100% + 14px)', transform: 'translateX(-50%)', width: 230 }}
              >
                <div className="mx-auto" style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '7px solid var(--bg-surface)', filter: 'drop-shadow(0 -1px 0 var(--border-strong))' }} />
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-lg)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CRIT_COLOR[c.criterion] ?? 'var(--accent)' }} />
                    <span className="text-[13.5px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {c.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-extrabold tabular-nums" style={{ color: tierColor(c.score) }}>{c.score}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>/100</span>
                    <span className="badge" style={{ background: `${tierColor(c.score)}1a`, color: tierColor(c.score), border: `1px solid ${tierColor(c.score)}40` }}>
                      {tierName(c.score)}
                    </span>
                    {d != null && d !== 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: d > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                        <TrendingUp size={11} /> {d > 0 ? `+${d}` : d}
                      </span>
                    )}
                  </div>
                  {pts.length >= 2 && (
                    <div className="mt-2"><Sparkline pts={pts} /></div>
                  )}
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {c.evidence_count} {c.evidence_count === 1 ? 'evidence item' : 'evidence items'}
                    {d != null && d > 0 ? ' · since you started tracking' : ''}
                  </p>
                  {c.next_actions?.[0] && (
                    <p className="mt-2 text-[11.5px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                      Next: {c.next_actions[0]}
                    </p>
                  )}
                  <Link
                    href={`/dashboard/evidence/${c.criterion}`}
                    className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    Add evidence <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            )
          })()}
        </div>

        {/* zone labels */}
        <div className="relative mt-3.5 h-3 text-[9px] font-semibold uppercase" style={{ letterSpacing: '0.05em' }}>
          <span className="absolute" style={{ left: '20%', transform: 'translateX(-50%)', color: 'var(--c-critical_role)' }}>Gap</span>
          <span className="absolute" style={{ left: '52.5%', transform: 'translateX(-50%)', color: 'var(--amber)' }}>Building</span>
          <span className="absolute" style={{ left: '82.5%', transform: 'translateX(-50%)', color: 'var(--green)' }}>Strong</span>
        </div>
      </div>

      {/* ── Gate annotation ─────────────────────────────────── */}
      <div
        className="mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-1.5"
        style={{
          background: strongCount >= QUALIFY_GATE ? 'var(--green-subtle)' : 'var(--bg-raised)',
          border: `1px solid ${strongCount >= QUALIFY_GATE ? 'var(--green-border)' : 'var(--border)'}`,
        }}
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: QUALIFY_GATE }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: i < strongCount ? 'var(--green)' : 'var(--border-strong)' }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {strongCount >= QUALIFY_GATE ? (
            <><Check size={12} className="-mt-0.5 mr-0.5 inline" style={{ color: 'var(--green)' }} />
              <strong>You meet the USCIS minimum</strong> ({strongCount} of 10 strong). Build toward 5–6 for a competitive case.</>
          ) : (
            <>Meet <strong>{QUALIFY_GATE} criteria</strong> at the Strong line to qualify — you have <strong style={{ color: 'var(--text-primary)' }}>{strongCount}</strong>.</>
          )}
        </span>
      </div>

      {/* ── Legend (suited criteria) ─────────────────────────── */}
      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            {usingSuggestion ? 'Suggested for you' : 'Your focus'}
            {usingSuggestion && <Sparkles size={11} className="-mt-0.5 ml-1 inline" style={{ color: 'var(--accent)' }} />}
          </p>
          <button onClick={() => setShowAll(s => !s)} className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {showAll ? 'Hide other criteria' : 'Show all 10'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suited.map(c => {
            const d = deltaSinceStart(hist[c.criterion])
            return (
              <Link
                key={c.criterion}
                href={`/dashboard/evidence/${c.criterion}`}
                onMouseEnter={() => setActive(c.criterion)}
                onMouseLeave={() => setActive(null)}
                className="flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 transition-base"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: CRIT_COLOR[c.criterion] ?? 'var(--accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: tierColor(c.score) }}>{c.score}</span>
                {d != null && d > 0 && (
                  <span className="text-[10px] font-bold" style={{ color: 'var(--green)' }}>▲{d}</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Criteria chooser ─────────────────────────────────── */}
      {editing && (
        <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Which criteria best suit you?
            </p>
            <button
              onClick={() => setDraft(suggestFocus(items))}
              className="flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles size={11} /> Use suggested
            </button>
          </div>
          <p className="mb-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Pick the 5–6 that fit your field. The agents will scan and plan around these.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CRITERIA.map(c => {
              const on = draft.includes(c)
              return (
                <button
                  key={c}
                  onClick={() => toggleDraft(c)}
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5"
                  style={{
                    background: on ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border)'}`,
                    color: on ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: CRIT_COLOR[c] ?? 'var(--accent)', opacity: on ? 1 : 0.4 }} />
                  <span className="text-xs font-medium">{CRITERION_LABELS[c as CriterionType]}</span>
                  {on && <Check size={11} />}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={saveFocus}
              disabled={saving || draft.length === 0}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {saving ? 'Saving…' : `Save focus (${draft.length})`}
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
