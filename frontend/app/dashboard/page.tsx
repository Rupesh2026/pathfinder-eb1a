'use client'

import { useState } from 'react'
import { useDashboard } from './hooks/useDashboard'
import StatsRow from './components/StatsRow'
import CriteriaPanel from './components/CriteriaPanel'
import CriteriaOpportunityPanels from './components/CriteriaOpportunityPanels'
import OutcomeTracker from './components/OutcomeTracker'
import ScanButton from './components/ScanButton'
import Toast from './components/Toast'
import ReadinessCard from './components/ReadinessCard'
import UpcomingDeadlines from './components/UpcomingDeadlines'
import type { OutcomeItem } from './hooks/useDashboard'

function strengthColor(pct: number): string {
  if (pct >= 65) return 'var(--criterion-green)'
  if (pct >= 40) return 'var(--criterion-blue)'
  if (pct >= 20) return 'var(--criterion-amber)'
  return 'var(--criterion-red)'
}

export default function CommandCenter() {
  const {
    summary,
    profile,
    criteria,
    tasks,
    opportunities,
    outcomes,
    loading,
    refresh,
    dismissOpportunity,
    markOpportunityApplied,
    updateOutcomeStatus,
  } = useDashboard()

  const isFocused = (profile?.focused_criteria?.length ?? 0) > 0

  const [toast, setToast] = useState<string | null>(null)

  function showError(msg: string) {
    setToast(msg)
  }

  // CriteriaOpportunityPanels calls this after the API call succeeds
  function handleOpportunityApplied(id: string) {
    markOpportunityApplied(id)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const isMock = summary?._is_mock ?? false

  return (
    <div className="space-y-5">
      {/* ── Top Bar ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            EB-1A Command Center
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{today}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isMock && !loading && (
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: 'var(--urgency-amber-bg)', color: 'var(--urgency-amber-text)' }}
            >
              Sample data — run a scan to load yours
            </span>
          )}

          <button
            onClick={refresh}
            disabled={loading}
            className="text-xs font-medium disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}
            title="Refresh all dashboard data"
          >
            ↺ Refresh
          </button>

          <ScanButton
            initialStatus={summary?.scan_status}
            initialFinishedAt={summary?.scan_finished_at}
            onScanComplete={refresh}
            onError={showError}
            redirectTo="/dashboard/opportunities"
            subtitle="for opportunities"
          />

          {summary && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: 'var(--secondary-bg)',
                color: strengthColor(summary.profile_strength),
                border: '0.5px solid var(--card-border-color)',
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: strengthColor(summary.profile_strength) }}
              />
              {summary.profile_strength}% strength
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────── */}
      <StatsRow summary={summary} loading={loading} targetFilingDate={profile?.target_filing_date} />

      {/* ── Readiness Card ──────────────────────── */}
      <ReadinessCard />

      {/* ── Row 1: Criteria (full width) ────────── */}
      <CriteriaPanel criteria={criteria} loading={loading} focused={isFocused} />

      {/* ── Upcoming Deadlines strip ────────────── */}
      <UpcomingDeadlines />

      {/* ── Row 2: Opportunities (wide) + Right stack ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CriteriaOpportunityPanels
            criteria={criteria}
            opportunities={opportunities}
            loading={loading}
            lastScannedAt={summary?.scan_finished_at ?? null}
            onApplied={handleOpportunityApplied}
            onIgnore={dismissOpportunity}
            onError={showError}
          />
        </div>

        <div className="lg:col-span-1">
          <OutcomeTracker
            outcomes={outcomes}
            loading={loading}
            onStatusChange={updateOutcomeStatus}
            onError={showError}
          />
        </div>
      </div>

      {/* ── Toast ───────────────────────────────── */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
