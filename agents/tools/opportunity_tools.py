from tools.db import get_db

VALID_MODES = ("online", "in_person", "hybrid")

# Strings that identify the United States as the host country. Matching is
# case-insensitive and substring-based so values like "San Francisco, USA" or
# "New York, United States" resolve correctly.
_US_ALIASES = (
    "united states",
    "u.s.a",
    "u.s.",
    "usa",
    "us",
    "america",
)


def normalize_country(country) -> tuple[str | None, bool]:
    """Return (display_country, is_us) for a raw country string.

    is_us is True when the value names the United States. Returns (None, False)
    for empty/unknown input. Online-only / global opportunities should pass a
    falsy country and are treated as non-US.
    """
    if not country or not str(country).strip():
        return None, False
    display = str(country).strip()
    lowered = display.lower()
    # Token-aware check so "Australia" (contains "us"... no) / "Austria" don't
    # false-match: require the alias to appear as a word/boundary fragment.
    is_us = False
    for alias in _US_ALIASES:
        if alias == "us":
            # bare "us" only counts as a standalone token, not inside a word
            tokens = [t.strip(".,") for t in lowered.replace("/", " ").split()]
            if "us" in tokens:
                is_us = True
                break
        elif alias in lowered:
            is_us = True
            break
    return display, is_us


def normalize_mode(mode) -> str:
    """Coerce a raw mode value into one of VALID_MODES. Defaults to 'online'."""
    if not mode:
        return "online"
    m = str(mode).strip().lower().replace("-", "_").replace(" ", "_")
    aliases = {
        "in_person": "in_person",
        "inperson": "in_person",
        "offline": "in_person",
        "onsite": "in_person",
        "on_site": "in_person",
        "physical": "in_person",
        "virtual": "online",
        "remote": "online",
        "online": "online",
        "hybrid": "hybrid",
    }
    return aliases.get(m, "online" if m not in VALID_MODES else m)


def is_visible(is_us: bool, mode: str) -> bool:
    """Read-time visibility rule: US opps always show; non-US only when not in-person."""
    return bool(is_us) or normalize_mode(mode) != "in_person"


def read_existing_opportunity_titles(user_id: str) -> list[str]:
    """Return lowercase titles of all opportunities for this user (for deduplication)."""
    rows = (
        get_db()
        .table("opportunities")
        .select("title")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    return [row["title"].lower() for row in rows]


def write_opportunities(user_id: str, opps: list[dict]) -> dict:
    """Batch-insert new opportunities, skipping titles that already exist.

    Each opportunity may include a `country` (host country name, or null/"Global"
    for online-only) and a `mode` ('online' | 'in_person' | 'hybrid'). These are
    normalized here: country -> (display, is_us) and mode -> a valid enum value.
    """
    existing = set(read_existing_opportunity_titles(user_id))
    rows = []
    for o in opps:
        title = o.get("title", "").strip()
        if not title or title.lower() in existing:
            continue
        country, is_us = normalize_country(o.get("country"))
        mode = normalize_mode(o.get("mode"))
        rows.append({
            "user_id": user_id,
            "type": o.get("type", "cfp"),
            "title": title,
            "description": o.get("description"),
            "url": o.get("url"),
            "deadline": o.get("deadline"),
            "criterion": o.get("criterion"),
            "country": country,
            "is_us": is_us,
            "delivery_mode": mode,
            "dismissed": False,
            "applied": False,
        })
        existing.add(title.lower())  # dedupe within this same batch too
    if rows:
        get_db().table("opportunities").insert(rows).execute()
    return {"success": True, "inserted": len(rows), "skipped": len(opps) - len(rows)}


def read_opportunities(user_id: str) -> list[dict]:
    """Return all open (not dismissed, not applied) opportunities ordered by priority_score desc."""
    return (
        get_db()
        .table("opportunities")
        .select("*")
        .eq("user_id", user_id)
        .eq("dismissed", False)
        .eq("applied", False)
        .order("priority_score", desc=True)
        .execute()
        .data
    )


def update_opportunity_scores(user_id: str, scores: list[dict]) -> dict:
    """Update priority_score for each opportunity. scores = [{id, priority_score}]."""
    db = get_db()
    updated = 0
    for item in scores:
        opp_id = item.get("id")
        score = item.get("priority_score")
        if opp_id and score is not None:
            db.table("opportunities").update({"priority_score": score}).eq("id", opp_id).execute()
            updated += 1
    return {"success": True, "updated": updated}
