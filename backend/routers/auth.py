from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models.user import Tier, UserStatusResponse, UpgradeRequest
from services.user_store import user_store
from services.billing import create_customer, create_checkout_session, create_portal_session
from utils.auth import create_token, require_auth

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    client_id: str


class RegisterResponse(BaseModel):
    client_id: str
    tier: str
    token: str
    message: str


class UpgradeResponse(BaseModel):
    checkout_url: str


class PortalRequest(BaseModel):
    return_url: str = "https://plain-terms.app"


class PortalResponse(BaseModel):
    portal_url: str


@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """Register an anonymous user (or return existing). Returns a JWT for future requests."""
    user = user_store.get_or_create(request.client_id)
    token = create_token(user.client_id)
    return RegisterResponse(
        client_id=user.client_id,
        tier=user.tier.value,
        token=token,
        message="registered",
    )


@router.get("/status", response_model=UserStatusResponse)
async def get_status(client_id: str = Depends(require_auth)):
    """Get the current user's tier, usage, and subscription status."""
    user = user_store.get_or_create(client_id)
    user.reset_if_needed()
    return UserStatusResponse(
        client_id=user.client_id,
        tier=user.tier,
        subscription_status=user.subscription_status,
        quick_scans_used_today=user.quick_scans_today,
        quick_scans_limit_today=int(user.quick_limit) if user.quick_limit != float("inf") else 999,
        deep_scans_used_this_month=user.deep_scans_this_month,
        deep_scans_limit_this_month=int(user.deep_limit) if user.deep_limit != float("inf") else 999,
        has_payment_method=user.stripe_customer_id is not None,
    )


@router.post("/upgrade", response_model=UpgradeResponse)
async def upgrade(request: UpgradeRequest, client_id: str = Depends(require_auth)):
    """Create a Stripe Checkout session for upgrading to Pro."""
    user = user_store.get_or_create(client_id)

    if user.tier == Tier.PRO:
        raise HTTPException(status_code=400, detail="Already on Pro tier")

    if user.tier == Tier.ENTERPRISE:
        raise HTTPException(status_code=400, detail="Already on Enterprise tier")

    if not user.stripe_customer_id:
        customer_id = await create_customer(client_id)
        user.stripe_customer_id = customer_id
        user_store.save(user)
    else:
        customer_id = user.stripe_customer_id

    try:
        checkout_url = await create_checkout_session(
            customer_id=customer_id,
            price_id="",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            client_id=client_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return UpgradeResponse(checkout_url=checkout_url)


@router.post("/portal", response_model=PortalResponse)
async def billing_portal(request: PortalRequest, client_id: str = Depends(require_auth)):
    """Get a Stripe Customer Portal URL for managing subscription."""
    user = user_store.get_by_client_id(client_id)
    if not user or not user.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No billing account found. Upgrade first.")

    portal_url = await create_portal_session(user.stripe_customer_id, request.return_url)
    return PortalResponse(portal_url=portal_url)
