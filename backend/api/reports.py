"""
Report CRUD endpoints for ARIA.

All endpoints require Clerk JWT authentication (enforced by auth middleware).
User ID comes from request.state.user (Clerk sub claim).
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_
from pydantic import BaseModel, Field

from db.session import get_db
from db.models import Report, User, ReportChunk

router = APIRouter(prefix="/reports", tags=["reports"])


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class ReportOut(BaseModel):
    id: str
    query: str
    domain: str
    content: str
    sources: dict | None = None
    token_count: int | None = None
    generation_time_ms: int | None = None
    rating: int | None = None
    rating_comment: str | None = None
    created_at: str

    model_config = {"from_attributes": True}


class ReportListItem(BaseModel):
    id: str
    query: str
    domain: str
    created_at: str
    rating: int | None = None

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    data: list[ReportListItem]
    total: int
    page: int
    limit: int


class RateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


# ---------------------------------------------------------------------------
# Helper: get or create user from Clerk ID
# ---------------------------------------------------------------------------
async def get_or_create_user(clerk_id: str, db: AsyncSession) -> User:
    """Look up user by clerk_id; create if not exists."""
    stmt = select(User).where(User.clerk_id == clerk_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            clerk_id=clerk_id,
            email=f"{clerk_id}@pending.aria",  # Will be updated on first sync
            plan="free",
            reports_this_month=0,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


def _require_user(request: Request) -> str:
    """Extract Clerk user ID from request state set by auth middleware."""
    user_id = getattr(request.state, "user", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")
    return user_id


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("", response_model=ReportListResponse)
async def list_reports(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    domain: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List reports for the authenticated user with pagination and domain filter."""
    clerk_id = _require_user(request)
    user = await get_or_create_user(clerk_id, db)

    # Build query
    base_q = select(Report).where(
        and_(Report.user_id == user.id, Report.deleted_at.is_(None))
    )
    if domain:
        base_q = base_q.where(Report.domain == domain)

    # Count total
    count_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(count_q)).scalar()

    # Paginate
    offset = (page - 1) * limit
    data_q = base_q.order_by(Report.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(data_q)
    reports = result.scalars().all()

    return ReportListResponse(
        data=[
            ReportListItem(
                id=str(r.id),
                query=r.query,
                domain=r.domain,
                created_at=r.created_at.isoformat(),
                rating=r.rating,
            )
            for r in reports
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(
    report_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get a single report by ID (scoped to user)."""
    clerk_id = _require_user(request)
    user = await get_or_create_user(clerk_id, db)

    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_REPORT_ID")

    stmt = select(Report).where(
        and_(Report.id == rid, Report.user_id == user.id, Report.deleted_at.is_(None))
    )
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="REPORT_NOT_FOUND")

    return ReportOut(
        id=str(report.id),
        query=report.query,
        domain=report.domain,
        content=report.content,
        sources=report.sources,
        token_count=report.token_count,
        generation_time_ms=report.generation_time_ms,
        rating=report.rating,
        rating_comment=report.rating_comment,
        created_at=report.created_at.isoformat(),
    )


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a report (set deleted_at timestamp)."""
    clerk_id = _require_user(request)
    user = await get_or_create_user(clerk_id, db)

    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_REPORT_ID")

    stmt = (
        update(Report)
        .where(and_(Report.id == rid, Report.user_id == user.id))
        .values(deleted_at=datetime.utcnow())
    )
    result = await db.execute(stmt)
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="REPORT_NOT_FOUND")

    return {"status": "deleted"}


@router.post("/{report_id}/rate")
async def rate_report(
    report_id: str,
    body: RateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Rate a report 1-5 stars with optional comment."""
    clerk_id = _require_user(request)
    user = await get_or_create_user(clerk_id, db)

    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_REPORT_ID")

    stmt = (
        update(Report)
        .where(and_(Report.id == rid, Report.user_id == user.id))
        .values(rating=body.rating, rating_comment=body.comment)
    )
    result = await db.execute(stmt)
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="REPORT_NOT_FOUND")

    return {"status": "rated", "rating": body.rating}
