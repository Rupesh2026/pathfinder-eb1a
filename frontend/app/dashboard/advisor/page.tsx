'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, User, BookOpen, Loader2, Sparkles } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type AdvisorContext = {
  domain?: string
  role?: string
  profileStrength?: number
  criteriaScores?: Record<string, number>
  gaps?: string[]
  recentOutcomes?: { title: string; status: string }[]
}

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! I'm your EB-1A strategy advisor. I have full context of your case — criteria scores, gaps, and recent outcomes.\n\nAsk me anything: how to strengthen a specific criterion, what evidence to prioritize, how to interpret your scores, or how to build a compelling petition narrative.",
}

const SUGGESTIONS = [
  'Which criterion should I focus on first?',
  'How do I build a strong judging evidence case?',
  'What makes a compelling extraordinary ability narrative?',
  'Review my evidence gaps and suggest next steps',
]

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
      const criteria: { criterion: string; label: string; score: number }[] = criteriaRes.ok ? await criteriaRes.json() : []
      const summary = summaryRes.ok ? await summaryRes.json() : {}
      const outcomesArr: { opportunity_title: string; status: string }[] = outcomesRes.ok ? await outcomesRes.json() : []

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
      const { chunks, context: kbCtx } = await res.json()
      if (chunks?.length) setKbBacked(true)
      return kbCtx || ''
    } catch { return '' }
  }

  async function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || streaming) return
    setInput('')

    const userMsg: Message = { role: 'user', content: trimmed }
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)
    setKbBacked(false)

    const kbContext = await fetchKBContext(trimmed)
    const enrichedContext = kbContext ? { ...context, kbPrecedent: kbContext } : context

    try {
      const response = await fetch('/api/dashboard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], context: enrichedContext }),
      })

      if (!response.ok || !response.body) {
        let errText = 'Could not connect. Check that ANTHROPIC_API_KEY or GEMINI_API_KEY is set.'
        try { const j = await response.json(); if (j.error) errText = j.error } catch {}
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: errText }; return u })
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
          if (data === '[DONE]') { setStreaming(false); return }
          try {
            const { text, error } = JSON.parse(data)
            if (error) { setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `Error: ${error}` }; return u }); setStreaming(false); return }
            if (text) setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: u[u.length - 1].content + text }; return u })
          } catch {}
        }
      }
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: 'Connection error. Please try again.' }; return u })
    } finally {
      setStreaming(false)
    }
  }

  const gaps = context.gaps ?? []
  const strength = context.profileStrength
  const showSuggestions = messages.length <= 1

  return (
    <div className="flex flex-col animate-fade-in" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)', boxShadow: '0 0 16px var(--accent-border)' }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>AI Advisor</h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: contextLoaded ? 'var(--green)' : 'var(--amber)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {contextLoaded ? 'Case context loaded' : 'Loading context…'}
              </span>
              {kbBacked && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <BookOpen size={10} style={{ color: 'var(--c-scholarly)' }} />
                  <span className="text-xs" style={{ color: 'var(--c-scholarly)' }}>USCIS precedent</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Context pills */}
        <div className="hidden sm:flex items-center gap-2">
          {strength != null && (
            <span className="badge badge-indigo">Strength {strength}%</span>
          )}
          {gaps.length > 0 && (
            <span className="badge badge-red">{gaps.length} gaps</span>
          )}
          {context.domain && (
            <span className="badge badge-muted">{context.role}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
              style={
                msg.role === 'user'
                  ? { background: 'var(--bg-overlay)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  : { background: 'var(--accent)', color: 'white' }
              }
            >
              {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
            </div>

            {/* Bubble */}
            <div
              className="max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: 'var(--accent)', color: 'white' }
                  : {
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      whiteSpace: 'pre-wrap',
                    }
              }
            >
              {msg.content || (streaming && i === messages.length - 1 ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Thinking…</span>
                </span>
              ) : '')}
            </div>
          </div>
        ))}

        {/* Suggestions */}
        {showSuggestions && (
          <div className="pt-2 space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Suggested questions</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="card-interactive rounded-xl px-4 py-3 text-left text-xs transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-4">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            disabled={streaming}
            placeholder="Ask about your EB-1A strategy… (Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
            style={{
              background: 'var(--bg-raised)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="btn-primary self-end px-4 py-3"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Your case context is included automatically. USCIS precedent from AAO decisions injected when relevant.
        </p>
      </div>
    </div>
  )
}
