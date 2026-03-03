"""
Memory Node for ARIA.

Checks if a highly similar report already exists in the cache to short-circuit research.
"""
from typing import Dict, Any
from agents.state import ResearchState
from tools.vector import get_embeddings_model, search_cached_reports


async def memory_node(state: ResearchState) -> Dict[str, Any]:
    print("--- MEMORY NODE ---")
    query = state["query"]
    domain = state["domain"]
    
    embeddings_model = get_embeddings_model()
    if not embeddings_model:
        print("  [Memory] No embeddings model configured. Skipping cache check.")
        return {"cache_hit": False, "query_embedding": []}
        
    print(f"  [Memory] Checking semantic cache for query: '{query}' in domain: '{domain}'")
    
    # 1. Embed the user's query
    try:
        query_embedding = await embeddings_model.aembed_query(query)
    except Exception as e:
        print(f"  [Memory] Error embedding query: {e}")
        return {"cache_hit": False, "query_embedding": []}
        
    if not query_embedding:
        return {"cache_hit": False, "query_embedding": []}
        
    # 2. Search for existing reports
    cached_report = await search_cached_reports(query_embedding, domain, similarity_threshold=0.85)
    
    if cached_report:
        print(f"  [Memory] CACHE HIT! Short-circuiting research pipeline.")
        return {
            "final_report": cached_report["content"],
            "cache_hit": True,
            "query_embedding": query_embedding,
            "metadata": {"source": "semantic_cache", "original_report_id": str(cached_report["id"])}
        }
    
    print(f"  [Memory] Cache miss. Proceeding to planner.")
    return {
        "cache_hit": False,
        "query_embedding": query_embedding
    }
