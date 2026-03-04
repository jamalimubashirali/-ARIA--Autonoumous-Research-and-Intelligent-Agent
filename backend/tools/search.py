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
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=20.0)
            response.raise_for_status()
            data = response.json()
            return {"results": data.get("results", [])}
        except Exception as e:
            return {"error": f"Tavily search failed: {str(e)}"}
