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
    """After Reviewer: loop back to Writer (reject) or finish (approve).

    Max 2 total Writer iterations to prevent infinite loops.
    """
    decision = state.get("reviewer_decision", {})
    verdict = decision.get("verdict", "approve")
    iterations = state.get("writer_iterations", 1)

    if verdict == "reject" and iterations < 2:
        print(f"  [Router] Reviewer rejected (iteration {iterations}/2) → Writer retry")
        return "writer"
    else:
        if verdict == "reject":
            print(f"  [Router] Reviewer rejected but max iterations reached → END")
        else:
            print(f"  [Router] Reviewer approved → END")
        return END


def handle_researcher_error(state: ResearchState) -> str:
    """After Researcher: skip to Analyst even if there were errors.

    The Analyst's CRAG flow is robust enough to handle missing data
    (web fallback will trigger if vectors + search are empty).
    """
    if state.get("error"):
        print("  [Router] Researcher had errors, proceeding to Analyst anyway")
    return "analyst"


# ---------------------------------------------------------------------------
# Graph definition
# ---------------------------------------------------------------------------
def create_research_graph():
    """Build the multi-agent graph with conditional routing."""

    workflow = StateGraph(ResearchState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("analyst", analyst_node)
    workflow.add_node("writer", writer_node)
    workflow.add_node("reviewer", reviewer_node)

    # Linear edges
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "researcher")

    # Researcher → Analyst (always proceeds, even with errors)
    workflow.add_conditional_edges(
        "researcher",
        handle_researcher_error,
        {"analyst": "analyst"},
    )

    # Analyst → Writer (always)
    workflow.add_edge("analyst", "writer")

    # Writer → Reviewer (always)
    workflow.add_edge("writer", "reviewer")

    # Reviewer → Writer (reject, <2 iterations) or END (approve / max iterations)
    workflow.add_conditional_edges(
        "reviewer",
        should_retry_writer,
        {"writer": "writer", END: END},
    )

    # Compile
    app = workflow.compile()
    return app


research_graph = create_research_graph()
