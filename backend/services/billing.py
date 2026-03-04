import os
from typing import Optional

import stripe


def _configure_stripe() -> None:
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")


PRO_PRICE_ID = os.environ.get("STRIPE_PRO_PRICE_ID", "")


async def create_customer(client_id: str, metadata: Optional[dict] = None) -> str:
    """Create a Stripe customer and return the customer ID."""
    _configure_stripe()
    customer = stripe.Customer.create(
        metadata={"client_id": client_id, **(metadata or {})},
    )
    return customer.id


async def create_checkout_session(
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    client_id: str,
) -> str:
    """Create a Stripe Checkout session and return the URL."""
    _configure_stripe()
    price = price_id or PRO_PRICE_ID
    if not price:
        raise ValueError("STRIPE_PRO_PRICE_ID not configured")

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price, "quantity": 1}],
        success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={"client_id": client_id},
        subscription_data={"metadata": {"client_id": client_id}},
    )
    return session.url


async def create_portal_session(customer_id: str, return_url: str) -> str:
    """Create a Stripe Customer Portal session for managing billing."""
    _configure_stripe()
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return session.url


async def cancel_subscription(subscription_id: str) -> None:
    """Cancel a subscription at period end."""
    _configure_stripe()
    stripe.Subscription.modify(
        subscription_id,
        cancel_at_period_end=True,
    )


def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    """Verify and construct a Stripe webhook event."""
    _configure_stripe()
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        raise ValueError("STRIPE_WEBHOOK_SECRET not configured")
    return stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
