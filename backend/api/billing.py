"""
Stripe billing webhook handler for ARIA.

Handles subscription lifecycle events from Stripe and updates
the users/subscriptions tables in Supabase via SQLAlchemy.
"""
import stripe
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from db.session import get_db
from db.models import User, Subscription

router = APIRouter()
stripe.api_key = settings.stripe_secret_key


def _ts_to_datetime(ts: int | None) -> datetime | None:
    """Convert a Unix timestamp to a timezone-aware datetime."""
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc)


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]

    # --- Subscription created or updated ---
    if event_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
    ):
        customer_id = data.get("customer")
        stripe_sub_id = data.get("id")
        status = data.get("status")  # active, past_due, canceled, etc.

        # Extract plan name from metadata or price lookup
        plan_id = data["items"]["data"][0]["plan"]["id"]
        plan_name = data.get("metadata", {}).get("plan_name", "starter")

        # Find the user by stripe_customer_id
        stmt = select(User).where(User.stripe_customer_id == customer_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            # Update user's plan
            user.plan = plan_name

            # Upsert subscription record
            sub_stmt = select(Subscription).where(Subscription.user_id == user.id)
            sub_result = await db.execute(sub_stmt)
            subscription = sub_result.scalar_one_or_none()

            if subscription:
                subscription.stripe_subscription_id = stripe_sub_id
                subscription.plan = plan_name
                subscription.status = status
                subscription.current_period_start = _ts_to_datetime(
                    data.get("current_period_start")
                )
                subscription.current_period_end = _ts_to_datetime(
                    data.get("current_period_end")
                )
            else:
                subscription = Subscription(
                    user_id=user.id,
                    stripe_subscription_id=stripe_sub_id,
                    plan=plan_name,
                    status=status,
                    current_period_start=_ts_to_datetime(
                        data.get("current_period_start")
                    ),
                    current_period_end=_ts_to_datetime(
                        data.get("current_period_end")
                    ),
                )
                db.add(subscription)

            await db.commit()

    # --- Subscription deleted (cancelled) ---
    elif event_type == "customer.subscription.deleted":
        customer_id = data.get("customer")

        stmt = select(User).where(User.stripe_customer_id == customer_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            user.plan = "free"  # Downgrade to free

            sub_stmt = select(Subscription).where(Subscription.user_id == user.id)
            sub_result = await db.execute(sub_stmt)
            subscription = sub_result.scalar_one_or_none()

            if subscription:
                subscription.status = "cancelled"
                subscription.cancelled_at = datetime.now(tz=timezone.utc)

            await db.commit()

    return {"status": "success"}
