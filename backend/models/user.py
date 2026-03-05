from datetime import datetime, date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Tier(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    NONE = "none"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    TRIALING = "trialing"


TIER_LIMITS = {
    Tier.FREE: {"quick_per_day": 5, "deep_per_month": 0},
    Tier.PRO: {"quick_per_day": 20, "deep_per_month": 50},
    Tier.ENTERPRISE: {"quick_per_day": float("inf"), "deep_per_month": float("inf")},
}


class User(BaseModel):
    client_id: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    tier: Tier = Tier.FREE
    subscription_status: SubscriptionStatus = SubscriptionStatus.NONE
    quick_scans_today: int = 0
    deep_scans_this_month: int = 0
    last_quick_reset: date = Field(default_factory=date.today)
    last_deep_reset: date = Field(default_factory=lambda: date.today().replace(day=1))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def reset_if_needed(self) -> None:
        """Reset daily/monthly counters if the period has rolled over."""
        today = date.today()
        if self.last_quick_reset < today:
            self.quick_scans_today = 0
            self.last_quick_reset = today
        first_of_month = today.replace(day=1)
        if self.last_deep_reset < first_of_month:
            self.deep_scans_this_month = 0
            self.last_deep_reset = first_of_month

    @property
    def quick_limit(self) -> float:
        return TIER_LIMITS[self.tier]["quick_per_day"]

    @property
    def deep_limit(self) -> float:
        return TIER_LIMITS[self.tier]["deep_per_month"]

    @property
    def quick_remaining(self) -> int:
        self.reset_if_needed()
        remaining = self.quick_limit - self.quick_scans_today
        return max(0, int(remaining)) if remaining != float("inf") else 999

    @property
    def deep_remaining(self) -> int:
        self.reset_if_needed()
        remaining = self.deep_limit - self.deep_scans_this_month
        return max(0, int(remaining)) if remaining != float("inf") else 999

    def can_quick_scan(self) -> bool:
        self.reset_if_needed()
        return self.quick_scans_today < self.quick_limit

    def can_deep_scan(self) -> bool:
        self.reset_if_needed()
        return self.deep_scans_this_month < self.deep_limit

    def record_quick_scan(self) -> None:
        self.reset_if_needed()
        self.quick_scans_today += 1

    def record_deep_scan(self) -> None:
        self.reset_if_needed()
        self.deep_scans_this_month += 1


class UserStatusResponse(BaseModel):
    client_id: str
    tier: Tier
    subscription_status: SubscriptionStatus
    quick_scans_used_today: int
    quick_scans_limit_today: int
    deep_scans_used_this_month: int
    deep_scans_limit_this_month: int
    has_payment_method: bool


class UpgradeRequest(BaseModel):
    success_url: str = "https://plain-terms.app/success"
    cancel_url: str = "https://plain-terms.app/cancel"
