"""
Extracts structured EB-1A criterion patterns from raw documents using Gemini 2.0 Flash,
then refreshes pattern_aggregates for affected criteria.
"""

import json
import logging
import os

from tools.db import get_db

log = logging.getLogger(__name__)

# Match the rest of the stack (model.py): default to OpenAI, fall back to Gemini only when
# LLM_PROVIDER=gemini. The Gemini free tier has 0 generate_content quota on this project,
# which 429s every extraction, so OpenAI is the working default.
_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
_OPENAI_EXTRACT_MODEL = "gpt-4o-mini"
_GEMINI_EXTRACT_MODEL = "gemini-2.0-flash"

EXTRACT_PROMPT = """\
You are analyzing a USCIS EB-1A immigration decision document.

Extract all criterion-level patterns from this document. For each EB-1A criterion mentioned:
1. What was the outcome for that criterion? (approved / denied / rfe)
2. What key phrase or reasoning did USCIS use?
3. What type of evidence was evaluated? (press / judging / salary / original_contributions / scholarly_articles / awards / memberships / critical_role / artistic_exhibitions / commercial_success)

Valid criterion values: awards, memberships, press, judging, original_contributions,
scholarly_articles, artistic_exhibitions, critical_role, high_salary, commercial_success

Return ONLY a JSON array. Each element:
{{
  "criterion": "<criterion_value>",
  "outcome": "approved" | "denied" | "rfe",
  "pattern_text": "<key phrase or USCIS reasoning, max 300 chars>",
  "evidence_type": "<evidence category>"
}}

If no clear EB-1A criterion patterns are present, return [].

Document (source: {source_type}):
{content}
"""


class PatternExtractor:
    def __init__(self):
        self._provider = _PROVIDER
        self._openai = None
        self._genai = None
        if self._provider == "gemini":
            from google import genai
            api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            self._genai = genai.Client(api_key=api_key) if api_key else genai.Client()
        else:
            from openai import OpenAI
            self._openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    def _generate(self, prompt: str) -> str:
        """Call the configured LLM and return raw text."""
        if self._provider == "gemini":
            resp = self._genai.models.generate_content(
                model=_GEMINI_EXTRACT_MODEL, contents=prompt,
            )
            return resp.text or ""
        resp = self._openai.chat.completions.create(
            model=_OPENAI_EXTRACT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        return resp.choices[0].message.content or ""

    async def extract(self, document: dict) -> list[dict]:
        """Extract patterns from one document and store them in case_patterns."""
        db = get_db()
        doc_id = document["id"]
        source_type = document.get("source", "decision")

        # Limit content to avoid token overflow
        content_snippet = document.get("content", "")[:8000]

        prompt = EXTRACT_PROMPT.format(
            source_type=source_type,
            content=content_snippet,
        )

        try:
            raw = self._generate(prompt).strip()

            # Strip markdown fences if present
            if raw.startswith("```"):
                lines = raw.splitlines()
                end = -1 if lines[-1].strip() == "```" else len(lines)
                raw = "\n".join(lines[1:end])

            patterns = json.loads(raw)
            if not isinstance(patterns, list):
                return []
        except Exception as exc:
            log.warning(f"[PatternExtractor] Extraction failed for doc {doc_id}: {exc}")
            return []

        stored = []
        for p in patterns:
            criterion = p.get("criterion", "").strip()
            outcome = p.get("outcome", "").strip()
            pattern_text = p.get("pattern_text", "").strip()

            if not (criterion and outcome and pattern_text):
                continue

            valid_criteria = {
                "awards", "memberships", "press", "judging", "original_contributions",
                "scholarly_articles", "artistic_exhibitions", "critical_role",
                "high_salary", "commercial_success",
            }
            if criterion not in valid_criteria:
                continue

            try:
                result = db.table("case_patterns").insert({
                    "document_id": doc_id,
                    "criterion": criterion,
                    "outcome": outcome,
                    "pattern_text": pattern_text[:500],
                    "evidence_type": p.get("evidence_type", "").strip() or None,
                }).execute()
                if result.data:
                    stored.append(result.data[0])
            except Exception as exc:
                log.warning(f"[PatternExtractor] Failed to store pattern: {exc}")

        if stored:
            affected = list({p["criterion"] for p in stored})
            await self._refresh_aggregates(affected)

        log.info(f"[PatternExtractor] Stored {len(stored)} patterns for doc {doc_id}")
        return stored

    async def _refresh_aggregates(self, criteria: list[str]) -> None:
        """Recompute pattern_aggregates rows for the given criteria."""
        db = get_db()
        for criterion in criteria:
            try:
                rows = (
                    db.table("case_patterns")
                    .select("outcome, pattern_text, evidence_type")
                    .eq("criterion", criterion)
                    .execute()
                    .data
                )
                if not rows:
                    continue

                total = len(rows)
                approved = sum(1 for r in rows if r["outcome"] == "approved")
                denied = sum(1 for r in rows if r["outcome"] == "denied")
                approval_rate = approved / total if total else 0

                # Top patterns: group by pattern_text, sort by frequency
                from collections import Counter
                pattern_counts = Counter(r["pattern_text"] for r in rows)
                top_patterns = [
                    {"pattern": text, "count": count, "outcome": None}
                    for text, count in pattern_counts.most_common(5)
                ]

                # RFE triggers
                rfe_rows = [r for r in rows if r["outcome"] == "rfe"]
                rfe_counts = Counter(r["evidence_type"] for r in rfe_rows if r["evidence_type"])
                rfe_triggers = [
                    {"trigger": t, "frequency": c}
                    for t, c in rfe_counts.most_common(5)
                ]

                db.table("pattern_aggregates").upsert({
                    "criterion": criterion,
                    "total_docs": total,
                    "approval_rate": approval_rate,
                    "top_patterns": top_patterns,
                    "rfe_triggers": rfe_triggers,
                    "updated_at": "now()",
                }).execute()
            except Exception as exc:
                log.warning(f"[PatternExtractor] Aggregate refresh failed for {criterion}: {exc}")
