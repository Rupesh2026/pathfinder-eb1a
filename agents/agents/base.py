import json
from pathlib import Path
from typing import Any

_RUBRIC_PATH = Path(__file__).parent.parent / "knowledge" / "eb1a_rubric.txt"
_rubric_text: str | None = None


def load_rubric() -> str:
    """Load EB-1A rubric text from disk, cached for the process lifetime."""
    global _rubric_text
    if _rubric_text is None:
        _rubric_text = _RUBRIC_PATH.read_text(encoding="utf-8")
    return _rubric_text


def parse_json_response(text: str) -> Any:
    """Strip markdown code fences and parse JSON from an LLM response."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        end = -1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[1:end])
    return json.loads(text)
