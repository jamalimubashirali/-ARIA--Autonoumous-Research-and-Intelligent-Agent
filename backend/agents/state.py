from typing import TypedDict, List, Optional

class ResearchState(TypedDict):
    query: str                   # Raw user query
    domain: str                  # sales|finance|healthcare|legal|sports
    sub_tasks: List[str]         # Planner output
    search_results: List[dict]   # Tavily results
    scraped_content: List[str]   # Firecrawl output
    rag_context: str             # Retrieved vector context
    analysis: str                # Analyst synthesis
    final_report: str            # Writer output (Markdown)
    error: Optional[str]         # Error state
    metadata: dict               # Timestamps, token counts, sources
