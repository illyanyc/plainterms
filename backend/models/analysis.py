from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class Severity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RiskLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RiskScoreResponse(BaseModel):
    score: float = Field(..., ge=0, le=10)
    max: int = Field(default=10)
    level: RiskLevel
    explanation: str


class RedFlagResponse(BaseModel):
    id: int
    category: str
    severity: Severity
    confidence: Confidence
    title: str
    snippet: str
    why: str
    action: str
    section_ref: str = Field(default="")


class ProResponse(BaseModel):
    id: int
    title: str
    snippet: str
    section_ref: str = Field(default="")


class WatchOutResponse(BaseModel):
    id: int
    title: str
    snippet: str
    section_ref: str = Field(default="")


class SummaryResponse(BaseModel):
    text: str


class ReceiptResponse(BaseModel):
    section: str
    quote: str
    context: str


class ReputationResponse(BaseModel):
    trustpilot: Optional[dict] = None
    bbb: Optional[dict] = None


class DoneResponse(BaseModel):
    cached: bool = False
    processing_time_ms: int = 0


class HeuristicMatch(BaseModel):
    category: str
    matched: bool
    snippets: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    severity: Severity = Severity.INFO
