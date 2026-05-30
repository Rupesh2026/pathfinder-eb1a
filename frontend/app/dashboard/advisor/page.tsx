'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = { role: 'user' | 'assistant'; content: string }

const GREETING: Message = {
  role: 'assistant',
  content:
    "Hi! I'm your EB-1A strategy advisor. I have full context of your case — criteria scores, gaps, and recent outcomes.\n\nAsk me anything: how to strengthen a specific criterion, what evidence to prioritize, how to interpret your scores, or how to build a compelling petition narrative.",
}

type AdvisorContext = {
  domain?: string
  role?: string
  profileStrength?: number
  criteriaScores?: Record<string, number>
  gaps?: string[]
  recentOutcomes?: { title: string; status: string }[]
}

type KBChunk = { content: string; source: string; title: string; similarity: number }

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [context, setContext] = useState<AdvisorContext>({})
  const [contextLoaded, setContextLoaded] = useState(false)
  const [kbBacked, setKbBacked] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function loadContext() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, criteriaRes, summaryRes, outcomesRes] = await Promise.all([
        supabase.from('profiles').select('domain, role').eq('user_id', user.id).single(),
        fetch('/api/dashboard/criteria'),
        fetch('/api/dashboard/summary'),
        fetch('/api/dashboard/outcomes'),
      ])

      const profile = profileRes.data
      const criteria: { criterion: string; label: string; score: number }[] = criteriaRes.ok
        ? await criteriaRes.json()
        : []
      const summary = summaryRes.ok ? await summaryRes.json() : {}
      const outcomesArr: { opportunity_title: string; status: string }[] = outcomesRes.ok
        ? await outcomesRes.json()
        : []

      const criteriaScores: Record<string, number> = {}
      const gaps: string[] = []
      for (const c of criteria) {
        criteriaScores[c.criterion] = c.score
        if (c.score < 40) gaps.push(c.label)
      }

      setContext({
        domain: profile?.domain ?? undefined,
        role: profile?.role ?? undefined,
        profileStrength: summary.profile_strength,
        criteriaScores,
        gaps,
        recentOutcomes: Array.isArray(outcomesArr)
          ? outcomesArr.slice(0, 5).map(o => ({ title: o.opportunity_title, status: o.status }))
          : [],
      })
      setContextLoaded(true)
    }
    loadContext()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchKBContext(message: string): Promise<string> {
    try {
      const res = await fetch('/api/advisor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) return ''
      const { chunks, context: kbCtx } = await res.json() as { chunks: KBChunk[]; context: string }
      if (chunks?.length) setKbBacked(true)
      return kbCtx || ''
    } catch {
      return ''
    }
  }

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || streaming) return
    setInput('')

    const userMsg: Message = { role: 'user', content: trimmed }
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)
    setKbBacked(false)

    // Fetch USCIS precedent context and prepend to system context
    const kbContext = await fetchKBContext(trimmed)
    const enrichedContext = kbContext
      ? { ...context, kbPrecedent: kbContext }
      : context

    try {
      const response = await fetch('/api/dashboard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], context: enrichedContext }),
      })

      if (!response.ok || !response.body) {
        let errText = 'Could not connect. Check that ANTHROPIC_API_KEY or GEMINI_API_KEY is set.'
        try {
          const j = await response.json()
          if (j.error) errText = j.error
        } catch {}
        setMessages(prev => {
          const u = [...prev]
          u[u.length - 1] = { role: 'assistant', content: errText }
          return u
        })
        setStreaming(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            setStreaming(false)
            return
          }
          try {
            const { text, error } = JSON.parse(data)
            if (error) {
              setMessages(prev => {
                const u = [...prev]
                u[u.length - 1] = { role: 'assistant', content: `Error: ${error}` }
                return u
              })
              setStreaming(false)
              return
            }
            if (text) {
              setMessages(prev => {
                const u = [...prev]
                u[u.length - 1] = { ...u[u.length - 1], content: u[u.length - 1].content + text }
                return u
              })
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const u = [...prev]
        u[u.length - 1] = { role: 'assistant', content: 'Connection error. Please try again.' }
        return u
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const gaps = context.gaps ?? []
  const strength = context.profileStrength

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Context bar */}
      <div
        className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-5 py-3"
        style={{ background: 'var(--secondary-bg)', border: '0.5px solid var(--card-border-color)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Advisor</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: 'var(--urgency-green-bg)', color: 'var(--urgency-green-text)' }}
          >
            {contextLoaded ? 'Context loaded' : 'Loading context…'}
          </span>
          {kbBacked && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: '#E8F0FB', color: 'var(--criterion-blue)' }}
              title="Answer enriched with AAO decisions and USCIS precedent"
            >
              Knowledge-backed
            </span>
          )}
        </div>
        {strength != null && (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Profile strength: <strong style={{ color: 'var(--text-primary)' }}>{strength}%</strong>
          </span>
        )}
        {gaps.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Gaps:{' '}
            <span style={{ color: 'var(--criterion-red)' }}>{gaps.join(', ')}</span>
          </span>
        )}
        {context.domain && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {context.role} · {context.domain}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={
                msg.role === 'user'
                  ? { background: 'var(--secondary-bg)', color: 'var(--text-primary)', border: '0.5px solid var(--card-border-color)' }
                  : { background: '#111827', color: '#fff' }
              }
            >
              {msg.role === 'user' ? 'You' : 'AI'}
            </div>
            <div
              className="max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: '#111827', color: '#fff' }
                  : {
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '0.5px solid var(--card-border-color)',
                      whiteSpace: 'pre-wrap',
                    }
              }
            >
              {msg.content || (streaming && i === messages.length - 1 ? (
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                </span>
              ) : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--card-bg)', border: '0.5px solid var(--card-border-color)' }}
      >
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={streaming}
            placeholder="Ask about your EB-1A strategy… (Enter to send · Shift+Enter for newline)"
            rows={3}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
            style={{
              background: 'var(--secondary-bg)',
              color: 'var(--text-primary)',
              border: '0.5px solid var(--card-border-color)',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="self-end rounded-xl px-6 py-3 text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: '#111827', color: '#fff' }}
          >
            {streaming ? '…' : 'Send'}
          </button>
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Your profile context — scores, gaps, and outcomes — is included automatically. Relevant AAO decisions and USCIS precedent are injected when available.
        </p>
      </div>
    </div>
  )
}
