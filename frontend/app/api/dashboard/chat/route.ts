import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function buildSystemPrompt(context: {
  domain?: string
  role?: string
  profileStrength?: number
  criteriaScores?: Record<string, number>
  recentOutcomes?: { title: string; status: string }[]
  gaps?: string[]
  kbPrecedent?: string
}): string {
  const gapList = (context.gaps ?? []).join(', ') || 'none identified yet'
  const outcomesSummary = (context.recentOutcomes ?? [])
    .slice(0, 5)
    .map(o => `${o.title}: ${o.status}`)
    .join('; ') || 'no recent outcomes'

  const scoresSection = context.criteriaScores
    ? Object.entries(context.criteriaScores)
        .map(([k, v]) => `  ${k}: ${v}/100`)
        .join('\n')
    : '  (scores not available yet)'

  return `You are an expert EB-1A immigration strategy advisor embedded in the user's case-building dashboard. You have deep knowledge of USCIS requirements, AAO precedent decisions, and what makes a compelling extraordinary ability petition.

USER PROFILE:
- Domain: ${context.domain ?? 'Technology / AI'}
- Role: ${context.role ?? 'Senior Engineer / Researcher'}
- Profile strength: ${context.profileStrength ?? 0}%

CURRENT CRITERIA SCORES:
${scoresSection}

CRITICAL GAPS: ${gapList}

RECENT OUTCOMES: ${outcomesSummary}

YOUR ROLE:
- Provide specific, actionable advice on building a stronger EB-1A case
- Reference exact USCIS criteria (Awards, Memberships, Press, Judging, Original Contributions, Scholarly Articles, Critical Role, High Salary, Commercial Success)
- Be direct about what score levels mean for RFE risk
- Suggest concrete next steps, not vague guidance
- You have full context of this user's current dashboard state

Be concise but thorough. The user is sophisticated and has limited time.${
    context.kbPrecedent
      ? `\n\nRELEVANT USCIS PRECEDENT (from AAO decisions and policy manual):\n${context.kbPrecedent}\n\nWhen this precedent is relevant to the user's question, reference it specifically.`
      : ''
  }`
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

async function streamAnthropic(
  messages: ChatMessage[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
    }
  }
}

async function streamGemini(
  messages: ChatMessage[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  const model = genai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  // Gemini history must start with a 'user' turn — strip any leading assistant messages
  const rawHistory = messages.slice(0, -1)
  const firstUserIdx = rawHistory.findIndex(m => m.role === 'user')
  const history = (firstUserIdx === -1 ? [] : rawHistory.slice(firstUserIdx)).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]
  const chat = model.startChat({ history })
  const result = await chat.sendMessageStream(lastMessage.content)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
    }
  }
}

async function streamOpenAI(
  messages: ChatMessage[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
    }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  if (!hasAnthropic && !hasGemini && !hasOpenAI) {
    return NextResponse.json(
      { error: 'AI Advisor not configured. Add ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to .env.local.' },
      { status: 503 }
    )
  }

  const { messages, context } = await request.json() as {
    messages: ChatMessage[]
    context: Record<string, unknown>
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  const systemPrompt = buildSystemPrompt(context as Parameters<typeof buildSystemPrompt>[0])
  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        if (hasAnthropic) {
          try {
            await streamAnthropic(messages, systemPrompt, controller, encoder)
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            return
          } catch (e) {
            console.warn('Anthropic failed, trying next provider:', e)
          }
        }

        if (hasGemini) {
          try {
            await streamGemini(messages, systemPrompt, controller, encoder)
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            return
          } catch (e) {
            console.warn('Gemini failed, trying next provider:', e)
          }
        }

        if (hasOpenAI) {
          await streamOpenAI(messages, systemPrompt, controller, encoder)
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }

        throw new Error('All configured AI providers failed.')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
