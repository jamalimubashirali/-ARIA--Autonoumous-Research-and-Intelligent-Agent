"""
Research endpoint for ARIA.

POST /api/v1/research — Initiates the agent pipeline, streams progress via SSE,
and persists the final report to the database.
"""
import json
import time

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from agents.graph import research_graph
from db.session import get_db
from db.models import Report, User
from api.reports import get_or_create_user
from api.users import PLAN_LIMITS

router = APIRouter()


class ResearchRequest(BaseModel):
    query: str
    domain: str
    focus_prompt: str = ""


VALID_DOMAINS = ["sales", "finance", "healthcare", "legal", "sports"]


async def _enforce_plan_limit(user: User, db: AsyncSession):
    """Check if user has hit their monthly report limit."""
    from datetime import date

    # Auto-reset if past the reset date
    if user.usage_reset_date < date.today():
        user.reports_this_month = 0
        today = date.today()
        if today.month == 12:
            user.usage_reset_date = date(today.year + 1, 1, 1)
        else:
            user.usage_reset_date = date(today.year, today.month + 1, 1)
        await db.commit()
        await db.refresh(user)

    limit = PLAN_LIMITS.get(user.plan, 3)
    if limit != -1 and user.reports_this_month >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"PLAN_LIMIT_REACHED — {user.plan} plan allows {limit} reports/month",
        )


async def stream_agent(request: ResearchRequest, user: User, db: AsyncSession):
    """Stream agent execution progress via SSE and persist the final report."""
    initial_state = {
        "query": request.query,
        "domain": request.domain,
        "sub_tasks": [],
        "search_results": [],
        "scraped_content": [],
        "metadata": {"source": "api_request", "focus_prompt": request.focus_prompt},
    }

    start_time = time.time()
    final_report = None
    sources = []

    try:
        async for output in research_graph.astream(initial_state):
            for node_name, state_update in output.items():

                # Handle errors from any node
                if "error" in state_update and state_update["error"]:
                    error_payload = {
                        "event": "error",
                        "data": {"message": state_update["error"]},
                    }
                    yield f"data: {json.dumps(error_payload)}\n\n"
                    return

                # Notify UI of node progression
                if node_name in ["planner", "researcher", "analyst"]:
                    event_payload = {
                        "event": "node_complete",
                        "data": {"node": node_name},
                    }
                    yield f"data: {json.dumps(event_payload)}\n\n"

                    # Collect sources from researcher
                    if node_name == "researcher" and "search_results" in state_update:
                        sources = [
                            {"title": r.get("title", ""), "url": r.get("url", "")}
                            for r in state_update.get("search_results", [])
                            if r.get("url")
                        ]

                # Writer produces final report
                if node_name == "writer" and "final_report" in state_update:
                    final_report = state_update["final_report"]
                    report_payload = {
                        "event": "report",
                        "data": {"report": final_report},
                    }
                    yield f"data: {json.dumps(report_payload)}\n\n"

    except Exception as e:
        error_payload = {
            "event": "error",
            "data": {"message": f"Agent crashed: {str(e)}"},
        }
        yield f"data: {json.dumps(error_payload)}\n\n"
        return

    # --- Persist report to database ---
    if final_report:
        elapsed_ms = int((time.time() - start_time) * 1000)
        try:
            report = Report(
                user_id=user.id,
                query=request.query,
                domain=request.domain,
                content=final_report,
                sources={"items": sources} if sources else None,
                generation_time_ms=elapsed_ms,
            )
            db.add(report)

            # Increment user's monthly counter
            user.reports_this_month += 1
            await db.commit()

            # Notify frontend of saved report ID
            save_payload = {
                "event": "saved",
                "data": {"report_id": str(report.id)},
            }
            yield f"data: {json.dumps(save_payload)}\n\n"

        except Exception as e:
            # Non-fatal — report was already streamed to user
            err_payload = {
                "event": "warning",
                "data": {"message": f"Report streamed but save failed: {str(e)}"},
            }
            yield f"data: {json.dumps(err_payload)}\n\n"

    # Signal stream end
    yield f"data: {json.dumps({'event': 'done'})}\n\n"


@router.post("/research")
async def run_research(
    request: ResearchRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Start a research session. Streams SSE events and persists the report."""
    # Enforce authentication
    clerk_id = getattr(req.state, "user", None)
    if not clerk_id:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")

    if request.domain not in VALID_DOMAINS:
        raise HTTPException(status_code=400, detail="INVALID_DOMAIN")

    if len(request.query) < 10:
        raise HTTPException(status_code=400, detail="QUERY_TOO_SHORT")

    # Get user and enforce plan limits
    user = await get_or_create_user(clerk_id, db)
    await _enforce_plan_limit(user, db)

    return StreamingResponse(
        stream_agent(request, user, db),
        media_type="text/event-stream",
    )
