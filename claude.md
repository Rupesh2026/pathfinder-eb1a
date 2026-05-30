# EB-1A Agent System — Project Brief

## What this is
A multi-agent system that helps 4 users build their EB-1A (extraordinary ability) immigration case. Each user has their own auth, profile, and evidence record. Agents run daily without user prompting and surface personalized actions.

## Stack
- Frontend: Next.js (Vercel)
- Auth + Database: Supabase (Postgres)
- Agent server: Python + Google ADK (hosted on Render)
- AI models: Vertex AI (Gemini) or OpenAI — injected via env vars
- Scheduling: Render cron jobs (7am daily per user)

## Repo structure
/
├── frontend/          # Next.js app
│   ├── app/           # App router pages
│   ├── components/    # Shared UI components
│   └── lib/           # Supabase client, utils
├── agents/            # Python ADK agent service
│   ├── agents/        # Individual agent classes
│   ├── tools/         # Shared tools (web search, db)
│   ├── knowledge/     # EB-1A knowledge base text
│   └── main.py        # Render entry point + cron
├── supabase/
│   └── migrations/    # SQL migration files
└── CLAUDE.md
└── AGENTS.md

## Environment variables
Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI (use one or both)
OPENAI_API_KEY=
GOOGLE_CLOUD_PROJECT=
GOOGLE_APPLICATION_CREDENTIALS=
Render
RENDER_API_KEY=

## Database tables
- `profiles` — one per user, stores domain, role, salary band
- `evidence` — each piece of proof mapped to an EB-1A criterion
- `opportunities` — discovered CFPs, judging, speaking, awards
- `outcomes` — result of each application (pending/accepted/rejected)
- `daily_plans` — agent-generated top 3 actions per user per day
- `weekly_reflections` — agent-generated weekly analysis per user

## Auth
Supabase Auth handles signup/signin. All DB queries are scoped by `user_id`. Service role key is only used server-side in the agent service.

## How agents run
Render cron triggers `POST /run-daily-agents` at 7am every day. The endpoint loops through all active users and runs all 5 agents sequentially per user, writing results to Supabase.

## Key conventions
- Never expose service role key to frontend
- All agent outputs are stored in Supabase before frontend reads them
- Opportunities are never re-surfaced if dismissed = true
- Evidence strength is scored 0-100 per criterion
- Daily plans are generated fresh each day but outcomes persist forever
- Use TypeScript for all frontend code
- Use Python 3.11+ for all agent code
- All API keys via environment variables, never hardcoded