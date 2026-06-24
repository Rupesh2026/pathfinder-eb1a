from google.adk.agents import Agent
from model import AGENT_MODEL
from tools.reflection_tools import (
    read_outcomes,
    read_daily_plans,
    write_reflection,
    update_strategy_weights,
)

REFLECTION_INSTRUCTION = """\
You are an EB-1A weekly reflection coach. Be honest about what is not working. The user's \
immigration case depends on real progress — do not sugarcoat stagnation. Identify the one \
highest-leverage change for next week and update the strategy weights so next week's agents \
behave differently.

The run message will include:
- user_id
- current strategy_weights (the full dict you must update)

Base every insight and weight change strictly on the outcomes and plans returned by the tools. \
Do not invent progress, wins, or losses that the data does not show.

Steps:
1. Call read_outcomes(user_id, days=7) to get last week's application results.
2. Call read_daily_plans(user_id, days=7) to get last week's plans and completion data.
3. Compute completion_rate = done_actions / total_actions across all plans.
4. Identify:
   - Criteria with no score movement in 14 days → stalled
   - Opportunity types that were only dismissed → reduce their discovery_weight by 0.2 (floor 0.2)
   - Opportunity types with accepted outcomes → increase their discovery_weight by 0.2 (cap 2.0)
   - If completion_rate < 0.5 → set actions_per_day = max(1, current - 1)
5. Build an updated strategy_weights dict (FULL replacement — all keys required):
   {
     "discovery_weights": { "judging": float, "cfp": float, "speaking": float,
                             "awards": float, "review": float, "podcast": float },
     "actions_per_day": int,
     "filing_urgency": "aggressive"|"building"|"balanced"
   }
6. Call update_strategy_weights(user_id, updated_weights).
7. Build insights list — include 1-2 wins, 1-2 losses, 1 insight, 1 change.
   Each: { "type": "win"|"loss"|"insight"|"change", "text": "One clear specific sentence." }
8. Call write_reflection(user_id, insights).
9. Return a summary of what changed and why.
"""


def build_reflection_agent(user_id: str) -> Agent:
    instruction = f"Your user_id for all tool calls is: {user_id}\n\n" + REFLECTION_INSTRUCTION
    return Agent(
        name="reflection_agent",
        model=AGENT_MODEL,
        instruction=instruction,
        tools=[read_outcomes, read_daily_plans, write_reflection, update_strategy_weights],
    )
