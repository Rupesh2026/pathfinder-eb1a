'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Loader2 } from 'lucide-react'

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
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ScanButton({ initialStatus, initialFinishedAt, onScanComplete, onError, redirectTo }: Props) {
  const router = useRouter()
  const [status, setStatus]     = useState<ScanStatus>((initialStatus as ScanStatus) ?? 'idle')
  const [finishedAt, setFinishedAt] = useState<string | null>(initialFinishedAt ?? null)
  const [scanning, setScanning] = useState(false)
  const [timeLabel, setTimeLabel] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [, forceUpdate] = useState(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
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

  useEffect(() => {
    if (initialStatus === 'running' || initialStatus === 'queued') {
      setScanning(true)
      pollRef.current = setInterval(pollStatus, 3000)
    }
    return stopPolling
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // The main dashboard loads `summary` asynchronously, so initialFinishedAt /
  // initialStatus are undefined on first mount and only arrive later. Sync them
  // into state (unless a scan is actively running) so "Last scan …" appears.
  useEffect(() => {
    if (scanning) return
    if (initialFinishedAt) setFinishedAt(initialFinishedAt)
    if (initialStatus && initialStatus !== 'running' && initialStatus !== 'queued') {
      setStatus(initialStatus as ScanStatus)
    }
  }, [initialFinishedAt, initialStatus, scanning])

  useEffect(() => {
    const update = () => { if (finishedAt) setTimeLabel(timeAgo(finishedAt)); forceUpdate(n => n + 1) }
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
      onError?.('Could not reach agent server')
      setScanning(false)
      setStatus('error')
    }
  }

  const isRunning = scanning || status === 'running' || status === 'queued'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleScan}
        disabled={isRunning}
        className="btn-primary"
        style={isRunning ? { background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
      >
        {isRunning
          ? <Loader2 size={13} className="animate-spin" />
          : <Zap size={13} />}
        {isRunning ? 'Scanning…' : 'Scan Now'}
      </button>
      {(finishedAt || isRunning) && (
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {isRunning ? 'Running agents…' : `Last scan ${timeLabel}`}
        </span>
      )}
    </div>
  )
}
