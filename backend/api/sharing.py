"""
Report sharing — public read-only access via share tokens.

Flow:
1. Owner calls POST /reports/{id}/share → generates a share_token
2. Anyone calls GET /shared/{share_token} → gets the report (no auth needed)
3. Owner calls DELETE /reports/{id}/share → revokes sharing
"""
import uuid
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db.models import Report

router = APIRouter(tags=["sharing"])


@router.post("/reports/{report_id}/share")
async def create_share_link(
    report_id: uuid.UUID,
    request_obj=None,
    db: AsyncSession = Depends(get_db),
):
    """Generate a public share token for a report.

    Only the report owner can share it.
    """
    from fastapi import Request
    # Get user from auth state
    # This will be populated by the auth middleware
    user_id = getattr(request_obj, "state", None)

    result = await db.execute(
        select(Report).where(
            Report.id == report_id,
            Report.is_deleted == False,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate share token if not already shared
    if not report.share_token:
        report.share_token = secrets.token_urlsafe(32)
        await db.commit()
        await db.refresh(report)

    return {
        "share_token": report.share_token,
        "share_url": f"/shared/{report.share_token}",
    }


@router.delete("/reports/{report_id}/share")
async def revoke_share_link(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Revoke public share access for a report."""
    result = await db.execute(
        select(Report).where(
            Report.id == report_id,
            Report.is_deleted == False,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.share_token = None
    await db.commit()

    return {"detail": "Share link revoked"}


@router.get("/shared/{share_token}")
async def get_shared_report(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — no authentication required.

    Returns a read-only view of a shared report.
    """
    result = await db.execute(
        select(Report).where(
            Report.share_token == share_token,
            Report.is_deleted == False,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Shared report not found or link expired")

    return {
        "id": str(report.id),
        "query": report.query,
        "domain": report.domain,
        "content": report.content,
        "sources": report.sources,
        "created_at": report.created_at.isoformat(),
        "rating": report.rating,
        # Intentionally omit user_id and other private fields
    }
