# Pathfinder — EB-1A Case Builder

An open-source multi-agent system that helps you build your EB-1A (extraordinary ability) immigration case. Agents run daily, discover real opportunities worldwide that fill your evidence gaps, score your profile against USCIS standards, and deliver a personalized action plan every morning — without you having to prompt anything.

> Built with Next.js, Supabase, Python + Google ADK, and OpenAI/Gemini.

![Pathfinder Dashboard](docs/dashboard-preview.png)

---

## What it does

The EB-1A visa requires meeting at least 3 of 10 USCIS criteria (judging, press, awards, publications, salary, etc.). Building a strong case is a months-long process of finding the right opportunities and accumulating evidence.

This system automates the discovery and planning work:

- **Evidence scoring** — scores each of your 10 criteria 0–100 against USCIS rubric, flags critical gaps and RFE risks
- **Worldwide opportunity discovery** — searches for real CFPs, judging seats, speaking slots, awards, and peer review openings that target your weakest criteria
- **Prioritization** — ranks opportunities by gap importance, prestige, acceptance probability, and USCIS precedent approval rates
- **Daily action plans** — delivers 3 concrete, completable actions each morning
- **Weekly reflection** — analyzes your outcomes and completion rate, self-adjusts search strategy for next week
- **USCIS knowledge base** — scrapes AAO decisions, federal court opinions, and the USCIS Policy Manual; extracts patterns by criterion; informs all agent scoring

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind) |
| Auth + Database | Supabase (Postgres + pgvector + RLS) |
| Agent service | Python 3.11 + FastAPI + Google ADK |
| AI models | OpenAI gpt-4o-mini (default) or Gemini 2.0 Flash |
| Web search | Tavily API |
| Embeddings | OpenAI text-embedding-3-small |
| Hosting | Vercel (frontend) + Render (agents) |

---

## Repository structure

```
/
├── frontend/                  # Next.js app (Vercel)
│   ├── app/
│   │   ├── (auth)/            # Sign-in, sign-up pages
│   │   ├── onboarding/        # First-time profile + evidence setup
│   │   ├── dashboard/         # Main app (evidence, opportunities, advisor, calendar)
│   │   └── api/               # Server-side API routes
│   ├── components/            # Shared UI components
│   └── lib/                   # Supabase clients, types, utilities
├── agents/                    # Python agent service (Render)
│   ├── agents/                # 6 ADK agents
│   ├── tools/                 # DB, web search, knowledge base tools
│   ├── scrapers/              # USCIS AAO, court opinions, policy watcher
│   ├── extractors/            # LLM pattern extractor
│   ├── knowledge/             # EB-1A rubric text
│   └── main.py                # FastAPI entry point + cron endpoints
├── supabase/
│   └── migrations/            # 13 SQL migration files
├── architecture.md            # Full system architecture doc
└── AGENTS.md                  # Agent specs and prompts
```

---

## Agents

The system runs 6 agents in a deterministic daily pipeline. All outputs are written to Supabase before the frontend reads them.

### Daily pipeline (7am, all users)

```
EvidenceAgent → DiscoveryAgent → PrioritizationAgent → CoachAgent
```

| Agent | What it does | Data in | Data out |
|---|---|---|---|
| **EvidenceAgent** | Scores all 10 criteria 0–100, identifies critical gaps | `evidence` table + KB pattern summaries | Gap analysis passed to next agents |
| **DiscoveryAgent** | Web-searches for real opportunities targeting weak criteria | Tavily API + Supabase dedup | New rows in `opportunities` |
| **PrioritizationAgent** | Scores open opportunities using gap importance + prestige + USCIS approval rates | `opportunities` + `pattern_aggregates` | Updated `priority_score` on each opp |
| **CoachAgent** | Generates top 3 daily actions; carries forward missed deadlines | Top 5 opps + yesterday's plan | Upserts today's `daily_plans` row |

### Weekly pipeline (Sunday 7am)

| Agent | What it does |
|---|---|
| **ReflectionAgent** | Reads outcomes + completion rates; adjusts `strategy_weights` and `actions_per_day` in `profiles`; writes `weekly_reflections` insights |
| **KnowledgeBaseAgent** | Scrapes USCIS AAO decisions, federal court opinions, and Policy Manual; chunks + embeds; extracts criterion-level patterns; refreshes `pattern_aggregates` |

### Prioritization scoring formula

```
score = (prestige × 0.25 + narrative_fit × 0.20 + acceptance_prob × 0.20
       + time_efficiency × 0.15 + gap_weight × 0.20) × 100

gap_weight multiplier:
  criterion score < 40  → 2x   (critical gap)
  criterion score 40–64 → 1.5x (building)
  criterion score ≥ 65  → 1x   (strong)

USCIS precedent boost: ×1.2 if criterion approval_rate > 70%
```

---

## Database schema (Supabase)

All user tables use Row Level Security (`auth.uid() = user_id`). The agent service uses a service-role key server-side; the frontend only holds the anon key.

| Table | Purpose |
|---|---|
| `profiles` | User domain, role, salary band, strategy weights, scan status |
| `evidence` | Evidence per criterion with score 0–100 and strength tier |
| `opportunities` | Agent-discovered opportunities with location, delivery mode, priority score |
| `outcomes` | Application results (pending / accepted / rejected / withdrawn) |
| `daily_plans` | Agent-generated daily actions per user (JSONB array) |
| `weekly_reflections` | Weekly insight arrays + strategy changes |
| `raw_documents` | Scraped USCIS decisions and policy text |
| `document_chunks` | 1536-dim OpenAI embeddings via pgvector |
| `case_patterns` | LLM-extracted criterion patterns (approved/denied) |
| `pattern_aggregates` | Per-criterion approval rates, top patterns, RFE triggers |
| `scrape_runs` | Scrape job logs |

---

## Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- [Supabase](https://supabase.com) project
- [Render](https://render.com) account (for agent hosting + cron)
- OpenAI API key
- Tavily API key (for web search)
- Anthropic API key (for the advisor chat)

### 1. Clone and install

```bash
git clone https://github.com/Rupesh2026/pathfinder-eb1a
cd eb1a-agent-system

# Frontend
cd frontend
npm install

# Agents
cd ../agents
pip install -r requirements.txt
```

### 2. Set up Supabase

1. Create a new Supabase project
2. Run all migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or run each file manually in the SQL editor:
# supabase/migrations/001_*.sql through 013_*.sql
```

3. Enable the `pgvector` extension in your Supabase project (Database → Extensions → vector)

### 3. Configure environment variables

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

ANTHROPIC_API_KEY=sk-ant-...         # for /advisor chat
AGENT_SERVER_URL=https://your-render-service.onrender.com
CRON_API_KEY=your-shared-secret
```

**Agent service** — create `agents/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # never expose to frontend

OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
LLM_PROVIDER=openai                               # or "gemini"

SERVICE_URL=https://your-render-service.onrender.com
CRON_API_KEY=your-shared-secret                   # same as frontend
```

### 4. Run locally

```bash
# Terminal 1 — Frontend (http://localhost:2028)
cd frontend
npm run dev

# Terminal 2 — Agent service (http://localhost:8000)
cd agents
uvicorn main:app --reload --port 8000
```

### 5. Deploy

**Frontend → Vercel**

```bash
vercel deploy
```

Set the same `frontend/.env.local` variables in your Vercel project settings.

**Agents → Render**

1. Create a new Render Web Service pointing to the `/agents` directory
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
4. Add all `agents/.env` variables in Render's Environment tab
5. Add two Render Cron Jobs:

| Name | Schedule | Command |
|---|---|---|
| Daily agents | `0 7 * * *` | `python cron_trigger.py daily` |
| Weekly reflection | `0 7 * * 0` | `python cron_trigger.py weekly` |
| Knowledge base | `0 2 * * 0` | `curl -X POST $SERVICE_URL/run-knowledge-base -H "X-Api-Key: $CRON_API_KEY"` |

---

## Opportunity visibility rules

The system discovers opportunities worldwide. Non-US in-person events are filtered from the UI because they require travel — they stay in the database and become visible if the user is outside the US.

| Location | Delivery mode | Shown? |
|---|---|---|
| US | Any | Yes |
| Non-US | Online or hybrid | Yes |
| Non-US | In-person only | No |

---

## Supported EB-1A criteria

1. Awards / prizes (nationally or internationally recognized)
2. Memberships (associations requiring outstanding achievement)
3. Press / media coverage (published material about the person)
4. Judging (of others' work in the field)
5. Original contributions (of major significance)
6. Scholarly articles (in professional journals or major media)
7. Critical role (at distinguished organizations)
8. High salary (relative to peers in the field)
9. Artistic exhibitions *(rarely applicable for tech)*
10. Commercial success *(rarely applicable for tech)*

USCIS minimum: 3 criteria. Strong case: 5–6 criteria with substantial evidence.

---

## Switching AI models

Set `LLM_PROVIDER` in `agents/.env`:

- `openai` — uses `gpt-4o-mini` (default, handles large token contexts well)
- `gemini` — uses `gemini-2.0-flash`

The frontend advisor chat always uses Claude via the Anthropic API regardless of this setting.

---

## Contributing

Pull requests are welcome. Areas that could use help:

- Additional opportunity scrapers (grant databases, conference aggregators)
- More criterion-specific search query templates in `DiscoveryAgent`
- Frontend improvements (evidence upload, letter tracker, calendar)
- Better PDF parsing for AAO decisions
- Support for additional visa categories (O-1A, NIW)

Please open an issue before starting significant work so we can discuss the approach.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Disclaimer

This software is for informational purposes only and does not constitute legal advice. Immigration decisions are complex and fact-specific. Always consult a qualified immigration attorney before filing any petition.
