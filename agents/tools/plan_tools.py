from datetime import date, timedelta, timezone, datetime

from tools.db import get_db


def read_yesterday_plan(user_id: str) -> dict | None:
    """Return the daily_plans row for yesterday, or None if it does not exist.

    Uses limit(1) rather than maybe_single(): with no yesterday row, maybe_single() makes
    PostgREST return 406, which supabase-py surfaces as a None result (result.data then
    raises AttributeError and crashes the coach step). limit(1) degrades cleanly.
    """
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    result = (
        get_db()
        .table("daily_plans")
        .select("*")
        .eq("user_id", user_id)
        .eq("plan_date", yesterday)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def write_daily_plan(user_id: str, plan: list[dict]) -> dict:
    """Upsert today's plan. Conflict key: (user_id, plan_date)."""
    today = date.today().isoformat()
    get_db().table("daily_plans").upsert(
        {
            "user_id": user_id,
            "plan_date": today,
            "actions": plan,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id,plan_date",
    ).execute()
    return {"success": True, "plan_date": today, "actions_count": len(plan)}
