"""
ARIA Research Agent Graph — Multi-Agent with Conditional Routing.

Architecture:
  START → Planner → Researcher → Analyst (CRAG) → Writer → Reviewer
                                                      ↑          │
                                                      └── reject ─┘ (max 2 iterations)
                                                           approve → END

Error handling:
  - Researcher failure → skip to Analyst with whatever data exists
  - Analyst failure → Writer uses raw search data
  - Writer/Reviewer failure → return partial result
"""
from langgraph.graph import StateGraph, START, END

from agents.state import ResearchState
from agents.nodes.planner import planner_node
from agents.nodes.researcher import researcher_node
from agents.nodes.analyst import analyst_node
from agents.nodes.writer import writer_node
from agents.nodes.reviewer import reviewer_node


# ---------------------------------------------------------------------------
# Conditional routing functions
# ---------------------------------------------------------------------------
def should_retry_writer(state: ResearchState) -> str:
    """After Reviewer: route to Writer, Planner, or END based on target.

    Max 2 total iterations enforced by nodes.
    """
    decision = state.get("reviewer_decision", {})
    verdict = decision.get("verdict", "approve")
    routing_target = state.get("routing_target", END)

    if verdict == "reject":
        if routing_target == "planner":
            print(f"  [Router] Reviewer rejected (missing facts) → Planner loop")
            return "planner"
        elif routing_target == "writer":
            # The writer node incremented this to 1 on the first pass.
            # So if it's < 3, we can do a retry. Let's just trust routing_target 
            # as Reviewer handles the iteration checks now.
            print(f"  [Router] Reviewer rejected (formatting) → Writer retry")
            return "writer"
        else:
            print(f"  [Router] Reviewer rejected but max iterations reached → END")
            return END
    else:
        print(f"  [Router] Reviewer approved → END")
        return END


def analyst_router(state: ResearchState) -> str:
    """After Analyst: route to Writer, or back to Researcher if more data needed."""
    target = state.get("routing_target", "writer")
    if target == "researcher":
        print("  [Router] Analyst requested more data → Researcher loop")
        return "researcher"
    
    print("  [Router] Analyst complete → Writer")
    return "writer"


def handle_researcher_error(state: ResearchState) -> str:
    """After Researcher: skip to Analyst even if there were errors.

    The Analyst's CRAG flow is robust enough to handle missing data
    (web fallback will trigger if vectors + search are empty).
    """
    if state.get("error"):
        print("  [Router] Researcher had errors, proceeding to Analyst anyway")
    return "analyst"


from agents.nodes.memory import memory_node

# ... existing definitions ...

def memory_router(state: ResearchState) -> str:
    """Route from memory: if cache hit, end; otherwise, plan."""
    if state.get("cache_hit"):
        return END
    return "planner"

# ---------------------------------------------------------------------------
# Graph definition
# ---------------------------------------------------------------------------
def create_research_graph():
    """Build the multi-agent graph with conditional routing."""

    workflow = StateGraph(ResearchState)

    # Add nodes
    workflow.add_node("memory", memory_node)
    workflow.add_node("planner", planner_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("analyst", analyst_node)
    workflow.add_node("writer", writer_node)
    workflow.add_node("reviewer", reviewer_node)

    # Memory check first
    workflow.add_edge(START, "memory")
    
    workflow.add_conditional_edges(
        "memory",
        memory_router,
        {END: END, "planner": "planner"}
    )

    # Planner -> Researcher
    workflow.add_edge("planner", "researcher")

    # Researcher → Analyst (always proceeds, even with errors)
    workflow.add_conditional_edges(
        "researcher",
        handle_researcher_error,
        {"analyst": "analyst"},
    )

    # Analyst → Writer (or back to Researcher)
    workflow.add_conditional_edges(
        "analyst",
        analyst_router,
        {"writer": "writer", "researcher": "researcher"},
    )

    # Writer → Reviewer (always)
    workflow.add_edge("writer", "reviewer")

    # Reviewer → Writer, Planner, or END
    workflow.add_conditional_edges(
        "reviewer",
        should_retry_writer,
        {"writer": "writer", "planner": "planner", END: END},
    )

    # Compile
    app = workflow.compile()
    return app


research_graph = create_research_graph()
