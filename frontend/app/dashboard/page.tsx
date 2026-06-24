'use client'

import { useState, type ReactNode } from 'react'
import { useDashboard } from './hooks/useDashboard'
import StatsRow from './components/StatsRow'
import CriteriaPanel from './components/CriteriaPanel'
import TaskList from './components/TaskList'
import CriteriaOpportunityPanels from './components/CriteriaOpportunityPanels'
import OutcomeTracker from './components/OutcomeTracker'
import ScanButton from './components/ScanButton'
import Toast from './components/Toast'
import ReadinessCard from './components/ReadinessCard'
import ReadinessRoadmap from './components/ReadinessRoadmap'
import UpcomingDeadlines from './components/UpcomingDeadlines'
import type { OutcomeItem } from './hooks/useDashboard'
import { RefreshCw } from 'lucide-react'

export default function CommandCenter() {
  const {
    summary,
    profile,
    criteria,
    tasks,
    opportunities,
    isExampleOpportunities,
    outcomes,
    loading,
    refresh,
    updateTask,
    dismissOpportunity,
    markOpportunityApplied,
    updateOutcomeStatus,
  } = useDashboard()

  const [toast, setToast] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const isMock = summary?._is_mock ?? false
  const name = profile?.name?.trim().split(' ')[0] ?? ''

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Hey{name ? `, ${name}` : ''} 👋
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{today}</p>
        </div>

        <div className="flex items-center gap-2">
          {isMock && !loading && (
            <span className="badge badge-amber">Sample data · run a scan to load yours</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="btn-ghost"
            title="Refresh dashboard"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <ScanButton
            initialStatus={summary?.scan_status}
            initialFinishedAt={summary?.scan_finished_at}
            onScanComplete={refresh}
            onError={setToast}
            redirectTo="/dashboard/opportunities"
            subtitle="for opportunities"
          />
        </div>
      </div>

      {/* ── Overview ─────────────────────────────────────── */}
      <Section label="Overview" hint="Your case at a glance">
        <StatsRow summary={summary} loading={loading} targetFilingDate={profile?.target_filing_date} />
      </Section>

      {/* ── Roadmap: where you stand + criteria tracking ─── */}
      <Section label="Your roadmap" hint="Where you stand, what suits you, and what to push next">
        <ReadinessRoadmap profile={profile} loading={loading} onRefresh={refresh} />
      </Section>

      {/* ── Today's focus: plan + readiness + deadlines ──── */}
      <Section label="Do this today" hint="Your AI plan, filing readiness, and what's due soon">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TaskList
              tasks={tasks}
              opportunities={opportunities}
              loading={loading}
              onToggle={updateTask}
              onError={setToast}
            />
          </div>
          <div className="space-y-4">
            <ReadinessCard />
            <UpcomingDeadlines />
          </div>
        </div>
      </Section>

      {/* ── Evidence health ──────────────────────────────── */}
      <Section label="Where you stand" hint="Strength of evidence across your EB-1A criteria">
        <CriteriaPanel
          criteria={criteria}
          loading={loading}
          focused={(profile?.focused_criteria?.length ?? 0) > 0}
        />
      </Section>

      {/* ── Opportunities ────────────────────────────────── */}
      <Section label="Grow your case" hint="Apply to opportunities that build evidence for your weak criteria">
        <CriteriaOpportunityPanels
          opportunities={opportunities}
          isExampleOpportunities={isExampleOpportunities}
          loading={loading}
          lastScannedAt={summary?.scan_finished_at ?? null}
          onApplied={markOpportunityApplied}
          onIgnore={dismissOpportunity}
          onError={setToast}
        />
      </Section>

      {/* ── Applications ─────────────────────────────────── */}
      <Section label="Track your applications" hint="Outcomes of opportunities you've applied to">
        <OutcomeTracker
          outcomes={outcomes}
          loading={loading}
          onStatusChange={updateOutcomeStatus}
          onError={setToast}
        />
      </Section>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function Section({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-0.5">
        <h2
          className="text-[11px] font-semibold uppercase"
          style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
        >
          {label}
        </h2>
        {hint && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {hint}</span>
        )}
      </div>
      {children}
    </section>
  )
}
