from tools.db import get_db


def read_evidence(user_id: str) -> list[dict]:
    """Return all evidence rows for this user from the evidence table."""
    return (
        get_db()
        .table("evidence")
        .select("*")
        .eq("user_id", user_id)
        .execute()
        .data
    )
