import re
from models.analysis import HeuristicMatch, Severity

CLAUSE_CHECKS: list[dict] = [
    {
        "category": "auto_renewal",
        "label": "Auto-Renewal",
        "patterns": [r"auto.?renew", r"automatically\s+renew", r"recurring\s+charge", r"auto.?bill"],
        "severity": Severity.WARNING,
    },
    {
        "category": "cancellation_friction",
        "label": "Cancellation Friction",
        "patterns": [r"cancel\w*\s+in\s+writing", r"cancel\w*\s+by\s+phone", r"30.?day\s+notice", r"cancel\w*\s+fee", r"early\s+termination\s+fee"],
        "severity": Severity.WARNING,
    },
    {
        "category": "binding_arbitration",
        "label": "Binding Arbitration",
        "patterns": [r"binding\s+arbitration", r"waive\s+\w+\s+class\s+action", r"individual\s+basis", r"class.?action\s+waiver", r"arbitrat\w+\s+agreement"],
        "severity": Severity.CRITICAL,
    },
    {
        "category": "content_license",
        "label": "Broad Content License",
        "patterns": [r"perpetual\s+license", r"irrevocable\s+right", r"worldwide\s+license", r"royalty.free\s+license", r"sublicens\w+\s+right"],
        "severity": Severity.WARNING,
    },
    {
        "category": "unilateral_changes",
        "label": "Unilateral Changes",
        "patterns": [r"change\s+\w+\s+any\s+time", r"modify\s+without\s+notice", r"sole\s+discretion", r"right\s+to\s+modify", r"amend\s+these\s+terms"],
        "severity": Severity.WARNING,
    },
    {
        "category": "data_sharing",
        "label": "Data Sharing/Sale",
        "patterns": [r"share\s+\w+\s+third\s+part", r"sell\s+\w+\s+personal", r"data\s+broker", r"advertising\s+partner", r"monetiz\w+\s+data"],
        "severity": Severity.CRITICAL,
    },
    {
        "category": "sensitive_data",
        "label": "Sensitive Data Collection",
        "patterns": [r"biometric", r"health\s+data", r"genetic", r"racial", r"sexual\s+orientation", r"religious\s+belief"],
        "severity": Severity.CRITICAL,
    },
    {
        "category": "location_tracking",
        "label": "Location Tracking",
        "patterns": [r"location\s+data", r"\bgps\b", r"geolocation", r"precise\s+location", r"device\s+location"],
        "severity": Severity.WARNING,
    },
    {
        "category": "data_retention",
        "label": "Data Retention",
        "patterns": [r"retain\s+indefinite", r"store\s+\w+\s+necessary", r"keep\s+\w+\s+data", r"retention\s+period", r"retain\s+\w+\s+information"],
        "severity": Severity.INFO,
    },
    {
        "category": "third_party_processors",
        "label": "Third-Party Processors",
        "patterns": [r"sub.?processor", r"service\s+provider", r"third\s+party\s+process", r"external\s+vendor"],
        "severity": Severity.INFO,
    },
    {
        "category": "liability_limits",
        "label": "Liability Limitations",
        "patterns": [r"limitation\s+of\s+liability", r"no\s+event\s+\w+\s+liable", r"aggregate\s+liability", r"shall\s+not\s+exceed", r"in\s+no\s+case\s+\w+\s+liable"],
        "severity": Severity.WARNING,
    },
    {
        "category": "refund_restrictions",
        "label": "Refund Restrictions",
        "patterns": [r"no\s+refund", r"non.?refundable", r"final\s+sale", r"restocking\s+fee", r"all\s+sales\s+\w+\s+final"],
        "severity": Severity.WARNING,
    },
    {
        "category": "account_termination",
        "label": "Account Termination",
        "patterns": [r"terminate\s+\w+\s+account\s+\w+\s+any\s+reason", r"suspend\s+\w+\s+sole\s+discretion", r"deactivate\s+without\s+notice"],
        "severity": Severity.WARNING,
    },
    {
        "category": "indemnification",
        "label": "Indemnification",
        "patterns": [r"indemnif", r"hold\s+harmless", r"defend\s+at\s+your\s+\w*\s*cost"],
        "severity": Severity.WARNING,
    },
    {
        "category": "jurisdiction",
        "label": "Jurisdiction",
        "patterns": [r"governing\s+law", r"exclusive\s+jurisdiction", r"venue\s+shall"],
        "severity": Severity.INFO,
    },
    {
        "category": "force_majeure",
        "label": "Force Majeure",
        "patterns": [r"force\s+majeure", r"act\s+of\s+god", r"beyond\s+\w+\s+control"],
        "severity": Severity.INFO,
    },
    {
        "category": "survival_clauses",
        "label": "Survival Clauses",
        "patterns": [r"survive\s+termination", r"obligations\s+\w+\s+continue"],
        "severity": Severity.INFO,
    },
    {
        "category": "ip_assignment",
        "label": "IP Assignment",
        "patterns": [r"assign\s+\w+\s+intellectual", r"transfer\s+\w+\s+ownership", r"work\s+for\s+hire", r"assign\s+all\s+rights"],
        "severity": Severity.CRITICAL,
    },
    {
        "category": "non_compete",
        "label": "Non-Compete",
        "patterns": [r"non.?compete", r"non.?solicit", r"competitive\s+product"],
        "severity": Severity.CRITICAL,
    },
    {
        "category": "marketing_consent",
        "label": "Marketing Consent",
        "patterns": [r"consent\s+\w+\s+market", r"opt.?in\s+\w+\s+communicat", r"promotional\s+email", r"marketing\s+message"],
        "severity": Severity.INFO,
    },
]


def run_heuristics(text: str) -> list[HeuristicMatch]:
    """Run all 20 clause family checks against the policy text."""
    results: list[HeuristicMatch] = []
    text_lower = text.lower()

    for check in CLAUSE_CHECKS:
        snippets: list[str] = []
        for pattern in check["patterns"]:
            for match in re.finditer(pattern, text_lower):
                start = max(0, match.start() - 80)
                end = min(len(text), match.end() + 80)
                snippet = text[start:end].strip()
                if snippet not in snippets:
                    snippets.append(snippet)

        matched = len(snippets) > 0
        confidence = min(1.0, len(snippets) * 0.3 + (0.4 if matched else 0.0))

        results.append(
            HeuristicMatch(
                category=check["category"],
                matched=matched,
                snippets=snippets[:3],
                confidence=confidence,
                severity=check["severity"] if matched else Severity.INFO,
            )
        )

    return results


def format_heuristics_for_prompt(matches: list[HeuristicMatch]) -> str:
    """Format heuristic results as text for the LLM prompt."""
    lines: list[str] = []
    for m in matches:
        if m.matched:
            lines.append(
                f"- [{m.severity.value.upper()}] {m.category}: "
                f"found {len(m.snippets)} match(es), confidence={m.confidence:.1f}"
            )
            for s in m.snippets[:2]:
                lines.append(f'  Snippet: "...{s}..."')
    if not lines:
        lines.append("- No heuristic matches found.")
    return "\n".join(lines)
