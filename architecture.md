# EB-1A Agent System — Architecture

## 1. System Overview

A multi-agent system that helps users build their EB-1A (extraordinary ability) immigration case. Agents run daily on a schedule, discover opportunities worldwide, score the user's evidence, and generate personalized daily action plans. Users interact through a Next.js dashboard; all agent outputs are stored in Supabase before the frontend reads them.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RENDER (Agent Server)                        │
│                                                                     │
│  Cron 7am daily ──► /run-daily-agents                               │
│                          │                                          │
│                    ┌─────▼──────┐                                   │
│                    │  Evidence  │ scores criteria, finds gaps        │
│                    └─────┬──────┘                                   │
│                          │                                          │
│                    ┌─────▼──────┐                                   │
│                    │ Discovery  │ web-searches worldwide opps        │
│                    └─────┬──────┘                                   │
│                          │                                          │
│                    ┌─────▼──────┐                                   │
│                    │Prioritize  │ scores opps by gap + prestige      │
│                    └─────┬──────┘                                   │
│                          │                                          │
│                    ┌─────▼──────┐                                   │
│                    │   Coach    │ generates top 3 daily actions      │
│                    └─────┬──────┘                                   │
│                          │ writes to Supabase                       │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    SUPABASE (Postgres)   │
              │  evidence, opportunities │
              │  daily_plans, outcomes   │
              └────────────┬────────────┘
                           │ reads via RLS
              ┌────────────▼────────────┐
              │   RENDER (Next.js 14)   │
              │   Dashboard + Auth UI   │
              └─────────────────────────┘
```

---

## 2. Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind — responsive) | Render (or Vercel) |
| Auth + Database | Supabase (Postgres + pgvector) | Supabase Cloud |
| Agent Service | Python 3.11 + FastAPI + Google ADK | Render |
| AI Models (agents) | OpenAI gpt-4o-mini (default) or Gemini 2.0 Flash | API |
| AI Models (advisor chat) | Anthropic Claude → Gemini → OpenAI (first available) | API |
| Web Search | Tavily API | API |
| Embeddings | OpenAI text-embedding-3-small (1536-dim) | API |
| Scheduling | Render cron jobs | Render |

---

## 3. Repository Structure

```
/
├── frontend/
│   ├── app/
│   │   ├── landing.tsx             # Public marketing landing page
│   │   ├── layout.tsx              # Root layout + viewport export (mobile scaling)
│   │   ├── globals.css             # Design tokens + responsive helper layer (≤768px)
│   │   ├── (auth)/signin|signup/   # Auth pages
│   │   ├── onboarding/             # First-time profile + evidence setup
│   │   ├── evaluate/               # Free pre-auth EB-1A evaluator (top-of-funnel)
│   │   ├── actions/                # Server actions: auth, evidence, plans, opportunities, letters, onboarding
│   │   ├── dashboard/              # Protected route hub
│   │   │   ├── page.tsx            # Command center (main dashboard)
│   │   │   ├── components/         # DashboardShell (collapsible sidebar), panels, cards
│   │   │   ├── hooks/              # Dashboard client hooks
│   │   │   ├── evidence/           # View/add evidence per criterion
│   │   │   ├── opportunities/      # Worldwide opportunity list
│   │   │   ├── letters/            # Recommendation letter tracker
│   │   │   ├── advisor/            # Streaming AI chat
│   │   │   ├── profile/            # User profile settings
│   │   │   └── calendar/           # Deadline + streak calendar
│   │   └── api/
│   │       ├── dashboard/          # profile, criteria, tasks, scan, chat, deadlines, streak, summary, outcomes, readiness, opportunities
│   │       ├── advisor/query/      # Vector search over KB chunks (advisor RAG context)
│   │       ├── evaluate/           # Free evaluator (two-stage GPT-4o + Resend email)
│   │       ├── criteria/           # Criteria scoring read
│   │       ├── evidence/           # score
│   │       ├── knowledge/          # status, backfill
│   │       └── opportunities/      # [id]/outcome, [id]/skip
│   ├── components/                 # Shared UI: CriteriaScoreChart, OpportunityCard, DailyPlanCard, ReflectionFeed, ErrorMessage
│   ├── lib/
│   │   ├── supabase/client.ts      # Browser Supabase client (anon key)
│   │   ├── supabase/server.ts      # Server Supabase client (anon key, RLS)
│   │   ├── types.ts                # TypeScript schema types
│   │   ├── opportunity-visibility.ts  # US vs non-US filter logic
│   │   ├── rfe-rules.ts            # RFE trigger detection
│   │   └── mock-data.ts            # Sample opps for new users
│   └── middleware.ts               # Auth + profile routing guard
├── agents/
│   ├── main.py                     # FastAPI app + cron endpoints
│   ├── agents/
│   │   ├── base.py                 # Shared ADK agent base (build_* factories)
│   │   ├── supervisor_agent.py     # Defined but not used for delegation
│   │   ├── evidence_agent.py
│   │   ├── discovery_agent.py
│   │   ├── prioritization_agent.py
│   │   ├── coach_agent.py
│   │   ├── reflection_agent.py
│   │   └── knowledge_base_agent.py
│   ├── tools/
│   │   ├── db.py                   # Singleton Supabase client (service-role key)
│   │   ├── evidence_tools.py
│   │   ├── opportunity_tools.py
│   │   ├── plan_tools.py
│   │   ├── reflection_tools.py
│   │   ├── web_search.py           # Tavily wrapper
│   │   └── knowledge_base_client.py  # Vector search + pattern summaries
│   ├── scrapers/
│   │   ├── aao_scraper.py          # USCIS AAO non-precedent decisions
│   │   ├── court_scraper.py        # Federal court opinions (CourtListener API)
│   │   └── policy_watcher.py       # USCIS Policy Manual Volume 6 Part F
│   ├── extractors/
│   │   └── pattern_extractor.py    # LLM extracts criterion patterns from docs
│   └── knowledge/
│       └── eb1a_rubric.txt         # 10-criterion scoring rubric with field examples
├── supabase/
│   └── migrations/                 # 14 SQL files (001–014)
├── render.yaml                     # Render Blueprint: 2 web services + 2 cron jobs
├── DEPLOY.md                       # Render deploy guide + secret checklist
└── CLAUDE.md / AGENTS.md / architecture.md
```

---

## 4. Database Schema

All user-owned tables enforce Row Level Security (RLS) via `auth.uid() = user_id`. The agent service uses the service-role key to bypass RLS for writes; the frontend only holds the anon key.

### User Tables

**`profiles`**
One row per user. Central config for the agent system.

| Column | Type | Purpose |
|---|---|---|
| id | uuid | = auth.uid() |
| domain | text | e.g. "machine learning", "biotech" |
| role | text | e.g. "ML Researcher" |
| salary_band | enum | under_150k / 150k_200k / 200k_300k / 300k_plus |
| focused_criteria | text[] | Criteria the user wants to prioritize |
| strategy_weights | jsonb | Per-criterion discovery weights (updated by ReflectionAgent) |
| actions_per_day | int | How many coach actions per day (default 3, adjusted by reflection) |
| scan_status | text | idle / running / done |
| last_scan_at | timestamptz | When last agent scan started |
| scan_completed_at | timestamptz | When last agent scan finished |

**`evidence`**
One row per piece of proof, per criterion, per user.

| Column | Type | Purpose |
|---|---|---|
| criterion | enum | One of 10 EB-1A criteria |
| title | text | Short label |
| description | text | Detail of the evidence |
| url | text | Supporting link |
| score | int (0–100) | Strength score |
| strength_tier | enum | strong / medium / weak |

**`opportunities`**
Agent-discovered opportunities worldwide.

| Column | Type | Purpose |
|---|---|---|
| criterion | enum | Which gap this addresses |
| title | text | Name of the opportunity |
| url | text | Link |
| deadline | date | Application deadline |
| country | text | Origin country |
| is_us | bool | Whether US-based |
| delivery_mode | enum | online / in_person / hybrid |
| priority_score | float | Computed by PrioritizationAgent |
| dismissed | bool | User marked as not interested |
| applied | bool | User applied |
| opportunity_type | enum | cfp, judging, speaking, award, podcast, grant, peer_review |

**`outcomes`**
Result after applying to an opportunity.

| Column | Type | Purpose |
|---|---|---|
| opportunity_id | uuid | FK to opportunities |
| status | enum | pending / accepted / rejected / withdrawn |
| notes | text | User notes |

**`daily_plans`**
Agent-generated daily actions. One row per user per day (upserted).

| Column | Type | Purpose |
|---|---|---|
| plan_date | date | The day this is for |
| actions | jsonb[] | Array of action objects (see CoachAgent output) |

**`weekly_reflections`**
Agent-generated weekly analysis. One row per user per week.

| Column | Type | Purpose |
|---|---|---|
| week_start | date | Monday of the week |
| insights | jsonb[] | Array of {type, text} objects |
| strategy_changes | jsonb | Updated weights that were applied |

### Knowledge Base Tables

Written by the KnowledgeBaseAgent (service-role only). Users can read.

| Table | Purpose |
|---|---|
| `raw_documents` | Scraped USCIS decisions, court opinions, policy text. Deduplicated by `content_hash`. |
| `document_chunks` | 1800-char chunks of raw docs with 1536-dim OpenAI embeddings (pgvector). |
| `case_patterns` | LLM-extracted criterion-level patterns (approved/denied, pattern text, evidence type). |
| `pattern_aggregates` | Precomputed per-criterion stats: approval_rate, top_patterns[], rfe_triggers[]. |
| `scrape_runs` | Log of each scrape job: source, status, docs_found, docs_added, errors. |

### Enums

```sql
criterion_type: awards, memberships, press, judging, original_contributions,
                scholarly_articles, critical_role, high_salary,
                artistic_exhibitions, commercial_success

opportunity_type: cfp, judging, speaking, award, podcast, grant, peer_review

outcome_status_type: pending, accepted, rejected, withdrawn

salary_band_type: under_150k, 150k_200k, 200k_300k, 300k_plus

strength_tier_type: strong, medium, weak
```

---

## 5. Agents

The system uses Google ADK as the agent framework. Despite a `SupervisorAgent` being defined, orchestration is **deterministic** — `main.py` calls each agent directly in a fixed sequence. This was a deliberate decision after LLM-based delegation skipped the DiscoveryAgent, breaking the scanning pipeline.

### Agent Pipeline (runs daily per user)

```
EvidenceAgent → DiscoveryAgent → PrioritizationAgent → CoachAgent
```

---

### EvidenceAgent

**What it does:** Reads all of the user's evidence rows and produces a structured gap analysis for the rest of the pipeline.

**Data sources:**
- Supabase `evidence` table (via `read_evidence(user_id)`)
- Knowledge base context: approval rates + RFE triggers per criterion (injected into system prompt)

**Output:**
```json
{
  "critical_gaps": ["judging", "press"],
  "building": ["scholarly_articles"],
  "strong": ["original_contributions"],
  "scores": {
    "judging": {
      "score": 0,
      "missing_proof": ["no review assignments found"],
      "next_actions": ["apply to NeurIPS reviewer pool"]
    }
  }
}
```

**Scoring thresholds:**
- `>= 65` → strong
- `40–64` → building
- `< 40` → critical gap
- `0` or missing → no evidence (treated as critical, highest priority)

---

### DiscoveryAgent

**What it does:** Searches the web for real opportunities matching the user's domain/role, then writes them to Supabase with location and delivery metadata.

**Focus-driven scan target:** `main.py` computes `scan_criteria = focused_criteria if set else weak_criteria` and passes it in. The agent discovers opportunities **only** for the criteria in `scan_criteria` — so a user's saved Criteria Focus drives exactly what gets scanned (read fresh each run, so later-added focus criteria are picked up automatically).

**Future-dated only:** Only opportunities whose application/submission/nomination deadline is **today or later** are written. Rolling/always-open calls (peer-review signups, editorial boards, podcast pitches) keep `deadline = null`. The backend also discards any row whose deadline is before today, as a safety net.

**Data sources:**
- Tavily API web search (excludes LinkedIn, Reddit, Quora; includes domain-relevant sites)
- `write_opportunities` upserts on URL — the agent passes everything it finds; the DB refreshes deadlines/descriptions on re-encounter rather than the agent guessing what's a duplicate

**How it searches:** Per search template, runs **3 query passes** (always with `exclude_domains`):
1. **WORLDWIDE** — no `include_domains`; results span the globe
2. **FOCUSED** — with the template's `include_domains` to catch top venues
3. **FRESHNESS** — no `include_domains`, `time_range="month"`, for newly-announced calls

Fallback: if all three passes for a template return fewer than 2 results, one broad query runs with no domain filter. Each criterion has its own search template: judging, cfp, speaking, awards, press, review.

**Visibility normalization (written at insert time):**

| Condition | Shown to user? |
|---|---|
| `is_us = true`, any delivery mode | Yes |
| `is_us = false`, online or hybrid | Yes |
| `is_us = false`, in_person only | No (filtered) |

The visibility rule is enforced at the API read level too. Non-US in-person opportunities stay in the DB but are never surfaced.

**Output:** Count of new opportunities inserted per criterion.

---

### PrioritizationAgent

**What it does:** Scores every open (not dismissed, not applied) opportunity using a weighted formula that factors in the user's evidence gaps, opportunity prestige, and USCIS precedent data.

**Data sources:**
- `read_opportunities(user_id)` — all open opps sorted by current priority_score
- `pattern_aggregates` table — per-criterion approval rates (for USCIS precedent boost)

**Scoring formula:**

```
score = (
  prestige           * 0.25 +
  narrative_fit      * 0.20 +
  acceptance_prob    * 0.15 +
  time_efficiency    * 0.10 +
  gap_weight         * 0.20 +
  profile_fit        * 0.10
) * 100
```

Each factor is 1–5 (rated by the LLM). `profile_fit` rates how well the opportunity matches the user's role, seniority, and domain. `gap_weight` is then multiplied:
- Criterion score `< 40` → 2x
- Criterion score `40–64` → 1.5x
- Criterion score `>= 65` → 1x

**USCIS precedent boost:** If a criterion's approval_rate in `pattern_aggregates` is `> 70%`, the final score is multiplied by 1.2.

**Output:** Top 5 opportunities with updated priority scores (written back to `opportunities`).

---

### CoachAgent

**What it does:** Generates today's daily plan — a ranked list of 3 concrete actions for the user to take.

**Data sources:**
- Top 5 opportunities (from PrioritizationAgent output)
- Evidence gaps (from EvidenceAgent output)
- `read_yesterday_plan(user_id)` — checks for incomplete actions with deadlines within 7 days
- Knowledge base: USCIS precedent snippets to enrich `why` field

**Memory / carry-forward logic:** If yesterday's plan has an action marked `done = false` with a deadline less than 7 days out, it is carried to today at rank 1 with `carried_forward = true`.

**Output (written to `daily_plans`):**
```json
[
  {
    "rank": 1,
    "title": "Apply as NeurIPS 2025 reviewer",
    "why": "Judging at 0% — biggest gap. NeurIPS reviewers approved at 84% per USCIS precedent.",
    "criterion": "judging",
    "evidence_gain": 15,
    "deadline": "Jun 1",
    "time_required": "45 minutes",
    "done": false,
    "carried_forward": false
  }
]
```

---

### ReflectionAgent

**What it does:** Runs weekly (Sunday 7am). Analyzes the past 7 days of outcomes and plan completion to surface insights and self-improve the agent system's parameters.

**Data sources:**
- `read_outcomes(user_id, days=7)` — application results from the past week
- `read_daily_plans(user_id, days=7)` — plans + done flags

**Self-improvement logic:**

| Condition | Action |
|---|---|
| Criterion score not moved in 14 days | Flag as stalled in insights |
| Opportunity type consistently dismissed | Reduce `discovery_weight` for that type by 0.2 (floor: 0.2) |
| Opportunity type has accepted outcomes | Increase `discovery_weight` for that type by 0.2 (cap: 2.0) |
| Plan completion rate < 50% | Reduce `actions_per_day` by 1 (floor: 1) |

**Output:** Writes `weekly_reflections` row (insights array) and calls `update_strategy_weights()` to update the `profiles` row. The DiscoveryAgent reads these weights the next week.

---

### KnowledgeBaseAgent

**What it does:** Scrapes USCIS legal decisions and policy, chunks and embeds the text, runs LLM extraction to build a searchable precedent database, and refreshes per-criterion aggregate stats.

**Runs:** Weekly, Sunday 2am (or on-demand via `/run-knowledge-base`).

**Scrapers:**

| Scraper | Source | Method |
|---|---|---|
| `AAOScraper` | USCIS AAO non-precedent I-140 decisions | Fetches PDF links → pdfplumber text extraction |
| `CourtScraper` | Federal court opinions via CourtListener API | REST API, queries `"extraordinary ability" OR "EB-1A"` |
| `PolicyWatcher` | USCIS Policy Manual Vol. 6 Part F (Chapters 1–5) | HTTP → BeautifulSoup text extraction |

**Pipeline:**
1. Scrape with age filter (2 years for backfill, ~2 weeks for incremental)
2. Deduplicate by `content_hash`; insert new rows to `raw_documents`
3. Chunk into ~1800-character windows (~512 tokens)
4. Embed each chunk with OpenAI `text-embedding-3-small` (1536 dimensions)
5. Store in `document_chunks` with pgvector index
6. Run `PatternExtractor` on each new document:
   - Calls LLM to extract structured patterns: `{criterion, outcome, pattern_text, evidence_type}`
   - Inserts into `case_patterns`
7. Refresh `pattern_aggregates` for all affected criteria

**How agents use KB:**
- EvidenceAgent and CoachAgent call `format_pattern_context(criterion)` to get a markdown string with approval rates, top patterns, and RFE triggers, injected directly into the agent's system prompt.
- Vector search via `search_patterns(criterion, query, top_k=5)` is available for semantic lookups.

---

## 6. Cron & Orchestration

**Entry point:** `agents/main.py` (FastAPI)

### Endpoints

| Endpoint | Trigger | Schedule | Action |
|---|---|---|---|
| `POST /run-daily-agents` | Render cron | 7am daily | Loops all active users; runs Evidence → Discovery → Prioritization → Coach per user |
| `POST /run-daily-agent` | Frontend dashboard | On-demand | Single-user scan; runs in background task; updates `scan_status` |
| `GET /scan-status/{user_id}` | Dashboard polling | Per-user poll | Returns `{status, last_scan_at, scan_completed_at}` |
| `POST /run-weekly-reflection` | Render cron | 7am Sunday | Loops all users; runs ReflectionAgent only |
| `POST /run-knowledge-base` | Render cron / manual | 2am Sunday (or on-demand) | Scrape + embed + extract + refresh aggregates |

All cron-facing endpoints are protected by `X-Api-Key: $CRON_API_KEY`.

### On-Demand Scan Flow (Dashboard)

```
User clicks "Scan" button
  → Frontend: POST /api/dashboard/scan (server action)
  → Agent server: POST /run-daily-agent (background task spawned)
  → profiles.scan_status = "running"
  → Dashboard polls GET /api/dashboard/scan/status
  → Agent finishes → profiles.scan_status = "done"
  → Frontend redirects to /dashboard/opportunities
```

---

## 7. Frontend

### Auth & Routing

Supabase Auth with JWTs stored in cookies. `middleware.ts` runs on all `/dashboard/*` routes:
- No session → redirect to `/signin`
- Session but no profile → redirect to `/onboarding`
- Session + profile → allow through

### Pages

| Route | Purpose |
|---|---|
| `/` | Public landing page |
| `/evaluate` | Free pre-auth EB-1A evaluator (top-of-funnel → `/signup`) |
| `/signin`, `/signup` | Auth pages |
| `/onboarding` | Initial profile + evidence setup (first-time only) |
| `/dashboard` | Command center: overall readiness, criteria overview, upcoming deadlines, top opportunities, today's actions |
| `/dashboard/evidence` | View and add evidence per criterion |
| `/dashboard/opportunities` | Filterable worldwide opportunity list |
| `/dashboard/letters` | Recommendation letter tracker |
| `/dashboard/advisor` | Streaming AI chat (Anthropic → Gemini → OpenAI fallback, server-side) |
| `/dashboard/profile` | Edit domain, role, salary band, focused criteria |
| `/dashboard/calendar` | Completion streaks + deadline calendar |

### API Routes

**Dashboard data:**

| Route | Method | What it reads/writes |
|---|---|---|
| `/api/dashboard/profile` | GET / POST | `profiles` table |
| `/api/dashboard/criteria` | GET | `evidence` grouped by criterion → scores + gap summary |
| `/api/dashboard/tasks/today` | GET | `daily_plans` for today |
| `/api/dashboard/tasks/[rank]/complete` | POST | Marks `done = true` on a plan action |
| `/api/dashboard/opportunities` | GET | `opportunities` filtered by visibility rule, criteria, type, applied flag |
| `/api/dashboard/deadlines` | GET | Open opportunities with upcoming deadlines |
| `/api/dashboard/summary` | GET | Overall readiness % (average evidence score across criteria) |
| `/api/dashboard/readiness` | GET | Readiness breakdown for the dashboard card |
| `/api/dashboard/outcomes` | GET / POST | Application outcomes log |
| `/api/dashboard/streak` | GET | Daily completion streak from `daily_plans` |
| `/api/dashboard/scan` | POST | Forwards to agent server `/run-daily-agent` |
| `/api/dashboard/scan/status` | GET | Reads `profiles.scan_status` |
| `/api/dashboard/chat` | POST | Streams advisor chat; picks first available provider **Anthropic (`claude-sonnet-4-6`) → Gemini (`gemini-2.0-flash`) → OpenAI (`gpt-4o`)**, with user context injected |

**Opportunity actions:**

| Route | Method | Action |
|---|---|---|
| `/api/dashboard/opportunities/[id]/outcome` | POST | Inserts/updates `outcomes` row |
| `/api/dashboard/opportunities/[id]/skip` | POST | Sets `opportunities.dismissed = true` |

**Evidence + KB:**

| Route | Method | Action |
|---|---|---|
| `/api/evidence/score` | GET | Returns per-criterion scores with strength feedback |
| `/api/criteria` | GET | Criteria scoring read |
| `/api/advisor/query` | POST | Embeds the question and vector-searches `document_chunks`; returns KB context chunks for the advisor (RAG) |
| `/api/evaluate` | POST | Free pre-auth evaluator — two-stage GPT-4o eval + Resend email |
| `/api/knowledge/status` | GET | Last `scrape_runs` entry |
| `/api/knowledge/backfill` | POST | Triggers `/run-knowledge-base?backfill=true` |

### Supabase Client Strategy

- `lib/supabase/client.ts` — Browser client with anon key. Used in client components.
- `lib/supabase/server.ts` — Server client with anon key. Used in API routes and server components. RLS enforces `user_id` scoping via session cookie.
- Agent service uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for writing opportunities, plans, and reflections.

### Key Frontend Components

**Shared (`frontend/components/`):** `CriteriaScoreChart` (radar of 10 criteria), `OpportunityCard`, `DailyPlanCard`, `ReflectionFeed`, `ErrorMessage`.

**Dashboard (`frontend/app/dashboard/components/`):**

| Component | Purpose |
|---|---|
| `DashboardShell` | App shell with the **collapsible slide-in/out left sidebar**; defaults the sidebar closed below 1024px and slides it in over a backdrop |
| `SidebarNav` | Left navigation items |
| `ReadinessCard` | Overall readiness score card |
| `CriteriaOpportunityPanels` / `CriteriaPanel` | Criteria scores + matched opportunities |
| `OpportunityList` | Filterable worldwide opportunity list |
| `TaskList` | Today's coach actions with mark-done |
| `StatsRow` | Top-line stat counters |
| `FilingCountdown` | Countdown to `target_filing_date` |
| `UpcomingDeadlines` | Open opportunities with near deadlines |
| `StreakCalendar` | Completion streak visualization |
| `OutcomeTracker` | Application result log |
| `ScanButton` | Triggers agent scan + polls status |
| `AdvisorChat` | Streaming chat UI |
| `SignOutButton`, `Toast` | Auth + transient notifications |

### Responsive / Mobile

The desktop UI (≥1024px) is kept pixel-identical; mobile support is additive only. Inline `style={{}}` can't be overridden by Tailwind variants, so a `@media (max-width: 768px)` helper layer at the bottom of `globals.css` provides `!important` classes (`.r-stack`, `.r-rowcol`, `.r-cols2`, `.r-section`, `.r-edu-row`, etc.) that containers opt into. Tailwind-classed elements without conflicting inline styles use mobile-first variants (`grid-cols-1 lg:grid-cols-2`). `app/layout.tsx` exports an explicit `viewport`. See the **UI Design System → Responsive / Mobile** section in `CLAUDE.md`.

---

## 8. Tools Reference

### `agents/tools/web_search.py`
Wraps Tavily API. Always uses `advanced` search depth.

```python
async web_search(
    query: str,
    num_results: int = 5,
    include_domains: list[str] = None,
    exclude_domains: list[str] = None,
    time_range: str = None
) -> list[{"title": str, "url": str, "snippet": str}]
```

Default exclusions: `linkedin.com`, `reddit.com`, `quora.com`.

### `agents/tools/opportunity_tools.py`

```python
normalize_country(country: str) -> (display_name: str, is_us: bool)
normalize_mode(mode: str) -> "online" | "in_person" | "hybrid"
is_visible(is_us: bool, mode: str) -> bool  # visibility rule
read_existing_opportunity_titles(user_id) -> list[str]
write_opportunities(user_id, opps: list[dict]) -> {"success": bool, "inserted": int}
read_opportunities(user_id) -> list[dict]  # open only, sorted by priority_score
update_opportunity_scores(user_id, scores: list[dict]) -> {"success": bool, "updated": int}
```

### `agents/tools/knowledge_base_client.py`

```python
search_patterns(criterion, query, top_k=5) -> list[dict]  # vector similarity search
get_pattern_summary(criterion) -> {"approval_rate": float, "top_patterns": [], "rfe_triggers": []}
format_pattern_context(criterion) -> str  # markdown string injected into agent prompts
```

---

## 9. EB-1A Rubric & Knowledge Base

### Rubric (`agents/knowledge/eb1a_rubric.txt`)

Defines scoring bands for all 10 criteria with field-specific examples:

| Criterion | Strong (75–100) | Medium | Weak |
|---|---|---|---|
| Awards | Forbes 30U30, major named award | Industry recognition | Minor mention |
| Memberships | IEEE Senior Member, invitation-only | ACM Senior | Open membership |
| Press | NYT, Wired, TechCrunch | Industry blog, podcast | Self-authored |
| Judging | NeurIPS / ICML reviewer | Mid-tier program committee | Local event judge |
| Original Contributions | Patent + 1000 GitHub stars | Patent pending + 500 stars | Patent pending only |
| Scholarly Articles | NeurIPS / ICML / ICLR / ACL / CVPR | IEEE / ACM journals | Workshop papers |
| Critical Role | CTO / VP / Director | Staff / Principal with team | Senior IC |
| High Salary | Top 10% documented | Top 25% | No documentation |

### Common RFE Triggers (injected into agent context)
- Judging evidence is online-only (no in-person panel service)
- No independent recommendation letters
- Press is self-authored or not independent
- Salary lacks third-party documentation
- Contributions lack quantified impact evidence
- Critical role lacks org chart or headcount data
- Only 3 criteria met with borderline scores

---

## 10. Environment Variables

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side API routes only — never sent to browser
AGENT_SERVER_URL=            # Render agent server URL (scan trigger)
RENDER_SERVICE_URL=          # same agent server URL (used by some routes)
CRON_API_KEY=                # shared secret for agent endpoints
RESEND_API_KEY=              # evaluator results email
ANTHROPIC_API_KEY=           # advisor chat — first choice
GEMINI_API_KEY=              # advisor chat — fallback
OPENAI_API_KEY=              # advisor chat fallback + advisor RAG embeddings
```

### Agent Service (`agents/.env`)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # NEVER expose to frontend
LLM_PROVIDER=openai          # "openai" → gpt-4o-mini, or "gemini" → gemini-2.0-flash
OPENAI_API_KEY=
GEMINI_API_KEY=              # only when LLM_PROVIDER=gemini
TAVILY_API_KEY=
SERVICE_URL=                 # self-reference for cron trigger
CRON_API_KEY=
```

---

## 11. Key Design Decisions

**Deterministic pipeline, not LLM delegation.** A `SupervisorAgent` exists but is not used for orchestration. `main.py` calls each agent directly in sequence. LLM-based delegation was tried but kept skipping the DiscoveryAgent, breaking scans.

**Service-role key server-side only.** Agents write to Supabase via service-role key (bypasses RLS). The frontend only holds the anon key — all reads are RLS-scoped to `auth.uid()`.

**Visibility rule enforced at read time.** Non-US in-person opportunities are stored in the DB but filtered at the API layer. This keeps the full worldwide dataset intact while applying the travel constraint only at display time.

**KB as context injection, not RAG query.** USCIS precedent (approval rates, RFE triggers) is formatted into a markdown string and injected into the agent's system prompt. This keeps the system lightweight and avoids an extra vector search round-trip per agent call.

**ReflectionAgent self-improves the system.** Strategy weights and `actions_per_day` are stored in `profiles` and updated weekly based on outcome + completion data. The DiscoveryAgent reads these weights when searching next week.

**Mock data for new users.** `lib/mock-data.ts` provides sample opportunities shown before the first scan completes, preventing an empty dashboard on day one.

**Focus-driven discovery.** Users pin a Criteria Focus (`profiles.focused_criteria`). When set, the DiscoveryAgent scans **exactly those criteria** — whether or not they're weak — via `scan_criteria = focused_criteria`. When no focus is set, it falls back to all weak criteria (score < 65). `scan_criteria` is read fresh from the profile each scan, so criteria added later are picked up automatically. (This replaced an earlier intersection-of-weak-and-focused approach.)

**Future-dated opportunities only.** The DiscoveryAgent writes only opportunities whose deadline is today or later (or `null` for rolling calls); the backend discards any past-deadline row as a safety net. This keeps the dashboard actionable.

**Full-stack Render deploy.** `render.yaml` is a single Blueprint provisioning both web services (agent server + Next.js frontend) and both cron jobs. `CRON_API_KEY` is generated once on the agent server and shared to the crons and frontend via `fromService`. The frontend can alternatively run on Vercel by removing the `eb1a-frontend` block. See `DEPLOY.md`.

---

## 12. Full Data Flow

```
Onboarding
  User fills profile (domain, role, salary) + adds initial evidence
  → profiles row created, evidence rows created

Daily at 7am (Render cron)
  POST /run-daily-agents
  └─ For each active user:
     1. EvidenceAgent
        reads: evidence table
        reads: knowledge base (pattern_aggregates, format_pattern_context)
        writes: nothing (output passed to next agent in memory)

     2. DiscoveryAgent
        reads: EvidenceAgent gaps (passed in call)
        reads: existing opportunity titles (deduplication)
        calls: Tavily web search API (2 passes per criterion)
        writes: opportunities table (new rows only)

     3. PrioritizationAgent
        reads: opportunities table (open opps)
        reads: pattern_aggregates (USCIS approval rates per criterion)
        writes: opportunities.priority_score (bulk update)

     4. CoachAgent
        reads: top 5 opportunities (from PrioritizationAgent output)
        reads: daily_plans (yesterday — for carry-forward logic)
        reads: knowledge base (format_pattern_context for why field)
        writes: daily_plans (upsert today's plan)

Sunday at 7am (Render cron)
  POST /run-weekly-reflection
  └─ For each active user:
     ReflectionAgent
       reads: outcomes (last 7 days)
       reads: daily_plans (last 7 days)
       writes: weekly_reflections
       writes: profiles.strategy_weights
       writes: profiles.actions_per_day

Sunday at 2am (Render cron)
  POST /run-knowledge-base
  └─ KnowledgeBaseAgent
       scrapes: USCIS AAO decisions, CourtListener opinions, USCIS Policy Manual
       writes: raw_documents, document_chunks (with embeddings), case_patterns
       writes: pattern_aggregates (refreshed per criterion)
       writes: scrape_runs (log)

User visits dashboard
  → Frontend reads via RLS:
     profiles, evidence, opportunities (visibility-filtered)
     daily_plans (today), weekly_reflections, outcomes

User applies to opportunity
  → POST /api/dashboard/opportunities/[id]/outcome
  → outcomes row created

User marks action done
  → POST /api/dashboard/tasks/[rank]/complete
  → daily_plans.actions[rank].done = true

User triggers manual scan
  → POST /api/dashboard/scan → agent server → background task
  → Dashboard polls /api/dashboard/scan/status until done
  → Redirect to /dashboard/opportunities
```
