from typing import Optional
from services.serper import search_trustpilot, search_bbb


async def get_reputation_snapshot(domain: str) -> Optional[dict]:
    """Fetch basic reputation data for a domain (free tier: Trustpilot + BBB)."""
    trustpilot = await search_trustpilot(domain)
    bbb = await search_bbb(domain)

    if not trustpilot and not bbb:
        return None

    result: dict = {}

    if trustpilot:
        result["trustpilot"] = {
            "rating": trustpilot["rating"],
            "reviewCount": trustpilot["reviewCount"],
        }

    if bbb:
        result["bbb"] = {
            "rating": bbb["rating"],
            "accredited": bbb["accredited"],
        }
        if bbb.get("complaintCount") is not None:
            result["bbb"]["complaintCount"] = bbb["complaintCount"]

    return result
