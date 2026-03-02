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

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert research planner. Given a research query and domain, decompose it into 3-5 specific search sub-tasks that together will produce a comprehensive intelligence report.

Rules:
(1) Each sub-task should target a different information source or angle.
(2) Order tasks from broad to specific.
(3) Consider the domain when prioritising angles:
    - sales: company overview, financials, products, leadership, recent news
    - finance: financial statements, market data, analyst consensus, risk factors
    - healthcare: clinical data, regulatory status, mechanism of action, competitive landscape
    - legal: statute text, case law, regulatory guidance, compliance requirements
    - sports: performance stats, injury history, contract details, scouting assessment
(4) Output ONLY a JSON array of strings."""),
        ("user", "Domain: {domain}\nQuery: {query}")
    ])

    chain = prompt | llm.with_structured_output(PlannerOutput)

    try:
        result = chain.invoke({"domain": state["domain"], "query": state["query"]})
        return {"sub_tasks": result.sub_tasks}
    except Exception as e:
        print(f"Planner structured output failed, trying raw parse: {e}")
        # Fallback: try without structured output
        try:
            import json
            raw_chain = prompt | llm
            raw_result = raw_chain.invoke({"domain": state["domain"], "query": state["query"]})
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
