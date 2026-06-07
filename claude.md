# EB-1A Agent System — Project Brief

## What this is
A multi-agent system that helps users build their EB-1A (extraordinary ability) immigration case. Each user has their own auth, profile, and evidence record. The daily agent pipeline runs automatically and surfaces personalized, profile-matched actions based on the user's role, domain, and evidence gaps.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) — Vercel |
| Auth + Database | Supabase (Postgres + pgvector) |
| Agent server | Python 3.11 + Google ADK — Render |
| AI models | OpenAI GPT-4o (primary) or Vertex AI Gemini — injected via env vars |
| Web search | Tavily API |
| Email | Resend API |
| Scheduling | Render cron jobs (7am daily per user) |

## Repo structure

```
/
├── frontend/                     # Next.js app
│   ├── app/
│   │   ├── api/dashboard/        # Server-side API routes (Supabase queries)
│   │   ├── dashboard/            # Authenticated command center
│   │   ├── evaluate/             # Free pre-auth EB-1A evaluator (top-of-funnel)
│   │   └── (auth)/               # Login / signup pages
│   ├── components/               # Shared UI components
│   └── lib/                      # Supabase client, utils
├── agents/                       # Python ADK agent service
│   ├── agents/                   # Individual agent classes
│   ├── tools/                    # Shared tools (web_search, db, plan, kb)
│   ├── knowledge/                # EB-1A knowledge base source documents
│   ├── scrapers/                 # AAO decision scraper
│   ├── tests/                    # Agent unit tests
│   └── main.py                   # FastAPI entry point + all agent orchestration
├── supabase/
│   └── migrations/               # SQL migration files (numbered 001–NNN)
├── CLAUDE.md
└── AGENTS.md
```

## Environment variables

### Frontend (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_AGENT_URL=            # Render agent server base URL
```

### Agent server (Render)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
TAVILY_API_KEY=
CRON_API_KEY=                     # Shared secret — all /run-* endpoints require X-Api-Key header
RESEND_API_KEY=                   # For evaluator results email
GOOGLE_CLOUD_PROJECT=             # Optional — only needed for Vertex AI / Gemini
GOOGLE_APPLICATION_CREDENTIALS=   # Optional — only needed for Vertex AI / Gemini
```

## Database tables

| Table | Purpose |
|-------|---------|
| `profiles` | One per user: `domain`, `role`, `salary_band`, `country_of_origin`, `education` (JSONB), `strategy_weights` (JSONB), `focused_criteria`, `scan_status`, `scan_started_at`, `scan_finished_at`, `target_filing_date` |
| `evidence` | Each piece of proof mapped to an EB-1A criterion; `strength` score 0–100 |
| `opportunities` | Discovered CFPs, judging, speaking, awards; includes `country`, `mode` (online/in_person/hybrid), `priority_score`, `dismissed` |
| `outcomes` | Result of each application: pending / accepted / rejected |
| `daily_plans` | Agent-generated top N actions per user per day |
| `weekly_reflections` | Agent-generated weekly analysis per user |
| `document_chunks` | KB vector embeddings (pgvector); `embedding`, `criterion`, `source` columns |
| `case_patterns` | Structured patterns extracted from AAO decisions per criterion |
| `pattern_aggregates` | Approval rates and evidence stats derived from AAO decisions |

## Auth
Supabase Auth (email/password). All frontend DB queries are scoped by `user_id` via Row Level Security. The service role key is only used server-side in the agent service — never exposed to the frontend.

## Daily agent pipeline

The pipeline is **deterministic and sequential** — not LLM-supervised delegation. Each agent is invoked directly in `main.py`, and the output of each step is explicitly passed to the next. This replaced an earlier LLM-supervisor model that proved unreliable and frequently skipped the discovery step.

```
run_daily_agents_for_user(user_id)
  1. EvidenceAgent      → reads evidence rows; returns (weak_criteria, scores, critical_gaps)
  2. DiscoveryAgent     → web searches WORLDWIDE for opportunities targeting weak_criteria;
                          applies EB-1A Quality Gate (domain + role match, prestige tier,
                          profile fit); writes qualifying opportunities to DB
  3. PrioritizationAgent→ reads all open opportunities; scores each with 6-factor formula
                          using evidence_scores + profile context; writes priority_score to DB
  4. CoachAgent         → reads top-ranked opportunities + yesterday's plan;
                          writes today's daily plan to DB (N actions, each with criterion,
                          personalized title, evidence_gain estimate)
```

### API endpoints

| Endpoint | Trigger | Purpose |
|----------|---------|---------|
| `POST /run-daily-agents` | Render cron 7am | Runs pipeline for all active users sequentially |
| `POST /run-daily-agent` | Dashboard on-demand | Runs pipeline for one user; updates `scan_status` in profiles |
| `GET /scan-status/{user_id}` | Dashboard polling | Returns `scan_status`, `scan_started_at`, `scan_finished_at` |
| `POST /run-weekly-reflection` | Render cron Sunday 7am | Runs ReflectionAgent for all users |
| `POST /run-knowledge-base` | Manual / scheduled | Ingests AAO decisions + USCIS policy into pgvector |

All endpoints require `X-Api-Key: {CRON_API_KEY}` header.

## Key conventions

- Never expose the service role key to the frontend
- All agent outputs are written to Supabase before the frontend reads them
- Opportunities are never re-surfaced after `dismissed = true`
- Evidence strength is scored 0–100 per criterion: `< 40` = critical_gap, `40–64` = building, `≥ 65` = strong
- Daily plans are regenerated fresh each day; outcomes persist forever
- Opportunities carry `country` (host country name or "Global") and `mode` (online / in_person / hybrid)
- Non-US in-person-only opportunities are hidden from the dashboard — users may lack visa flexibility to travel
- Profile fields `role`, `salary_band`, `country_of_origin`, and `education` are fetched and passed to **all agents** to enable personalized, profile-matched recommendations
- The `_build_profile_context(profile)` helper in `main.py` maps salary bands to seniority labels and formats the `education` JSONB array into a compact string for injection into agent prompts
- TypeScript for all frontend code
- Python 3.11+ for all agent code
- All secrets via environment variables — never hardcoded

## Free evaluator (pre-auth top-of-funnel)

`/evaluate` is a free, no-login EB-1A readiness tool that acts as the conversion path to the paid dashboard.

- **9-step intake form** — conversational, grouped by topic (identity → role → publications → recognition → judging → press → speaking → contributions → context)
- **Two-stage GPT-4o evaluation** — Stage 1: profile evaluator scores all 10 criteria; Stage 2: roadmap generator produces month-by-month action plan
- **Results dashboard** — readiness score (0–100), criteria breakdown (Met / Partial / Not Met), top 3 gaps, personalized roadmap, timeline estimate
- **Email delivery** — results sent to the user's email via Resend
- **CTA** — bottom of results page drives to `/signup` where the paid platform pre-loads the opportunities matching their gaps
