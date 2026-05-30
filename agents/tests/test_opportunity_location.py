"""Unit tests for worldwide opportunity location/mode normalization + visibility.

Run: python -m pytest agents/tests/test_opportunity_location.py
 or: python agents/tests/test_opportunity_location.py   (standalone, no pytest)
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tools.opportunity_tools import normalize_country, normalize_mode, is_visible


def test_normalize_country_us_variants():
    for raw in ["United States", "USA", "U.S.A.", "us", "San Francisco, USA",
                "New York, United States", "America"]:
        display, is_us = normalize_country(raw)
        assert is_us is True, f"{raw!r} should be US"
        assert display == raw.strip()


def test_normalize_country_non_us():
    for raw in ["United Kingdom", "Germany", "India", "Singapore", "Australia",
                "Austria", "Global", "Canada"]:
        _, is_us = normalize_country(raw)
        assert is_us is False, f"{raw!r} should be non-US"


def test_normalize_country_empty():
    assert normalize_country(None) == (None, False)
    assert normalize_country("") == (None, False)
    assert normalize_country("   ") == (None, False)


def test_normalize_mode():
    assert normalize_mode("online") == "online"
    assert normalize_mode("virtual") == "online"
    assert normalize_mode("remote") == "online"
    assert normalize_mode("in_person") == "in_person"
    assert normalize_mode("in-person") == "in_person"
    assert normalize_mode("offline") == "in_person"
    assert normalize_mode("onsite") == "in_person"
    assert normalize_mode("hybrid") == "hybrid"
    assert normalize_mode(None) == "online"        # default
    assert normalize_mode("gibberish") == "online"  # safe fallback


def test_visibility_rule():
    # US: always visible regardless of mode
    assert is_visible(True, "in_person") is True
    assert is_visible(True, "online") is True
    assert is_visible(True, "hybrid") is True
    # non-US: only online/hybrid visible, in_person hidden
    assert is_visible(False, "online") is True
    assert is_visible(False, "hybrid") is True
    assert is_visible(False, "in_person") is False
    # offline alias normalizes to in_person -> hidden for non-US
    assert is_visible(False, "offline") is False


def _run():
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for fn in fns:
        try:
            fn()
            print(f"PASS {fn.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL {fn.__name__}: {e}")
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(_run())
