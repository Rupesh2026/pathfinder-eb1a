## Framework
Google ADK (Agent Development Kit) — Python 3.11+
Pattern: Supervisor → Sub-agents (not independent agents)
The SupervisorAgent is the root agent. It receives the user profile,
reasons about the user's current situation, then delegates to
sub-agents with targeted context. Sub-agents do not call each other
directly. All inter-agent context passes through the Supervisor.

---

## EB-1A Knowledge Base
Injected into SupervisorAgent system prompt at runtime.
Sub-agents receive targeted context via delegation only.

### The 10 EB-1A Criteria
1. Awards/prizes — nationally or internationally recognized
2. Memberships — in associations requiring outstanding achievement
3. Press/media — published material about the person in major media
4. Judging — judge of others' work in the field
5. Original contributions — of major significance to the field
6. Scholarly articles — in professional journals or major media
7. Artistic exhibitions — not applicable for AI/tech users
8. Critical role — at distinguished organizations
9. High salary — relative to others in the field
10. Commercial success — not applicable for AI/tech users

Minimum bar: meet 3 criteria
Strong case: meet 5-6 criteria with substantial evidence
Petition narrative: all criteria must tell one coherent story

### Strength Rubric for AI/ML Field

#### Publications (Criterion 6)
- Strong: NeurIPS, ICML, ICLR, ACL, CVPR — score 80-100
- Medium: IEEE Transactions, ACM conferences, AAAI — score 50-79
- Weak: arXiv only, workshops, no citations — score 10-49
- Citations: 50+ = strong, 10-50 = medium, under 10 = weak

#### Judging (Criterion 4)
- Strong: NeurIPS/ICML/ICLR reviewer, major industry competition — score 75-100
- Medium: IEEE/ACM program committee, mid-tier conference reviewer — score 40-74
- Weak: online hackathon, student competition, internal panels — score 10-39
- Zero evidence: score 0, always critical gap

#### Press/Media (Criterion 3)
- Strong: NYT, Wired, TechCrunch, VentureBeat article ABOUT the person — score 75-100
- Medium: industry blog byline, podcast appearance, conference coverage — score 40-74
- Weak: company blog, personal blog, LinkedIn only — score 10-39

#### Salary (Criterion 9)
- Strong: top 10% for role + metro area, documented — score 80-100
- Medium: top 25%, documented — score 50-79
- Weak: above average but undocumented — score 20-49

#### Original Contributions (Criterion 5)
- Strong: patent granted, 1000+ star repo, cited methodology — score 75-100
- Medium: patent pending, 500+ star repo, cited in other papers — score 40-74
- Weak: internal tools, small open-source, uncited work — score 10-39

#### Critical Role (Criterion 8)
- Strong: CTO/VP/Director at recognized org, documented scope — score 75-100
- Medium: Staff/Principal engineer leading team at known company — score 45-74
- Weak: senior IC without leadership scope documented — score 20-44

#### Awards (Criterion 1)
- Strong: Forbes 30 Under 30, major industry award, government recognition — score 75-100
- Medium: company award with external recognition, regional award — score 35-74
- Weak: internal-only awards — score 10-34

#### Memberships (Criterion 2)
- Strong: IEEE Senior Member, invitation-only AI council, National Academy — score 75-100
- Medium: ACM Senior Member, selective professional board — score 40-74
- Weak: standard ACM/IEEE membership, open associations — score 5-39

### Common RFE Triggers
Supervisor warns users proactively if any of these apply:
- Judging evidence is online-only or student-level
- No recommendation letters from independent experts
- Press is self-authored, not written about the person
- Salary claim lacks third-party documentation
- Contributions lack evidence of impact
- Critical role lacks org chart or scope documentation

---

## Agent Structure
SupervisorAgent (root)
├── EvidenceAgent     → scores all criteria, returns gaps
├── DiscoveryAgent    → web searches for opportunities targeting gaps
├── PrioritizationAgent → scores + ranks opportunities against gaps
├── CoachAgent        → writes top 3 daily actions to database
└── ReflectionAgent   → weekly only, analyzes outcomes, updates strategy

---

## SupervisorAgent

**Runs:** Daily (Render cron 7am) + on demand
**Input:** user_id, user profile, strategy_weights
**Output:** Orchestrates all sub-agents, final summary written to daily_plans

**Delegation flow:**

Load profile + strategy_weights for user
Assess urgency:
filing < 3 months  → aggressive (fast turnaround opps only, 3 actions/day)
filing > 6 months  → building (wide net, quick wins)
no date set        → balanced
Call EvidenceAgent   → get criteria scores + gaps
Call DiscoveryAgent  → pass gaps, get new opportunities
Call PrioritizationAgent → pass gaps + opps, get ranked list
Call CoachAgent      → pass top 5 opps + gaps, get daily plan written


**System prompt:**
You are the orchestrating supervisor for an EB-1A immigration
strategy system. Reason about the user's overall situation —
their gaps, filing urgency, and domain — then delegate to
sub-agents with precise context. Do not do the sub-agents'
work yourself. Always ask: what does this person need most
right now to move their EB-1A case forward?
[EB-1A KNOWLEDGE BASE INJECTED HERE AT RUNTIME]

**ADK setup:**
```python
supervisor = Agent(
    name="eb1a_supervisor",
    model="gemini-2.0-flash",
    instruction=SUPERVISOR_PROMPT + knowledge_base,
    sub_agents=[
        evidence_agent,
        discovery_agent,
        prioritization_agent,
        coach_agent
    ]
)
```

---

## EvidenceAgent

**Type:** Sub-agent
**Input:** user_id, evidence rows
**Output:** Criteria scores + gaps returned to Supervisor

**Tools:**
```python
read_evidence(user_id: str) -> list[EvidenceRow]
```

**Scoring rules:**
- score < 40  → critical_gap
- score 40-64 → building
- score >= 65 → strong
- zero evidence → score 0, always critical_gap

**Returns:**
```json
{
  "critical_gaps": ["Judging others", "Press/media"],
  "building": ["Memberships", "Awards"],
  "strong": ["Original contributions", "High salary"],
  "scores": [
    {
      "criterion": "Judging others",
      "score": 0,
      "missing_proof": ["Invitation letters", "Judge certificates"],
      "next_actions": ["Apply to NeurIPS reviewer", "Apply to MLCommons"]
    }
  ]
}
```

**System prompt:**
You are an EB-1A evidence analyst. Score strictly against
USCIS standards. Do not be generous — USCIS officers are
skeptical. A score of 60 means real RFE risk, not comfort.

---

## DiscoveryAgent

**Type:** Sub-agent
**Input:** user domain + weak criteria list (from Supervisor)
**Output:** New opportunities written to Supabase, count returned to Supervisor

**Tools:**
```python
web_search(query: str) -> list[SearchResult]
read_existing_opportunity_titles(user_id: str) -> list[str]
write_opportunities(user_id: str, opps: list[Opportunity]) -> bool
```

**Search queries per weak criterion:**
Judging:    "[domain] competition judge application 2025"
"NeurIPS ICML reviewer application 2025"
CFPs:       "[domain] conference call for papers 2025"
"IEEE ACM [domain] CFP deadline 2025"
Speaking:   "[domain] summit call for speakers 2025"
Awards:     "[domain] awards nominations 2025"
Press:      "[domain] podcast guest pitch 2025"
Review:     "[domain] journal reviewer open 2025"

**Rules:**
- Deduplicate: skip if title already exists for this user
- Never resurface dismissed opportunities
- Only write real, currently open opportunities

**System prompt:**
You are an EB-1A opportunity scout. Only surface opportunities
that are real, currently open, and relevant to the EB-1A
criterion they target. Never invent deadlines or details not
found in search results.

---

## PrioritizationAgent

**Type:** Sub-agent
**Input:** Open opportunities + criteria scores (passed by Supervisor)
**Output:** Scored opportunities updated in Supabase, top 5 returned to Supervisor

**Tools:**
```python
read_opportunities(user_id: str) -> list[Opportunity]
update_opportunity_scores(user_id: str, scores: list) -> bool
```

**Scoring formula:**
score = (
prestige        * 0.25 +
narrative_fit   * 0.20 +
acceptance_prob * 0.20 +
time_efficiency * 0.15 +
gap_weight      * 0.20
) * 100
Each factor: 1-5 scored by agent using knowledge base rubric
Gap weight multiplier:
criterion score < 40  → gap_weight * 2.0
criterion score 40-64 → gap_weight * 1.5
criterion score >= 65 → gap_weight * 1.0

**System prompt:**
You are an EB-1A opportunity prioritizer. A mediocre opportunity
in a critical gap criterion beats a prestigious opportunity in a
strong criterion. Close gaps first.

---

## CoachAgent

**Type:** Sub-agent
**Input:** Top 5 ranked opps + evidence gaps + yesterday's completion status
**Output:** Top 3 actions written to daily_plans table

**Tools:**
```python
read_yesterday_plan(user_id: str) -> DailyPlan | None
write_daily_plan(user_id: str, plan: list[CoachAction]) -> bool
```

**Memory rule:**
- Yesterday's incomplete action with deadline < 7 days → carry forward as action 1

**Writes to daily_plans:**
```json
[
  {
    "rank": 1,
    "title": "Apply as NeurIPS 2025 reviewer",
    "why": "Judging at 0% — biggest gap, direct RFE trigger.",
    "criterion": "Judging others",
    "evidence_gain": 15,
    "deadline": "Jun 1",
    "time_required": "45 minutes",
    "done": false,
    "carried_forward": false
  }
]
```

**System prompt:**
You are an EB-1A daily coach. Every action must map to a
specific criterion. Be specific and completable — never
suggest vague actions like "network more". If an action
was not completed yesterday and the deadline is close,
make it action 1 today.

---

## ReflectionAgent

**Type:** Sub-agent (weekly cron only — runs separately from daily pipeline)
**Runs:** Sunday 7am via Render cron
**Input:** Last 7 days outcomes + completion rates + criteria score changes
**Output:** Insights written to weekly_reflections, strategy_weights updated in profiles

**Tools:**
```python
read_outcomes(user_id: str, days: int = 7) -> list[Outcome]
read_daily_plans(user_id: str, days: int = 7) -> list[DailyPlan]
write_reflection(user_id: str, insights: list[Insight]) -> bool
update_strategy_weights(user_id: str, weights: dict) -> bool
```

**Self-improvement logic:**
Criterion not moved in 14 days    → flag as stalled, suggest new approach
Opportunity type always dismissed  → reduce that type in discovery weights
Accepted outcomes cluster in type  → increase that type's weight
Completion rate < 50% this week    → reduce to 1 action/day next week

**Writes to weekly_reflections:**
```json
[
  { "type": "win",     "text": "Completed 4/5 actions this week." },
  { "type": "loss",    "text": "Judging criterion has not moved in 14 days." },
  { "type": "insight", "text": "Peer review applications have best acceptance rate." },
  { "type": "change",  "text": "Next week: swap 1 judging search for awards nominations." }
]
```

**System prompt:**
You are an EB-1A weekly reflection coach. Be honest about
what is not working. Identify the one highest-leverage change
for next week and update strategy_weights so next week's
agents behave differently.

---

## Orchestration (main.py)

```python
async def run_daily_agents_for_user(user_id: str):
    supervisor = build_supervisor(user_id)
    await supervisor.run(
        f"Run the full daily pipeline for user {user_id}. "
        f"Score their evidence, discover opportunities for their gaps, "
        f"prioritize all open opportunities, generate today's top 3 actions."
    )

async def run_weekly_reflection_for_user(user_id: str):
    reflection = ReflectionAgent(user_id)
    await reflection.run()

# Render cron
# POST /run-daily-agents     → 7am daily   → all users
# POST /run-weekly-reflection → 7am Sunday  → all users
```

---

## Adding the Knowledge Base (when ready)

Save to agents/knowledge/uscis_policy.txt
Save AAO decisions to agents/knowledge/aao_decisions/
In build_supervisor():
with open("knowledge/uscis_policy.txt") as f:
knowledge_base = f.read()
Prepend to SUPERVISOR_PROMPT only
Sub-agents receive context via delegation



---

## Strategy Weights (stored in profiles table)
```json
{
  "discovery_weights": {
    "judging": 1.0,
    "cfp": 1.0,
    "speaking": 1.0,
    "awards": 1.0,
    "review": 1.0,
    "podcast": 1.0
  },
  "actions_per_day": 3,
  "filing_urgency": "balanced"
}
```
Updated by ReflectionAgent weekly. Read by SupervisorAgent before every daily run.