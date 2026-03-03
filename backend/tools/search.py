import httpx
from typing import List, Dict, Any
from config import settings

async def tavily_search(query: str, num_results: int = 5) -> Dict[str, Any]:
    """Search the web using Tavily with advanced depth for high-quality results."""
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
        "include_raw_content": False,
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
