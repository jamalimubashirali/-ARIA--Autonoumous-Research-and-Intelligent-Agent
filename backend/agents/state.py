"""
Research agent state schema.

This TypedDict defines the shared state that flows between all graph nodes.
All fields are optional (except query/domain) since nodes produce them incrementally.
"""
from typing import TypedDict, List, Optional, Annotated
from operator import add


class ReviewerDecision(TypedDict):
    verdict: str        # "approve" or "reject"
    feedback: str       # Specific feedback if rejected
    scores: dict        # {completeness, accuracy, source_attribution} 1-5


class ResearchState(TypedDict):
    # ---- Input ----
    query: str                   # Raw user query
    domain: str                  # sales|finance|healthcare|legal|sports|general
    focus_prompt: str            # Optional user-supplied focus/angle for the research

    # ---- Planner output ----
    sub_tasks: List[str]         # Decomposed search sub-tasks

    # ---- Researcher output ----
    search_results: List[dict]   # Tavily results
    scraped_content: List[str]   # Firecrawl output
    sources: List[dict]          # [{title, url}] collected from search for citation

    # ---- Corrective RAG (Analyst) ----
    rag_context: str             # Retrieved vector chunks (graded-relevant only)
    rag_query_rewrites: int      # Number of query rewrites performed
    rag_web_fallback: bool       # Whether web fallback was triggered

    # ---- Analyst output ----
    analysis: str                # Synthesized analysis block

    # ---- Writer output ----
    final_report: str            # Writer output (Markdown)

    # ---- Reviewer output ----
    reviewer_decision: Optional[ReviewerDecision]
    writer_iterations: int       # Number of Writer → Reviewer loops

    # ---- Error handling ----
    error: Optional[str]         # Error state

    # ---- Metadata ----
    metadata: dict               # Timestamps, token counts, sources
