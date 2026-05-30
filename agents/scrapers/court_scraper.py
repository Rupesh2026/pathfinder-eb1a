"""
Fetches federal court opinions about EB-1A extraordinary ability via CourtListener API.
API docs: https://www.courtlistener.com/help/api/rest/
Rate limit: 5000 requests/day (no API key required for public opinions).
"""

import asyncio
import hashlib
import logging
from datetime import date, timedelta

import httpx

from scrapers.aao_scraper import CRITERION_KEYWORDS

log = logging.getLogger(__name__)

COURTLISTENER_BASE = "https://www.courtlistener.com/api/rest/v4"
SEARCH_QUERY = '"extraordinary ability" OR "EB-1A" OR "EB1A"'


class CourtScraper:
    def __init__(self):
        self._client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; EB1A-Research/1.0)"},
        )

    async def scrape(self, years_back: int = 2) -> list[dict]:
        """Fetch federal court opinions about EB-1A from CourtListener."""
        cutoff = date.today() - timedelta(days=years_back * 365)
        log.info(f"[CourtScraper] Fetching opinions since {cutoff}")

        opinions = await self._search_opinions(cutoff)
        log.info(f"[CourtScraper] Found {len(opinions)} opinions")

        docs = []
        for opinion in opinions:
            await asyncio.sleep(0.5)
            try:
                doc = await self._process_opinion(opinion)
                if doc:
                    docs.append(doc)
            except Exception as exc:
                log.warning(f"[CourtScraper] Failed to process opinion {opinion.get('id')}: {exc}")

        log.info(f"[CourtScraper] Extracted {len(docs)} court documents")
        return docs

    async def _search_opinions(self, cutoff: date) -> list[dict]:
        opinions = []
        params = {
            "q": SEARCH_QUERY,
            "type": "o",
            "date_filed_min": cutoff.isoformat(),
            "court": "ca1,ca2,ca3,ca4,ca5,ca6,ca7,ca8,ca9,ca10,ca11,cadc",
            "page_size": 100,
        }
        try:
            resp = await self._client.get(f"{COURTLISTENER_BASE}/search/", params=params)
            resp.raise_for_status()
            data = resp.json()
            opinions = data.get("results", [])
        except Exception as exc:
            log.warning(f"[CourtScraper] Search failed: {exc}")
        return opinions

    async def _process_opinion(self, opinion: dict) -> dict | None:
        """Fetch full opinion text and build a document dict."""
        opinion_id = opinion.get("id") or opinion.get("cluster_id")
        text = opinion.get("snippet") or opinion.get("text") or ""

        # Fetch full text if not in search result
        if len(text) < 500 and opinion_id:
            try:
                resp = await self._client.get(f"{COURTLISTENER_BASE}/opinions/{opinion_id}/")
                resp.raise_for_status()
                data = resp.json()
                text = data.get("plain_text") or data.get("html_lawbox") or text
            except Exception:
                pass

        if not text or len(text) < 100:
            return None

        # Strip HTML if present
        if "<" in text:
            from bs4 import BeautifulSoup
            text = BeautifulSoup(text, "html.parser").get_text(separator="\n", strip=True)

        content_hash = hashlib.sha256(text.encode()).hexdigest()
        criteria = self._extract_criteria(text)

        title = (
            opinion.get("caseName")
            or opinion.get("case_name")
            or f"Court Opinion {opinion_id}"
        )
        filed_date = opinion.get("dateFiled") or opinion.get("date_filed")

        return {
            "source": "court",
            "source_url": f"https://www.courtlistener.com/?q={opinion_id}",
            "title": title,
            "content": text[:50000],
            "content_hash": content_hash,
            "published_at": filed_date,
            "criteria": criteria,
        }

    def _extract_criteria(self, text: str) -> list[str]:
        text_lower = text.lower()
        found = set()
        for keyword, criterion in CRITERION_KEYWORDS.items():
            if keyword in text_lower:
                found.add(criterion)
        return sorted(found) if found else ["original_contributions"]

    async def close(self):
        await self._client.aclose()
