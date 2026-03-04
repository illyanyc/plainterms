import logging

from fastapi import APIRouter, Request, HTTPException

from models.user import SubscriptionStatus, Tier
from services.billing import construct_webhook_event
from services.user_store import user_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events for subscription lifecycle."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = construct_webhook_event(payload, sig_header)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {e}")

    event_type = event["type"]
    data = event["data"]["object"]

    match event_type:
        case "checkout.session.completed":
            _handle_checkout_completed(data)

        case "customer.subscription.updated":
            _handle_subscription_updated(data)

        case "customer.subscription.deleted":
            _handle_subscription_deleted(data)

        case "invoice.payment_failed":
            _handle_payment_failed(data)

        case _:
            logger.info(f"Unhandled Stripe event: {event_type}")

    return {"status": "ok"}


def _handle_checkout_completed(session: dict) -> None:
    """User completed checkout -- activate their Pro subscription."""
    client_id = session.get("metadata", {}).get("client_id")
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")

    if not client_id or not customer_id:
        logger.warning("checkout.session.completed missing client_id or customer")
        return

    user_store.upgrade_to_pro(
        client_id=client_id,
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id or "",
    )
    logger.info(f"User {client_id} upgraded to Pro via checkout")


def _handle_subscription_updated(subscription: dict) -> None:
    """Subscription status changed (renewal, past_due, etc.)."""
    customer_id = subscription.get("customer")
    status = subscription.get("status", "")

    status_map = {
        "active": SubscriptionStatus.ACTIVE,
        "past_due": SubscriptionStatus.PAST_DUE,
        "canceled": SubscriptionStatus.CANCELED,
        "trialing": SubscriptionStatus.TRIALING,
        "unpaid": SubscriptionStatus.PAST_DUE,
    }

    mapped_status = status_map.get(status, SubscriptionStatus.NONE)
    user = user_store.update_subscription_status(customer_id, mapped_status)

    if user:
        if mapped_status == SubscriptionStatus.ACTIVE:
            user.tier = Tier.PRO
            user_store.save(user)
        logger.info(f"Subscription updated for customer {customer_id}: {status}")


def _handle_subscription_deleted(subscription: dict) -> None:
    """Subscription was fully canceled/expired."""
    customer_id = subscription.get("customer")
    if customer_id:
        user_store.downgrade_to_free(customer_id)
        logger.info(f"Subscription deleted for customer {customer_id}, downgraded to free")


def _handle_payment_failed(invoice: dict) -> None:
    """Payment failed on an invoice."""
    customer_id = invoice.get("customer")
    if customer_id:
        user_store.update_subscription_status(customer_id, SubscriptionStatus.PAST_DUE)
        logger.info(f"Payment failed for customer {customer_id}")
