from google.adk.agents import Agent

from model import AGENT_MODEL
from agents.base import load_rubric
from agents.evidence_agent import build_evidence_agent
from agents.discovery_agent import build_discovery_agent
from agents.prioritization_agent import build_prioritization_agent
from agents.coach_agent import build_coach_agent
from tools.db import get_db
from tools.knowledge_base_client import format_pattern_context

_DEFAULT_STRATEGY_WEIGHTS = {
    "discovery_weights": {
        "judging": 1.0, "cfp": 1.0, "speaking": 1.0,
        "awards": 1.0, "review": 1.0, "podcast": 1.0,
    },
    "actions_per_day": 3,
    "filing_urgency": "balanced",
}

SUPERVISOR_PROMPT = """\
You are the orchestrating supervisor for an EB-1A immigration strategy system. Reason about \
the user's overall situation — their gaps, filing urgency, and domain — then delegate to \
sub-agents with precise context. Do not do the sub-agents' work yourself. Always ask: what \
does this person need most right now to move their EB-1A case forward?

Delegation sequence (always in this exact order):
1. EvidenceAgent  — pass user_id. Receive criteria scores + gaps.
2. DiscoveryAgent — pass user_id, user domain, weak_criteria list (score < 65), and \
   focused_criteria (user's selected focus list). DiscoveryAgent will intersect the two.
3. PrioritizationAgent — pass user_id and the evidence_scores dict from EvidenceAgent.
4. CoachAgent     — pass user_id, top 5 opportunity details, evidence gaps, actions_per_day, \
   and focused_criteria so it can prioritize focused actions.

Filing urgency behavior (from strategy_weights.filing_urgency):
- aggressive: emphasize fast-turnaround opportunities (deadline < 2 weeks), push actions_per_day
- building:   wide discovery net, prefer quick wins that boost weak criteria
- balanced:   standard formula, standard actions_per_day

When delegating, include the user_id and all relevant context in your delegation message \
so the sub-agent has everything it needs without querying the Supervisor back.

---
EB-1A KNOWLEDGE BASE:
{rubric}
---

User context:
user_id: {user_id}
domain: {domain}
strategy_weights: {strategy_weights}
focused_criteria: {focused_criteria}
"""


def build_supervisor(user_id: str) -> Agent:
    db = get_db()
    profile = (
        db.table("profiles")
        .select("domain, strategy_weights, focused_criteria")
        .eq("user_id", user_id)
        .single()
        .execute()
        .data
    )

    domain = profile.get("domain", "AI/ML") if profile else "AI/ML"
    strategy_weights = profile.get("strategy_weights") or _DEFAULT_STRATEGY_WEIGHTS
    focused_criteria = profile.get("focused_criteria") or [] if profile else []

    # Append USCIS precedent context for each focused criterion (gracefully empty if KB not yet populated)
    kb_context = ""
    for criterion in focused_criteria:
        ctx = format_pattern_context(criterion)
        if ctx:
            kb_context += f"\n\n{ctx}"

    instruction = SUPERVISOR_PROMPT.format(
        rubric=load_rubric(),
        user_id=user_id,
        domain=domain,
        strategy_weights=strategy_weights,
        focused_criteria=focused_criteria if focused_criteria else "all criteria (none selected)",
    )
    if kb_context:
        instruction += f"\n\n---\nUSCIS ADJUDICATION PATTERNS (from AAO decisions):{kb_context}"

    return Agent(
        name="eb1a_supervisor",
        model=AGENT_MODEL,
        instruction=instruction,
        sub_agents=[
            build_evidence_agent(user_id),
            build_discovery_agent(user_id),
            build_prioritization_agent(user_id),
            build_coach_agent(user_id),
        ],
    )
