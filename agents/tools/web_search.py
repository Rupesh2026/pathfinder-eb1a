import logging
import os
from typing import Any, List, Optional

import httpx

log = logging.getLogger(__name__)


async def web_search(
    query: str,
    num_results: int = 5,
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
    time_range: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Search the web using Tavily and return a list of {title, url, snippet} dicts.

    Args:
        query: The search query string.
        num_results: Maximum number of results to return (default 5).
        include_domains: Only return results from these domains (e.g. ["ieee.org", "acm.org"]).
        exclude_domains: Never return results from these domains (e.g. ["linkedin.com", "reddit.com"]).
        time_range: Recency filter — one of "day", "week", "month", "year". Omit for no filter.

    Returns:
        List of dicts with keys: title, url, snippet.
    """
    api_key = os.getenv("TAVILY_API_KEY")
    log.info(
        "web_search called: query=%r num_results=%d include=%s exclude=%s time_range=%s key_present=%s",
        query, num_results, include_domains, exclude_domains, time_range, bool(api_key),
    )
    if not api_key:
        log.warning("TAVILY_API_KEY not set — skipping web search")
        return []

    # Gemini function-calling may pass a comma-string instead of a list
    if isinstance(include_domains, str):
        include_domains = [d.strip() for d in include_domains.split(",") if d.strip()]
    if isinstance(exclude_domains, str):
        exclude_domains = [d.strip() for d in exclude_domains.split(",") if d.strip()]

    payload: dict[str, Any] = {
        "api_key": api_key,
        "query": query,
        "max_results": num_results,
        "search_depth": "advanced",
    }
    if include_domains:
        payload["include_domains"] = include_domains
    if exclude_domains:
        payload["exclude_domains"] = exclude_domains
    if time_range:
        payload["time_range"] = time_range

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("content", ""),
        })
    return results
