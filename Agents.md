# EB-1A Agent System — Agent Reference

## Architecture

### Pipeline model

The daily pipeline is **deterministic and sequential** — not an LLM supervisor delegating to sub-agents. Each agent is run directly via `_run_single_agent()` in `main.py`, with the output of each step passed explicitly to the next. This replaced an LLM-supervisor delegation model that was unreliable and frequently skipped discovery.

```
main.py: run_daily_agents_for_user(user_id)
  │
  ├─ 1. EvidenceAgent.run()
  │      input : user_id
  │      output: (weak_criteria, scores, critical_gaps)  ← parsed by _parse_evidence()
  │
  ├─ 2. DiscoveryAgent.run()
  │      input : user_id, domain, role, weak_criteria, focused_criteria, profile_context
  │      output: opportunities written to DB
  │
  ├─ 3. PrioritizationAgent.run()
  │      input : user_id, evidence_scores, profile_context
  │      output: priority_score updated on all open opportunities in DB
  │
  └─ 4. CoachAgent.run()
         input : user_id, actions_per_day, focused_criteria, critical_gaps, scores, profile_context
         output: daily_plans row written for today
```

### Profile context injection

All agents receive a `User profile:` block built by `_build_profile_context(profile: dict) -> str` in `main.py`. This converts stored profile fields into a compact, human-readable string:

| Profile field | How it appears in the prompt |
|---------------|------------------------------|
| `role` | `Role: Data Product Manager` |
| `salary_band` | `Seniority: senior professional` (mapped from enum) |
| `country_of_origin` | `Country of origin: India` |
| `education` (JSONB array) | `Education: MS in Computer Science (Stanford); MBA (Wharton)` |

Returns empty string when all fields are absent — callers guard with `if profile_context:` to avoid injecting empty blocks.

### Salary band → seniority mapping

| `salary_band` | Seniority label |
|---------------|----------------|
| `under_150k` | early-career professional |
| `150k_200k` | mid-level professional |
| `200k_300k` | senior professional |
| `300k_plus` | highly experienced senior professional |

### ADK setup per agent

Each agent is a standalone `google.adk.agents.Agent` instance. Agents do not reference each other — all inter-agent context passes through `main.py`.

```python
agent = Agent(
    name="discovery_agent",
    model=AGENT_MODEL,              # from model.py; respects OPENAI_API_KEY / GOOGLE env vars
    instruction=instruction,        # prepended with "Your user_id for all tool calls is: {user_id}"
    tools=[...],
)
runner = Runner(agent=agent, app_name=app_name, session_service=InMemorySessionService())
```

---

## EB-1A Criteria

| Key | Criterion | Typical evidence type |
|-----|-----------|----------------------|
| `awards` | Awards or prizes of excellence | Forbes 30U30, IEEE/ACM fellow, industry recognition |
| `memberships` | Selective professional association membership | IEEE Senior Member, invitation-only councils |
| `press` | Published material about the person in major media | TechCrunch, Wired, VentureBeat — written *about* the person |
| `judging` | Judging the work of others | Peer review, hackathon judging, evaluation panels |
| `original_contributions` | Original contributions of major significance | Patents, cited methodologies, widely-adopted open-source |
| `scholarly_articles` | Authorship in professional journals or major media | NeurIPS, ICML, ICLR, IEEE Transactions |
| `artistic_exhibitions` | Artistic displays (low relevance for tech) | |
| `critical_role` | Leading or critical role in distinguished organizations | Staff/VP/Director with documented scope |
| `high_salary` | High salary relative to peers | Requires third-party documentation |
| `commercial_success` | Commercial success (maps to product adoption for tech) | Revenue impact, adoption metrics |

**Minimum to file:** 3 criteria. **Strong case:** 5–6 criteria with substantive evidence.

### Score thresholds

| Range | Status |
|-------|--------|
| ≥ 65 | `strong` |
| 40–64 | `building` |
| < 40 | `critical_gap` |
| 0 (no evidence) | `critical_gap` — always |

---

## EvidenceAgent

**Runs:** Step 1 of daily pipeline
**Input:** `user_id`
**Output:** JSON text returned to `main.py`, parsed into `(weak_criteria, scores, critical_gaps)` by `_parse_evidence()`

### Tools

```python
read_evidence(user_id: str) -> list[EvidenceRow]
```

KB context (USCIS adjudication patterns from `document_chunks`) is appended to the instruction at build time via `format_pattern_context()` for all 10 criteria, so scores are calibrated against real AAO decisions.

### Output format

```json
{
  "strong":        ["awards", "high_salary"],
  "building":      ["press"],
  "critical_gaps": ["judging", "scholarly_articles"],
  "scores": [
    {
      "criterion":    "judging",
      "score":        0,
      "missing_proof": ["Reviewer invitation letters", "Program committee certificates"],
      "next_actions":  ["Apply to NeurIPS reviewer pool", "Apply to MLCommons evaluator"]
    }
  ]
}
```

### `_parse_evidence()` contract

`main.py` strips markdown fences, parses the JSON, and returns:

```python
(weak_criteria: list[str], scores: list[dict], critical_gaps: list[str])
```

- `weak_criteria` = all criteria not in `strong` (score < 65); used by DiscoveryAgent
- `critical_gaps` = criteria with score < 40; passed to CoachAgent for highest-priority planning
- **Fallback:** on any parse failure, returns `(focused_criteria or _ALL_CRITERIA, [], [])`

---

## DiscoveryAgent

**Runs:** Step 2 of daily pipeline
**Input:** `user_id`, `domain`, `role`, `weak_criteria`, `focused_criteria`, `profile_context`
**Output:** New opportunities written to `opportunities` table; count summary returned to `main.py`

### Tools

```python
web_search(query: str, ...) -> list[SearchResult]       # Tavily API
write_opportunities(user_id: str, opps: list) -> dict   # upserts on URL
```

### Worldwide mandate

Searches globally — not restricted to the US. Every opportunity is tagged:

- `country`: host country (e.g. `"United States"`, `"Germany"`) or `"Global"` for fully virtual events
- `mode`: `online` | `in_person` | `hybrid`

**Visibility rule:** Non-US in-person-only opportunities are hidden from the user's dashboard. The agent is instructed to prefer online/hybrid results for non-US venues to maximize actionable opportunities.

### EB-1A Quality Gate

Before writing to DB, each result must pass **all three** checks:

**a. Domain & role match** — directly relevant to the user's domain AND role; not just broadly "tech"

**b. Prestige tier** — nationally or internationally recognized
- Adequate: IEEE/ACM flagship conferences (NeurIPS, ICML, CVPR, ICLR, ACL), NSF/NIH grants, Nature/Science, Forbes 30 Under 30, MIT TR35, ACM SIGKDD
- Inadequate: local meetups, community college workshops, unknown podcasts (<10k listeners), obscure regional competitions, self-nominated listicles

**c. Profile fit** — the user's role and education make them a credible applicant
- Industry practitioner → industry programs and professional society awards
- PhD researcher → academic conferences and journals
- Do not cross-recommend unless the venue explicitly bridges both communities

**Target:** 5–15 high-quality results per scan. Fewer excellent matches beat many mediocre ones.

### Deduplication

`write_opportunities` upserts on URL — the agent does not skip "familiar-sounding" results. The DB refreshes deadlines and descriptions on re-encounter.

### Search strategy

Three passes per criterion template:

| Pass | Description |
|------|-------------|
| WORLDWIDE | No `include_domains`; global results |
| FOCUSED | With `include_domains` for top venues in this template |
| FRESHNESS | No `include_domains`; `time_range="month"` for newly announced opportunities |

Queries include `[role]` and `[domain]` tokens substituted from the user's profile. Fallback: if all three passes return fewer than 2 results, one more broad query runs with no domain filter.

### Template → criterion mapping

| Template | Targets |
|----------|---------|
| `judging` | `judging` |
| `cfp` | `scholarly_articles`, `original_contributions` |
| `speaking` | `original_contributions` |
| `awards` | `awards`, `memberships` |
| `press` | `press` |
| `review` | `judging`, `scholarly_articles` |

---

## PrioritizationAgent

**Runs:** Step 3 of daily pipeline
**Input:** `user_id`, `evidence_scores`, `profile_context`
**Output:** `priority_score` written to every open opportunity in DB; top 5 returned as summary

### Tools

```python
read_opportunities(user_id: str) -> list[Opportunity]
update_opportunity_scores(user_id: str, scores: list[dict]) -> bool
```

### Scoring formula

```
score = (
  prestige        × 0.25 +
  narrative_fit   × 0.20 +
  acceptance_prob × 0.15 +
  time_efficiency × 0.10 +
  gap_weight      × 0.20 +
  profile_fit     × 0.10
) × 100
```

Each factor is rated 1–5 by the agent.

| Factor | Definition |
|--------|-----------|
| `prestige` | How nationally/internationally recognized (1 = local/obscure, 5 = NeurIPS/NSF/Forbes 30U30) |
| `narrative_fit` | How directly this strengthens a specific EB-1A criterion |
| `acceptance_prob` | How likely this user is accepted/invited given their profile |
| `time_efficiency` | Evidence gain per hour of effort |
| `gap_weight` | How critical is the targeted criterion gap (derived from `evidence_scores`) |
| `profile_fit` | How well the opportunity matches the user's role, seniority, and domain (5 = perfect fit; 1 = wrong field/level) |

### Modifiers

**Gap weight multiplier** (applied to `gap_weight` before the formula):

| Criterion score | Multiplier |
|----------------|-----------|
| < 40 | × 2.0 |
| 40–64 | × 1.5 |
| ≥ 65 | × 1.0 |

**USCIS approval rate boost** (applied after gap weight, before final score):
- Criterion approval rate > 70% (from KB) → multiply final score × 1.2

### KB injection

`build_prioritization_agent()` queries `pattern_aggregates` via `get_pattern_summary()` and appends live USCIS approval rates per criterion to the agent's instruction at build time.

---

## CoachAgent

**Runs:** Step 4 of daily pipeline
**Input:** `user_id`, `actions_per_day`, `focused_criteria`, `evidence_critical_gaps`, `evidence_scores`, `profile_context`
**Output:** `daily_plans` row written for today

### Tools

```python
read_yesterday_plan(user_id: str) -> DailyPlan | None
write_daily_plan(user_id: str, plan: list[CoachAction]) -> bool
read_opportunities(user_id: str) -> list[Opportunity]
```

### Plan generation logic

1. Call `read_yesterday_plan` — carry forward any `done=false` action with deadline < 7 days as rank 1 (`carried_forward=true`)
2. Call `read_opportunities` to get open opportunities ordered by `priority_score` descending
3. Fill remaining slots prioritizing `evidence_critical_gaps` criteria first, then `focused_criteria`
4. Write exactly `actions_per_day` actions to `daily_plans`

### Action format

```json
{
  "rank": 1,
  "title": "Apply as Data Product Manager reviewer for AAAI 2026 — your enterprise AI background qualifies you for the applied AI track",
  "why": "Judging is your highest-priority gap (score 0). AAO decisions show reviewing at top-tier venues is among the most consistently approved criterion evidence.",
  "criterion": "judging",
  "evidence_gain": 15,
  "deadline": "Jun 15",
  "time_required": "45 minutes",
  "done": false,
  "carried_forward": false
}
```

**Personalization rule:** Action titles must reference the user's role and specific background. Generic titles ("Submit application to judging panel") are rejected — titles must name the role, venue, and qualifying angle.

### USCIS precedent enrichment

`enrich_action_with_precedent(action: dict)` in `coach_agent.py` is a post-generation utility that appends a KB snippet to `action["why"]` via `search_patterns(criterion, title, top_k=1)`. Used when the coach agent is invoked programmatically rather than through the daily pipeline.

---

## ReflectionAgent

**Runs:** Weekly (Sunday 7am via Render cron `POST /run-weekly-reflection`)
**Input:** `user_id`, current `strategy_weights`
**Output:** `weekly_reflections` row written; `strategy_weights` updated in `profiles`

### Tools

```python
read_outcomes(user_id: str, days: int = 7) -> list[Outcome]
read_daily_plans(user_id: str, days: int = 7) -> list[DailyPlan]
write_reflection(user_id: str, insights: list[Insight]) -> bool
update_strategy_weights(user_id: str, weights: dict) -> bool
```

### Adaptation rules

| Signal | Action |
|--------|--------|
| Criterion score unchanged for 14 days | Flag as stalled; recommend new approach |
| Opportunity type consistently dismissed | Reduce `discovery_weight` by 0.2 (floor 0.2) |
| Opportunity type with accepted outcomes | Increase `discovery_weight` by 0.2 (cap 2.0) |
| Weekly completion rate < 50% | Reduce `actions_per_day` by 1 (floor 1) |

### Reflection output

```json
[
  { "type": "win",     "text": "Completed 4/5 actions this week." },
  { "type": "loss",    "text": "Judging criterion has not moved in 14 days." },
  { "type": "insight", "text": "Peer review applications have the best acceptance rate." },
  { "type": "change",  "text": "Next week: swap one judging search for awards nominations." }
]
```

---

## KnowledgeBaseAgent

**Runs:** On-demand (`POST /run-knowledge-base?backfill=false`) or scheduled separately
**Purpose:** Ingest AAO decisions and USCIS policy documents into pgvector for calibrating agent decisions

### Ingestion pipeline

1. AAO non-precedent I-140 decisions — scraped via `scrapers/aao_scraper.py`
2. USCIS Policy Manual text
3. Federal court opinions relevant to EB-1A

Chunks are embedded with OpenAI `text-embedding-3-small` and stored in `document_chunks`. Structured patterns and approval rates are derived and stored in `case_patterns` and `pattern_aggregates`.

### Usage by other agents

| Agent | Function | Purpose |
|-------|----------|---------|
| `EvidenceAgent` | `format_pattern_context(criterion)` | Calibrate scores against real AAO decisions |
| `PrioritizationAgent` | `get_pattern_summary(criterion)` | Inject USCIS approval rates into scoring |
| `CoachAgent` | `search_patterns(criterion, query, top_k)` | Append precedent snippets to action `why` fields |
| `DiscoveryAgent` | `format_pattern_context(criterion)` | Optional context for opportunity framing |

---

## Strategy weights

Stored in `profiles.strategy_weights` (JSONB). Read by `main.py` before every daily run. Updated by `ReflectionAgent` weekly.

```json
{
  "discovery_weights": {
    "judging":  1.0,
    "cfp":      1.0,
    "speaking": 1.0,
    "awards":   1.0,
    "review":   1.0,
    "podcast":  1.0
  },
  "actions_per_day": 3,
  "filing_urgency": "balanced"
}
```

`filing_urgency` values: `aggressive` (filing < 3 months) | `building` (> 6 months) | `balanced` (no date set or 3–6 months)

---

## Common RFE triggers

The system surfaces these proactively in the dashboard when applicable:

- Judging evidence is online-only or student-level
- No recommendation letters from independent experts documented in evidence
- Press evidence is self-authored, not written *about* the person
- Salary claim lacks third-party documentation
- Original contributions lack evidence of field adoption or impact (not just creation)
- Critical role lacks org chart or scope documentation
