import json
import os
from typing import AsyncGenerator
from openai import AsyncOpenAI
from models.analysis import HeuristicMatch


_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
    return _client


SYSTEM_PROMPT = """You are PlainTerms, a legal policy analyzer that helps everyday people understand legal documents.

TASK: Analyze the provided policy text and produce a structured assessment.

PRE-SCAN RESULTS (heuristic checks already found these patterns):
{heuristic_results}

INSTRUCTIONS:
1. Confirm or override each heuristic finding with full context analysis.
2. Identify additional concerns not caught by heuristics.
3. Find user-friendly or positive clauses.
4. Produce a risk score 1-10 with a brief explanation.
5. Write a plain English summary (3-4 sentences, 8th grade reading level).

OUTPUT FORMAT: You MUST respond with exactly the JSON blocks listed below, each on its own line, prefixed by its type tag. Do not include any other text.

RISK_SCORE: {{"score": <number 1-10>, "level": "<high|medium|low>", "explanation": "<1-2 sentences>"}}
RED_FLAG: {{"category": "<category_name>", "severity": "<critical|warning|info>", "confidence": "<high|medium|low>", "title": "<short title>", "snippet": "<quoted text from policy>", "why": "<plain English explanation>", "action": "<what user should do>", "section_ref": "<section reference if found>"}}
PRO: {{"title": "<short title>", "snippet": "<quoted text>", "section_ref": "<section reference>"}}
WATCH_OUT: {{"title": "<short title>", "snippet": "<quoted text>", "section_ref": "<section reference>"}}
SUMMARY: {{"text": "<3-4 sentence plain English summary>"}}
RECEIPT: {{"section": "<section reference>", "quote": "<exact quote>", "context": "<what this relates to>"}}

Output one RISK_SCORE, then all RED_FLAGs (most severe first), then PROs, then WATCH_OUTs, then one SUMMARY, then RECEIPTs.
Each output block must be valid JSON on a single line, prefixed by the type tag and a colon.
"""


async def stream_llm_analysis(
    policy_text: str,
    policy_type: str,
    heuristic_results: str,
) -> AsyncGenerator[tuple[str, dict], None]:
    """Stream LLM analysis, yielding (event_type, parsed_data) tuples."""
    client = _get_client()

    prompt = f"Analyze this {policy_type} policy:\n\n{policy_text[:80000]}"
    system = SYSTEM_PROMPT.format(heuristic_results=heuristic_results)

    stream = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=4096,
        stream=True,
    )

    buffer = ""
    red_flag_counter = 0
    pro_counter = 0
    watch_out_counter = 0

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta is None:
            continue

        buffer += delta
        while "\n" in buffer:
            line, buffer = buffer.split("\n", 1)
            line = line.strip()
            if not line:
                continue

            event_type, data = _parse_line(line)
            if event_type and data:
                if event_type == "red_flag":
                    red_flag_counter += 1
                    data["id"] = red_flag_counter
                elif event_type == "pro":
                    pro_counter += 1
                    data["id"] = pro_counter
                elif event_type == "watch_out":
                    watch_out_counter += 1
                    data["id"] = watch_out_counter
                yield event_type, data

    if buffer.strip():
        event_type, data = _parse_line(buffer.strip())
        if event_type and data:
            yield event_type, data


TAG_MAP = {
    "RISK_SCORE": "risk_score",
    "RED_FLAG": "red_flag",
    "PRO": "pro",
    "WATCH_OUT": "watch_out",
    "SUMMARY": "summary",
    "RECEIPT": "receipt",
}


def _parse_line(line: str) -> tuple[str | None, dict | None]:
    """Parse a tagged JSON line from the LLM output."""
    for tag, event_type in TAG_MAP.items():
        prefix = f"{tag}:"
        if line.startswith(prefix):
            json_str = line[len(prefix):].strip()
            try:
                return event_type, json.loads(json_str)
            except json.JSONDecodeError:
                return None, None
    return None, None
