import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { IntakeData, EvaluationResult, CriterionEvaluation, GapItem, RoadmapMonth } from '@/app/evaluate/types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Stage 1: Profile Evaluator Prompt ────────────────────────────────────────

const STAGE1_SYSTEM = `You are a senior EB-1A immigration strategist with 15+ years of experience and deep knowledge of USCIS adjudication standards, AAO precedent decisions, and Matter of Price.

You will receive a structured professional profile and must evaluate it against the 10 USCIS EB-1A regulatory criteria. Your evaluation must be honest and legally calibrated — do NOT inflate scores.

CRITERIA (use these exact IDs):
- awards: National or international prizes/awards for excellence in the field
- memberships: Membership in associations requiring outstanding achievement judged by recognized experts
- press: Published material about the person in professional/major trade publications or major media
- judging: Participation as judge of others' work (peer review, competition panels, editorial boards, grant review)
- original_contributions: Original scientific/scholarly contributions of major significance to the field
- scholarly_articles: Authorship of scholarly articles in professional journals or major media
- artistic_exhibitions: Display/participation in artistic exhibitions or showcases at significant scale
- critical_role: Critical or leading role in organizations or establishments with distinguished reputations
- high_salary: Commanding a high salary or remuneration substantially above peers in the field
- commercial_success: Commercial success mapped to product adoption, revenue impact, or open-source usage

SCORING RULES:
- "met": concrete, externally verifiable evidence a USCIS officer would accept without RFE
- "partial": evidence exists but is insufficient alone (wrong scope, not verifiable, limited impact, surface-level)
- "not_met": no meaningful evidence for this criterion
- qualityFlag "substantive": strong, precedent-backed evidence; "surface_level": mentions activity but lacks depth; "none": no evidence
- evidenceMapping: quote specific answers from the profile that support this criterion (empty array if none)
- gapExplanation: exactly what is missing or weak in plain language (1-2 sentences)
- readinessScore: 0-100 holistic score. ≥65 = strong, 35-64 = developing, <35 = early_stage
- holisticVerdict: "strong" (file-ready or nearly ready, ≥3 criteria met with substantive evidence), "developing" (on track, 6-12 months away), "early_stage" (12-18+ months needed)

Return ONLY valid JSON — no markdown, no text outside JSON:
{
  "readinessScore": <integer 0-100>,
  "holisticVerdict": "<strong|developing|early_stage>",
  "criteria": [
    {
      "id": "<criterion_id>",
      "label": "<human-readable criterion name>",
      "status": "<met|partial|not_met>",
      "confidence": "<high|medium|low>",
      "evidenceMapping": ["<specific evidence from profile>"],
      "qualityFlag": "<substantive|surface_level|none>",
      "gapExplanation": "<what is missing or weak>"
    }
  ]
}`

// ─── Stage 2: Roadmap Generator Prompt ────────────────────────────────────────

const STAGE2_SYSTEM = `You are an EB-1A case strategy architect generating personalized action roadmaps.

Given a profile evaluation and the original intake data, you will generate:

1. FOE Statement: 2-3 sentences precisely defining the user's Field of Extraordinary Ability. Be specific — not "Machine Learning" but "machine learning infrastructure for production LLM systems at scale." Make the user feel seen and understood.

2. Top 3 Gaps: Rank the unmet/partial criteria by effort-to-impact ratio for this user's domain. For each gap: 3 concrete actionable items specific to their field (venue names, publication targets, real organizations). Each action should be startable within 1 week.

3. Monthly Roadmap: Generate months based on holistic verdict:
   - strong: 3 months
   - developing: 6 months
   - early_stage: 12 months
   Each month: 2-4 concrete actions with type tag. Actions must reference real venues/targets relevant to the user's specific field and sub-specialization. Do NOT use generic advice.

4. Timeline estimate and statement based on their current score and gaps.

5. Paid Platform Bridge: A compelling, profile-specific headline and 3-4 categories describing what Pathfinder's AI agents automatically find for users (judging opportunities, CFP alerts, speaking invitations, press connections, peer review slots).

Action types: judging, publication, speaking, press, documentation

IMPORTANT: Use the user's specific field/sub-specialization when naming targets. For AI/ML engineers: NeurIPS, ICML, ICLR, KDD, etc. For data engineers: DataEngConf, Spark Summit, dbt Coalesce. For product managers: ProductCon, Mind the Product. Always name real, existing venues.

Return ONLY valid JSON:
{
  "foeStatement": "<2-3 sentences specific to their expertise>",
  "topGaps": [
    {
      "criterionId": "<id>",
      "label": "<label>",
      "priority": <1|2|3>,
      "effortLevel": "<low|medium|high>",
      "actions": ["<action 1>", "<action 2>", "<action 3>"]
    }
  ],
  "roadmap": [
    {
      "month": <1-12>,
      "label": "<Month N — Theme>",
      "actions": [
        { "text": "<concrete action>", "type": "<type>" }
      ]
    }
  ],
  "estimatedMonths": "<3-6|6-9|9-12|12-18|18+>",
  "timelineStatement": "<1-2 sentence statement on filing readiness>",
  "paidPlatformBridge": {
    "headline": "<profile-specific headline about what Pathfinder does>",
    "categories": ["<category 1>", "<category 2>", "<category 3>"]
  }
}`

// ─── Email ─────────────────────────────────────────────────────────────────────

async function sendResultsEmail(email: string, name: string, result: EvaluationResult) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const verdictLabel =
    result.holisticVerdict === 'strong' ? 'Strong Profile' :
    result.holisticVerdict === 'developing' ? 'Developing Profile' :
    'Early Stage Profile'

  const scoreColor =
    result.readinessScore >= 70 ? '#16a34a' :
    result.readinessScore >= 40 ? '#b45309' : '#dc2626'

  const gapsHtml = result.topGaps.map(g =>
    `<li style="margin-bottom:8px"><strong>${g.label}</strong>: ${g.actions[0]}</li>`
  ).join('')

  const categoriesHtml = result.paidPlatformBridge.categories.map(c =>
    `<li style="margin-bottom:4px">✓ ${c}</li>`
  ).join('')

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: 'Inter', sans-serif; background: #f5f6fa; padding: 24px; color: #0f0f17;">
  <div style="max-width:560px; margin:0 auto;">
    <div style="background:#5b5fc7; padding:24px 28px; border-radius:12px 12px 0 0;">
      <h1 style="color:white; margin:0; font-size:18px; font-weight:700;">Your EB-1A Assessment Results</h1>
      <p style="color:rgba(255,255,255,0.8); margin:4px 0 0; font-size:13px;">Pathfinder · Powered by AI</p>
    </div>
    <div style="background:#ffffff; padding:28px; border:1px solid rgba(0,0,0,0.09); border-top:none; border-radius:0 0 12px 12px;">
      <p style="color:#42425e; margin:0 0 20px;">Hi ${name || 'there'},</p>

      <div style="text-align:center; padding:20px; background:#f0f1f6; border-radius:10px; margin-bottom:24px;">
        <div style="font-size:48px; font-weight:800; color:${scoreColor}; line-height:1;">${result.readinessScore}</div>
        <div style="font-size:13px; color:#8b8ba8; margin-top:4px;">Readiness Score / 100</div>
        <div style="display:inline-block; margin-top:8px; padding:4px 12px; background:${scoreColor}1a; color:${scoreColor}; border-radius:20px; font-size:12px; font-weight:600;">${verdictLabel}</div>
      </div>

      <p style="color:#42425e; font-size:14px; line-height:1.6; margin:0 0 20px;">${result.foeStatement}</p>

      <h3 style="font-size:13px; font-weight:600; color:#0f0f17; margin:0 0 12px; text-transform:uppercase; letter-spacing:0.05em;">Your Top 3 Gaps to Close</h3>
      <ul style="padding-left:0; list-style:none; margin:0 0 20px; color:#42425e; font-size:13px;">
        ${gapsHtml}
      </ul>

      <div style="background:#f0f1f6; border-radius:10px; padding:16px; margin-bottom:20px;">
        <p style="margin:0 0 10px; font-size:13px; font-weight:600; color:#0f0f17;">${result.paidPlatformBridge.headline}</p>
        <ul style="padding-left:0; list-style:none; margin:0 0 16px; color:#42425e; font-size:12px;">
          ${categoriesHtml}
        </ul>
        <a href="https://pathfindereb1a.com/signup?email=${encodeURIComponent(email)}&assessment_id=${result.assessmentId}"
           style="display:inline-block; background:#5b5fc7; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600;">
          Start your EB-1A journey →
        </a>
      </div>

      <p style="font-size:11px; color:#8b8ba8; margin:16px 0 0; line-height:1.5;">
        <strong>Disclaimer:</strong> This assessment is for informational and strategic planning purposes only. It does not constitute legal advice and does not create an attorney-client relationship. Always consult a qualified immigration attorney before filing.
      </p>
    </div>
  </div>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pathfinder <noreply@pathfindereb1a.com>',
      to: [email],
      subject: `Your EB-1A Assessment — Score: ${result.readinessScore}/100 · ${verdictLabel}`,
      html,
    }),
  })
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI evaluation not configured' }, { status: 503 })
  }

  let intake: IntakeData
  try {
    intake = await request.json() as IntakeData
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!intake.email || !intake.email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const openai = new OpenAI({ apiKey })

  // ── Stage 1: Evaluate criteria ────────────────────────────────────────────
  let stage1: { readinessScore: number; holisticVerdict: string; criteria: CriterionEvaluation[] }
  try {
    const stage1Resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: STAGE1_SYSTEM },
        { role: 'user', content: JSON.stringify(intake, null, 2) },
      ],
    })
    stage1 = JSON.parse(stage1Resp.choices[0].message.content!)
  } catch {
    return NextResponse.json({ error: 'Profile evaluation failed. Please try again.' }, { status: 500 })
  }

  // ── Stage 2: Generate roadmap ─────────────────────────────────────────────
  let stage2: {
    foeStatement: string
    topGaps: GapItem[]
    roadmap: RoadmapMonth[]
    estimatedMonths: string
    timelineStatement: string
    paidPlatformBridge: { headline: string; categories: string[] }
  }
  try {
    const stage2Resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: STAGE2_SYSTEM },
        {
          role: 'user',
          content: JSON.stringify({
            evaluation: stage1,
            profile: intake,
          }, null, 2),
        },
      ],
    })
    stage2 = JSON.parse(stage2Resp.choices[0].message.content!)
  } catch {
    return NextResponse.json({ error: 'Roadmap generation failed. Please try again.' }, { status: 500 })
  }

  // ── Store in Supabase ─────────────────────────────────────────────────────
  let assessmentId = crypto.randomUUID()
  try {
    const db = getServiceClient()
    const merged = {
      email: intake.email,
      name: intake.fullName,
      field: intake.expertiseField,
      intake_data: intake,
      evaluation: { ...stage1, ...stage2 },
      readiness_score: Math.min(100, Math.max(0, Math.round(stage1.readinessScore))),
    }
    const { data } = await db.from('evaluator_assessments').insert(merged).select('id').single()
    if (data?.id) assessmentId = data.id
  } catch {
    // DB failure is non-fatal — still return results to user
  }

  // ── Build final result ────────────────────────────────────────────────────
  const result: EvaluationResult = {
    assessmentId,
    readinessScore: Math.min(100, Math.max(0, Math.round(stage1.readinessScore))),
    holisticVerdict: (stage1.holisticVerdict as EvaluationResult['holisticVerdict']) ?? 'developing',
    foeStatement: stage2.foeStatement ?? '',
    criteria: stage1.criteria ?? [],
    topGaps: stage2.topGaps ?? [],
    roadmap: stage2.roadmap ?? [],
    estimatedMonths: stage2.estimatedMonths ?? '6-9',
    timelineStatement: stage2.timelineStatement ?? '',
    paidPlatformBridge: stage2.paidPlatformBridge ?? { headline: '', categories: [] },
  }

  // ── Send email (fire-and-forget) ──────────────────────────────────────────
  sendResultsEmail(intake.email, intake.fullName, result).catch(() => {})

  return NextResponse.json(result)
}
