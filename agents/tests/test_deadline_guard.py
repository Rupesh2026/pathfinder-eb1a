"""Unit tests for the future-dated opportunity guard (normalize_deadline).

Run: python -m pytest agents/tests/test_deadline_guard.py
 or: python agents/tests/test_deadline_guard.py   (standalone, no pytest)
"""
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tools.opportunity_tools import normalize_deadline

TODAY = date(2026, 6, 20)
PAST = (TODAY - timedelta(days=10)).isoformat()      # 2026-06-10
FUTURE = (TODAY + timedelta(days=30)).isoformat()    # 2026-07-20
TOMORROW = (TODAY + timedelta(days=1)).isoformat()


def test_past_deadline_is_expired():
    assert normalize_deadline(PAST, TODAY) == (PAST, True)


def test_future_and_today_are_kept():
    assert normalize_deadline(FUTURE, TODAY) == (FUTURE, False)
    assert normalize_deadline(TOMORROW, TODAY) == (TOMORROW, False)
    # Due today still counts as actionable (not expired).
    assert normalize_deadline(TODAY.isoformat(), TODAY) == (TODAY.isoformat(), False)


def test_undated_values_are_kept_as_null():
    for raw in (None, "", "   ", "null", "None", "N/A", "TBD", "rolling", "ongoing"):
        assert normalize_deadline(raw, TODAY) == (None, False), f"{raw!r} should be undated"


def test_unparseable_deadline_coerced_to_null_not_crash():
    # A malformed value must not raise (would otherwise error the batch insert).
    assert normalize_deadline("June 2026", TODAY) == (None, False)
    assert normalize_deadline("2026", TODAY) == (None, False)


def test_datetime_strings_use_date_part():
    assert normalize_deadline("2026-07-20T09:00:00", TODAY) == (FUTURE, False)
    assert normalize_deadline("2026-06-10T23:59:59", TODAY) == (PAST, True)


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"[PASS] {name}")
    print("\nAll deadline-guard tests passed.")
