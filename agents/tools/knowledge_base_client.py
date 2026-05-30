"""
RAG client used by all existing agents to retrieve relevant USCIS precedent.
Provides both semantic search (match_chunks) and fast aggregate lookup (get_pattern_summary).
"""

import logging
import os

from openai import OpenAI
from tools.db import get_db

log = logging.getLogger(__name__)

_openai_client: OpenAI | None = None


def _get_openai() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _openai_client


def search_patterns(criterion: str | None, query: str, top_k: int = 5) -> list[dict]:
    """
    Semantic search over document_chunks.
    Returns top_k chunks most similar to query, optionally filtered by criterion.
    """
    db = get_db()
    try:
        embedding = (
            _get_openai()
            .embeddings.create(model="text-embedding-3-small", input=query)
            .data[0]
            .embedding
        )
        result = db.rpc(
            "match_chunks",
            {
                "query_embedding": embedding,
                "match_criterion": criterion,
                "match_count": top_k,
            },
        ).execute()
        return result.data or []
    except Exception as exc:
        log.warning(f"[KBClient] search_patterns failed: {exc}")
        return []


def get_pattern_summary(criterion: str) -> dict | None:
    """
    Fast lookup of aggregated patterns for a criterion from pattern_aggregates.
    Returns None if no data has been ingested yet (graceful degradation).
    """
    db = get_db()
    try:
        # Use limit(1) rather than maybe_single(): an empty pattern_aggregates table makes
        # PostgREST return 406 on maybe_single(), which supabase-py surfaces as a None result
        # (and a noisy per-criterion warning). limit(1) degrades cleanly when the KB is empty.
        result = (
            db.table("pattern_aggregates")
            .select("*")
            .eq("criterion", criterion)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None
    except Exception as exc:
        log.warning(f"[KBClient] get_pattern_summary failed for {criterion}: {exc}")
        return None


def format_pattern_context(criterion: str) -> str:
    """
    Returns a ready-to-inject string summarizing USCIS patterns for a criterion.
    Returns empty string if no data is available (won't break existing agents).
    """
    summary = get_pattern_summary(criterion)
    if not summary or not summary.get("total_docs"):
        return ""

    lines = [
        f"## USCIS Precedent: {criterion}",
        f"Based on {summary['total_docs']} AAO/court decisions:",
        f"- Approval rate: {summary['approval_rate']:.0%}" if summary.get("approval_rate") is not None else "",
    ]

    top = summary.get("top_patterns") or []
    if top:
        lines.append("- Success patterns:")
        for p in top[:3]:
            lines.append(f'  • "{p["pattern"]}"')

    rfe = summary.get("rfe_triggers") or []
    if rfe:
        lines.append("- Common RFE triggers:")
        for r in rfe[:3]:
            lines.append(f'  • {r["trigger"]}')

    return "\n".join(l for l in lines if l)
