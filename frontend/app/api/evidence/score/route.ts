import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CRITERION_LABELS } from '@/lib/types'

const SCORING_PROMPT = `You are an EB-1A immigration evidence evaluator with deep knowledge of USCIS standards and AAO precedent decisions.

Score the following evidence item for the EB-1A criterion indicated.

Scoring rubric:
- 75-100 (Strong): Top-tier venues, nationally/internationally recognized, externally verifiable impact
- 50-74 (Building): Solid evidence with some gaps in prestige, external recognition, or documentation
- 25-49 (Weak): Present but insufficient alone — missing prestige, external verification, or measurable impact
- 0-24 (Gap): Unlikely to satisfy USCIS; needs replacement or major supplementation

Return ONLY valid JSON with this exact structure:
{"score": <integer 0-100>, "tier": "<strong|building|weak|gap>", "reasoning": "<1-2 sentence explanation>"}

Do not include any text outside the JSON.`

function tierFromScore(score: number): string {
  if (score >= 65) return 'strong'
  if (score >= 40) return 'building'
  if (score >= 20) return 'weak'
  return 'gap'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { criterion, title, description, evidence_id } = await request.json()
  if (!criterion || !title) {
    return NextResponse.json({ error: 'criterion and title required' }, { status: 400 })
  }

  const criterionLabel = CRITERION_LABELS[criterion as keyof typeof CRITERION_LABELS] ?? criterion
  const userMessage = `Criterion: ${criterionLabel}
Title: ${title}${description ? `\nDescription: ${description}` : ''}`

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasGemini = !!process.env.GEMINI_API_KEY

  if (!hasAnthropic && !hasGemini) {
    return NextResponse.json({ error: 'AI scorer not configured' }, { status: 503 })
  }

  let score: number
  let tier: string
  let reasoning: string

  try {
    let responseText: string

    if (hasAnthropic) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: SCORING_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      })
      responseText = (msg.content[0] as { type: string; text: string }).text
    } else {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: SCORING_PROMPT })
      const result = await model.generateContent(userMessage)
      responseText = result.response.text()
    }

    const parsed = JSON.parse(responseText.replace(/```json|```/g, '').trim())
    score = Math.min(100, Math.max(0, Math.round(Number(parsed.score))))
    tier = tierFromScore(score)
    reasoning = parsed.reasoning ?? ''
  } catch {
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }

  // Update the evidence record if ID provided
  if (evidence_id) {
    await supabase
      .from('evidence')
      .update({ score, strength_tier: tier as 'strong' | 'medium' | 'weak', updated_at: new Date().toISOString() })
      .eq('id', evidence_id)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ score, tier, reasoning })
}
