import os
from typing import Optional
import httpx

_SERPER_URL = "https://google.serper.dev/search"


async def search(query: str, num_results: int = 5) -> list[dict]:
    """Run a Serper.dev search and return organic results."""
    api_key = os.environ.get("SERPER_API_KEY", "")
    if not api_key:
        return []

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                _SERPER_URL,
                json={"q": query, "num": num_results},
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("organic", [])
        except (httpx.HTTPError, Exception):
            return []


async def search_trustpilot(domain: str) -> Optional[dict]:
    """Search for a domain's Trustpilot page and extract basic info."""
    results = await search(f'"{domain}" site:trustpilot.com', num_results=3)
    for result in results:
        url = result.get("link", "")
        if "trustpilot.com/review" in url:
            snippet = result.get("snippet", "")
            rating = _extract_rating(snippet)
            return {
                "rating": rating,
                "reviewCount": _extract_review_count(snippet),
                "url": url,
            }
    return None


async def search_bbb(domain: str) -> Optional[dict]:
    """Search for a domain's BBB page and extract basic info."""
    results = await search(f'"{domain}" site:bbb.org', num_results=3)
    for result in results:
        url = result.get("link", "")
        if "bbb.org/us/" in url or "bbb.org/ca/" in url:
            snippet = result.get("snippet", "")
            return {
                "rating": _extract_bbb_rating(snippet),
                "accredited": "accredited" in snippet.lower(),
                "complaintCount": _extract_complaint_count(snippet),
                "url": url,
            }
    return None


def _extract_rating(snippet: str) -> float:
    """Extract a numeric rating from a Trustpilot snippet."""
    import re
    match = re.search(r"(\d+\.?\d*)\s*/?\s*5", snippet)
    if match:
        return float(match.group(1))
    match = re.search(r"rated?\s+(\d+\.?\d*)", snippet.lower())
    if match:
        return float(match.group(1))
    return 0.0


def _extract_review_count(snippet: str) -> int:
    import re
    match = re.search(r"([\d,]+)\s+reviews?", snippet.lower())
    if match:
        return int(match.group(1).replace(",", ""))
    return 0


def _extract_bbb_rating(snippet: str) -> str:
    import re
    match = re.search(r"rating:?\s*([A-F][+-]?)", snippet, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return "N/A"


def _extract_complaint_count(snippet: str) -> int | None:
    import re
    match = re.search(r"(\d+)\s+complaint", snippet.lower())
    if match:
        return int(match.group(1))
    return None
