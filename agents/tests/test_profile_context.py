"""Unit tests for _build_profile_context and updated _parse_evidence.

Run: python tests/test_profile_context.py
"""
import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import the functions directly from main (no live services needed)
from main import _build_profile_context, _parse_evidence

# ─── _build_profile_context ────────────────────────────────────────────────────

def test_full_profile():
    profile = {
        "role": "Senior ML Engineer",
        "salary_band": "200k_300k",
        "country_of_origin": "India",
        "education": [
            {"degree": "PhD", "field": "Computer Science", "institution": "MIT"},
        ],
    }
    ctx = _build_profile_context(profile)
    assert "Senior ML Engineer" in ctx
    assert "senior professional" in ctx
    assert "India" in ctx
    assert "PhD in Computer Science (MIT)" in ctx
    print(f"PASS test_full_profile\n  -> {ctx!r}")


def test_missing_fields_graceful():
    ctx = _build_profile_context({})
    assert ctx == "", f"Expected empty string, got {ctx!r}"
    print("PASS test_missing_fields_graceful")


def test_partial_profile_no_education():
    profile = {"role": "Staff Engineer", "salary_band": "300k_plus"}
    ctx = _build_profile_context(profile)
    assert "Staff Engineer" in ctx
    assert "highly experienced" in ctx
    assert "Education" not in ctx
    print(f"PASS test_partial_profile_no_education -> {ctx!r}")


def test_education_without_field():
    profile = {
        "education": [{"degree": "MBA", "institution": "Harvard"}],
    }
    ctx = _build_profile_context(profile)
    assert "MBA (Harvard)" in ctx
    print(f"PASS test_education_without_field -> {ctx!r}")


def test_unknown_salary_band_skipped():
    profile = {"salary_band": "not_a_real_band", "role": "Researcher"}
    ctx = _build_profile_context(profile)
    assert "Researcher" in ctx
    assert "Seniority" not in ctx
    print(f"PASS test_unknown_salary_band_skipped -> {ctx!r}")


# ─── _parse_evidence (now returns 3-tuple) ─────────────────────────────────────

_VALID_JSON = json.dumps({
    "strong": ["awards"],
    "building": ["press"],
    "critical_gaps": ["judging", "scholarly_articles"],
    "scores": [
        {"criterion": "awards", "score": 70, "missing_proof": [], "next_actions": []},
        {"criterion": "judging", "score": 20, "missing_proof": [], "next_actions": []},
    ],
})


def test_parse_evidence_returns_3_tuple():
    weak, scores, critical_gaps = _parse_evidence(_VALID_JSON, [])
    assert isinstance(weak, list)
    assert isinstance(scores, list)
    assert isinstance(critical_gaps, list)
    print("PASS test_parse_evidence_returns_3_tuple")


def test_parse_evidence_critical_gaps_extracted():
    weak, scores, critical_gaps = _parse_evidence(_VALID_JSON, [])
    assert "judging" in critical_gaps
    assert "scholarly_articles" in critical_gaps
    assert "awards" not in critical_gaps   # awards is strong, not a critical gap
    print(f"PASS test_parse_evidence_critical_gaps_extracted -> {critical_gaps}")


def test_parse_evidence_weak_excludes_strong():
    weak, scores, critical_gaps = _parse_evidence(_VALID_JSON, [])
    assert "awards" not in weak   # awards is strong
    assert "judging" in weak      # judging is not strong
    print(f"PASS test_parse_evidence_weak_excludes_strong -> weak={weak}")


def test_parse_evidence_scores_preserved():
    weak, scores, critical_gaps = _parse_evidence(_VALID_JSON, [])
    assert len(scores) == 2
    assert any(s["criterion"] == "judging" and s["score"] == 20 for s in scores)
    print("PASS test_parse_evidence_scores_preserved")


def test_parse_evidence_fenced_json():
    fenced = f"```json\n{_VALID_JSON}\n```"
    weak, scores, critical_gaps = _parse_evidence(fenced, [])
    assert "judging" in critical_gaps
    print("PASS test_parse_evidence_fenced_json")


def test_parse_evidence_malformed_falls_back():
    focused = ["awards", "judging"]
    weak, scores, critical_gaps = _parse_evidence("not json at all", focused)
    assert weak == focused   # falls back to focused
    assert scores == []
    assert critical_gaps == []
    print("PASS test_parse_evidence_malformed_falls_back")


def test_parse_evidence_empty_focused_falls_back_to_all():
    weak, scores, critical_gaps = _parse_evidence("bad", [])
    assert len(weak) == 10   # all 10 criteria
    print(f"PASS test_parse_evidence_empty_focused_falls_back_to_all -> {len(weak)} criteria")


# ─── Runner ────────────────────────────────────────────────────────────────────

def _run():
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for fn in fns:
        try:
            fn()
        except Exception as e:
            failed += 1
            print(f"FAIL {fn.__name__}: {e}")
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(_run())
