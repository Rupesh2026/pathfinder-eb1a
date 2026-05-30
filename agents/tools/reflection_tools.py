from datetime import date, timedelta, timezone, datetime

from tools.db import get_db


def read_outcomes(user_id: str, days: int = 7) -> list[dict]:
    """Return outcomes joined with opportunity details for the last N days."""
    since = (date.today() - timedelta(days=days)).isoformat()
    return (
        get_db()
        .table("outcomes")
        .select("*, opportunities(title, type, criterion)")
        .eq("user_id", user_id)
        .gte("created_at", since)
        .execute()
        .data
    )


def read_daily_plans(user_id: str, days: int = 7) -> list[dict]:
    """Return daily_plans rows for the last N days."""
    since = (date.today() - timedelta(days=days)).isoformat()
    today = date.today().isoformat()
    return (
        get_db()
        .table("daily_plans")
        .select("plan_date, actions")
        .eq("user_id", user_id)
        .gte("plan_date", since)
        .lte("plan_date", today)
        .execute()
        .data
    )


def write_reflection(user_id: str, insights: list[dict]) -> dict:
    """Upsert weekly reflection. Conflict key: (user_id, week_start)."""
    week_start = (date.today() - timedelta(days=7)).isoformat()
    get_db().table("weekly_reflections").upsert(
        {
            "user_id": user_id,
            "week_start": week_start,
            "reflections": insights,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id,week_start",
    ).execute()
    return {"success": True, "week_start": week_start, "insights_count": len(insights)}


def update_strategy_weights(user_id: str, weights: dict) -> dict:
    """Replace profiles.strategy_weights with the full updated weights dict."""
    get_db().table("profiles").update(
        {"strategy_weights": weights}
    ).eq("user_id", user_id).execute()
    return {"success": True}
