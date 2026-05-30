"""
Scrapes AAO Non-Precedent Decisions for EB-1A (I-140) cases.
Source: https://www.uscis.gov/administrative-appeals/aao-decisions/aao-non-precedent-decisions
"""

import asyncio
import hashlib
import io
import logging
from datetime import date, timedelta

import httpx
import pdfplumber
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

# AAO decision search page — decisions are listed as PDF links
AAO_SEARCH_URL = "https://www.uscis.gov/administrative-appeals/aao-decisions/aao-non-precedent-decisions"

# Maps text found in AAO headings/titles to criterion_type enum values
CRITERION_KEYWORDS: dict[str, str] = {
    "prize": "awards",
    "award": "awards",
    "membership": "memberships",
    "association": "memberships",
    "press": "press",
    "media": "press",
    "judg": "judging",
    "panel": "judging",
    "review": "judging",
    "peer review": "scholarly_articles",
    "original contribution": "original_contributions",
    "scholarly article": "scholarly_articles",
    "article": "scholarly_articles",
    "exhibition": "artistic_exhibitions",
    "display": "artistic_exhibitions",
    "critical role": "critical_role",
    "leading role": "critical_role",
    "essential capacity": "critical_role",
    "high salary": "high_salary",
    "remuneration": "high_salary",
    "commercial success": "commercial_success",
    "box office": "commercial_success",
}


class AAOScraper:
    def __init__(self):
        self._client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; EB1A-Research/1.0)"},
        )

    async def scrape(self, years_back: int = 2) -> list[dict]:
        """Return list of document dicts for new AAO I-140 EB-1A decisions."""
        cutoff = date.today() - timedelta(days=years_back * 365)
        log.info(f"[AAOScraper] Fetching decisions since {cutoff}")

        pdf_links = await self._fetch_decision_links(cutoff)
        log.info(f"[AAOScraper] Found {len(pdf_links)} candidate PDFs")

        docs = []
        for link in pdf_links:
            await asyncio.sleep(1.0)  # polite rate limit
            try:
                doc = await self._process_pdf(link)
                if doc:
                    docs.append(doc)
            except Exception as exc:
                log.warning(f"[AAOScraper] Failed to process {link}: {exc}")

        log.info(f"[AAOScraper] Extracted {len(docs)} documents")
        return docs

    async def _fetch_decision_links(self, cutoff: date) -> list[str]:
        """Scrape the AAO search page for I-140 EB-1A PDF links."""
        links = []
        try:
            resp = await self._client.get(AAO_SEARCH_URL)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.endswith(".pdf") and ("I-140" in href or "extraordinary" in href.lower()):
                    full = href if href.startswith("http") else f"https://www.uscis.gov{href}"
                    links.append(full)

            # If the main page doesn't have direct links, try the JSON API endpoint
            if not links:
                links = await self._fetch_via_api(cutoff)
        except Exception as exc:
            log.warning(f"[AAOScraper] Page fetch failed: {exc}, falling back to API")
            links = await self._fetch_via_api(cutoff)

        return links

    async def _fetch_via_api(self, cutoff: date) -> list[str]:
        """Try the AAO's JSON search API as a fallback."""
        links = []
        try:
            api_url = "https://www.uscis.gov/api/aao/decisions"
            params = {
                "form": "I-140",
                "start": cutoff.isoformat(),
                "limit": 500,
            }
            resp = await self._client.get(api_url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("decisions", data if isinstance(data, list) else []):
                    url = item.get("pdf_url") or item.get("url") or item.get("file")
                    if url:
                        links.append(url)
        except Exception as exc:
            log.warning(f"[AAOScraper] API fallback failed: {exc}")
        return links

    async def _process_pdf(self, url: str) -> dict | None:
        """Download a PDF, extract text, compute hash, extract criteria."""
        resp = await self._client.get(url)
        resp.raise_for_status()

        raw_bytes = resp.content
        content_hash = hashlib.sha256(raw_bytes).hexdigest()

        text = self._extract_pdf_text(raw_bytes)
        if not text or len(text) < 200:
            return None

        # Only process I-140 / EB-1A decisions
        text_lower = text.lower()
        if "extraordinary" not in text_lower and "eb-1" not in text_lower:
            return None

        title = self._extract_title(text)
        published_at = self._extract_date(text)
        criteria = self._extract_criteria(text)

        return {
            "source": "aao",
            "source_url": url,
            "title": title,
            "content": text[:50000],  # cap at 50k chars
            "content_hash": content_hash,
            "published_at": published_at,
            "criteria": criteria,
        }

    def _extract_pdf_text(self, raw_bytes: bytes) -> str:
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages)

    def _extract_title(self, text: str) -> str:
        first_lines = text.strip().splitlines()[:5]
        for line in first_lines:
            line = line.strip()
            if len(line) > 10:
                return line[:200]
        return "AAO Decision"

    def _extract_date(self, text: str) -> str | None:
        import re
        patterns = [
            r"(\w+ \d{1,2},\s*20\d{2})",
            r"(\d{4}-\d{2}-\d{2})",
            r"(\d{1,2}/\d{1,2}/20\d{2})",
        ]
        for pattern in patterns:
            m = re.search(pattern, text[:500])
            if m:
                try:
                    from dateutil import parser as dparser
                    return dparser.parse(m.group(1)).date().isoformat()
                except Exception:
                    pass
        return None

    def _extract_criteria(self, text: str) -> list[str]:
        text_lower = text.lower()
        found = set()
        for keyword, criterion in CRITERION_KEYWORDS.items():
            if keyword in text_lower:
                found.add(criterion)
        return sorted(found)

    async def close(self):
        await self._client.aclose()
