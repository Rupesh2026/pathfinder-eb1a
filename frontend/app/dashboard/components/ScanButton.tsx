'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ScanStatus = 'idle' | 'running' | 'done' | 'error' | 'queued'

type Props = {
  initialStatus?: string | null
  initialFinishedAt?: string | null
  onScanComplete?: () => void
  onError?: (msg: string) => void
  redirectTo?: string
  subtitle?: string
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ScanButton({ initialStatus, initialFinishedAt, onScanComplete, onError, redirectTo, subtitle }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<ScanStatus>((initialStatus as ScanStatus) ?? 'idle')
  const [finishedAt, setFinishedAt] = useState<string | null>(initialFinishedAt ?? null)
  const [scanning, setScanning] = useState(false)
  const [timeLabel, setTimeLabel] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [, forceUpdate] = useState(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/scan/status', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const s: ScanStatus = data.status ?? 'idle'
      setStatus(s)
      if (s === 'done' || s === 'error') {
        setFinishedAt(data.finished_at)
        setScanning(false)
        stopPolling()
        if (s === 'done') {
          onScanComplete?.()
          if (redirectTo) router.push(redirectTo)
        }
      }
    } catch {}
  }, [stopPolling, onScanComplete, redirectTo, router])

  // Restore running state on mount
  useEffect(() => {
    if (initialStatus === 'running' || initialStatus === 'queued') {
      setScanning(true)
      pollRef.current = setInterval(pollStatus, 3000)
    }
    return stopPolling
  }, []) // intentionally run only once on mount

  // Update time label every 30s
  useEffect(() => {
    const update = () => {
      if (finishedAt) setTimeLabel(timeAgo(finishedAt))
      forceUpdate(n => n + 1)
    }
    update()
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [finishedAt])

  const handleScan = async () => {
    if (scanning) return
    setScanning(true)
    setStatus('queued')
    setTimeLabel('')

    try {
      const res = await fetch('/api/dashboard/scan', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        onError?.(err.error ?? 'Scan failed to start')
        setScanning(false)
        setStatus('error')
        return
      }
      setStatus('running')
      stopPolling()
      pollRef.current = setInterval(pollStatus, 3000)
    } catch {
      onError?.('Could not reach server. Check AGENT_SERVER_URL.')
      setScanning(false)
      setStatus('error')
    }
  }

  const isRunning = scanning || status === 'running' || status === 'queued'

  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-center gap-3">
        <button
          onClick={handleScan}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-opacity disabled:opacity-60"
          style={{
            background: isRunning ? 'var(--secondary-bg)' : '#111827',
            color: isRunning ? 'var(--text-secondary)' : '#fff',
            border: '0.5px solid var(--card-border-color)',
          }}
        >
          {isRunning ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Scanning…
            </>
          ) : (
            <>
              <span>↻</span> Scan Now
            </>
          )}
        </button>

        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {isRunning
            ? 'Running pipeline…'
            : finishedAt
            ? `Last scanned: ${timeLabel}`
            : 'Not scanned yet'}
        </span>
      </div>

      {subtitle && !isRunning && (
        <span className="text-[10px] pl-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {subtitle}
        </span>
      )}
    </div>
  )
}
