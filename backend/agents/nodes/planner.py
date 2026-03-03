from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

from agents.state import ResearchState
from models import get_llm, TIER_LIGHT


class PlannerOutput(BaseModel):
    sub_tasks: List[str] = Field(
        description="3-5 specific search sub-tasks that together will produce a comprehensive intelligence report."
    )


def planner_node(state: ResearchState) -> dict:
    """Decompose the user query into 3-5 targeted search sub-tasks.
    
    Uses the LIGHT model (Llama-4-Maverick-17B) since this is a
    reasoning-only node with no tool calls.
    """
    print(f"--- PLANNER NODE: Domain {state['domain']} ---")

    llm = get_llm(tier=TIER_LIGHT, temperature=0)

    # Pull focus prompt from state if available
    focus_prompt = state.get("focus_prompt") or state.get("metadata", {}).get("focus_prompt", "")

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert research planner. Given a research query and domain, decompose it into 3-5 highly SPECIFIC web search queries that will find the exact information needed.

Rules:
(1) Each sub-task must be a concrete, detailed search query — NOT a vague topic.
    BAD:  "injury prevention in sports"
    GOOD: "AI wearable sensor data injury prediction Premier League NBA 2024 2025"
(2) Incorporate key terms and entities directly from the user's query into each sub-task.
(3) Order tasks from broad context to specific data points.
(4) If the user provided a focus prompt, weight sub-tasks toward that angle.
(5) Include at least one sub-task targeting academic/research sources (e.g., "site:pubmed.ncbi.nlm.nih.gov" or "journal" or "study").
(6) Include at least one sub-task targeting recent news or case studies.
(7) Output ONLY a JSON array of strings."""),
        ("user", "Domain: {domain}\nQuery: {query}\nFocus: {focus_prompt}")
    ])

    chain = prompt | llm.with_structured_output(PlannerOutput)

    try:
        result = chain.invoke({
            "domain": state["domain"],
            "query": state["query"],
            "focus_prompt": focus_prompt or "No specific focus — cover all angles.",
        })
        return {"sub_tasks": result.sub_tasks}
    except Exception as e:
        print(f"Planner structured output failed, trying raw parse: {e}")
        # Fallback: try without structured output
        try:
            import json
            raw_chain = prompt | llm
            raw_result = raw_chain.invoke({
                "domain": state["domain"],
                "query": state["query"],
                "focus_prompt": focus_prompt or "No specific focus — cover all angles.",
            })
            content = raw_result.content
            # Try to extract JSON array from response
            start = content.find("[")
            end = content.rfind("]") + 1
            if start != -1 and end > start:
                tasks = json.loads(content[start:end])
                return {"sub_tasks": tasks}
        except Exception:
            pass
        return {"error": f"Planner failed: {str(e)}", "sub_tasks": [state["query"]]}
