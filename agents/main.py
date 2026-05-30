import os
import json
import logging
from datetime import date, datetime, timezone

from dotenv import load_dotenv
load_dotenv()

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from tools.db import get_db
from agents.evidence_agent import build_evidence_agent
from agents.discovery_agent import build_discovery_agent
from agents.prioritization_agent import build_prioritization_agent
from agents.coach_agent import build_coach_agent
from agents.reflection_agent import build_reflection_agent
from agents.knowledge_base_agent import KnowledgeBaseAgent

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="EB-1A Agent Server")

_ALL_CRITERIA = [
    "awards", "memberships", "press", "judging", "original_contributions",
    "scholarly_articles", "artistic_exhibitions", "critical_role",
    "high_salary", "commercial_success",
]


async def _run_single_agent(agent, user_id: str, message: str) -> str:
    """Run one ADK agent to completion and return its concatenated final text.

    We orchestrate the daily pipeline by running each agent ourselves (deterministic)
    rather than relying on an LLM supervisor to transfer control between sub-agents —
    that delegation was unreliable and frequently skipped discovery, so scans produced
    no opportunities.
    """
    app_name = f"eb1a_{agent.name}"
    session_service = InMemorySessionService()
    runner = Runner(agent=agent, app_name=app_name, session_service=session_service)
    session = await session_service.create_session(app_name=app_name, user_id=user_id)
    parts_text: list[str] = []
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=genai_types.Content(role="user", parts=[genai_types.Part(text=message)]),
    ):
        if getattr(event, "content", None) and event.content.parts:
            for part in event.content.parts:
                if getattr(part, "text", None):
                    parts_text.append(part.text)
    return "".join(parts_text)


def _parse_evidence(evidence_text: str, focused: list[str]) -> tuple[list[str], list[dict]]:
    """Derive (weak_criteria, scores) from the evidence agent's JSON output.

    weak_criteria = every criterion not rated 'strong' (score < 65). Falls back to the
    user's focused criteria (or all criteria) so discovery always has targets to search.
    """
    try:
        raw = evidence_text.strip()
        if raw.startswith("```"):
            lines = raw.splitlines()
            raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        data = json.loads(raw)
        strong = set(data.get("strong", []))
        weak = [c for c in _ALL_CRITERIA if c not in strong]
        scores = data.get("scores", [])
        if weak:
            return weak, scores
    except Exception as exc:
        log.warning(f"Evidence parse failed, falling back to focused/all criteria: {exc}")
    return (focused or _ALL_CRITERIA), []


def _verify_api_key(x_api_key: str) -> None:
    expected = os.environ.get("CRON_API_KEY")
    if not expected or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _get_active_user_ids() -> list[str]:
    rows = get_db().table("profiles").select("user_id").execute().data
    return [row["user_id"] for row in rows]


async def run_daily_agents_for_user(user_id: str) -> None:
    """Run the daily pipeline as an explicit, deterministic sequence of agents.

    evidence -> discovery -> prioritization -> coach. Each step is run directly and fed
    the context the next one needs, so discovery always executes and the scan reliably
    produces opportunities (the LLM-supervisor delegation used to skip it).
    """
    log.info(f"[{user_id}] Starting daily pipeline (deterministic)")
    db = get_db()
    profile = (
        db.table("profiles")
        .select("domain, strategy_weights, focused_criteria")
        .eq("user_id", user_id)
        .single()
        .execute()
        .data
    ) or {}
    domain = profile.get("domain") or "AI/ML"
    focused = profile.get("focused_criteria") or []
    weights = profile.get("strategy_weights") or {}
    actions_per_day = (weights.get("actions_per_day") if isinstance(weights, dict) else None) or 3
    focused_label = focused if focused else "all criteria"

    try:
        # 1. Evidence scoring → derive weak criteria
        evidence_text = await _run_single_agent(
            build_evidence_agent(user_id), user_id,
            f"Score the EB-1A evidence for user_id {user_id} now. "
            f"Call read_evidence, then return the JSON object described in your instructions.",
        )
        weak_criteria, scores = _parse_evidence(evidence_text, focused)
        log.info(f"[{user_id}] weak_criteria={weak_criteria}")

        # 2. Discovery (worldwide) — always runs with a non-empty criteria set
        disc_summary = await _run_single_agent(
            build_discovery_agent(user_id), user_id,
            f"user_id: {user_id}\n"
            f"domain: {domain}\n"
            f"weak_criteria: {weak_criteria}\n"
            f"focused_criteria: {focused_label}\n\n"
            "Discover real, currently-open EB-1A opportunities WORLDWIDE for these criteria, "
            "tag each with country and mode, and write them with write_opportunities.",
        )
        log.info(f"[{user_id}] Discovery: {disc_summary[:200]}")

        # 3. Prioritization → score all open opportunities
        await _run_single_agent(
            build_prioritization_agent(user_id), user_id,
            f"user_id: {user_id}\n"
            f"evidence_scores: {scores}\n\n"
            "Call read_opportunities, score every open opportunity using your formula, "
            "then call update_opportunity_scores.",
        )

        # 4. Coach → today's daily plan
        await _run_single_agent(
            build_coach_agent(user_id), user_id,
            f"user_id: {user_id}\n"
            f"actions_per_day: {actions_per_day}\n"
            f"focused_criteria: {focused_label}\n\n"
            "Generate today's daily plan from the top-ranked opportunities and evidence gaps, "
            "then call write_daily_plan.",
        )
        log.info(f"[{user_id}] Daily pipeline complete")
    except Exception as exc:
        log.exception(f"[{user_id}] Daily pipeline failed: {exc}")


async def run_weekly_reflection_for_user(user_id: str) -> None:
    log.info(f"[{user_id}] Starting weekly reflection")
    try:
        profile = (
            get_db()
            .table("profiles")
            .select("strategy_weights")
            .eq("user_id", user_id)
            .single()
            .execute()
            .data
        )
        strategy_weights = (profile or {}).get("strategy_weights", {})

        reflection_agent = build_reflection_agent(user_id)
        session_service = InMemorySessionService()
        runner = Runner(
            agent=reflection_agent,
            app_name="eb1a_reflection",
            session_service=session_service,
        )
        session = await session_service.create_session(
            app_name="eb1a_reflection",
            user_id=user_id,
        )
        message = (
            f"Run weekly reflection for user {user_id}. "
            f"Current strategy_weights: {strategy_weights}. "
            f"Analyze last 7 days, write reflection insights, and update strategy_weights."
        )
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session.id,
            new_message=genai_types.Content(
                role="user",
                parts=[genai_types.Part(text=message)],
            ),
        ):
            log.debug(f"[{user_id}] {event}")
        log.info(f"[{user_id}] Weekly reflection complete")
    except Exception as exc:
        log.exception(f"[{user_id}] Weekly reflection failed: {exc}")


async def _bg_scan(user_id: str) -> None:
    """Background task: run pipeline then update scan status in DB."""
    db = get_db()
    try:
        await run_daily_agents_for_user(user_id)
        db.table("profiles").update({
            "scan_status": "done",
            "scan_finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("user_id", user_id).execute()
        log.info(f"[{user_id}] Background scan finished")
    except Exception as exc:
        log.exception(f"[{user_id}] Background scan failed: {exc}")
        db.table("profiles").update({
            "scan_status": "error",
            "scan_finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("user_id", user_id).execute()


@app.get("/")
async def health():
    return {"status": "ok", "date": date.today().isoformat()}


@app.post("/run-daily-agents")
async def run_daily_agents(x_api_key: str = Header(...)):
    _verify_api_key(x_api_key)
    user_ids = _get_active_user_ids()
    log.info(f"Running daily pipeline for {len(user_ids)} users")
    for user_id in user_ids:
        await run_daily_agents_for_user(user_id)
    return {"status": "ok", "users_processed": len(user_ids)}


@app.post("/run-daily-agent")
async def run_daily_agent_single(
    background_tasks: BackgroundTasks,
    request: Request,
    x_api_key: str = Header(...),
):
    """Trigger the daily pipeline for a single user (on-demand from dashboard)."""
    _verify_api_key(x_api_key)
    body = await request.json()
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    db = get_db()
    db.table("profiles").update({
        "scan_status": "running",
        "scan_started_at": datetime.now(timezone.utc).isoformat(),
        "scan_finished_at": None,
    }).eq("user_id", user_id).execute()

    background_tasks.add_task(_bg_scan, user_id)
    log.info(f"[{user_id}] On-demand scan queued")
    return {"status": "queued", "user_id": user_id}


@app.get("/scan-status/{user_id}")
async def get_scan_status(user_id: str, x_api_key: str = Header(...)):
    """Return current scan status for a user (polled by dashboard)."""
    _verify_api_key(x_api_key)
    result = (
        get_db()
        .table("profiles")
        .select("scan_status, scan_started_at, scan_finished_at")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        return {"status": "idle", "started_at": None, "finished_at": None}
    return {
        "status": result.data.get("scan_status") or "idle",
        "started_at": result.data.get("scan_started_at"),
        "finished_at": result.data.get("scan_finished_at"),
    }


@app.post("/run-knowledge-base")
async def run_knowledge_base(
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(...),
    backfill: bool = False,
):
    """Trigger the weekly knowledge base update (or full backfill)."""
    _verify_api_key(x_api_key)
    agent = KnowledgeBaseAgent()
    background_tasks.add_task(agent.run, backfill=backfill)
    log.info(f"Knowledge base run queued (backfill={backfill})")
    return {"status": "queued", "backfill": backfill}


@app.post("/run-weekly-reflection")
async def run_weekly_reflection(x_api_key: str = Header(...)):
    _verify_api_key(x_api_key)
    user_ids = _get_active_user_ids()
    log.info(f"Running weekly reflection for {len(user_ids)} users")
    for user_id in user_ids:
        await run_weekly_reflection_for_user(user_id)
    return {"status": "ok", "users_processed": len(user_ids)}
