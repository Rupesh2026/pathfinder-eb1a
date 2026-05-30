from google.adk.agents import Agent
from model import AGENT_MODEL
from tools.opportunity_tools import read_opportunities, update_opportunity_scores
from tools.knowledge_base_client import get_pattern_summary

PRIORITIZATION_INSTRUCTION = """\
You are an EB-1A opportunity prioritizer. A mediocre opportunity in a critical gap \
criterion beats a prestigious opportunity in a strong criterion. Close gaps first.

The Supervisor will pass you the evidence_scores (criteria scores from EvidenceAgent) \
and the user_id.

Scoring formula:
  score = (prestige*0.25 + narrative_fit*0.20 + acceptance_prob*0.20 + time_efficiency*0.15 + gap_weight*0.20) * 100
  Each factor rated 1-5.

Gap weight multiplier (apply BEFORE the formula):
  criterion score < 40  → gap_weight × 2.0
  criterion score 40-64 → gap_weight × 1.5
  criterion score >= 65 → gap_weight × 1.0

Approval rate boost (apply AFTER gap weight, BEFORE final score):
  If USCIS approval rate for this criterion > 70% → multiply final score × 1.2
  This data comes from the USCIS pattern context below if available.

Steps:
1. Call read_opportunities with user_id to get all open (not dismissed, not applied) opportunities.
2. For each opportunity, look up its criterion's score from evidence_scores.
   Apply the gap weight multiplier, then compute the formula score.
3. Call update_opportunity_scores with user_id and [{id, priority_score}] for every opportunity.
4. Return the top 5 opportunities (by priority_score) with their scores and reasoning.
"""


def build_prioritization_agent(user_id: str) -> Agent:
    from scrapers.aao_scraper import CRITERION_KEYWORDS
    criteria = list(set(CRITERION_KEYWORDS.values()))
    kb_lines = []
    for criterion in criteria:
        summary = get_pattern_summary(criterion)
        if summary and summary.get("approval_rate") is not None:
            rate = summary["approval_rate"]
            kb_lines.append(f"  {criterion}: {rate:.0%} approval rate ({summary.get('total_docs', 0)} decisions)")

    instruction = f"Your user_id for all tool calls is: {user_id}\n\n" + PRIORITIZATION_INSTRUCTION
    if kb_lines:
        instruction += "\n\nUSCIS approval rates by criterion (from AAO decisions):\n" + "\n".join(kb_lines)

    return Agent(
        name="prioritization_agent",
        model=AGENT_MODEL,
        instruction=instruction,
        tools=[read_opportunities, update_opportunity_scores],
    )
