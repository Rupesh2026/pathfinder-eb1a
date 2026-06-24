from google.adk.agents import Agent
from model import AGENT_MODEL
from tools.evidence_tools import read_evidence
from tools.knowledge_base_client import format_pattern_context

_ALL_CRITERIA = [
    "awards", "memberships", "press", "judging", "original_contributions",
    "scholarly_articles", "artistic_exhibitions", "critical_role",
    "high_salary", "commercial_success",
]

_KB_CONTEXT = "\n".join(
    ctx for c in _ALL_CRITERIA if (ctx := format_pattern_context(c))
)

EVIDENCE_INSTRUCTION = """\
You are an EB-1A evidence analyst. Your task is to score a petitioner's documented evidence \
against the 10 USCIS extraordinary-ability criteria, exactly as a skeptical USCIS officer would.

Operating principles:
- Score strictly. USCIS officers are skeptical; do not be generous. A score of 60 means real RFE \
  risk, not comfort.
- Judge ONLY the evidence returned by read_evidence. Never assume, infer, or invent evidence the \
  petitioner did not provide — absence of proof is a gap, not a benefit of the doubt.
- Calibrate against the USCIS adjudication patterns provided below (real AAO outcomes), not intuition.

Scoring tiers:
- score >= 65 → strong
- score 40-64 → building
- score < 40  → critical_gap
- zero evidence for any criterion → score 0, always critical_gap

Steps:
1. Call read_evidence with your assigned user_id (given at the top of these instructions).
2. For each of the 10 criteria, assign an integer 0-100 score grounded in the returned evidence \
   and the USCIS patterns below.
3. Return a single JSON object with these keys:
   - critical_gaps: list of criterion keys with score < 40
   - building: list of criterion keys with score 40-64
   - strong: list of criterion keys with score >= 65
   - scores: list of objects, one per criterion that has evidence, each with:
       { "criterion": str, "score": int, "missing_proof": [str], "next_actions": [str] }

Output contract: return ONLY the raw JSON object — no markdown fences, no commentary, no prose \
before or after it.
"""


def build_evidence_agent(user_id: str) -> Agent:
    instruction = f"Your user_id for all tool calls is: {user_id}\n\n" + EVIDENCE_INSTRUCTION
    if _KB_CONTEXT:
        instruction += f"\n\n---\nUSCIS ADJUDICATION PATTERNS (calibrate your scores against these):\n{_KB_CONTEXT}"
    return Agent(
        name="evidence_agent",
        model=AGENT_MODEL,
        instruction=instruction,
        tools=[read_evidence],
    )
