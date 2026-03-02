import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.graph import research_graph

router = APIRouter()

class ResearchRequest(BaseModel):
    query: str
    domain: str
    focus_prompt: str = ""

async def stream_agent(request: ResearchRequest):
    # Setup initial state
    initial_state = {
        "query": request.query,
        "domain": request.domain,
        "sub_tasks": [],
        "search_results": [],
        "scraped_content": [],
        "metadata": {"source": "api_request", "focus_prompt": request.focus_prompt}
    }
    
    try:
        # We use astream to get events from each node
        async for output in research_graph.astream(initial_state):
            for node_name, state_update in output.items():
                
                # If the node has an error, notify UI and stop
                if "error" in state_update and state_update["error"]:
                    error_payload = {"event": "error", "data": {"message": state_update["error"]}}
                    yield f"data: {json.dumps(error_payload)}\n\n"
                    # Exit loop on critical error (up to implementation if we want to continue)
                    return
                
                # Notify UI of node progression
                if node_name in ["planner", "researcher", "analyst"]:
                    event_payload = {"event": "node_complete", "data": {"node": node_name}}
                    yield f"data: {json.dumps(event_payload)}\n\n"
                    
                # If Writer node is complete, stream the final report
                if node_name == "writer" and "final_report" in state_update:
                    report_payload = {"event": "report", "data": {"report": state_update["final_report"]}}
                    yield f"data: {json.dumps(report_payload)}\n\n"
                    
    except Exception as e:
        error_payload = {"event": "error", "data": {"message": f"Agent crashed: {str(e)}"}}
        yield f"data: {json.dumps(error_payload)}\n\n"

@router.post("/research")
async def run_research(request: ResearchRequest, req: Request):
    # TODO: In production, uncomment JWT validation middleware to ensure req.state.user is present
    # user = getattr(req.state, "user", None)
    # if not user:
    #    raise HTTPException(status_code=401, detail="Unauthorized")

    if request.domain not in ["sales", "finance", "healthcare", "legal", "sports"]:
        raise HTTPException(status_code=400, detail="INVALID_DOMAIN")
        
    if len(request.query) < 10:
        raise HTTPException(status_code=400, detail="QUERY_TOO_SHORT")
        
    return StreamingResponse(stream_agent(request), media_type="text/event-stream")

@router.get("/reports")
async def list_reports(page: int = 1, limit: int = 20, domain: str = None):
    # TODO: Implement Supabase fetch
    return {"data": [], "page": page, "limit": limit}
