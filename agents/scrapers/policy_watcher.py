"""
Watches USCIS Policy Manual Volume 6 Part F (EB-1) for content changes.
Source: https://www.uscis.gov/policy-manual/volume-6-part-f
"""

import hashlib
import logging

import httpx
from bs4 import BeautifulSoup

from scrapers.aao_scraper import CRITERION_KEYWORDS

log = logging.getLogger(__name__)

POLICY_CHAPTERS = [
    "https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-1",
    "https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-2",
    "https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-3",
    "https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-4",
    "https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-5",
]


class PolicyWatcher:
    def __init__(self):
        self._client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; EB1A-Research/1.0)"},
        )

    async def scrape(self, years_back: int = 2) -> list[dict]:
        """
        Fetch USCIS policy manual chapters. Returns one document per chapter.
        The years_back parameter is unused here — policy content is always current.
        """
        docs = []
        for url in POLICY_CHAPTERS:
            try:
                doc = await self._fetch_chapter(url)
                if doc:
                    docs.append(doc)
            except Exception as exc:
                log.warning(f"[PolicyWatcher] Failed to fetch {url}: {exc}")
        log.info(f"[PolicyWatcher] Fetched {len(docs)} policy chapters")
        return docs

    async def _fetch_chapter(self, url: str) -> dict | None:
        resp = await self._client.get(url)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Extract the main content area
        main = (
            soup.find("main")
            or soup.find("article")
            or soup.find("div", class_="field-body")
            or soup.find("div", id="content")
        )
        if not main:
            return None

        # Remove nav/breadcrumb noise
        for tag in main.find_all(["nav", "header", "footer", "script", "style"]):
            tag.decompose()

        text = main.get_text(separator="\n", strip=True)
        if len(text) < 100:
            return None

        content_hash = hashlib.sha256(text.encode()).hexdigest()

        title_tag = soup.find("h1") or soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else "USCIS Policy Manual"

        criteria = self._extract_criteria(text)

        return {
            "source": "uscis_policy",
            "source_url": url,
            "title": title,
            "content": text[:50000],
            "content_hash": content_hash,
            "published_at": None,
            "criteria": criteria,
        }

    def _extract_criteria(self, text: str) -> list[str]:
        text_lower = text.lower()
        found = set()
        for keyword, criterion in CRITERION_KEYWORDS.items():
            if keyword in text_lower:
                found.add(criterion)
        return sorted(found)

    async def close(self):
        await self._client.aclose()
