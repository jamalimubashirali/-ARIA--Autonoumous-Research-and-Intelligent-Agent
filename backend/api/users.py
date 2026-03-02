"""
User management endpoints for ARIA.

Provides usage tracking and plan information.
"""
from datetime import date

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel

from db.session import get_db
from db.models import User

router = APIRouter(prefix="/user", tags=["user"])

# Plan limits (reports per month)
PLAN_LIMITS = {
    "free": 3,
    "starter": 50,
    "pro": -1,         # unlimited
    "enterprise": -1,  # unlimited
}


class UsageResponse(BaseModel):
    plan: str
    reports_this_month: int
    reports_limit: int  # -1 = unlimited
    usage_reset_date: str
    can_generate: bool


class UserSyncRequest(BaseModel):
    email: str
    full_name: str | None = None


def _require_user(request: Request) -> str:
    user_id = getattr(request.state, "user", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")
    return user_id


async def get_or_create_user(clerk_id: str, db: AsyncSession) -> User:
    """Get user by clerk_id or create a new one."""
    stmt = select(User).where(User.clerk_id == clerk_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            clerk_id=clerk_id,
            email=f"{clerk_id}@pending.aria",
            plan="free",
            reports_this_month=0,
            usage_reset_date=date.today(),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get current user's plan and usage stats."""
    clerk_id = _require_user(request)
    user = await get_or_create_user(clerk_id, db)

    # Auto-reset counter if past reset date
    if user.usage_reset_date < date.today():
        user.reports_this_month = 0
        # Set reset date to 1st of next month
        today = date.today()
        if today.month == 12:
            user.usage_reset_date = date(today.year + 1, 1, 1)
        else:
            user.usage_reset_date = date(today.year, today.month + 1, 1)
        await db.commit()
        await db.refresh(user)

    limit = PLAN_LIMITS.get(user.plan, 3)
    can_generate = limit == -1 or user.reports_this_month < limit

    return UsageResponse(
        plan=user.plan,
        reports_this_month=user.reports_this_month,
        reports_limit=limit,
        usage_reset_date=user.usage_reset_date.isoformat(),
        can_generate=can_generate,
    )


@router.post("/sync")
async def sync_user(
    body: UserSyncRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Sync user profile data from Clerk (called from frontend after auth)."""
    clerk_id = _require_user(request)
    user = await get_or_create_user(clerk_id, db)

    user.email = body.email
    if body.full_name:
        user.full_name = body.full_name
    await db.commit()

    return {"status": "synced", "user_id": str(user.id)}
