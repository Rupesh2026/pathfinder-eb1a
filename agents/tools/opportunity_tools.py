from datetime import date

from tools.db import get_db

VALID_MODES = ("online", "in_person", "hybrid")
VALID_TYPES = {"cfp", "judging", "speaking", "award", "podcast", "grant", "peer_review"}

_TYPE_ALIASES = {
    "conference": "cfp",
    "paper": "cfp",
    "publication": "cfp",
    "call_for_papers": "cfp",
    "workshop": "cfp",
    "review": "peer_review",
    "reviewer": "peer_review",
    "judge": "judging",
    "competition": "judging",
    "talk": "speaking",
    "keynote": "speaking",
    "presentation": "speaking",
    "fellowship": "award",
    "recognition": "award",
    "nomination": "award",
    "media": "podcast",
    "interview": "podcast",
    "press": "podcast",
    # criterion names the LLM sometimes passes as type
    "original_contributions": "cfp",
    "scholarly_articles": "cfp",
    "memberships": "award",
    "awards": "award",
    "judging": "judging",
    "press": "podcast",
}


def normalize_type(t) -> str:
    """Coerce a raw type value into a valid opportunity_type enum. Defaults to 'cfp'."""
    if not t:
        return "cfp"
    s = str(t).strip().lower().replace("-", "_").replace(" ", "_")
    if s in VALID_TYPES:
        return s
    return _TYPE_ALIASES.get(s, "cfp")

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


def normalize_deadline(raw, today: date | None = None) -> tuple[str | None, bool]:
    """Return (iso_deadline_or_none, is_expired) for a raw deadline value.

    The opportunities.deadline column is a DATE; we only ever store an ISO
    ``YYYY-MM-DD`` string or NULL. This coerces whatever the agent produced:
      - empty / unparseable  -> (None, False)  treated as undated (rolling), kept.
      - a valid date < today -> (iso, True)     expired, caller should drop it.
      - a valid date >= today-> (iso, False)    future or due today, kept.

    Coercing unparseable values to None (instead of passing them through) also
    prevents a malformed string like "June 2026" from erroring the batch insert.
    """
    today = today or date.today()
    if not raw:
        return None, False
    s = str(raw).strip()
    if not s or s.lower() in ("null", "none", "n/a", "tbd", "rolling", "ongoing"):
        return None, False
    try:
        d = date.fromisoformat(s[:10])
    except ValueError:
        # Unknown format — keep as undated rather than risk a bad DB write.
        return None, False
    return d.isoformat(), d < today


def read_existing_opportunity_titles(user_id: str) -> list[str]:
    """Return lowercase titles of all opportunities for this user."""
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
    """Upsert opportunities for a user with URL-first deduplication.

    Dedup priority per incoming opportunity:
      1. URL match  → update deadline + description on the existing row (refresh latest info).
      2. Title match (no URL) → skip (same event, nothing to refresh without a URL key).
      3. Neither   → insert as new.

    Within the same batch, URL and title uniqueness are also enforced so the agent
    cannot double-write within a single scan.
    """
    db = get_db()

    existing_rows = (
        db.table("opportunities")
        .select("id, title, url")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    # Build lookup maps from stored data
    by_url: dict[str, str] = {}   # url_lower -> id
    by_title: set[str] = set()    # title_lower
    for row in existing_rows:
        if row.get("url"):
            by_url[row["url"].lower()] = row["id"]
        if row.get("title"):
            by_title.add(row["title"].lower())

    # Batch-local uniqueness guards
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()

    to_insert: list[dict] = []
    updated = 0
    skipped = 0
    expired = 0
    today = date.today()

    for o in opps:
        title = (o.get("title") or "").strip()
        url = (o.get("url") or "").strip()
        url_key = url.lower() if url else None
        title_key = title.lower() if title else None

        if not title:
            skipped += 1
            continue

        # Date gate: never store an opportunity whose application deadline has
        # already passed — it only wastes the user's attention. Undated (rolling)
        # opportunities have deadline_norm = None and are kept.
        deadline_norm, is_expired = normalize_deadline(o.get("deadline"), today)
        if is_expired:
            expired += 1
            continue

        # Intra-batch dedup
        if url_key and url_key in seen_urls:
            skipped += 1
            continue
        if not url_key and title_key and title_key in seen_titles:
            skipped += 1
            continue

        if url_key and url_key in by_url:
            # Refresh latest info on the existing row
            patch: dict = {}
            if deadline_norm:
                patch["deadline"] = deadline_norm
            if o.get("description"):
                patch["description"] = o["description"]
            if patch:
                db.table("opportunities").update(patch).eq("id", by_url[url_key]).execute()
            updated += 1
            seen_urls.add(url_key)
            continue

        if title_key and title_key in by_title:
            skipped += 1
            if url_key:
                seen_urls.add(url_key)
            seen_titles.add(title_key)
            continue

        # Genuinely new opportunity
        country, is_us = normalize_country(o.get("country"))
        mode = normalize_mode(o.get("mode"))
        to_insert.append({
            "user_id": user_id,
            "type": normalize_type(o.get("type")),
            "title": title,
            "description": o.get("description"),
            "url": url or None,
            "deadline": deadline_norm,
            "criterion": o.get("criterion"),
            "country": country,
            "is_us": is_us,
            "delivery_mode": mode,
            "dismissed": False,
            "applied": False,
        })
        if url_key:
            seen_urls.add(url_key)
            by_url[url_key] = ""  # mark as seen
        if title_key:
            seen_titles.add(title_key)
            by_title.add(title_key)

    if to_insert:
        db.table("opportunities").insert(to_insert).execute()

    return {
        "success": True,
        "inserted": len(to_insert),
        "updated": updated,
        "skipped": skipped,
        "expired": expired,
    }


def read_opportunities(user_id: str) -> list[dict]:
    """Return all open, non-expired opportunities ordered by priority_score desc.

    Open = not dismissed and not applied. Non-expired = deadline is in the future
    (today or later) OR has no deadline (rolling). This keeps prioritization, the
    coach's daily plan, and the dashboard focused on opportunities the user can
    still act on — even ones whose deadline has lapsed since they were stored.
    """
    today = date.today().isoformat()
    return (
        get_db()
        .table("opportunities")
        .select("*")
        .eq("user_id", user_id)
        .eq("dismissed", False)
        .eq("applied", False)
        .or_(f"deadline.is.null,deadline.gte.{today}")
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
