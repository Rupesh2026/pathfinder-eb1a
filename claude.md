# EB-1A Agent System — Project Brief

## What this is
A multi-agent system that helps users build their EB-1A (extraordinary ability) immigration case. Each user has their own auth, profile, and evidence record. The daily agent pipeline runs automatically and surfaces personalized, profile-matched actions based on the user's role, domain, and evidence gaps.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) — Render (or Vercel) |
| Auth + Database | Supabase (Postgres + pgvector) |
| Agent server | Python 3.11 + Google ADK — Render |
| AI models | Agents: OpenAI gpt-4o-mini (primary) or Vertex AI Gemini. Advisor chat (frontend): Anthropic Claude → Gemini → OpenAI — all injected via env vars |
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

### Frontend (Render web service, or Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-side API routes only — never sent to the browser
AGENT_SERVER_URL=                 # Render agent server base URL (scan trigger)
RENDER_SERVICE_URL=               # Same agent server URL (used by some routes)
CRON_API_KEY=                     # Shared secret — must match the agent server
RESEND_API_KEY=                   # Evaluator results email
ANTHROPIC_API_KEY=                # Advisor chat (first choice)
GEMINI_API_KEY=                   # Advisor chat fallback
OPENAI_API_KEY=                   # Advisor chat fallback + advisor RAG embeddings
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
  2. DiscoveryAgent     → web searches WORLDWIDE; scans exactly the user's saved
                          Criteria Focus (profiles.focused_criteria) when set, else falls
                          back to weak_criteria; only discovers opportunities whose deadline
                          is today or later; applies EB-1A Quality Gate (domain + role match,
                          prestige tier, profile fit); writes qualifying opportunities to DB
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
- Discovery is **focus-driven**: when the user has saved a Criteria Focus (`profiles.focused_criteria`), the scan targets exactly those criteria (read fresh each scan); otherwise it falls back to all weak criteria
- Discovery only writes opportunities whose application deadline is today or later — never past deadlines
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

## UI Design System

> **RULE: Never deviate from this design system in future builds. Any new UI component, page, or feature must reference this section before writing a single line of CSS or inline style.**

### Design Philosophy
Premium, calm, trustworthy — matching the quality of claude.ai. Light backgrounds, warm palette, generous spacing. Not enterprise-boring, not startup-flashy.

### Color Tokens (defined in `frontend/app/globals.css` `:root`)

| Token | Value | Use |
|-------|-------|-----|
| `--bg-page` | `#faf9f7` | Page background — warm cream |
| `--bg-surface` | `#ffffff` | Cards, modals, inputs |
| `--bg-raised` | `#f4f2ee` | Slightly elevated surfaces |
| `--bg-overlay` | `#ece9e3` | Dropdowns, overlays |
| `--bg-hover` | `rgba(0,0,0,0.035)` | Hover states |
| `--bg-active` | `rgba(232,100,58,0.07)` | Active/selected states |
| `--border` | `rgba(0,0,0,0.08)` | Default borders |
| `--border-subtle` | `rgba(0,0,0,0.05)` | Hairline borders |
| `--border-strong` | `rgba(0,0,0,0.13)` | Emphasized borders, input borders |
| `--text-primary` | `#1a1814` | Headings, body text |
| `--text-secondary` | `#48433e` | Supporting text |
| `--text-muted` | `#8a827a` | Placeholders, captions |
| `--text-inverted` | `#ffffff` | Text on dark/accent backgrounds |
| `--accent` | `#e8643a` | Primary CTA, links, active states |
| `--accent-hover` | `#d4572f` | Accent hover state |
| `--accent-subtle` | `rgba(232,100,58,0.08)` | Accent tinted backgrounds |
| `--accent-border` | `rgba(232,100,58,0.22)` | Accent borders |
| `--green` | `#16a34a` | Success, "Met" status |
| `--amber` | `#b45309` | Warning, "Partial" status |
| `--red` | `#dc2626` | Error, "Not Met" status |
| `--blue` | `#2563eb` | Info |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)` | Card default |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)` | Elevated cards |
| `--shadow-lg` | `0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)` | Modals, dropdowns |

### Typography
- **Font family:** `Inter` (loaded from Google Fonts, 300–800 weights)
- **Headings:** `font-weight: 700–800`, `letter-spacing: -0.02em` to `-0.05em` (tighter at larger sizes)
- **Body:** `font-size: 13.5–15px`, `line-height: 1.65–1.75`, `letter-spacing: -0.01em`
- **Captions/labels:** `font-size: 11–12.5px`, `color: var(--text-muted)`
- **Uppercase labels:** `font-size: 10.5–11px`, `font-weight: 600`, `letter-spacing: 0.06–0.08em`

### Spacing Scale
- xs: 4px · sm: 8px · md: 16px · lg: 24px · xl: 32px · 2xl: 48px · 3xl: 64px · 4xl: 96px
- Section padding: `96px 0` on large screens
- Card padding: `24–32px`
- Max content width: `1120px` (landing) · `720px` (forms/evaluate) · `1200px` (dashboard)

### Border Radius
- Inputs, small buttons: `10px`
- Cards, medium buttons: `14px`
- Large buttons, modals: `18px`
- Full pills/badges: `999px`

### Component Rules

**Cards** — use `.card` class: white bg, `border: 1px solid var(--border)`, `border-radius: 14px`, `box-shadow: var(--shadow-sm)`. Never use heavy shadows or colored backgrounds unless explicitly needed.

**Buttons** — Primary: `background: var(--accent)`, white text, `border-radius: 12px`, coral glow shadow on hover. Secondary: surface bg, `border: 1px solid var(--border-strong)`. Ghost: transparent, subtle hover. Never use plain blue or gray primary buttons.

**Inputs** — `background: var(--bg-surface)`, `border: 1px solid var(--border-strong)`, coral focus ring (`box-shadow: 0 0 0 3px var(--accent-subtle)`), `border-radius: 10px`.

**Badges** — pill shape (`border-radius: 999px`), use semantic color classes: `.badge-green`, `.badge-amber`, `.badge-red`, `.badge-coral`, `.badge-muted`. Never invent new badge colors.

**Navigation** — use `.nav-item` class. Active state: `background: var(--accent-subtle)`, `color: var(--accent)`, `border: 1px solid var(--accent-border)`.

**Dark sections** — only for high-impact moments (hero CTA, problem sections). Use `#1c1a17` (warm dark), never pure `#000000`. Warm off-white text `#f2ede8`. Coral glow accent.

**Section rhythm** — alternate between `var(--bg-page)` (#faf9f7) and `var(--bg-raised)` (#f4f2ee) for visual differentiation. Never use raw white for full-page section backgrounds.

### Accent color reference
The accent is coral/orange-red `#e8643a` — the same tone as claude.ai's CTA buttons. Every primary action, active state, and emphasis uses this. **Never reintroduce indigo/blue as a primary accent.**

### Responsive / Mobile

> **RULE: The laptop/web UI (≥1024px) must stay pixel-identical. Mobile work only ever *adds* rules gated behind a breakpoint — never changes a desktop value.**

- The app uses heavy inline `style={{}}`, which Tailwind responsive variants **cannot** override (inline wins). So mobile overrides live in a `@media (max-width: 768px)` helper layer at the bottom of `frontend/app/globals.css`, using helper classes with `!important`:
  - `.r-stack` (grid → 1 col), `.r-cols2`, `.r-rowcol` (flex row → column), `.r-wrap`, `.r-scroll-x`, `.r-full`, `.r-pad-card`, `.r-section` (trim 96px section padding), `.r-gap-sm`, `.r-edu-row` (profile education reflow).
  - Add the class to a container; on desktop the query never matches, so it's inert.
- Where an element is already Tailwind-classed with **no** conflicting inline style, prefer mobile-first variants instead: e.g. `grid-cols-1 lg:grid-cols-2`, `grid-cols-2 md:grid-cols-4`, `hidden sm:inline`.
- Breakpoint choice mirrors structure: use `lg:` (1024) where it must match the dashboard sidebar drawer (`DashboardShell` defaults the sidebar closed below 1024 and slides it in over a backdrop); `md:`/`sm:` otherwise.
- `app/layout.tsx` exports an explicit `viewport` (`width=device-width, initialScale=1, maximumScale=5`).
- The `img, video, canvas { max-width: 100%; height: auto }` guard deliberately excludes `svg` so Lucide icon sizes are preserved.
