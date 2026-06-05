'use client'

import { useState } from 'react'
import { useDashboard } from './hooks/useDashboard'
import StatsRow from './components/StatsRow'
import CriteriaPanel from './components/CriteriaPanel'
import TaskList from './components/TaskList'
import CriteriaOpportunityPanels from './components/CriteriaOpportunityPanels'
import OutcomeTracker from './components/OutcomeTracker'
import ScanButton from './components/ScanButton'
import Toast from './components/Toast'
import ReadinessCard from './components/ReadinessCard'
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
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = profile?.role?.split(' ')[0] ?? ''

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting}{name ? `, ${name}` : ''} 👋
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

      {/* ── Stats ────────────────────────────────────────── */}
      <StatsRow summary={summary} loading={loading} targetFilingDate={profile?.target_filing_date} />

      {/* ── Main grid: tasks + readiness + deadlines ─────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's tasks (wide) */}
        <div className="lg:col-span-2">
          <TaskList
            tasks={tasks}
            loading={loading}
            onToggle={updateTask}
            onError={setToast}
          />
        </div>

        {/* Readiness + deadlines stack */}
        <div className="space-y-4">
          <ReadinessCard />
          <UpcomingDeadlines />
        </div>
      </div>

      {/* ── Criteria evidence health ──────────────────────── */}
      <CriteriaPanel
        criteria={criteria}
        loading={loading}
        focused={(profile?.focused_criteria?.length ?? 0) > 0}
      />

      {/* ── Opportunities + outcomes ──────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CriteriaOpportunityPanels
            criteria={criteria}
            opportunities={opportunities}
            isExampleOpportunities={isExampleOpportunities}
            loading={loading}
            lastScannedAt={summary?.scan_finished_at ?? null}
            onApplied={markOpportunityApplied}
            onIgnore={dismissOpportunity}
            onError={setToast}
          />
        </div>
        <div>
          <OutcomeTracker
            outcomes={outcomes}
            loading={loading}
            onStatusChange={updateOutcomeStatus}
            onError={setToast}
          />
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
