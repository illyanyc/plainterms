import json
import time
from typing import AsyncGenerator
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse

from models.request import AnalyzeRequest
from services.redactor import redact_pii
from services.heuristics import run_heuristics, format_heuristics_for_prompt
from services.llm import stream_llm_analysis
from services.reputation import get_reputation_snapshot
from services.user_store import user_store
from utils.rate_limiter import burst_limiter
from utils.cache import analysis_cache, reputation_cache
from utils.auth import require_auth

router = APIRouter(prefix="/api/v1", tags=["analysis"])


@router.post("/analyze/quick")
async def analyze_quick(request: AnalyzeRequest, client_id: str = Depends(require_auth)):
    """Quick analysis (Free: 5/day, Pro: 20/day, Enterprise: unlimited)."""
    if not burst_limiter.is_allowed(client_id):
        retry = burst_limiter.retry_after(client_id)
        raise HTTPException(status_code=429, detail=f"Too many requests. Retry after {retry}s")

    user = user_store.get_or_create(client_id)
    if not user.can_quick_scan():
        tier = user.tier.value
        limit = int(user.quick_limit) if user.quick_limit != float("inf") else "unlimited"
        raise HTTPException(
            status_code=429,
            detail=f"Daily quick scan limit reached ({limit}/day on {tier} tier). Upgrade for more.",
        )

    cache_key = analysis_cache.make_key(request.url, request.policy_text)
    cached = analysis_cache.get(cache_key)
    if cached:
        return EventSourceResponse(_stream_cached(cached))

    user.record_quick_scan()
    user_store.save(user)

    return EventSourceResponse(
        _stream_quick_analysis(request, cache_key),
        media_type="text/event-stream",
    )


@router.post("/analyze/deep")
async def analyze_deep(request: AnalyzeRequest, client_id: str = Depends(require_auth)):
    """Deep analysis (Pro: 50/month, Enterprise: unlimited). Free tier blocked."""
    if not burst_limiter.is_allowed(client_id):
        retry = burst_limiter.retry_after(client_id)
        raise HTTPException(status_code=429, detail=f"Too many requests. Retry after {retry}s")

    user = user_store.get_or_create(client_id)
    if not user.can_deep_scan():
        if user.tier.value == "free":
            raise HTTPException(status_code=403, detail="Deep scans require a Pro subscription.")
        limit = int(user.deep_limit) if user.deep_limit != float("inf") else "unlimited"
        raise HTTPException(
            status_code=429,
            detail=f"Monthly deep scan limit reached ({limit}/month). Resets next month.",
        )

    user.record_deep_scan()
    user_store.save(user)

    return EventSourceResponse(
        _stream_quick_analysis(request, None),
        media_type="text/event-stream",
    )


async def _stream_quick_analysis(
    request: AnalyzeRequest,
    cache_key: str | None,
) -> AsyncGenerator[dict, None]:
    start_time = time.time()
    all_events: list[dict] = []

    redacted_text = redact_pii(request.policy_text)
    heuristic_matches = run_heuristics(redacted_text)
    heuristic_prompt = format_heuristics_for_prompt(heuristic_matches)

    domain = urlparse(request.url).hostname or ""
    domain = domain.removeprefix("www.")

    rep_cache_key = f"rep:{domain}"
    reputation = reputation_cache.get(rep_cache_key)
    if reputation is None:
        try:
            reputation = await get_reputation_snapshot(domain)
            if reputation:
                reputation_cache.set(rep_cache_key, reputation)
        except Exception:
            reputation = None

    if reputation:
        event = {"event": "reputation", "data": json.dumps(reputation)}
        all_events.append(event)
        yield event

    # Stream heuristic-only results as red flags before LLM (instant feedback)
    flag_id = 0
    for match in heuristic_matches:
        if match.matched:
            flag_id += 1
            flag_data = {
                "id": flag_id,
                "category": match.category,
                "severity": match.severity.value,
                "confidence": "high" if match.confidence >= 0.7 else "medium",
                "title": match.category.replace("_", " ").title(),
                "snippet": match.snippets[0] if match.snippets else "",
                "why": f"Heuristic pattern detected for {match.category.replace('_', ' ')}",
                "action": "Review this clause carefully",
                "section_ref": "",
            }
            event = {"event": "red_flag", "data": json.dumps(flag_data)}
            all_events.append(event)
            yield event

    try:
        async for event_type, data in stream_llm_analysis(
            redacted_text,
            request.policy_type.value,
            heuristic_prompt,
        ):
            event = {"event": event_type, "data": json.dumps(data)}
            all_events.append(event)
            yield event
    except Exception as e:
        error_event = {
            "event": "error",
            "data": json.dumps({"message": f"LLM analysis unavailable: {str(e)[:200]}"}),
        }
        yield error_event

    elapsed_ms = int((time.time() - start_time) * 1000)
    done_event = {"event": "done", "data": json.dumps({"cached": False, "processing_time_ms": elapsed_ms})}
    all_events.append(done_event)
    yield done_event

    if cache_key:
        analysis_cache.set(cache_key, all_events)


async def _stream_cached(events: list[dict]) -> AsyncGenerator[dict, None]:
    for event in events:
        if event.get("event") == "done":
            yield {"event": "done", "data": json.dumps({"cached": True, "processing_time_ms": 0})}
        else:
            yield event
