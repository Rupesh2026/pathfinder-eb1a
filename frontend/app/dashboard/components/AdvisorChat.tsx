'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { CriterionData, SummaryData, OutcomeItem } from '../hooks/useDashboard'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  criteria: CriterionData[]
  summary: SummaryData | null
  outcomes: OutcomeItem[]
  domain?: string
  role?: string
}

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! I'm your EB-1A advisor. Ask me anything — how to strengthen a specific criterion, what evidence to prioritize, how to read your current scores, or strategy for your petition.",
}

export default function AdvisorChat({ criteria, summary, outcomes, domain, role }: Props) {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildContext = useCallback(() => {
    const criteriaScores: Record<string, number> = {}
    const gaps: string[] = []
    for (const c of criteria) {
      criteriaScores[c.criterion] = c.score
      if (c.score < 40) gaps.push(c.label)
    }
    return {
      domain,
      role,
      profileStrength: summary?.profile_strength,
      criteriaScores,
      gaps,
      recentOutcomes: outcomes.slice(0, 5).map(o => ({
        title: o.opportunity_title,
        status: o.status,
      })),
    }
  }, [criteria, summary, outcomes, domain, role])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || streaming) return
    setInput('')

    const userMsg: Message = { role: 'user', content: trimmed }
    const assistantMsg: Message = { role: 'assistant', content: '' }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    try {
      const response = await fetch('/api/dashboard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: buildContext(),
        }),
      })

      if (!response.ok || !response.body) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, I could not connect. Check ANTHROPIC_API_KEY.' }
          return updated
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
                u[u.length - 1] = { role: 'assistant', content: 'An error occurred. Please try again.' }
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

  return (
    <div className="card flex flex-col" style={{ minHeight: 360, maxHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: 'var(--divider)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Advisor</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: 'var(--urgency-green-bg)', color: 'var(--urgency-green-text)' }}
        >
          Claude
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--secondary-bg)', color: 'var(--text-primary)' }
              }
            >
              {msg.content || (streaming && i === messages.length - 1 ? (
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                </span>
              ) : '…')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={streaming}
            placeholder="Ask about your EB-1A strategy…"
            rows={2}
            className="flex-1 resize-none rounded-lg px-3 py-2 text-xs focus:outline-none disabled:opacity-50"
            style={{
              background: 'var(--secondary-bg)',
              color: 'var(--text-primary)',
              border: '0.5px solid var(--card-border-color)',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="self-end rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Context auto-updates with your live scores ↵ Enter to send
        </p>
      </div>
    </div>
  )
}
