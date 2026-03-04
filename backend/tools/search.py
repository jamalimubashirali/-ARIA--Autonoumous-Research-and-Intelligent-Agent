import httpx
from typing import List, Dict, Any
from config import settings
from langchain_core.tools import tool

@tool
async def tavily_search(query: str, num_results: int = 3) -> Dict[str, Any]:
    """Search the web for real-time information. 
    Use this tool first to find recent news, facts, and relevant URLs.
    
    Args:
        query: The search query string to look up.
        num_results: Max number of search results to return.
    """
    if not settings.tavily_api_key:
        return {"error": "Tavily API key not configured."}
        
    url = "https://api.tavily.com/search"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.tavily_api_key}"
    }
    payload = {
        "query": query,
        "search_depth": "advanced",
        "include_answer": False,
        "include_raw_content": True,   # Return full page text — used as Firecrawl fallback
        "max_results": num_results,
    }
    
    async with httpx.AsyncClient(timeout=45.0) as client:
        last_error = None
        for attempt in range(2):  # 1 retry
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                print(f"  [TavilySearch] Got {len(results)} results for: '{query[:50]}...'")
                return {"results": results}
            except Exception as e:
                last_error = e
                if attempt == 0:
                    print(f"  [TavilySearch] Attempt 1 failed: {e}. Retrying...")
                    import asyncio
                    await asyncio.sleep(1)
        print(f"  [TavilySearch] All attempts failed: {last_error}")
        return {"error": f"Tavily search failed: {str(last_error)}"}
