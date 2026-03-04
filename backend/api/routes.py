"""
Research endpoint for ARIA.

POST /api/v1/research — Initiates the agent pipeline, streams progress via SSE,
and persists the final report to the database.
"""
import asyncio
import json
import re
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
from tools.vector import save_report_chunks
from models import get_token_tracker


def _extract_title(report_content: str, fallback_query: str) -> str:
    """Extract a clean title from the report's first markdown heading."""
    # Find all headers (H1 to H3)
    matches = re.findall(r'^#{1,3}\s+(.+)', report_content, re.MULTILINE)
    
    generic_titles = {
        "executive summary", "introduction", "overview", "summary", 
        "background", "findings", "analysis", "report", "conclusion", 
        "conclusions & recommendations", "intelligence report"
    }
    
    for title in matches:
        # Remove bold markers
        clean_title = re.sub(r'\*+', '', title).strip()
        if clean_title.lower() not in generic_titles:
            return clean_title[:300]

    # Fallback: first sentence of the query
    first_sentence = fallback_query.split('.')[0].strip()
    return first_sentence[:300] if first_sentence else fallback_query[:300]

router = APIRouter()


class ResearchRequest(BaseModel):
    query: str
    domain: str
    focus_prompt: str = ""


async def _derive_topic(query: str, provided_domain: str) -> str:
    """Derive a 2-3 word topic classification for the query."""
    if provided_domain and provided_domain.lower() not in ["general", "none", "", "null"]:
        # Frontend might still send legacy domains or specific tags
        return provided_domain
    
    from models import get_llm
    from langchain_core.messages import HumanMessage
    
    try:
        llm = get_llm()
        prompt = f"Given the research query: '{query}', generate a 2-3 word broad topic classification (e.g., 'Quantum Computing', 'European History', 'Biotech Markets'). Return ONLY the topic string, no quotes or prefix."
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        topic = response.content.strip().replace('"', '').replace("'", "").title()
        return topic[:50]
    except Exception as e:
        print(f"Failed to derive topic: {e}")
        return "General Intelligence"


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
        "focus_prompt": request.focus_prompt or "",
        "sub_tasks": [],
        "search_results": [],
        "scraped_content": [],
        "sources": [],
        "metadata": {"source": "api_request", "focus_prompt": request.focus_prompt},
    }

    start_time = time.time()
    final_report = None
    sources = []
    is_cache_hit = False
    query_embedding = None

    # Reset token tracker for this request
    tracker = get_token_tracker()
    tracker.reset()

    try:
        async for output in research_graph.astream(initial_state):
            for node_name, state_update in output.items():

                # Handle errors from critical nodes only — researcher errors are recoverable
                # and must NOT abort the stream before the report is saved.
                if "error" in state_update and state_update["error"] and not final_report:
                    # Only fatal if it's an unrecoverable node (writer/planner/analyst fully failed)
                    is_fatal = node_name in ("writer", "planner", "analyst") and not state_update.get("final_report")
                    if is_fatal:
                        error_payload = {
                            "event": "error",
                            "data": {"message": state_update["error"]},
                        }
                        yield f"data: {json.dumps(error_payload)}\n\n"
                        return
                    else:
                        # Non-fatal (e.g. researcher) — log as warning event but keep going
                        warn_payload = {
                            "event": "warning",
                            "data": {"message": state_update["error"]},
                        }
                        yield f"data: {json.dumps(warn_payload)}\n\n"

                # Notify UI of node progression
                if node_name in ["memory", "planner", "researcher", "analyst"]:
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
                        
                    if node_name == "memory":
                        if "cache_hit" in state_update:
                            is_cache_hit = state_update["cache_hit"]
                        if "query_embedding" in state_update:
                            query_embedding = state_update["query_embedding"] if state_update["query_embedding"] else None

                # Memory or Writer produces final report
                if node_name in ["memory", "writer"] and "final_report" in state_update:
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
                title=_extract_title(final_report, request.query),
                domain=request.domain,
                content=final_report,
                query_embedding=query_embedding if query_embedding else None,
                sources={"items": sources} if sources else None,
                generation_time_ms=elapsed_ms,
                token_count=tracker.total or None,
            )
            db.add(report)

            # Increment user's monthly counter
            user.reports_this_month += 1
            await db.commit()
            await db.refresh(report)

            # Embed report chunks into vector store (background, non-blocking)
            # Skip if it is a cache hit to avoid duplicating the same literal text in RAG DB
            if not is_cache_hit:
                try:
                    chunks_saved = await save_report_chunks(
                        report_id=report.id,
                        user_id=user.id,
                        domain=request.domain,
                        report_content=final_report,
                    )
                    print(f"  [Vector] Saved {chunks_saved} report chunks for future RAG")
                except Exception as vec_err:
                    print(f"  [Vector] Chunk save failed (non-fatal): {vec_err}")

            # Notify frontend of saved report ID
            save_payload = {
                "event": "saved",
                "data": {"report_id": str(report.id)},
            }
            yield f"data: {json.dumps(save_payload)}\n\n"

        except Exception as e:
            print(f"[ERROR] Failed to save report to database: {e}")
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

    # We no longer validate against a strict list of domains
    # if request.domain not in VALID_DOMAINS:
    #     raise HTTPException(status_code=400, detail="INVALID_DOMAIN")

    if len(request.query) < 10:
        raise HTTPException(status_code=400, detail="QUERY_TOO_SHORT")

    # Quickly derive a dynamic topic if the UI passes "General" or nothing
    dynamic_topic = await _derive_topic(request.query, request.domain)
    request.domain = dynamic_topic

    # Get user and enforce plan limits
    user = await get_or_create_user(clerk_id, db)
    await _enforce_plan_limit(user, db)

    return StreamingResponse(
        stream_agent(request, user, db),
        media_type="text/event-stream",
    )
