from pydantic import BaseModel, Field
from enum import Enum


class PolicyType(str, Enum):
    PRIVACY = "privacy"
    TERMS = "terms"
    COOKIE = "cookie"
    REFUND = "refund"
    OTHER = "other"


class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="URL of the policy page")
    policy_text: str = Field(..., max_length=100_000, description="Extracted policy text")
    policy_type: PolicyType = Field(default=PolicyType.OTHER, description="Type of policy")
    client_id: str = Field(..., description="Anonymous client identifier for rate limiting")
